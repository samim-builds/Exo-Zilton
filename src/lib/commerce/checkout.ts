import type { Prisma } from "@/generated/prisma/client";
import type { PricedOrderItem } from "@/lib/catalog/order-pricing";
import {
  computeTotals,
  evaluateDiscount,
  evaluateVoucher,
  normalizeCode,
  normalizePhone,
  voucherRefundDue,
  type Currency,
  type OrderTotals,
} from "./discounts";

// Server side of discounts and gift vouchers: quoting a cart, committing the
// codes inside the order transaction, and releasing them on cancellation.

type Db = Prisma.TransactionClient;

export type AppliedDiscount = { id: string; code: string; title: string; amount: number; freeShipping: boolean; combinable: boolean };
export type AppliedVoucher = { id: string; code: string; amount: number; remaining: number };

export type Quote = {
  totals: OrderTotals;
  discount: AppliedDiscount | null;
  voucher: AppliedVoucher | null;
  errors: { discount?: string; voucher?: string };
};

export type QuoteInput = {
  items: PricedOrderItem[];
  currency: Currency;
  shipping: number;
  email?: string;
  phone?: string;
  discountCode?: string;
  voucherCode?: string;
  now?: Date;
};

/** Whether a typed code is a discount code or a gift voucher. */
export async function identifyCode(db: Db, raw: string): Promise<"discount" | "voucher" | null> {
  const code = normalizeCode(raw);
  if (!code) return null;
  if (await db.discount.findUnique({ where: { code }, select: { id: true } })) return "discount";
  if (await db.giftVoucher.findUnique({ where: { code }, select: { id: true } })) return "voucher";
  return null;
}

async function expandCategories(db: Db, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const all = await db.category.findMany({ select: { id: true, parentId: true } });
  const found = new Set<string>();
  const queue = [...ids];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (found.has(id)) continue;
    found.add(id);
    queue.push(...all.filter((c) => c.parentId === id).map((c) => c.id));
  }
  return [...found];
}

async function customerHistory(db: Db, discountId: string, email?: string, phone?: string) {
  const who: Prisma.OrderWhereInput[] = [];
  const redeemedBy: Prisma.DiscountRedemptionWhereInput[] = [];
  if (email) {
    who.push({ email: { equals: email, mode: "insensitive" } });
    redeemedBy.push({ customerEmail: email.toLowerCase() });
  }
  const phoneKey = phone ? normalizePhone(phone) : "";
  if (phoneKey.length >= 7) {
    who.push({ phoneNormalized: phoneKey });
    redeemedBy.push({ customerPhone: phoneKey });
  }
  // Without contact details yet (cart preview) assume a first order; the order API re-checks.
  if (who.length === 0) return { isFirstOrder: true, customerUses: 0 };

  const [previousOrders, customerUses] = await Promise.all([
    db.order.count({ where: { status: { not: "CANCELLED" }, OR: who } }),
    db.discountRedemption.count({ where: { discountId, OR: redeemedBy } }),
  ]);
  return { isFirstOrder: previousOrders === 0, customerUses };
}

