import { describe, expect, it } from "vitest";
import {
  computeTotals,
  evaluateDiscount,
  evaluateVoucher,
  generateCode,
  normalizeCode,
  normalizePhone,
  voucherRefundDue,
  type DiscountContext,
  type DiscountRule,
} from "./discounts";

const NOW = new Date("2026-11-16T12:00:00Z");

const rule = (over: Partial<DiscountRule> = {}): DiscountRule => ({
  code: "SAVE10",
  type: "PERCENT",
  percentOff: 10,
  valuePKR: null,
  valueUSD: null,
  minSubtotalPKR: null,
  minSubtotalUSD: null,
  maxDiscountPKR: null,
  maxDiscountUSD: null,
  appliesTo: "ALL",
  categoryIds: [],
  productIds: [],
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  usedCount: 0,
  perCustomerLimit: null,
  firstOrderOnly: false,
  active: true,
  ...over,
});

const ctx = (over: Partial<DiscountContext> = {}): DiscountContext => ({
  currency: "PKR",
  lines: [
    { productId: "mortar", categoryId: "mortars", lineTotal: 40000 },
    { productId: "bowl", categoryId: "bowls", lineTotal: 10000 },
  ],
  shipping: 500,
  now: NOW,
  customerUses: 0,
  isFirstOrder: false,
  ...over,
});

describe("evaluateDiscount — amounts", () => {
  it("takes a percentage off the subtotal, rounded to whole units", () => {
    expect(evaluateDiscount(rule({ percentOff: 15 }), ctx({ lines: [{ productId: "a", categoryId: null, lineTotal: 333 }] }))).toEqual({
      ok: true,
      amount: 50,
      freeShipping: false,
    });
  });

  it("takes a fixed amount in the order currency", () => {
    const fixed = rule({ type: "FIXED", percentOff: null, valuePKR: 2000, valueUSD: 10 });
    expect(evaluateDiscount(fixed, ctx())).toMatchObject({ ok: true, amount: 2000 });
    expect(evaluateDiscount(fixed, ctx({ currency: "USD" }))).toMatchObject({ ok: true, amount: 10 });
  });

  it("never discounts more than the eligible subtotal", () => {
    const fixed = rule({ type: "FIXED", percentOff: null, valuePKR: 99999 });
    expect(evaluateDiscount(fixed, ctx())).toMatchObject({ amount: 50000 });
  });

  it("caps percentage discounts at the maximum for the currency", () => {
    expect(evaluateDiscount(rule({ percentOff: 50, maxDiscountPKR: 5000 }), ctx())).toMatchObject({ amount: 5000 });
  });

  it("rejects a fixed discount with no value for the order currency", () => {
    const pkrOnly = rule({ type: "FIXED", percentOff: null, valuePKR: 2000 });
    expect(evaluateDiscount(pkrOnly, ctx({ currency: "USD" }))).toMatchObject({ ok: false, reason: "CURRENCY" });
  });

  it("gives free shipping with no money off the items", () => {
    expect(evaluateDiscount(rule({ type: "FREE_SHIPPING", percentOff: null }), ctx())).toEqual({
      ok: true,
      amount: 0,
      freeShipping: true,
    });
  });
});

describe("evaluateDiscount — scope", () => {
  it("applies only to lines in the chosen categories", () => {
    expect(evaluateDiscount(rule({ appliesTo: "CATEGORIES", categoryIds: ["bowls"] }), ctx())).toMatchObject({ amount: 1000 });
  });

  it("applies only to the chosen products", () => {
    expect(evaluateDiscount(rule({ appliesTo: "PRODUCTS", productIds: ["mortar"] }), ctx())).toMatchObject({ amount: 4000 });
  });

  it("rejects carts with nothing eligible", () => {
    expect(evaluateDiscount(rule({ appliesTo: "PRODUCTS", productIds: ["other"] }), ctx())).toMatchObject({ ok: false, reason: "NOT_ELIGIBLE" });
  });
});

