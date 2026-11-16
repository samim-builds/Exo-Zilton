import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { AttributeDef } from "./attributes";
import type { CategoryInput, ProductInput } from "./schemas";
import { bundleAvailability, bundlePricing } from "./bundles";

export type CategoryNodeView = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  depth: number;
  path: string;
  sortOrder: number;
  published: boolean;
  productCount: number;
  attributes: AttributeDef[];
};

/** All categories in tree order (parents before children), with depth and a "Parent › Child" path. */
export async function listCategoryTree(): Promise<CategoryNodeView[]> {
  const rows = await prisma.category.findMany({
    include: { attributes: { orderBy: { sortOrder: "asc" } }, _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const children = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const key = row.parentId && rows.some((r) => r.id === row.parentId) ? row.parentId : null;
    children.set(key, [...(children.get(key) ?? []), row]);
  }

  const out: CategoryNodeView[] = [];
  const visit = (parentId: string | null, depth: number, prefix: string) => {
    for (const row of children.get(parentId) ?? []) {
      if (out.some((c) => c.id === row.id)) continue;
      const path = prefix ? `${prefix} › ${row.name}` : row.name;
      out.push({
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parentId,
        depth,
        path,
        sortOrder: row.sortOrder,
        published: row.published,
        productCount: row._count.products,
        attributes: row.attributes,
      });
      visit(row.id, depth + 1, path);
    }
  };
  visit(null, 0, "");
  return out;
}

export async function getCategoryForEdit(id: string): Promise<CategoryInput | null> {
  const row = await prisma.category.findUnique({
    where: { id },
    include: { attributes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    imageUrl: row.imageUrl,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    published: row.published,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    attributes: row.attributes.map((a) => ({
      id: a.id,
      key: a.key,
      label: a.label,
      type: a.type,
      unit: a.unit,
      options: a.options,
      scope: a.scope,
      required: a.required,
    })),
  };
}

/** Category definitions the product editor needs to compute inherited attributes client-side. */
export async function listCategoriesForEditor() {
  return prisma.category.findMany({
    select: { id: true, name: true, parentId: true, attributes: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getProductForEdit(id: string): Promise<ProductInput | null> {
  const row = await prisma.product.findUnique({
    where: { id },
    include: {
      options: { orderBy: { position: "asc" }, include: { values: { orderBy: { position: "asc" } } } },
      variants: {
        orderBy: { position: "asc" },
        include: { optionValues: { include: { optionValue: { include: { option: true } } } } },
      },
      images: { orderBy: { sortOrder: "asc" } },
      bundleItems: { orderBy: { position: "asc" }, select: { variantId: true, quantity: true } },
    },
  });
  if (!row) return null;

  // Legacy per-size rows (pre catalog v2) have no variants yet: surface their
  // old columns as one default variant so they can be edited and saved.
  const variants: ProductInput["variants"] =
    row.variants.length > 0
      ? row.variants.map((v) => ({
          id: v.id,
          key: v.id,
          combo: Object.fromEntries(v.optionValues.map((ov) => [ov.optionValue.option.name, ov.optionValue.value])),
          sku: v.sku,
          pricePKR: v.pricePKR,
          priceUSD: v.priceUSD,
          compareAtPKR: v.compareAtPKR,
          compareAtUSD: v.compareAtUSD,
          costPKR: v.costPKR,
          trackInventory: v.trackInventory,
          stockQty: v.stockQty,
          lowStockThreshold: v.lowStockThreshold,
          weightGrams: v.weightGrams,
          attributes: (v.attributes ?? {}) as Record<string, unknown>,
          active: v.active,
        }))
      : [
          {
            key: "default",
            combo: {},
            sku: row.sku ?? row.slug.toUpperCase(),
            pricePKR: row.pricePKR ?? 0,
            priceUSD: row.priceUSD ?? 0,
            trackInventory: !row.inStock,
            stockQty: 0,
            lowStockThreshold: 5,
            attributes: { diameterCm: row.diameterCm ?? undefined, capacityMl: row.capacityMl ?? undefined },
            active: true,
          },
        ];

  return {
    id: row.id,
    kind: row.kind,
    bundle:
      row.kind === "BUNDLE"
        ? { mode: row.bundlePricingMode, discountPercent: row.bundleDiscountPercent, items: row.bundleItems }
        : null,
    name: row.name,
    slug: row.slug,
    subtitle: row.subtitle ?? "",
    categoryId: row.categoryId,
    status: row.status,
    description: row.description,
    features: row.features,
    careInstructions: row.careInstructions,
    deliveryInfo: row.deliveryInfo,
    specs: Object.entries((row.specs ?? {}) as Record<string, string>).map(([key, value]) => ({ key, value: String(value) })),
    attributes: (row.attributes ?? {}) as Record<string, unknown>,
    tags: row.tags,
    featured: row.featured,
    sortOrder: row.sortOrder,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    options: row.options.map((o) => ({ name: o.name, values: o.values.map((v) => v.value) })),
    variants,
    images: row.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      variantKey: img.variantId && row.variants.some((v) => v.id === img.variantId) ? img.variantId : null,
    })),
  };
}

export type ProductListRow = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  kind: "STANDARD" | "BUNDLE";
  category: string | null;
  image: string | null;
  variantCount: number;
  minPKR: number | null;
  maxPKR: number | null;
  stock: { tracked: boolean; total: number; outOfStock: number };
  /** Bundles only: item count and how many bundles the components can fill (null = unlimited). */
  bundle: { itemCount: number; available: number | null } | null;
  featured: boolean;
  updatedAt: Date;
};

export async function listProductsAdmin(args: {
  kind: "STANDARD" | "BUNDLE";
  q: string;
  status?: string[];
  category?: string[];
  sort: { id: "name" | "updatedAt" | "sortOrder"; desc: boolean };
  skip: number;
  take: number;
}): Promise<{ rows: ProductListRow[]; total: number }> {
  const statuses = (args.status ?? []).filter((s): s is "DRAFT" | "ACTIVE" | "ARCHIVED" =>
    ["DRAFT", "ACTIVE", "ARCHIVED"].includes(s),
  );
  const categories = args.category ?? [];
  const categoryIds = categories.filter((c) => c !== "none");
  const where: Prisma.ProductWhereInput = {
    kind: args.kind,
    // Archived rows are hidden unless asked for, so converted legacy rows stay out of the way.
    status: statuses.length > 0 ? { in: statuses } : { not: "ARCHIVED" },
    AND: [
      args.q
        ? {
            OR: [
              { name: { contains: args.q, mode: "insensitive" } },
              { slug: { contains: args.q, mode: "insensitive" } },
              { variants: { some: { sku: { contains: args.q, mode: "insensitive" } } } },
            ],
          }
        : {},
      categories.length > 0
        ? {
            OR: [
              ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
              ...(categories.includes("none") ? [{ categoryId: null }] : []),
            ],
          }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        variants: { select: { pricePKR: true, priceUSD: true, active: true, trackInventory: true, stockQty: true } },
        bundleItems: {
          select: {
            quantity: true,
            variant: { select: { pricePKR: true, priceUSD: true, trackInventory: true, stockQty: true, active: true, product: { select: { status: true } } } },
          },
        },
      },
      orderBy: { [args.sort.id]: args.sort.desc ? "desc" : "asc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    total,
    rows: rows.map((p) => {
      const active = p.variants.filter((v) => v.active);
      const parts = p.bundleItems.map((b) => ({ ...b.variant, active: b.variant.active && b.variant.product.status === "ACTIVE", quantity: b.quantity }));
      const prices =
        p.kind === "BUNDLE"
          ? active.map(
              (v) =>
                bundlePricing({ mode: p.bundlePricingMode, discountPercent: p.bundleDiscountPercent, fixedPKR: v.pricePKR, fixedUSD: v.priceUSD }, parts)
                  .pricePKR,
            )
          : active.map((v) => v.pricePKR);
      const tracked = active.filter((v) => v.trackInventory);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        status: p.status,
        kind: p.kind,
        category: p.category?.name ?? null,
        image: p.images[0]?.url ?? null,
        variantCount: p.variants.length,
        minPKR: prices.length ? Math.min(...prices) : p.pricePKR,
        maxPKR: prices.length ? Math.max(...prices) : p.pricePKR,
        stock: {
          tracked: tracked.length > 0,
          total: tracked.reduce((sum, v) => sum + v.stockQty, 0),
          outOfStock: tracked.filter((v) => v.stockQty <= 0).length,
        },
        bundle: p.kind === "BUNDLE" ? { itemCount: parts.length, available: bundleAvailability(parts) } : null,
        featured: p.featured,
        updatedAt: p.updatedAt,
      };
    }),
  };
}

export type BundleComponentOption = {
  variantId: string;
  label: string;
  sku: string;
  pricePKR: number;
  priceUSD: number;
  trackInventory: boolean;
  stockQty: number;
  /** False when the variant or its product can't currently be sold. */
  sellable: boolean;
};

/** Variants that can go inside a bundle: those of standard, non-archived products. */
export async function listBundleComponentOptions(): Promise<BundleComponentOption[]> {
  const variants = await prisma.productVariant.findMany({
    where: { product: { kind: "STANDARD", status: { not: "ARCHIVED" } } },
    select: {
      id: true,
      sku: true,
      title: true,
      pricePKR: true,
      priceUSD: true,
      trackInventory: true,
      stockQty: true,
      active: true,
      product: { select: { name: true, status: true } },
    },
    orderBy: [{ product: { sortOrder: "asc" } }, { product: { name: "asc" } }, { position: "asc" }],
  });
  return variants.map((v) => ({
    variantId: v.id,
    label: v.title ? `${v.product.name} - ${v.title}` : v.product.name,
    sku: v.sku,
    pricePKR: v.pricePKR,
    priceUSD: v.priceUSD,
    trackInventory: v.trackInventory,
    stockQty: v.stockQty,
    sellable: v.active && v.product.status === "ACTIVE",
  }));
}
