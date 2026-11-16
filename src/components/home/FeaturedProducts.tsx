import Link from "next/link";
import { getCategoryPage, getPublishedProducts } from "@/lib/products";
import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/site/Button";
import type { SectionData } from "@/lib/cms/sections";

export async function FeaturedProducts({ data }: { data: SectionData<"product-rail"> }) {
  const products =
    data.source === "category" && data.categorySlug
      ? ((await getCategoryPage(data.categorySlug))?.products ?? [])
      : await getPublishedProducts();
  const featured = products.filter((p) => p.inStock).slice(0, data.limit);

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow={data.eyebrow} title={data.title} description={data.description} />
          {data.ctaLabel && (
            <Link href={data.ctaHref || "/products"} className={buttonVariants({ variant: "secondary", className: "self-start sm:self-auto" })}>
              {data.ctaLabel}
            </Link>
          )}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.variantKey} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
