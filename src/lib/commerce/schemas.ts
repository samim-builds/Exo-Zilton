import { z } from "zod";
import { normalizeCode } from "./discounts";

// Admin input for discount codes and gift vouchers.

const codeSchema = z
  .string()
  .transform(normalizeCode)
  .pipe(z.string().regex(/^[A-Z0-9-]{3,40}$/, "Use 3–40 letters, numbers or dashes."));

const amount = z.number().int().min(0).nullable();
const limit = z.number().int().min(1).nullable();
// datetime-local values ("2026-12-01T00:00") or ISO strings; blank means none.
const optionalDate = z
  .union([z.string(), z.date(), z.null()])
  .transform((v, ctx) => {
    if (v === null || v === "") return null;
    const date = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Enter a valid date." });
      return z.NEVER;
    }
    return date;
  });

export const discountInputSchema = z
  .object({
    id: z.string().optional(),
    code: codeSchema,
    title: z.string().trim().min(1, "Give the discount a name.").max(120),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    percentOff: z.number().int().nullable(),
    valuePKR: amount,
    valueUSD: amount,
    minSubtotalPKR: amount,
    minSubtotalUSD: amount,
    maxDiscountPKR: amount,
    maxDiscountUSD: amount,
    appliesTo: z.enum(["ALL", "CATEGORIES", "PRODUCTS"]),
    categoryIds: z.array(z.string()).max(200),
    productIds: z.array(z.string()).max(500),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: limit,
    perCustomerLimit: limit,
    firstOrderOnly: z.boolean(),
    combinable: z.boolean(),
    active: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && (d.percentOff === null || d.percentOff < 1 || d.percentOff > 100)) {
      ctx.addIssue({ code: "custom", path: ["percentOff"], message: "Enter a percentage from 1 to 100." });
    }
    if (d.type === "FIXED" && !d.valuePKR && !d.valueUSD) {
      ctx.addIssue({ code: "custom", path: ["valuePKR"], message: "Enter an amount in PKR, USD or both." });
    }
    if (d.appliesTo === "CATEGORIES" && d.categoryIds.length === 0) {
      ctx.addIssue({ code: "custom", path: ["categoryIds"], message: "Choose at least one category." });
    }
    if (d.appliesTo === "PRODUCTS" && d.productIds.length === 0) {
      ctx.addIssue({ code: "custom", path: ["productIds"], message: "Choose at least one product." });
    }
    if (d.startsAt && d.endsAt && d.endsAt <= d.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after the start." });
    }
  })
  .transform((d) => ({
    ...d,
    percentOff: d.type === "PERCENT" ? d.percentOff : null,
    valuePKR: d.type === "FIXED" ? d.valuePKR || null : null,
    valueUSD: d.type === "FIXED" ? d.valueUSD || null : null,
    maxDiscountPKR: d.type === "PERCENT" ? d.maxDiscountPKR : null,
    maxDiscountUSD: d.type === "PERCENT" ? d.maxDiscountUSD : null,
    categoryIds: d.appliesTo === "CATEGORIES" ? d.categoryIds : [],
    productIds: d.appliesTo === "PRODUCTS" ? d.productIds : [],
  }));

export type DiscountInput = z.input<typeof discountInputSchema>;

export const voucherIssueSchema = z
  .object({
    currency: z.enum(["PKR", "USD"]),
    amount: z.number().int().min(1, "Enter an amount."),
    quantity: z.number().int().min(1).max(200),
    code: codeSchema.optional(),
    expiresAt: optionalDate.optional(),
    recipientEmail: z.union([z.literal(""), z.email("Enter a valid email.")]).optional(),
    note: z.string().trim().max(500).optional(),
    reason: z.enum(["PURCHASE", "GIFT", "REFUND", "PROMO"]),
  })
  .refine((d) => !d.code || d.quantity === 1, { path: ["code"], message: "A custom code only works for a single voucher." });

export type VoucherIssueInput = z.input<typeof voucherIssueSchema>;

export const voucherAdjustSchema = z.object({
  id: z.string().min(1),
  delta: z.number().int().refine((n) => n !== 0, "Enter an amount to add or remove."),
  note: z.string().trim().min(1, "Say why the balance changed.").max(500),
});
