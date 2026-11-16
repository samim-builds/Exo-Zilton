import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ProductGallery } from "@/components/products/ProductGallery";
import { VariantSelector } from "@/components/products/VariantSelector";
import { ProductActions } from "@/components/products/ProductActions";
import { ProductAccordion } from "@/components/products/ProductAccordion";
import { BrandBanner } from "@/components/home/BrandBanner";
import { lookupProduct, type CatalogProduct, type CatalogVariant } from "@/lib/products";
import { resolveVariant, variantHref } from "@/lib/catalog/storefront";
import { buildMetadata, productGroupJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { formatDiameter, formatPKR, formatUSD } from "@/lib/format";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Product-wide specs plus the selected variant's size and dimensions.
function variantSpecs(product: CatalogProduct, variant: CatalogVariant): Record<string, string> {
  // Variant values win: migrated products carry the first size's Size/Diameter/Capacity in specs.
  return {
    ...product.specs,
    ...Object.fromEntries(
      product.options.map((o) => [o.name, o.values.find((v) => v.slug === variant.selection[o.param])?.value ?? ""]),
    ),
    ...(variant.diameterCm > 0 && { Diameter: `${variant.diameterCm}cm` }),
    ...(variant.capacityMl > 0 && { Capacity: `${variant.capacityMl}ml` }),
  };
}

async function resolvePage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const found = await lookupProduct(slug);
  if (!found) notFound();
  // Old per-size URLs (/products/mortar-and-pestle-size-3) moved to the product page with that size selected.
  if (found.kind === "legacy") permanentRedirect(variantHref(found.product, found.variant));
  const product = found.product;
  const variant = resolveVariant(product, query);
  return { product, variant, href: variantHref(product, variant) };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { product, variant, href } = await resolvePage(props);
  const title = product.options.length > 0 && variant.title ? `${product.name} - ${variant.title}` : product.name;

  return buildMetadata({
    title: product.seoTitle || title,
    description: product.seoDescription || product.description,
    path: href,
    image: variant.images[0]?.url,
    keywords: [
      "porcelain mortar and pestle",
      variant.title,
      ...(variant.diameterCm > 0 ? [`${variant.diameterCm}cm mortar pestle`] : []),
      "Exo Zilton",
    ].filter(Boolean),
  });
}

export default async function ProductPage(props: PageProps) {
  const { product, variant, href } = await resolvePage(props);

  const productLd = productGroupJsonLd(product);
  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    ...(product.category ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }] : []),
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
            {product.category && (
              <>
                <Link href={`/categories/${product.category.slug}`} className="hover:text-navy">
                  {product.category.name}
                </Link>
                <span className="mx-2 text-hairline">/</span>
              </>
            )}
            <span className="text-navy">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,61.8fr)_minmax(0,38.2fr)] lg:gap-16">
            <ProductGallery key={variant.key} images={variant.images.map((img) => img.url)} productName={product.name} />

            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-bronze">
                Collection 01 · Unglazed vitrified porcelain
              </p>
              <h1 className="mt-4 font-serif text-4xl font-light tracking-tight text-navy lg:text-[42px] lg:leading-[1.05]">
                {product.name}
              </h1>
              <p className="mt-6 font-sans text-[15px] tracking-wide text-navy">
                {variant.compareAtPKR && variant.compareAtPKR > variant.pricePKR && (
                  <s className="mr-3 text-muted">{formatPKR(variant.compareAtPKR)}</s>
                )}
                {formatPKR(variant.pricePKR)}
                <span className="mx-3 text-hairline" aria-hidden="true">
                  |
                </span>
                <span className="text-muted">{formatUSD(variant.priceUSD)} USD</span>
              </p>
              {product.subtitle && (
                <p className="mt-3 font-sans text-[14px] text-muted">{product.subtitle}</p>
              )}
              {product.options.length > 0 && (
                <div className="mt-8">
                  <VariantSelector product={product} current={variant} />
                </div>
              )}
              <div className="mt-8">
                <ProductActions key={variant.key} product={product} variant={variant} href={href} />
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
                        {Object.entries(variantSpecs(product, variant)).map(([key, value]) => (
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

          {variant.diameterCm > 0 && (
            <p className="mt-8 text-center font-sans text-[12px] tracking-wide text-muted">
              {variant.title} — {formatDiameter(variant.diameterCm)}
            </p>
          )}
        </div>
      </div>

      <BrandBanner />
    </>
  );
}
