import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { queryCatalog } from "@/lib/catalog/queries";
import { priceOrderLines } from "@/lib/catalog/order-pricing";
import { isDomestic, orderRequestSchema } from "@/lib/order-schema";
import { sendOrderEmails } from "@/lib/order-emails";
import { CodeConflictError, commitIncentives, quoteOrder } from "@/lib/commerce/checkout";
import { normalizePhone } from "@/lib/commerce/discounts";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Online ordering is unavailable. Please order via WhatsApp." },
      { status: 503 },
    );
  }

  const parsed = orderRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const data = parsed.data;

  try {
    // Price every line server-side from the live (uncached) catalog.
    const domestic = isDomestic(data.country);
    const currency = domestic ? "PKR" : "USD";
    const priced = priceOrderLines(await queryCatalog(), data.items, currency);
    if (!priced.ok) {
      return NextResponse.json(
        { error: "Some items in your cart are no longer available. Please review your cart." },
        { status: 409 },
      );
    }
    const { items } = priced;
    const email = data.email.toLowerCase();

    const customer = await prisma.customer.upsert({
      where: { email },
      update: { name: data.name, phone: data.phone },
      create: { email, name: data.name, phone: data.phone },
    });

    // Codes are re-validated and claimed in the same transaction as the order,
    // so a code used up between the cart preview and now can't be redeemed twice.
    const order = await prisma.$transaction(async (tx) => {
      const quote = await quoteOrder(tx, {
        items,
        currency,
        shipping: 0,
        email,
        phone: data.phone,
        discountCode: data.discountCode,
        voucherCode: data.voucherCode,
      });
      const codeError = quote.errors.discount ?? quote.errors.voucher;
      if (codeError) throw new CodeConflictError(codeError);

      const created = await tx.order.create({
        data: {
          customerId: customer.id,
          paymentMethod: domestic ? "COD" : "PAY_ON_CONFIRMATION",
          currency,
          subtotal: quote.totals.subtotal,
          shipping: quote.totals.shipping,
          discountCode: quote.discount?.code ?? null,
          discountAmount: quote.totals.discountAmount,
          voucherCode: quote.voucher?.code ?? null,
          voucherAmount: quote.totals.voucherAmount,
          total: quote.totals.total,
          name: data.name,
          email: data.email,
          phone: data.phone,
          phoneNormalized: normalizePhone(data.phone),
          addressLine: data.addressLine,
          city: data.city,
          postalCode: data.postalCode || null,
          country: data.country,
          notes: data.notes || null,
          items: { create: items },
        },
        include: { items: true },
      });
      await commitIncentives(tx, { orderId: created.id, quote, email, phone: data.phone, currency });
      return created;
    });

    await sendOrderEmails(order);

    return NextResponse.json({ id: order.id, number: order.number }, { status: 201 });
  } catch (error) {
    if (error instanceof CodeConflictError) {
      return NextResponse.json({ error: error.message, field: "code" }, { status: 409 });
    }
    console.error("[Order error]", error);
    return NextResponse.json(
      { error: "We couldn't place your order. Please try again or order via WhatsApp." },
      { status: 500 },
    );
  }
}
