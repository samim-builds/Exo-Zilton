import { HeroCarousel } from "@/components/home/HeroCarousel";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { BrandBanner } from "@/components/home/BrandBanner";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { TrustBar } from "@/components/home/TrustBar";
import { organizationJsonLd } from "@/lib/seo";

export default function HomePage() {
  const jsonLd = organizationJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroCarousel />
      <TrustBar />
      <FeaturedProducts />
      <FeatureGrid />
      <BrandBanner />
      <InstagramFeed />
    </>
  );
}
