export type Product = {
  /** Set for database-backed entries; absent in the static fallback. */
  productId?: string;
  variantId?: string;
  slug: string;
  name: string;
  sku: string;
  size: string;
  diameterCm: number;
  capacityMl: number;
  pricePKR: number;
  priceUSD: number;
  inStock: boolean;
  images: string[];
  imageAlts?: { url: string; alt: string }[];
  features: string[];
  specs: Record<string, string>;
  description: string;
  careInstructions: string[];
  deliveryInfo: string;
};