describe("evaluateDiscount — conditions", () => {
  it("rejects inactive codes", () => {
    expect(evaluateDiscount(rule({ active: false }), ctx())).toMatchObject({ ok: false, reason: "INACTIVE" });
  });

  it("respects the schedule", () => {
    expect(evaluateDiscount(rule({ startsAt: new Date("2026-11-17") }), ctx())).toMatchObject({ reason: "NOT_STARTED" });
    expect(evaluateDiscount(rule({ endsAt: new Date("2026-11-16T11:59:59Z") }), ctx())).toMatchObject({ reason: "EXPIRED" });
  });

  it("enforces total and per-customer usage limits", () => {
    expect(evaluateDiscount(rule({ usageLimit: 5, usedCount: 5 }), ctx())).toMatchObject({ reason: "USAGE_LIMIT" });
    expect(evaluateDiscount(rule({ perCustomerLimit: 1 }), ctx({ customerUses: 1 }))).toMatchObject({ reason: "CUSTOMER_LIMIT" });
    expect(evaluateDiscount(rule({ usageLimit: 5, usedCount: 4 }), ctx())).toMatchObject({ ok: true });
  });

  it("limits first-order codes to customers without previous orders", () => {
    expect(evaluateDiscount(rule({ firstOrderOnly: true }), ctx())).toMatchObject({ reason: "FIRST_ORDER_ONLY" });
    expect(evaluateDiscount(rule({ firstOrderOnly: true }), ctx({ isFirstOrder: true }))).toMatchObject({ ok: true });
  });

  it("requires the minimum subtotal for the order currency", () => {
    const min = rule({ minSubtotalPKR: 60000, minSubtotalUSD: 100 });
    expect(evaluateDiscount(min, ctx())).toMatchObject({ reason: "MIN_SUBTOTAL" });
    expect(evaluateDiscount(min, ctx({ currency: "USD", lines: [{ productId: "a", categoryId: null, lineTotal: 100 }] }))).toMatchObject({
      ok: true,
    });
  });

  it("explains every failure in words a customer understands", () => {
    const result = evaluateDiscount(rule({ minSubtotalPKR: 60000 }), ctx());
    expect(result.ok === false && result.message).toBe("Spend Rs. 60,000 or more to use this code.");
  });
});

describe("evaluateVoucher", () => {
  const voucher = { currency: "PKR" as const, balance: 5000, expiresAt: null, active: true };

  it("covers up to its balance", () => {
    expect(evaluateVoucher(voucher, { currency: "PKR", amountDue: 3000, now: NOW })).toEqual({ ok: true, amount: 3000 });
    expect(evaluateVoucher(voucher, { currency: "PKR", amountDue: 8000, now: NOW })).toEqual({ ok: true, amount: 5000 });
  });

  it("must match the order currency", () => {
    expect(evaluateVoucher(voucher, { currency: "USD", amountDue: 30, now: NOW })).toMatchObject({ ok: false, reason: "CURRENCY" });
  });

  it("rejects inactive, expired and empty vouchers", () => {
    expect(evaluateVoucher({ ...voucher, active: false }, { currency: "PKR", amountDue: 1, now: NOW })).toMatchObject({ reason: "INACTIVE" });
    expect(evaluateVoucher({ ...voucher, expiresAt: new Date("2026-01-01") }, { currency: "PKR", amountDue: 1, now: NOW })).toMatchObject({
      reason: "EXPIRED",
    });
    expect(evaluateVoucher({ ...voucher, balance: 0 }, { currency: "PKR", amountDue: 1, now: NOW })).toMatchObject({ reason: "EMPTY" });
  });
});

describe("computeTotals", () => {
  it("applies the discount, then shipping, then the voucher on what is left", () => {
    expect(computeTotals({ subtotal: 50000, shipping: 500, discount: { amount: 5000, freeShipping: false }, voucherBalance: 10000 })).toEqual({
      subtotal: 50000,
      discountAmount: 5000,
      shipping: 500,
      voucherAmount: 10000,
      total: 35500,
    });
  });

  it("zeroes shipping for free-shipping discounts", () => {
    expect(computeTotals({ subtotal: 1000, shipping: 500, discount: { amount: 0, freeShipping: true }, voucherBalance: null })).toMatchObject({
      shipping: 0,
      total: 1000,
    });
  });

  it("lets a voucher cover the whole order and keeps the rest of its balance", () => {
    expect(computeTotals({ subtotal: 1000, shipping: 200, discount: null, voucherBalance: 5000 })).toMatchObject({ voucherAmount: 1200, total: 0 });
  });
});

describe("codes and phones", () => {
  it("normalizes codes to trimmed uppercase without spaces", () => {
    expect(normalizeCode("  save 10 ")).toBe("SAVE10");
  });

  it("generates codes in groups from an unambiguous alphabet", () => {
    let i = 0;
    const code = generateCode("EZ", [4, 4], () => (i++ % 10) / 10);
    expect(code).toMatch(/^EZ-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("matches local and international forms of the same phone", () => {
    expect(normalizePhone("0300 123-4567")).toBe("3001234567");
    expect(normalizePhone("+92 300 1234567")).toBe("3001234567");
    expect(normalizePhone("0092-300-1234567")).toBe("3001234567");
  });
});

describe("voucherRefundDue", () => {
  it("returns what an order took from a voucher and hasn't been given back", () => {
    expect(voucherRefundDue([{ delta: -3000, reason: "REDEEM" }])).toBe(3000);
    expect(voucherRefundDue([{ delta: -3000, reason: "REDEEM" }, { delta: 3000, reason: "REFUND" }])).toBe(0);
  });

  it("ignores manual adjustments", () => {
    expect(voucherRefundDue([{ delta: -3000, reason: "REDEEM" }, { delta: 500, reason: "ADJUST" }])).toBe(3000);
  });
});
