import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

// Admin reads for discounts and gift vouchers.

import type { DiscountStatus } from "./display";

export type { DiscountStatus };

export function discountStatus(
  d: { active: boolean; startsAt: Date | null; endsAt: Date | null; usageLimit: number | null; usedCount: number },
  now = new Date(),
): DiscountStatus {
  if (!d.active) return "inactive";
  if (d.endsAt && d.endsAt < now) return "expired";
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return "used-up";
  if (d.startsAt && d.startsAt > now) return "scheduled";
  return "active";
}

export type DiscountListRow = Awaited<ReturnType<typeof listDiscounts>>["rows"][number];

export async function listDiscounts(args: {
  q: string;
  kind?: string[];
  state?: string[];
  sort: { id: "code" | "createdAt" | "usedCount"; desc: boolean };
  skip: number;
  take: number;
}) {
  const kinds = (args.kind ?? []).filter((k): k is "STANDARD" | "WELCOME" => k === "STANDARD" || k === "WELCOME");
  const now = new Date();
  const stateFilters: Record<string, Prisma.DiscountWhereInput> = {
    active: { active: true, OR: [{ endsAt: null }, { endsAt: { gte: now } }], AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }] },
    inactive: { active: false },
    expired: { endsAt: { lt: now } },
  };
  const states = (args.state ?? []).flatMap((s) => (stateFilters[s] ? [stateFilters[s]] : []));

  const where: Prisma.DiscountWhereInput = {
    // Per-subscriber welcome codes are hidden unless asked for.
    kind: kinds.length > 0 ? { in: kinds } : "STANDARD",
    AND: [
      args.q
        ? { OR: [{ code: { contains: args.q, mode: "insensitive" } }, { title: { contains: args.q, mode: "insensitive" } }] }
        : {},
      states.length > 0 ? { OR: states } : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.discount.findMany({
      where,
      orderBy: { [args.sort.id]: args.sort.desc ? "desc" : "asc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.discount.count({ where }),
  ]);
  return { rows: rows.map((d) => ({ ...d, status: discountStatus(d, now) })), total };
}

export async function getDiscountForEdit(id: string) {
  return prisma.discount.findUnique({
    where: { id },
    include: {
      redemptions: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { order: { select: { id: true, number: true, status: true } } },
      },
    },
  });
}

/** Categories and active products for the discount scope pickers. */
export async function listDiscountScopeOptions() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { categories, products };
}

export type VoucherListRow = Awaited<ReturnType<typeof listVouchers>>["rows"][number];

export async function listVouchers(args: {
  q: string;
  currency?: string[];
  state?: string[];
  sort: { id: "createdAt" | "balance"; desc: boolean };
  skip: number;
  take: number;
}) {
  const now = new Date();
  const stateFilters: Record<string, Prisma.GiftVoucherWhereInput> = {
    usable: { active: true, balance: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
    empty: { balance: 0 },
    expired: { expiresAt: { lt: now } },
    inactive: { active: false },
  };
  const states = (args.state ?? []).flatMap((s) => (stateFilters[s] ? [stateFilters[s]] : []));
  const currencies = (args.currency ?? []).filter((c) => c === "PKR" || c === "USD");

  const where: Prisma.GiftVoucherWhereInput = {
    AND: [
      args.q
        ? {
            OR: [
              { code: { contains: args.q, mode: "insensitive" } },
              { recipientEmail: { contains: args.q, mode: "insensitive" } },
              { note: { contains: args.q, mode: "insensitive" } },
            ],
          }
        : {},
      currencies.length > 0 ? { currency: { in: currencies } } : {},
      states.length > 0 ? { OR: states } : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.giftVoucher.findMany({
      where,
      orderBy: { [args.sort.id]: args.sort.desc ? "desc" : "asc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.giftVoucher.count({ where }),
  ]);
  return { rows, total };
}

export async function getVoucher(id: string) {
  return prisma.giftVoucher.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        include: { order: { select: { id: true, number: true } } },
      },
    },
  });
}
