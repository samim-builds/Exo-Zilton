import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

  // Merge duplicate lines and price everything server-side from the database.
  const quantities = new Map<string, number>();
  for (const item of data.items) {
    quantities.set(item.slug, Math.min(99, (quantities.get(item.slug) ?? 0) + item.quantity));
  }

  try {
    const products = await prisma.product.findMany({
      where: { slug: { in: [...quantities.keys()] }, published: true },
    });

    const unavailable = [...quantities.keys()].filter(
      (slug) => !products.some((p) => p.slug === slug && p.inStock),
    );
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: "Some items in your cart are no longer available. Please review your cart." },
        { status: 409 },
      );
    }

    const domestic = isDomestic(data.country);
    const currency = domestic ? "PKR" : "USD";
    const items = products.map((p) => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      size: p.size,
      unitPrice: domestic ? p.pricePKR : p.priceUSD,
      quantity: quantities.get(p.slug)!,
    }));
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

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
