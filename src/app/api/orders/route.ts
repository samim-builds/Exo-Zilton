import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { queryCatalog } from "@/lib/catalog/queries";
import { priceOrderLines } from "@/lib/catalog/order-pricing";
import { isDomestic, orderRequestSchema } from "@/lib/order-schema";
import { sendOrderEmails } from "@/lib/order-emails";

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
    const { items, subtotal } = priced;

    const customer = await prisma.customer.upsert({
      where: { email: data.email.toLowerCase() },
      update: { name: data.name, phone: data.phone },
      create: { email: data.email.toLowerCase(), name: data.name, phone: data.phone },
    });

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        paymentMethod: domestic ? "COD" : "PAY_ON_CONFIRMATION",
        currency,
        subtotal,
        shipping: 0,
        total: subtotal,
        name: data.name,
        email: data.email,
        phone: data.phone,
        addressLine: data.addressLine,
        city: data.city,
        postalCode: data.postalCode || null,
        country: data.country,
        notes: data.notes || null,
        items: { create: items },
      },
      include: { items: true },
    });

    await sendOrderEmails(order);

    return NextResponse.json({ id: order.id, number: order.number }, { status: 201 });
  } catch (error) {
    console.error("[Order error]", error);
    return NextResponse.json(
      { error: "We couldn't place your order. Please try again or order via WhatsApp." },
      { status: 500 },
    );
  }
}
