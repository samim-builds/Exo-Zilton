import type { Metadata } from "next";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getPublishedProducts } from "@/lib/products";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "Shop Mortar & Pestle",
  description:
    "Browse Exo Zilton porcelain mortar and pestle sets in multiple sizes. Premium unglazed vitrified porcelain with beechwood handles. Prices in PKR and USD.",
  path: "/products",
  keywords: [
    "buy mortar and pestle",
    "porcelain grinder Pakistan",
    "kitchen mortar pestle sizes",
  ],
});

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow="Shop Exo Zilton"
          title="Mortar & Pestle Collection"
          description="Designed to maximise flavour blends, the must-have mortar and pestle remains a staple in any home kitchen. Made with dense unglazed porcelain for the perfect abrasive finish."
        />

        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
