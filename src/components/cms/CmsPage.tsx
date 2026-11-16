import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getSiteSettings } from "@/lib/cms/server";
import { buildMetadata } from "@/lib/seo";
import { ContentPage, DraftBanner, SectionRenderer } from "./SectionRenderer";

// Shared route bodies for pages rendered from the CMS.

export async function cmsMetadata(slug: string, path: string): Promise<Metadata> {
  const page = await getPage(slug);
  if (!page) return {};
  return buildMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription,
    path,
    ...(page.ogImageUrl ? { image: page.ogImageUrl } : {}),
  });
}

export async function CmsPage({ slug, plain = false }: { slug: string; plain?: boolean }) {
  const [page, settings] = await Promise.all([getPage(slug), getSiteSettings()]);
  if (!page) notFound();
  const body = <SectionRenderer sections={page.sections} settings={settings} />;
  return (
    <>
      {page.draft && <DraftBanner />}
      {plain ? body : <ContentPage>{body}</ContentPage>}
    </>
  );
}
