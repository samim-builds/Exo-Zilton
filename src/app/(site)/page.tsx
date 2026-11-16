import type { Metadata } from "next";
import { CmsPage } from "@/components/cms/CmsPage";
import { getPage } from "@/lib/cms/server";
import { organizationJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("home");
  return {
    ...(page?.seoTitle ? { title: page.seoTitle } : {}),
    ...(page?.seoDescription ? { description: page.seoDescription } : {}),
  };
}

export default function HomePage() {
  const jsonLd = organizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CmsPage slug="home" plain />
    </>
  );
}
