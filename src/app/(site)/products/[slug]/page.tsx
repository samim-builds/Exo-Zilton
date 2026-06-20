import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGallery } from "@/components/products/ProductGallery";
import { SizeSelector } from "@/components/products/SizeSelector";
import { ProductActions } from "@/components/products/ProductActions";
import { ProductAccordion } from "@/components/products/ProductAccordion";
import { BrandBanner } from "@/components/home/BrandBanner";
import {
  getProductBySlug,
  getAllProductSlugs,
  getPublishedProducts,
} from "@/lib/products";
import { buildMetadata, productJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { formatDiameter } from "@/lib/format";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return buildMetadata({
    title: product.name,
    description: product.description,
    path: `/products/${product.slug}`,
    image: product.images[0],
    keywords: [
      "porcelain mortar and pestle",
      product.size,
      `${product.diameterCm}cm mortar pestle`,
      "Exo Zilton",
    ],
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, allProducts] = await Promise.all([
    getProductBySlug(slug),
    getPublishedProducts(),
  ]);

  if (!product) {
    notFound();
  }

  const productLd = productJsonLd(product);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: product.name, path: `/products/${product.slug}` },
  ]);

  const faqLd = faqJsonLd([
    {
      question: "How do I clean my Exo Zilton mortar and pestle?",
      answer: product.careInstructions.join(" "),
    },
    {
      question: "What material is the Exo Zilton mortar and pestle made from?",
      answer: "Unglazed vitrified porcelain with a beechwood handle.",
    },
    {
      question: "Does Exo Zilton ship internationally?",
      answer: product.deliveryInfo,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <div className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-charcoal/60">
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-navy">
              Products
            </Link>
            <span className="mx-2">/</span>
            <span className="text-navy">{product.name}</span>
          </nav>

          <h1 className="mb-8 font-serif text-3xl font-semibold text-navy sm:text-4xl">
            {product.name}
          </h1>

          <div className="grid gap-12 lg:grid-cols-2">
            <ProductGallery images={product.images} productName={product.name} />

            <div>
              <SizeSelector products={allProducts} currentSlug={product.slug} />
              <div className="mt-8">
                <ProductActions product={product} />
              </div>
            </div>
          </div>

          <div className="mt-16">
            <ProductAccordion
              items={[
                {
                  id: "overview",
                  title: "Overview",
                  content: (
                    <div>
                      <p>{product.description}</p>
                      <ul className="mt-4 list-disc space-y-2 pl-5">
                        {product.features.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  ),
                },
                {
                  id: "specs",
                  title: "Specifications",
                  content: (
                    <table className="w-full text-left">
                      <tbody>
                        {Object.entries(product.specs).map(([key, value]) => (
                          <tr key={key} className="border-b border-cream">
                            <th className="py-2 pr-4 font-medium text-navy">{key}</th>
                            <td className="py-2">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ),
                },
                {
                  id: "care",
                  title: "Care Instructions",
                  content: (
                    <ul className="list-disc space-y-2 pl-5">
                      {product.careInstructions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                },
                {
                  id: "delivery",
                  title: "Delivery & Returns",
                  content: <p>{product.deliveryInfo}</p>,
                },
              ]}
            />
          </div>

          <p className="mt-8 text-center text-sm text-charcoal/60">
            {product.size} — {formatDiameter(product.diameterCm)}
          </p>
        </div>
      </div>

      <BrandBanner />
    </>
  );
}
