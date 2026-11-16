import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductGallery } from "@/components/products/ProductGallery";
import { VariantSelector } from "@/components/products/VariantSelector";
import { ProductActions } from "@/components/products/ProductActions";
import { ProductAccordion } from "@/components/products/ProductAccordion";
import { BrandBanner } from "@/components/home/BrandBanner";
import { Price } from "@/components/site/Price";
import { getPage } from "@/lib/cms/server";
import { sectionDefaults } from "@/lib/cms/sections";
import { lookupProduct, type CatalogProduct, type CatalogVariant } from "@/lib/products";
import { resolveVariant, variantHref } from "@/lib/catalog/storefront";
import { buildMetadata, productGroupJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

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
  // The product page reuses the homepage brand banner so both stay in step.
  const homeBanner = (await getPage("home"))?.sections.find((s) => s.type === "brand-banner");
  const banner = homeBanner?.type === "brand-banner" ? homeBanner.data : sectionDefaults("brand-banner");

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

      <div className="pt-6 pb-20 sm:pt-10 sm:pb-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-stone">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden><ChevronRight className="size-3.5 text-stone/60" /></li>
              <li>
                <Link href="/products" className="hover:text-ink">
                  Products
                </Link>
              </li>
              {product.category && (
                <>
                  <li aria-hidden><ChevronRight className="size-3.5 text-stone/60" /></li>
                  <li>
                    <Link href={`/categories/${product.category.slug}`} className="hover:text-ink">
                      {product.category.name}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden><ChevronRight className="size-3.5 text-stone/60" /></li>
              <li aria-current="page" className="text-ink">
                {product.name}
              </li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <ProductGallery key={variant.key} images={variant.images.map((img) => img.url)} productName={product.name} />
            </div>

            <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
              {product.category && <p className="text-sm text-stone">{product.category.name}</p>}
              <h1 className="mt-2 text-4xl text-ink sm:text-[2.75rem] sm:leading-[1.08]">{product.name}</h1>
              {product.subtitle && <p className="mt-3 text-base text-stone">{product.subtitle}</p>}
              <Price
                size="lg"
                className="mt-5"
                pricePKR={variant.pricePKR}
                priceUSD={variant.priceUSD}
                compareAtPKR={variant.compareAtPKR}
                compareAtUSD={variant.compareAtUSD}
              />
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

          <div className="mt-20 lg:mt-28">
            <ProductAccordion
              items={[
                {
                  id: "overview",
                  title: "Overview",
                  content: (
                    <div>
                      <p>{product.description}</p>
                      <ul className="mt-4 list-disc space-y-2 pl-5 marker:text-bronze">
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
                          <tr key={key} className="border-b border-glaze last:border-0">
                            <th scope="row" className="py-2.5 pr-6 font-medium text-ink">{key}</th>
                            <td className="tabular py-2.5">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ),
                },
                {
                  id: "care",
                  title: "Care",
                  content: (
                    <ul className="list-disc space-y-2 pl-5 marker:text-bronze">
                      {product.careInstructions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                },
                {
                  id: "delivery",
                  title: "Delivery and returns",
                  content: <p>{product.deliveryInfo}</p>,
                },
              ]}
            />
          </div>

        </div>
      </div>

      <BrandBanner data={banner} />
    </>
  );
}
