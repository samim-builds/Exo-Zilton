import Link from "next/link";
import { getPublishedProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/shared/SectionHeading";

export async function FeaturedProducts() {
  const products = await getPublishedProducts();
  const featured = products.filter((p) => p.inStock).slice(0, 4);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <SectionHeading
            align="left"
            eyebrow="Shop"
            title="Mortar & Pestle Collection"
            description="Available in multiple sizes to suit every kitchen — from compact daily use to professional grinding."
          />
          <Link
            href="/products"
            className="shrink-0 rounded-full bg-navy px-8 py-3 text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            View All
          </Link>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
