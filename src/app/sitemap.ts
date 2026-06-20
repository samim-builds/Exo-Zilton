import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getAllProductSlugs } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  const staticPages = ["", "/products", "/about", "/contact", "/privacy", "/terms"].map(
    (path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const slugs = await getAllProductSlugs();
  const productPages = slugs.map((slug) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticPages, ...productPages];
}
