import { formatPKR, formatUSD } from "@/lib/format";

// Pure discount, gift-voucher and order-total rules. The order API and the
// apply-code preview both run these, so the customer sees what they'll pay.

export type Currency = "PKR" | "USD";

export type DiscountRule = {
  code: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  percentOff: number | null;
  valuePKR: number | null;
  valueUSD: number | null;
  minSubtotalPKR: number | null;
  minSubtotalUSD: number | null;
  maxDiscountPKR: number | null;
  maxDiscountUSD: number | null;
  appliesTo: "ALL" | "CATEGORIES" | "PRODUCTS";
  /** Category ids in scope, already expanded to include subcategories. */
  categoryIds: string[];
  productIds: string[];
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number | null;
  firstOrderOnly: boolean;
  active: boolean;
};

export type PricingLine = { productId: string | null; categoryId: string | null; lineTotal: number };

export type DiscountContext = {
  currency: Currency;
  lines: PricingLine[];
  shipping: number;
  now: Date;
  /** Earlier redemptions of this code by the same email or phone. */
  customerUses: number;
  /** No earlier non-cancelled order with the same email or phone. */
  isFirstOrder: boolean;
};

export type DiscountFailure =
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "USAGE_LIMIT"
  | "CUSTOMER_LIMIT"
  | "FIRST_ORDER_ONLY"
  | "MIN_SUBTOTAL"
  | "NOT_ELIGIBLE"
  | "CURRENCY";

export type DiscountResult =
  | { ok: true; amount: number; freeShipping: boolean }
  | { ok: false; reason: DiscountFailure; message: string };

const money = (amount: number, currency: Currency) => (currency === "PKR" ? formatPKR(amount) : formatUSD(amount));
const fail = (reason: DiscountFailure, message: string): DiscountResult => ({ ok: false, reason, message });

export function evaluateDiscount(rule: DiscountRule, ctx: DiscountContext): DiscountResult {
  const pick = (pkr: number | null, usd: number | null) => (ctx.currency === "PKR" ? pkr : usd);

  if (!rule.active) return fail("INACTIVE", "This code is no longer active.");
  if (rule.startsAt && ctx.now < rule.startsAt) return fail("NOT_STARTED", "This code isn't active yet.");
  if (rule.endsAt && ctx.now > rule.endsAt) return fail("EXPIRED", "This code has expired.");
  if (rule.usageLimit !== null && rule.usedCount >= rule.usageLimit) return fail("USAGE_LIMIT", "This code has been fully redeemed.");
  if (rule.perCustomerLimit !== null && ctx.customerUses >= rule.perCustomerLimit) {
    return fail("CUSTOMER_LIMIT", "You've already used this code.");
  }
  if (rule.firstOrderOnly && !ctx.isFirstOrder) return fail("FIRST_ORDER_ONLY", "This code is for your first order only.");

  const subtotal = ctx.lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const minSubtotal = pick(rule.minSubtotalPKR, rule.minSubtotalUSD);
  if (minSubtotal !== null && subtotal < minSubtotal) {
    return fail("MIN_SUBTOTAL", `Spend ${money(minSubtotal, ctx.currency)} or more to use this code.`);
  }

  if (rule.type === "FREE_SHIPPING") return { ok: true, amount: 0, freeShipping: true };

  const eligible = ctx.lines
    .filter((l) =>
      rule.appliesTo === "ALL"
        ? true
        : rule.appliesTo === "CATEGORIES"
          ? l.categoryId !== null && rule.categoryIds.includes(l.categoryId)
          : l.productId !== null && rule.productIds.includes(l.productId),
    )
    .reduce((sum, l) => sum + l.lineTotal, 0);
  if (eligible === 0) return fail("NOT_ELIGIBLE", "This code doesn't apply to the items in your cart.");

  let amount: number;
  if (rule.type === "PERCENT") {
    amount = Math.round((eligible * (rule.percentOff ?? 0)) / 100);
  } else {
    const value = pick(rule.valuePKR, rule.valueUSD);
    if (value === null) return fail("CURRENCY", `This code can't be used on ${ctx.currency} orders.`);
    amount = value;
  }
  const cap = pick(rule.maxDiscountPKR, rule.maxDiscountUSD);
  amount = Math.min(amount, eligible, cap ?? Infinity);
  return { ok: true, amount, freeShipping: false };
}

export type VoucherState = { currency: Currency; balance: number; expiresAt: Date | null; active: boolean };
export type VoucherFailure = "INACTIVE" | "EXPIRED" | "EMPTY" | "CURRENCY";
export type VoucherResult = { ok: true; amount: number } | { ok: false; reason: VoucherFailure; message: string };

export function evaluateVoucher(
  voucher: VoucherState,
  { currency, amountDue, now }: { currency: Currency; amountDue: number; now: Date },
): VoucherResult {
  if (!voucher.active) return { ok: false, reason: "INACTIVE", message: "This gift voucher is no longer active." };
  if (voucher.expiresAt && now > voucher.expiresAt) return { ok: false, reason: "EXPIRED", message: "This gift voucher has expired." };
  if (voucher.balance <= 0) return { ok: false, reason: "EMPTY", message: "This gift voucher has no balance left." };
  if (voucher.currency !== currency) {
    return { ok: false, reason: "CURRENCY", message: `This gift voucher is in ${voucher.currency} and can't be used on ${currency} orders.` };
  }
  return { ok: true, amount: Math.min(voucher.balance, Math.max(0, amountDue)) };
}

export type OrderTotals = { subtotal: number; discountAmount: number; shipping: number; voucherAmount: number; total: number };

/** Items → discount → shipping (free-shipping codes zero it) → gift voucher on what remains. */
export function computeTotals({
  subtotal,
  shipping,
  discount,
  voucherBalance,
}: {
  subtotal: number;
  shipping: number;
  discount: { amount: number; freeShipping: boolean } | null;
  voucherBalance: number | null;
}): OrderTotals {
  const discountAmount = Math.min(discount?.amount ?? 0, subtotal);
  const finalShipping = discount?.freeShipping ? 0 : shipping;
  const due = subtotal - discountAmount + finalShipping;
  const voucherAmount = Math.min(Math.max(0, voucherBalance ?? 0), due);
  return { subtotal, discountAmount, shipping: finalShipping, voucherAmount, total: due - voucherAmount };
}

export function normalizeCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

// No 0/O, 1/I/L, so codes survive being read aloud or copied by hand.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(prefix: string, groups: number[], random: () => number = Math.random): string {
  const group = (length: number) =>
    Array.from({ length }, () => CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]).join("");
  return [prefix, ...groups.map(group)].join("-");
}

/** Last 10 digits, so 0300…, +92 300… and 0092 300… compare equal. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

/** Balance an order took from a voucher that hasn't been refunded yet (for cancellations; idempotent). */
export function voucherRefundDue(transactions: { delta: number; reason: string }[]): number {
  const net = transactions
    .filter((t) => t.reason === "REDEEM" || t.reason === "REFUND")
    .reduce((sum, t) => sum + t.delta, 0);
  return Math.max(0, -net);
}
