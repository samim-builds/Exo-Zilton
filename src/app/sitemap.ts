import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getCatalog, getCategories } from "@/lib/products";
import { variantHref } from "@/lib/catalog/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  const page = (path: string, priority: number) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority,
  });

  const staticPages = ["", "/products", "/about", "/contact", "/privacy", "/terms"].map((path) =>
    page(path, path === "" ? 1 : 0.8),
  );

  const [catalog, categories] = await Promise.all([getCatalog(), getCategories()]);
  const productPages = catalog.flatMap((product) => [
    page(`/products/${product.slug}`, 0.9),
    // Each variant has its own indexable URL (?size=size-3).
    ...(product.options.length > 0 ? product.variants.map((v) => page(variantHref(product, v), 0.7)) : []),
  ]);
  const categoryPages = categories.map((c) => page(`/categories/${c.slug}`, 0.8));

  return [...staticPages, ...categoryPages, ...productPages];
}
