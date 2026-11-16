import Link from "next/link";
import { getCategoryPage, getPublishedProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { SectionData } from "@/lib/cms/sections";

export async function FeaturedProducts({ data }: { data: SectionData<"product-rail"> }) {
  const products =
    data.source === "category" && data.categorySlug
      ? ((await getCategoryPage(data.categorySlug))?.products ?? [])
      : await getPublishedProducts();
  const featured = products.filter((p) => p.inStock).slice(0, data.limit);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Reveal>
            <SectionHeading align="left" eyebrow={data.eyebrow} title={data.title} description={data.description} />
          </Reveal>
          {data.ctaLabel && (
            <Link
              href={data.ctaHref || "/products"}
              className="shrink-0 rounded-full bg-navy px-8 py-3 text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            >
              {data.ctaLabel}
            </Link>
          )}
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.variantKey} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
