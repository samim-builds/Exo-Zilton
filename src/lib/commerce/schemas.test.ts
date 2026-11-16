import { describe, expect, it } from "vitest";
import { discountInputSchema, voucherAdjustSchema, voucherIssueSchema } from "./schemas";

const base = {
  code: " spring 10 ",
  title: "Spring sale",
  type: "PERCENT" as const,
  percentOff: 10,
  valuePKR: null,
  valueUSD: null,
  minSubtotalPKR: null,
  minSubtotalUSD: null,
  maxDiscountPKR: null,
  maxDiscountUSD: null,
  appliesTo: "ALL" as const,
  categoryIds: [],
  productIds: [],
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  perCustomerLimit: null,
  firstOrderOnly: false,
  combinable: true,
  active: true,
};

const issues = (input: unknown) => {
  const result = discountInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("discountInputSchema", () => {
  it("normalizes the code", () => {
    expect(discountInputSchema.parse(base).code).toBe("SPRING10");
  });

  it("rejects codes with symbols", () => {
    expect(issues({ ...base, code: "50%OFF!" })).toContain("code");
  });

  it("needs a percentage between 1 and 100 for percent codes", () => {
    expect(issues({ ...base, percentOff: null })).toContain("percentOff");
    expect(issues({ ...base, percentOff: 120 })).toContain("percentOff");
  });

  it("needs an amount in at least one currency for fixed codes", () => {
    expect(issues({ ...base, type: "FIXED", percentOff: null })).toContain("valuePKR");
    expect(issues({ ...base, type: "FIXED", percentOff: null, valueUSD: 5 })).toEqual([]);
  });

  it("needs categories or products when the scope is limited", () => {
    expect(issues({ ...base, appliesTo: "CATEGORIES" })).toContain("categoryIds");
    expect(issues({ ...base, appliesTo: "PRODUCTS" })).toContain("productIds");
  });

  it("parses dates and requires the end after the start", () => {
    const parsed = discountInputSchema.parse({ ...base, startsAt: "2026-12-01T00:00", endsAt: "2026-12-31T23:59" });
    expect(parsed.startsAt).toBeInstanceOf(Date);
    expect(issues({ ...base, startsAt: "2026-12-31T00:00", endsAt: "2026-12-01T00:00" })).toContain("endsAt");
  });

  it("clears values that don't apply to the type", () => {
    const parsed = discountInputSchema.parse({ ...base, type: "FREE_SHIPPING", percentOff: 10, valuePKR: 100 });
    expect(parsed).toMatchObject({ percentOff: null, valuePKR: null, valueUSD: null });
  });
});

describe("voucherIssueSchema", () => {
  it("issues up to 200 vouchers of a positive amount", () => {
    expect(voucherIssueSchema.safeParse({ currency: "PKR", amount: 5000, quantity: 3, reason: "GIFT" }).success).toBe(true);
    expect(voucherIssueSchema.safeParse({ currency: "PKR", amount: 0, quantity: 1, reason: "GIFT" }).success).toBe(false);
    expect(voucherIssueSchema.safeParse({ currency: "PKR", amount: 5000, quantity: 500, reason: "GIFT" }).success).toBe(false);
  });

  it("only takes a custom code for a single voucher", () => {
    expect(voucherIssueSchema.safeParse({ currency: "PKR", amount: 5000, quantity: 2, reason: "GIFT", code: "ez-gift-01" }).success).toBe(false);
    expect(voucherIssueSchema.parse({ currency: "PKR", amount: 5000, quantity: 1, reason: "GIFT", code: "ez-gift-01" }).code).toBe("EZ-GIFT-01");
  });
});

describe("voucherAdjustSchema", () => {
  it("needs a non-zero change and a reason", () => {
    expect(voucherAdjustSchema.safeParse({ id: "v1", delta: 0, note: "x" }).success).toBe(false);
    expect(voucherAdjustSchema.safeParse({ id: "v1", delta: -500, note: "" }).success).toBe(false);
    expect(voucherAdjustSchema.safeParse({ id: "v1", delta: -500, note: "Damaged item goodwill" }).success).toBe(true);
  });
});
