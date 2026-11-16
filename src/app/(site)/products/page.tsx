import type { Metadata } from "next";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { CategoryChips } from "@/components/products/CategoryChips";
import { getPublishedProducts, getShopCategories } from "@/lib/products";
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
  const [products, categories] = await Promise.all([getPublishedProducts(), getShopCategories()]);

  return (
    <div className="pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h1"
          title="Shop"
          description="Unglazed porcelain mortar and pestle sets with beechwood handles, in sizes for everyday seasoning through to batch grinding."
        />

        {categories.length > 0 && (
          <div className="mt-8">
            <CategoryChips categories={categories} />
          </div>
        )}

        <div className="mt-12">
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
