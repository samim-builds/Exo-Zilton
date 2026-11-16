import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ScrollStorytelling } from "@/components/home/ScrollStorytelling";
import { MaterialComparison } from "@/components/home/MaterialComparison";
import { BrandBanner } from "@/components/home/BrandBanner";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { TrustBar } from "@/components/home/TrustBar";
import { Faq, ImageText, PageHeading, RichText } from "./GenericSections";
import type { SectionInstance } from "@/lib/cms/sections";
import type { SiteSettings } from "@/lib/cms/settings";

function Section({ section, settings }: { section: SectionInstance; settings: SiteSettings }) {
  switch (section.type) {
    case "hero-carousel":
      return <HeroCarousel data={section.data} />;
    case "trust-bar":
      return <TrustBar data={section.data} />;
    case "product-rail":
      return <FeaturedProducts data={section.data} />;
    case "feature-grid":
      return <FeatureGrid data={section.data} />;
    case "scroll-story":
      return <ScrollStorytelling data={section.data} />;
    case "material-comparison":
      return <MaterialComparison data={section.data} />;
    case "brand-banner":
      return <BrandBanner data={section.data} />;
    case "instagram-feed":
      return <InstagramFeed data={section.data} handle={settings.contact.instagramHandle} />;
    case "page-heading":
      return <PageHeading data={section.data} />;
    case "image-text":
      return <ImageText data={section.data} />;
    case "rich-text":
      return <RichText data={section.data} />;
    case "faq":
      return <Faq data={section.data} />;
  }
}

export function SectionRenderer({ sections, settings }: { sections: SectionInstance[]; settings: SiteSettings }) {
  return (
    <>
      {sections
        .filter((s) => s.visible)
        .map((s) => (
          <Section key={s.id} section={s} settings={settings} />
        ))}
    </>
  );
}

/** Wrapper for content pages, matching the old page padding. */
export function ContentPage({ children }: { children: React.ReactNode }) {
  return <div className="pb-12 sm:pb-16">{children}</div>;
}

export function DraftBanner() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      Previewing unpublished changes.
      {/* A route handler, not a page: plain navigation so the cookie is cleared server-side. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/preview/exit" className="underline">
        Exit preview
      </a>
    </div>
  );
}
