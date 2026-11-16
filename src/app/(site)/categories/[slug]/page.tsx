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
    <div className="pt-14 pb-20 sm:pt-20 sm:pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h1"
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
                  className="text-sm text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-bronze"
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
            <div className="py-16 text-center">
              <p className="text-ink">No products in this category yet.</p>
              <Link href="/products" className="mt-3 inline-block text-sm text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-bronze">
                See all products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
