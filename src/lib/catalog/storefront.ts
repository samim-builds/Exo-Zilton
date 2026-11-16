import type { Product } from "@/lib/product-types";
import { slugifyOptionValue } from "./variants";

// Maps catalog products (product → variants) onto the storefront's per-size
// `Product` view, one entry per active variant. The storefront pages still
// work per size until the variant selector lands.

type ImageInput = { url: string; alt: string; sortOrder: number; variantId: string | null };

export type VariantInput = {
  id: string;
  sku: string;
  title: string;
  pricePKR: number;
  priceUSD: number;
  trackInventory: boolean;
  stockQty: number;
  attributes: unknown;
  legacySlug: string | null;
  position: number;
  active: boolean;
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
  description: string;
  features: string[];
  careInstructions: string[];
  deliveryInfo: string;
  specs: unknown;
  images: ImageInput[];
  variants: VariantInput[];
  legacy: LegacyColumns | null;
};

function numberAttr(attributes: unknown, key: string): number {
  const value = (attributes as Record<string, unknown> | null)?.[key];
  return typeof value === "number" ? value : Number(value) || 0;
}

function sortImages(images: ImageInput[]) {
  return [...images].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function toStorefrontProducts(products: CatalogProductInput[]): Product[] {
  return products.flatMap((product): Product[] => {
    const productImages = sortImages(product.images.filter((img) => !img.variantId));
    const shared = {
      description: product.description,
      features: product.features,
      careInstructions: product.careInstructions,
      deliveryInfo: product.deliveryInfo,
      specs: (product.specs ?? {}) as Record<string, string>,
    };

    if (product.variants.length === 0) {
      const legacy = product.legacy;
      if (!legacy || legacy.pricePKR === null || legacy.priceUSD === null) return [];
      return [
        {
          ...shared,
          productId: product.id,
          variantId: undefined,
          slug: product.slug,
          name: product.name,
          sku: legacy.sku ?? product.slug,
          size: legacy.size ?? "",
          diameterCm: legacy.diameterCm ?? 0,
          capacityMl: legacy.capacityMl ?? 0,
          pricePKR: legacy.pricePKR,
          priceUSD: legacy.priceUSD,
          inStock: legacy.inStock,
          images: productImages.map((img) => img.url),
          imageAlts: productImages.map(({ url, alt }) => ({ url, alt })),
        },
      ];
    }

    return [...product.variants]
      .filter((v) => v.active)
      .sort((a, b) => a.position - b.position)
      .map((variant) => {
        const own = sortImages(product.images.filter((img) => img.variantId === variant.id));
        const images = own.length > 0 ? own : productImages;
        return {
          ...shared,
          productId: product.id,
          variantId: variant.id,
          slug: variant.legacySlug ?? `${product.slug}-${slugifyOptionValue(variant.title)}`,
          name: `${product.name} - ${variant.title}`,
          sku: variant.sku,
          size: variant.title,
          diameterCm: numberAttr(variant.attributes, "diameterCm"),
          capacityMl: numberAttr(variant.attributes, "capacityMl"),
          pricePKR: variant.pricePKR,
          priceUSD: variant.priceUSD,
          inStock: !variant.trackInventory || variant.stockQty > 0,
          images: images.map((img) => img.url),
          imageAlts: images.map(({ url, alt }) => ({ url, alt })),
        };
      });
  });
}
