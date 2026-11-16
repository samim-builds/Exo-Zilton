import type { CatalogProduct, CatalogVariant, Product, ProductImageView } from "@/lib/product-types";
import { slugifyOptionValue } from "./variants";

// Maps catalog rows (product → options → variants) onto the storefront view:
// one product page per product, variants chosen via URL params (?size=size-3).

type ImageInput = { url: string; alt: string; sortOrder: number; variantId: string | null };

export type VariantInput = {
  id: string;
  sku: string;
  title: string;
  pricePKR: number;
  priceUSD: number;
  compareAtPKR: number | null;
  compareAtUSD: number | null;
  trackInventory: boolean;
  stockQty: number;
  attributes: unknown;
  legacySlug: string | null;
  position: number;
  active: boolean;
  isDefault: boolean;
  optionValueIds: string[];
};

export type OptionInput = {
  name: string;
  position: number;
  values: { id: string; value: string; slug: string; position: number }[];
};

// Values from the pre-variant columns, for rows the data migration hasn't converted yet.
export type LegacyColumns = {
  sku: string | null;
  size: string | null;
  diameterCm: number | null;
  capacityMl: number | null;
  pricePKR: number | null;
  priceUSD: number | null;
  inStock: boolean;
};

export type CatalogProductInput = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  features: string[];
  careInstructions: string[];
  deliveryInfo: string;
  specs: unknown;
  category: { slug: string; name: string } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  options: OptionInput[];
  images: ImageInput[];
  variants: VariantInput[];
  legacy: LegacyColumns | null;
};

type SearchParams = Record<string, string | string[] | undefined>;

function numberAttr(attributes: unknown, key: string): number {
  const value = (attributes as Record<string, unknown> | null)?.[key];
  return typeof value === "number" ? value : Number(value) || 0;
}

function sortedImages(images: ImageInput[]): ProductImageView[] {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder).map(({ url, alt }) => ({ url, alt }));
}

const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

function toCatalogProduct(input: CatalogProductInput): CatalogProduct | null {
  const productImages = sortedImages(input.images.filter((img) => !img.variantId));
  const shared = {
    id: input.id,
    slug: input.slug,
    name: input.name,
    subtitle: input.subtitle,
    description: input.description,
    features: input.features,
    careInstructions: input.careInstructions,
    deliveryInfo: input.deliveryInfo,
    specs: (input.specs ?? {}) as Record<string, string>,
    category: input.category,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
  };

  if (input.variants.length === 0) {
    const legacy = input.legacy;
    if (!legacy || legacy.pricePKR === null || legacy.priceUSD === null) return null;
    return {
      ...shared,
      options: [],
      variants: [
        {
          key: `legacy:${input.id}`,
          id: undefined,
          sku: legacy.sku ?? input.slug,
          title: legacy.size ?? "",
          selection: {},
          pricePKR: legacy.pricePKR,
          priceUSD: legacy.priceUSD,
          compareAtPKR: null,
          compareAtUSD: null,
          inStock: legacy.inStock,
          diameterCm: legacy.diameterCm ?? 0,
          capacityMl: legacy.capacityMl ?? 0,
          images: productImages,
          legacySlug: null,
          isDefault: true,
        },
      ],
    };
  }

  const options = [...input.options].sort(byPosition).map((o) => ({
    name: o.name,
    param: slugifyOptionValue(o.name),
    values: [...o.values].sort(byPosition),
  }));
  // optionValueId → [param, value slug]
  const valueIndex = new Map(options.flatMap((o) => o.values.map((v) => [v.id, [o.param, v.slug]] as const)));

  const variants = [...input.variants]
    .filter((v) => v.active)
    .sort(byPosition)
    .map((v): CatalogVariant => {
      const own = sortedImages(input.images.filter((img) => img.variantId === v.id));
      return {
        key: v.id,
        id: v.id,
        sku: v.sku,
        title: v.title,
        selection: Object.fromEntries(v.optionValueIds.flatMap((id) => (valueIndex.has(id) ? [valueIndex.get(id)!] : []))),
        pricePKR: v.pricePKR,
        priceUSD: v.priceUSD,
        compareAtPKR: v.compareAtPKR,
        compareAtUSD: v.compareAtUSD,
        inStock: !v.trackInventory || v.stockQty > 0,
        diameterCm: numberAttr(v.attributes, "diameterCm"),
        capacityMl: numberAttr(v.attributes, "capacityMl"),
        images: own.length > 0 ? own : productImages,
        legacySlug: v.legacySlug,
        isDefault: v.isDefault,
      };
    });
  if (variants.length === 0) return null;

  return {
    ...shared,
    options: options.map((o) => ({ name: o.name, param: o.param, values: o.values.map(({ value, slug }) => ({ value, slug })) })),
    variants,
  };
}

