import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { queryCatalog } from "@/lib/catalog/queries";
import { priceOrderLines } from "@/lib/catalog/order-pricing";
import { identifyCode, quoteOrder } from "@/lib/commerce/checkout";
import { getClientIp, isRateLimited, recordAttempt } from "@/lib/admin/rate-limit";
import { isDomestic } from "@/lib/order-schema";

const quoteSchema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(99) })).min(1).max(20),
  country: z.string().min(1).max(60),
  email: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  discountCode: z.string().trim().max(40).optional(),
  voucherCode: z.string().trim().max(40).optional(),
  /** A newly typed code; the server works out whether it is a discount or a voucher. */
  code: z.string().trim().max(40).optional(),
});

// Wrong codes per IP before the endpoint stops answering for 15 minutes (stops code guessing).
const MAX_UNKNOWN_CODES = 10;

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Codes can't be applied right now." }, { status: 503 });
  }

  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your cart and try again." }, { status: 400 });
  }
  const data = parsed.data;
  const limitKey = `code:${getClientIp(request)}`;

  let { discountCode, voucherCode } = data;
  let applied: "discount" | "voucher" | null = null;
  // Every code field counts toward the limit, not just the "apply" field, so the
  // others can't be used to test whether codes exist.
  if (data.code || discountCode || voucherCode) {
    if (await isRateLimited(limitKey, MAX_UNKNOWN_CODES)) {
      return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
    }
  }
  for (const existing of [discountCode, voucherCode]) {
    if (existing && !(await identifyCode(prisma, existing))) await recordAttempt(limitKey, false);
  }
  if (data.code) {
    applied = await identifyCode(prisma, data.code);
    if (!applied) {
      await recordAttempt(limitKey, false);
      return NextResponse.json({ error: "We couldn't find that code." }, { status: 404 });
    }
    if (applied === "discount") discountCode = data.code;
    else voucherCode = data.code;
  }

  try {
    const currency = isDomestic(data.country) ? "PKR" : "USD";
    const priced = priceOrderLines(await queryCatalog(), data.items, currency);
    if (!priced.ok) {
      return NextResponse.json({ error: "Some items in your cart are no longer available." }, { status: 409 });
    }
    const quote = await quoteOrder(prisma, {
      items: priced.items,
      currency,
      shipping: 0,
      email: data.email || undefined,
      phone: data.phone || undefined,
      discountCode,
      voucherCode,
    });

    return NextResponse.json({
      applied,
      currency,
      totals: quote.totals,
      discount: quote.discount && { code: quote.discount.code, title: quote.discount.title, amount: quote.discount.amount, freeShipping: quote.discount.freeShipping },
      voucher: quote.voucher && { code: quote.voucher.code, amount: quote.voucher.amount, remaining: quote.voucher.remaining },
      errors: quote.errors,
    });
  } catch (error) {
    console.error("[Quote error]", error);
    return NextResponse.json({ error: "We couldn't check that code. Please try again." }, { status: 500 });
  }
}
