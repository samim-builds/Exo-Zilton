// Storefront view types. Client-safe: no server imports.

export type ProductImageView = { url: string; alt: string };

export type CatalogOption = {
  name: string;
  /** URL search param for this option, e.g. "size". */
  param: string;
  values: { value: string; slug: string }[];
};

export type CatalogVariant = {
  /** Cart/order key: the variant id, or a synthetic key for rows without variants. */
  key: string;
  id?: string;
  sku: string;
  title: string;
  /** Option param → value slug, e.g. { size: "size-3" }. */
  selection: Record<string, string>;
  pricePKR: number;
  priceUSD: number;
  compareAtPKR: number | null;
  compareAtUSD: number | null;
  inStock: boolean;
  diameterCm: number;
  capacityMl: number;
  images: ProductImageView[];
  legacySlug: string | null;
  isDefault: boolean;
};

export type CatalogProduct = {
  id?: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  features: string[];
  careInstructions: string[];
  deliveryInfo: string;
  specs: Record<string, string>;
  category: { slug: string; name: string } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  options: CatalogOption[];
  variants: CatalogVariant[];
  /** Set for bundles: what one bundle contains. */
  bundle?: { items: BundleContent[] };
};

export type BundleContent = { variantId: string; sku: string; name: string; quantity: number; href: string };

/** One listing card: a single variant of a product. */
export type Product = {
  productId?: string;
  variantId?: string;
  variantKey: string;
  /** Product page URL with this variant selected. */
  href: string;
  slug: string;
  name: string;
  /** The product's own name, without the size (cart lines show the size separately). */
  productName?: string;
  sku: string;
  size: string;
  diameterCm: number;
  capacityMl: number;
  pricePKR: number;
  priceUSD: number;
  compareAtPKR?: number | null;
  compareAtUSD?: number | null;
  /** Bundles only: how many items one bundle holds. */
  bundleItemCount?: number;
  inStock: boolean;
  images: string[];
  imageAlts?: ProductImageView[];
  features: string[];
  specs: Record<string, string>;
  description: string;
  careInstructions: string[];
  deliveryInfo: string;
};
