import { z } from "zod";
import { countries } from "./inquiry-schema";
import { formatPKR, formatUSD } from "./format";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z.string().trim().min(7, "Please enter a valid phone number"),
  country: z.enum(countries as [string, ...string[]], { message: "Please select a country" }),
  addressLine: z.string().trim().min(5, "Please enter your full address"),
  city: z.string().trim().min(2, "Please enter your city"),
  postalCode: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const orderRequestSchema = checkoutSchema.extend({
  items: z
    .array(
      z.object({
        // Catalog variant key (see CatalogVariant.key).
        variantId: z.string().min(1).max(100),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty")
    .max(20),
  discountCode: z.string().trim().max(40).optional(),
  voucherCode: z.string().trim().max(40).optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type OrderRequest = z.infer<typeof orderRequestSchema>;

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  paid: z.boolean().optional(),
  courier: z.string().trim().max(100).optional(),
  trackingNumber: z.string().trim().max(100).optional(),
});

// Pakistan orders are priced in PKR and paid cash on delivery; everywhere else
// is priced in USD and we follow up with a shipping quote and payment link.
export function isDomestic(country: string): boolean {
  return country === "Pakistan";
}

export function formatMoney(amount: number, currency: string): string {
  return currency === "PKR" ? formatPKR(amount) : formatUSD(amount);
}

type OrderIncentives = { discountCode: string | null; discountAmount: number; voucherCode: string | null; voucherAmount: number };

/** Discount and gift-voucher lines to show between the items and the total. */
export function orderAdjustments(order: OrderIncentives): { label: string; amount: number }[] {
  return [
    ...(order.discountCode && order.discountAmount > 0 ? [{ label: `Discount (${order.discountCode})`, amount: -order.discountAmount }] : []),
    ...(order.voucherCode && order.voucherAmount > 0 ? [{ label: `Gift voucher (${order.voucherCode})`, amount: -order.voucherAmount }] : []),
  ];
}
