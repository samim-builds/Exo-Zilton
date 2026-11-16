"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { generateCode } from "@/lib/commerce/discounts";
import { voucherAdjustSchema, voucherIssueSchema } from "@/lib/commerce/schemas";
import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/order-schema";
import { siteConfig } from "@/lib/site";

const paths = { paths: ["/admin/marketing/vouchers"] };

/** Fresh codes that collide with neither each other nor existing vouchers or discounts. */
async function uniqueCodes(count: number): Promise<string[]> {
  const codes = new Set<string>();
  for (let attempt = 0; codes.size < count && attempt < 10; attempt++) {
    const batch = Array.from({ length: count - codes.size }, () => generateCode("EZ", [4, 4])).filter((c) => !codes.has(c));
    const [vouchers, discounts] = await Promise.all([
      prisma.giftVoucher.findMany({ where: { code: { in: batch } }, select: { code: true } }),
      prisma.discount.findMany({ where: { code: { in: batch } }, select: { code: true } }),
    ]);
    const taken = new Set([...vouchers, ...discounts].map((r) => r.code));
    batch.filter((c) => !taken.has(c)).forEach((c) => codes.add(c));
  }
  if (codes.size < count) throw new AdminActionError("Couldn't generate unique codes. Please try again.");
  return [...codes];
}

export const issueVouchers = adminAction(
  voucherIssueSchema.and(z.object({ sendToRecipient: z.boolean().optional() })),
  async ({ currency, amount, quantity, code, expiresAt, recipientEmail, note, reason, sendToRecipient }) => {
    if (code) {
      const [voucher, discount] = await Promise.all([
        prisma.giftVoucher.findUnique({ where: { code } }),
        prisma.discount.findUnique({ where: { code } }),
      ]);
      if (voucher || discount) throw new AdminActionError(`The code ${code} is already in use.`);
    }
    const codes = code ? [code] : await uniqueCodes(quantity);

    const vouchers = await prisma.$transaction(
      codes.map((c) =>
        prisma.giftVoucher.create({
          data: {
            code: c,
            currency,
            initialBalance: amount,
            balance: amount,
            expiresAt: expiresAt ?? null,
            recipientEmail: recipientEmail || null,
            note: note || null,
            issuedReason: reason,
            transactions: { create: { delta: amount, reason: "ISSUE", note: note || null } },
          },
        }),
      ),
    );

    if (sendToRecipient && recipientEmail) {
      const expiry = expiresAt ? ` It's valid until ${expiresAt.toLocaleDateString("en-GB", { dateStyle: "long" })}.` : "";
      await Promise.allSettled(
        vouchers.map((v) =>
          sendEmail({
            to: recipientEmail,
            subject: `Your ${siteConfig.name} gift voucher`,
            text: [
              `You've received a ${formatMoney(amount, currency)} gift voucher for ${siteConfig.name}.`,
              "",
              `Code: ${v.code}`,
              "",
              `Enter it at checkout on ${siteConfig.url}. Anything you don't spend stays on the voucher.${expiry}`,
            ].join("\n"),
          }),
        ),
      );
    }

    await logActivity({
      entityType: "voucher",
      entityId: vouchers.map((v) => v.id).join(","),
      action: "CREATE",
      summary: `Issued ${vouchers.length} gift voucher(s) of ${formatMoney(amount, currency)}`,
      diff: { reason, recipientEmail: recipientEmail || null },
    });
    return { ids: vouchers.map((v) => v.id), codes: vouchers.map((v) => v.code) };
  },
  paths,
);

export const adjustVoucher = adminAction(
  voucherAdjustSchema,
  async ({ id, delta, note }) => {
    const voucher = await prisma.$transaction(async (tx) => {
      // Conditional update so a deduction can't take the balance below zero.
      const updated = await tx.giftVoucher.updateMany({
        where: { id, ...(delta < 0 && { balance: { gte: -delta } }) },
        data: { balance: { increment: delta } },
      });
      if (updated.count === 0) throw new AdminActionError("The balance can't go below zero.");
      await tx.voucherTransaction.create({ data: { voucherId: id, delta, reason: "ADJUST", note } });
      return tx.giftVoucher.findUniqueOrThrow({ where: { id } });
    });
    await logActivity({
      entityType: "voucher",
      entityId: id,
      action: "UPDATE",
      summary: `Adjusted gift voucher ${voucher.code} by ${delta > 0 ? "+" : ""}${formatMoney(delta, voucher.currency)}`,
      diff: { delta, note },
    });
    return { balance: voucher.balance };
  },
  paths,
);

export const setVouchersActive = adminAction(
  z.object({ ids: z.array(z.string().min(1)).min(1).max(500), active: z.boolean() }),
  async ({ ids, active }) => {
    const { count } = await prisma.giftVoucher.updateMany({ where: { id: { in: ids } }, data: { active } });
    await logActivity({
      entityType: "voucher",
      entityId: ids.join(","),
      action: "STATUS",
      summary: `${active ? "Reactivated" : "Deactivated"} ${count} gift voucher(s)`,
    });
    return { count };
  },
  paths,
);