export async function quoteOrder(db: Db, input: QuoteInput): Promise<Quote> {
  const now = input.now ?? new Date();
  const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const errors: Quote["errors"] = {};
  let discount: AppliedDiscount | null = null;
  let voucher: AppliedVoucher | null = null;

  const discountCode = input.discountCode ? normalizeCode(input.discountCode) : "";
  if (discountCode) {
    const row = await db.discount.findUnique({ where: { code: discountCode } });
    if (!row) {
      errors.discount = "We couldn't find that code.";
    } else {
      const productIds = [...new Set(input.items.flatMap((i) => (i.productId ? [i.productId] : [])))];
      const [products, categoryIds, history] = await Promise.all([
        db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, categoryId: true } }),
        row.appliesTo === "CATEGORIES" ? expandCategories(db, row.categoryIds) : Promise.resolve([]),
        customerHistory(db, row.id, input.email, input.phone),
      ]);
      const categoryOf = new Map(products.map((p) => [p.id, p.categoryId]));
      const result = evaluateDiscount(
        { ...row, categoryIds },
        {
          currency: input.currency,
          lines: input.items.map((i) => ({
            productId: i.productId,
            categoryId: (i.productId && categoryOf.get(i.productId)) || null,
            lineTotal: i.unitPrice * i.quantity,
          })),
          shipping: input.shipping,
          now,
          ...history,
        },
      );
      if (result.ok) {
        discount = { id: row.id, code: row.code, title: row.title, amount: result.amount, freeShipping: result.freeShipping, combinable: row.combinable };
      } else {
        errors.discount = result.message;
      }
    }
  }

  const voucherCode = input.voucherCode ? normalizeCode(input.voucherCode) : "";
  let voucherRow: { id: string; code: string; balance: number } | null = null;
  if (voucherCode) {
    const row = await db.giftVoucher.findUnique({ where: { code: voucherCode } });
    if (!row) {
      errors.voucher = "We couldn't find that gift voucher.";
    } else if (discount && !discount.combinable) {
      errors.voucher = `Gift vouchers can't be combined with ${discount.code}.`;
    } else {
      const check = evaluateVoucher(
        { currency: row.currency as Currency, balance: row.balance, expiresAt: row.expiresAt, active: row.active },
        { currency: input.currency, amountDue: Number.MAX_SAFE_INTEGER, now },
      );
      if (check.ok) voucherRow = row;
      else errors.voucher = check.message;
    }
  }

  const totals = computeTotals({ subtotal, shipping: input.shipping, discount, voucherBalance: voucherRow?.balance ?? null });
  if (voucherRow && totals.voucherAmount > 0) {
    voucher = { id: voucherRow.id, code: voucherRow.code, amount: totals.voucherAmount, remaining: voucherRow.balance - totals.voucherAmount };
  }
  return { totals, discount, voucher, errors };
}

/** Thrown inside the order transaction when a code was used up between quote and commit. */
export class CodeConflictError extends Error {}

/** Records the discount redemption and voucher debit for a new order; call inside its transaction. */
export async function commitIncentives(
  tx: Db,
  { orderId, quote, email, phone, currency }: { orderId: string; quote: Quote; email: string; phone: string; currency: Currency },
) {
  if (quote.discount) {
    const rule = await tx.discount.findUniqueOrThrow({ where: { id: quote.discount.id }, select: { usageLimit: true } });
    // Conditional increment: fails if another order took the last use since the quote.
    const claimed = await tx.discount.updateMany({
      where: { id: quote.discount.id, active: true, ...(rule.usageLimit !== null && { usedCount: { lt: rule.usageLimit } }) },
      data: { usedCount: { increment: 1 } },
    });
    if (claimed.count === 0) throw new CodeConflictError(`${quote.discount.code} has just been fully redeemed.`);
    await tx.discountRedemption.create({
      data: {
        discountId: quote.discount.id,
        orderId,
        customerEmail: email.toLowerCase(),
        customerPhone: normalizePhone(phone),
        amount: quote.discount.amount,
        currency,
      },
    });
  }

  if (quote.voucher) {
    const debited = await tx.giftVoucher.updateMany({
      where: { id: quote.voucher.id, active: true, balance: { gte: quote.voucher.amount } },
      data: { balance: { decrement: quote.voucher.amount } },
    });
    if (debited.count === 0) throw new CodeConflictError("Your gift voucher balance changed. Please review your order.");
    await tx.voucherTransaction.create({
      data: { voucherId: quote.voucher.id, orderId, delta: -quote.voucher.amount, reason: "REDEEM" },
    });
  }
}

/** Gives back an order's discount use and voucher balance when it is cancelled. Safe to call twice. */
export async function releaseOrderIncentives(tx: Db, orderId: string) {
  const redemptions = await tx.discountRedemption.findMany({ where: { orderId } });
  for (const r of redemptions) {
    await tx.discountRedemption.delete({ where: { id: r.id } });
    await tx.discount.updateMany({ where: { id: r.discountId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  }

  const transactions = await tx.voucherTransaction.findMany({ where: { orderId }, select: { voucherId: true, delta: true, reason: true } });
  for (const voucherId of new Set(transactions.map((t) => t.voucherId))) {
    const due = voucherRefundDue(transactions.filter((t) => t.voucherId === voucherId));
    if (due === 0) continue;
    await tx.giftVoucher.update({ where: { id: voucherId }, data: { balance: { increment: due } } });
    await tx.voucherTransaction.create({ data: { voucherId, orderId, delta: due, reason: "REFUND", note: "Order cancelled" } });
  }
}
