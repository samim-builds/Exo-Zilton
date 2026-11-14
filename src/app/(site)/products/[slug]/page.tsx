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
import { formatDiameter, formatPKR, formatUSD } from "@/lib/format";

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
          <nav
            aria-label="Breadcrumb"
            className="mb-10 font-sans text-[11px] uppercase tracking-[0.18em] text-muted"
          >
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
            <span className="mx-2 text-hairline">/</span>
            <Link href="/products" className="hover:text-navy">
              Products
            </Link>
            <span className="mx-2 text-hairline">/</span>
            <span className="text-navy">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,61.8fr)_minmax(0,38.2fr)] lg:gap-16">
            <ProductGallery images={product.images} productName={product.name} />

            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-bronze">
                Collection 01 · Unglazed vitrified porcelain
              </p>
              <h1 className="mt-4 font-serif text-4xl font-light tracking-tight text-navy lg:text-[42px] lg:leading-[1.05]">
                {product.name}
              </h1>
              <p className="mt-6 font-sans text-[15px] tracking-wide text-navy">
                {formatPKR(product.pricePKR)}
                <span className="mx-3 text-hairline" aria-hidden="true">
                  |
                </span>
                <span className="text-muted">{formatUSD(product.priceUSD)} USD</span>
              </p>
              <div className="mt-8">
                <SizeSelector products={allProducts} currentSlug={product.slug} />
              </div>
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
                          <tr key={key} className="border-b border-hairline">
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

          <p className="mt-8 text-center font-sans text-[12px] tracking-wide text-muted">
            {product.size} — {formatDiameter(product.diameterCm)}
          </p>
        </div>
      </div>

      <BrandBanner />
    </>
  );
}
