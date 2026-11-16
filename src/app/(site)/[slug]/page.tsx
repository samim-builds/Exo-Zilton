import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsPage, cmsMetadata } from "@/components/cms/CmsPage";
import { DEFAULT_PAGES } from "@/lib/cms/sections";

// Custom pages created in the admin. System pages keep their own routes.

type Props = { params: Promise<{ slug: string }> };

const isSystemSlug = (slug: string) => Object.hasOwn(DEFAULT_PAGES, slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return isSystemSlug(slug) ? {} : cmsMetadata(slug, `/${slug}`);
}

export default async function CustomPage({ params }: Props) {
  const { slug } = await params;
  if (isSystemSlug(slug)) notFound();
  return <CmsPage slug={slug} />;
}
