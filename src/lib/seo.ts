import type { Metadata } from "next";
import { siteConfig, getInstagramUrl } from "./site";
import type { CatalogProduct } from "./product-types";
import { variantHref } from "./catalog/storefront";

export function buildMetadata({
  title,
  description,
  path = "",
  image = "/brand/og-image.webp",
  keywords,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string[];
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = path === "" ? title : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: `${siteConfig.url}${image}`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${siteConfig.url}${image}`],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo.png`,
    description: siteConfig.description,
    email: siteConfig.contactEmail,
    areaServed: ["PK", "Worldwide"],
    sameAs: [getInstagramUrl()],
  };
}

// schema.org properties a variant option maps onto; other options are listed by name.
const VARIES_BY: Record<string, string> = { size: "size", colour: "color", color: "color", material: "material" };

function absoluteUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${siteConfig.url}${url}`;
}

export function productGroupJsonLd(product: CatalogProduct) {
  const brand = { "@type": "Brand", name: siteConfig.name };
  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: product.name,
    description: product.description,
    productGroupID: product.slug,
    url: `${siteConfig.url}/products/${product.slug}`,
    brand,
    variesBy: product.options.map((o) => (VARIES_BY[o.param] ? `https://schema.org/${VARIES_BY[o.param]}` : o.name)),
    hasVariant: product.variants.map((variant) => ({
      "@type": "Product",
      name: product.options.length > 0 && variant.title ? `${product.name} - ${variant.title}` : product.name,
      sku: variant.sku,
      image: variant.images.map((img) => absoluteUrl(img.url)),
      ...Object.fromEntries(
        product.options.flatMap((o) => {
          const prop = VARIES_BY[o.param];
          const value = o.values.find((v) => v.slug === variant.selection[o.param])?.value ?? variant.title;
          return prop ? [[prop, value]] : [];
        }),
      ),
      offers: {
        "@type": "Offer",
        url: absoluteUrl(variantHref(product, variant)),
        priceCurrency: "PKR",
        price: variant.pricePKR,
        availability: variant.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: siteConfig.name },
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