export function toCatalogProducts(inputs: CatalogProductInput[]): CatalogProduct[] {
  return inputs.flatMap((input) => toCatalogProduct(input) ?? []);
}

function defaultVariant(product: CatalogProduct): CatalogVariant {
  return product.variants.find((v) => v.isDefault) ?? product.variants[0];
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The variant named by the URL params; unspecified options come from the default variant. */
export function resolveVariant(product: CatalogProduct, params: SearchParams): CatalogVariant {
  const fallback = defaultVariant(product);
  const wanted: Record<string, string> = {};
  for (const option of product.options) {
    const requested = firstParam(params[option.param]);
    const valid = requested && option.values.some((v) => v.slug === requested);
    const value = valid ? requested : fallback.selection[option.param];
    if (value) wanted[option.param] = value;
  }
  const matches = (v: CatalogVariant) => Object.entries(wanted).every(([param, slug]) => v.selection[param] === slug);
  return product.variants.find(matches) ?? fallback;
}

export function variantHref(product: CatalogProduct, variant: CatalogVariant): string {
  const query = new URLSearchParams(
    product.options.flatMap((o) => (variant.selection[o.param] ? [[o.param, variant.selection[o.param]]] : [])),
  ).toString();
  return `/products/${product.slug}${query ? `?${query}` : ""}`;
}

/**
 * Where choosing `valueSlug` for `param` leads from `current`: the same
 * combination with that option swapped, else any variant offering that value.
 */
export function selectionHref(
  product: CatalogProduct,
  current: CatalogVariant,
  param: string,
  valueSlug: string,
): { href: string | null; available: boolean } {
  const target = { ...current.selection, [param]: valueSlug };
  const exact = product.variants.find((v) => Object.entries(target).every(([p, s]) => v.selection[p] === s));
  const match = exact ?? product.variants.find((v) => v.selection[param] === valueSlug);
  return match ? { href: variantHref(product, match), available: true } : { href: null, available: false };
}

export function findByLegacySlug(
  products: CatalogProduct[],
  slug: string,
): { product: CatalogProduct; variant: CatalogVariant } | undefined {
  for (const product of products) {
    const variant = product.variants.find((v) => v.legacySlug === slug);
    if (variant) return { product, variant };
  }
  return undefined;
}

/** One listing card per variant, linking to the product page with it selected. */
export function flattenCatalog(products: CatalogProduct[]): Product[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      productId: product.id,
      variantId: variant.id,
      variantKey: variant.key,
      href: variantHref(product, variant),
      slug: product.slug,
      name: product.options.length > 0 && variant.title ? `${product.name} - ${variant.title}` : product.name,
      sku: variant.sku,
      size: variant.title,
      diameterCm: variant.diameterCm,
      capacityMl: variant.capacityMl,
      pricePKR: variant.pricePKR,
      priceUSD: variant.priceUSD,
      inStock: variant.inStock,
      images: variant.images.map((img) => img.url),
      imageAlts: variant.images,
      features: product.features,
      specs: product.specs,
      description: product.description,
      careInstructions: product.careInstructions,
      deliveryInfo: product.deliveryInfo,
    })),
  );
}

/** Slugs of a category and every category below it (cycle-safe). */
export function categorySubtree(
  categories: { id: string; slug: string; parentId: string | null }[],
  slug: string,
): Set<string> {
  const root = categories.find((c) => c.slug === slug);
  const found = new Set<string>();
  if (!root) return found;
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (found.has(current.slug)) continue;
    found.add(current.slug);
    queue.push(...categories.filter((c) => c.parentId === current.id));
  }
  return found;
}
