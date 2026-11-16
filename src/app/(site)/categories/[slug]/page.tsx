import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CategoryChips } from "@/components/products/CategoryChips";
import { ProductGrid } from "@/components/products/ProductGrid";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getCategoryPage, getShopCategories } from "@/lib/products";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCategoryPage(slug);
  if (!page) return { title: "Category Not Found" };
  const { category } = page;

  return buildMetadata({
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description || `Shop ${category.name} from Exo Zilton.`,
    path: `/categories/${category.slug}`,
    image: category.imageUrl ?? undefined,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [page, shopCategories] = await Promise.all([getCategoryPage(slug), getShopCategories()]);
  if (!page) notFound();
  const { category, children, products } = page;

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: category.name, path: `/categories/${category.slug}` },
  ]);

  return (
    <div className="py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow="Shop Exo Zilton"
          title={category.name}
          description={category.description ?? undefined}
        />

        <div className="mt-8">
          <CategoryChips categories={shopCategories} active={category.slug} />
        </div>

        {children.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {children.map((child) => (
              <li key={child.slug}>
                <Link
                  href={`/categories/${child.slug}`}
                  className="font-sans text-[12px] uppercase tracking-[0.16em] text-bronze underline underline-offset-4 hover:text-navy"
                >
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12">
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="py-12 text-center text-charcoal/70">New pieces are on their way. Check back soon.</p>
          )}
        </div>
      </div>
    </div>
  );
}
