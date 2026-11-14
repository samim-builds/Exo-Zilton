import { GrindStory } from "@/components/story/GrindStory";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ScrollStorytelling } from "@/components/home/ScrollStorytelling";
import { MaterialComparison } from "@/components/home/MaterialComparison";
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
      <GrindStory />
      <TrustBar />
      <FeaturedProducts />
      <FeatureGrid />
      <ScrollStorytelling />
      <MaterialComparison />
      <BrandBanner />
      <InstagramFeed />
    </>
  );
}
