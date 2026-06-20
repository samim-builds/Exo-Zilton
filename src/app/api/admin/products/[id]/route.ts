import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/admin-schemas";
import { mapDbProduct } from "@/lib/product-types";
import { requireAdmin } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(mapDbProduct(product));
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const data = productSchema.parse(body);

    const conflict = await prisma.product.findFirst({
      where: {
        OR: [{ slug: data.slug }, { sku: data.sku }],
        NOT: { id },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "Slug or SKU already in use" }, { status: 409 });
    }

    await prisma.productImage.deleteMany({ where: { productId: id } });

    const product = await prisma.product.update({
      where: { id },
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

    return NextResponse.json(mapDbProduct(product));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid product data" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
