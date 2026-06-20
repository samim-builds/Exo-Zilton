import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/admin-schemas";
import { mapDbProduct } from "@/lib/product-types";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL and run migrations." },
      { status: 503 },
    );
  }

  const products = await prisma.product.findMany({
    include: { images: true },
    orderBy: [{ sortOrder: "asc" }, { diameterCm: "asc" }],
  });

  return NextResponse.json(products.map(mapDbProduct));
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ slug: data.slug }, { sku: data.sku }] },
    });

    if (existing) {
      return NextResponse.json({ error: "Slug or SKU already exists" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        slug: data.slug,
        name: data.name,
        sku: data.sku,
        size: data.size,
        diameterCm: data.diameterCm,
        capacityMl: data.capacityMl,
        pricePKR: data.pricePKR,
        priceUSD: data.priceUSD,
        inStock: data.inStock,
        published: data.published,
        description: data.description,
        features: data.features,
        specs: data.specs,
        careInstructions: data.careInstructions,
        deliveryInfo: data.deliveryInfo,
        sortOrder: data.sortOrder,
        images: {
          create: data.images.map((img) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json(mapDbProduct(product), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }
}
