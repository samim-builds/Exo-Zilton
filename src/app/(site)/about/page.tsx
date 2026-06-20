import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About Exo Zilton",
  description:
    "Learn about Exo Zilton — a premium mortar and pestle brand crafting unglazed vitrified porcelain kitchen tools with timeless heritage design.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow="Our Story"
          title="Lovingly Crafted Mortar and Pestles"
          description="Exo Zilton brings together traditional craftsmanship and modern quality standards to create mortar and pestle sets worthy of any kitchen."
        />

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-cream">
            <Image
              src="/brand/logo.png"
              alt="Exo Zilton brand logo"
              fill
              className="object-contain p-8"
            />
          </div>

          <div className="space-y-6 text-base leading-relaxed text-charcoal/85">
            <p>
              Founded in {siteConfig.foundingYear}, Exo Zilton was born from a passion for
              timeless kitchen tools that elevate everyday cooking. Based in {siteConfig.location},
              we craft premium mortar and pestle sets that honour the heritage of this iconic
              kitchen essential.
            </p>
            <p>
              Each set is made from dense unglazed vitrified porcelain paired with a smooth
              beechwood handle — designed for comfortable, efficient grinding of herbs, spices,
              and pastes. The non-porous finish prevents stains and odours, ensuring every blend
              is pure and flavourful.
            </p>
            <p>
              From home chefs to professional kitchens, Exo Zilton mortar and pestle sets are
              built to stand the test of time — durable, practical, and beautifully presented in
              gift-ready packaging.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image
              src="/packaging/box-front.webp"
              alt="Exo Zilton gift-ready kraft packaging"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-navy">
              Gift-Ready Packaging
            </h2>
            <p className="leading-relaxed text-charcoal/85">
              Every Exo Zilton mortar and pestle arrives in elegant kraft packaging with our
              signature navy and gold branding — making it the perfect wedding, housewarming, or
              holiday gift for the cook in your life.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
