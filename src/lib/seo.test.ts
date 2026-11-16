import { describe, expect, it } from "vitest";
import type { CatalogProduct, CatalogVariant } from "@/lib/product-types";
import { productGroupJsonLd } from "./seo";
import { siteConfig } from "./site";

const variant = (over: Partial<CatalogVariant>): CatalogVariant => ({
  key: "v",
  id: "v",
  sku: "SKU",
  title: "",
  selection: {},
  pricePKR: 1000,
  priceUSD: 10,
  compareAtPKR: null,
  compareAtUSD: null,
  inStock: true,
  diameterCm: 0,
  capacityMl: 0,
  images: [],
  legacySlug: null,
  isDefault: false,
  ...over,
});

const product: CatalogProduct = {
  id: "p1",
  slug: "mortar-and-pestle",
  name: "Mortar and Pestle",
  subtitle: null,
  description: "Porcelain",
  features: [],
  careInstructions: [],
  deliveryInfo: "",
  specs: {},
  category: null,
  options: [{ name: "Size", param: "size", values: [] }],
  variants: [
    variant({ sku: "EZ-001", title: "Size 1", selection: { size: "size-1" }, images: [{ url: "/p/1.webp", alt: "" }] }),
    variant({ sku: "EZ-002", title: "Size 2", selection: { size: "size-2" }, inStock: false, images: [{ url: "https://blob.example/2.webp", alt: "" }] }),
  ],
};

describe("productGroupJsonLd", () => {
  const ld = productGroupJsonLd(product);

  it("describes the product as a ProductGroup varying by its options", () => {
    expect(ld).toMatchObject({
      "@type": "ProductGroup",
      name: "Mortar and Pestle",
      productGroupID: "mortar-and-pestle",
      variesBy: ["https://schema.org/size"],
    });
  });

  it("lists each variant with its own URL, offer and stock status", () => {
    expect(ld.hasVariant).toHaveLength(2);
    expect(ld.hasVariant[1]).toMatchObject({
      "@type": "Product",
      name: "Mortar and Pestle - Size 2",
      sku: "EZ-002",
      size: "Size 2",
      offers: {
        url: `${siteConfig.url}/products/mortar-and-pestle?size=size-2`,
        priceCurrency: "PKR",
        price: 1000,
        availability: "https://schema.org/OutOfStock",
      },
    });
  });

  it("keeps absolute image URLs and prefixes relative ones", () => {
    expect(ld.hasVariant.map((v) => v.image)).toEqual([[`${siteConfig.url}/p/1.webp`], ["https://blob.example/2.webp"]]);
  });
});
