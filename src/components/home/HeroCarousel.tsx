"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState } from "react";

type SlideTheme = "light" | "dark";
type EyebrowSize = "standard" | "lead";

const slides = [
  {
    image: "/hero/grind.webp",
    eyebrow: "fully.",
    eyebrowSize: "standard" as EyebrowSize,
    title: "Vitrified",
    accent: "Porcelain",
    description:
      "Vitrified porcelain ensures there is no staining or absorption of odours, tastes or bacteria to avoid cross contamination.",
    cta: "Shop Now",
    href: "/products",
    theme: "dark" as SlideTheme,
  },
  {
    image: "/hero/crush.webp",
    eyebrow: "grind.",
    eyebrowSize: "standard" as EyebrowSize,
    title: "Crush",
    accent: "Flavour",
    description:
      "Designed to maximise flavour blends, the must-have mortar and pestle remains a staple in any home kitchen.",
    cta: "Explore Collection",
    href: "/products",
    theme: "light" as SlideTheme,
  },
  {
    image: "/hero/craft.webp",
    eyebrow: "timeless traditional",
    eyebrowSize: "standard" as EyebrowSize,
    title: "Heritage",
    accent: "Design",
    description:
      "This iconic pestle and mortar has been carefully crafted using unglazed porcelain to offer a timeless look.",
    cta: "Our Story",
    href: "/about",
    theme: "dark" as SlideTheme,
  },
];

function HeroSlideContent({
  slide,
  isFirst,
}: {
  slide: (typeof slides)[number];
  isFirst?: boolean;
}) {
  const isDark = slide.theme === "dark";
  const TitleTag = isFirst ? "h1" : "h2";
  const isLeadEyebrow = slide.eyebrowSize === "lead";

  return (
    <div className="relative max-w-2xl animate-fade-in lg:max-w-3xl">
      <div className="relative">
        <p
          className={`mb-3 font-serif italic tracking-wide ${
            isLeadEyebrow
              ? "text-3xl font-semibold lowercase leading-tight sm:text-4xl md:mb-4 md:text-5xl lg:text-6xl"
              : "text-2xl font-medium sm:text-3xl md:text-4xl"
          } ${isDark ? "text-gold" : "text-kraft"}`}
        >
          {slide.eyebrow}
        </p>

        <TitleTag
          className={`font-serif text-5xl font-bold leading-none sm:text-6xl md:text-7xl lg:text-8xl ${isDark ? "text-white drop-shadow-lg" : "text-navy"}`}
        >
          {slide.title}
        </TitleTag>

        <p
          className={`font-script -mt-1 text-4xl leading-none sm:-mt-2 sm:text-5xl md:text-6xl lg:text-7xl ${isDark ? "text-gold" : "text-navy"}`}
        >
          {slide.accent}
        </p>

        <p
          className={`mt-8 max-w-md text-base leading-relaxed sm:mt-10 sm:text-lg md:max-w-xl ${isDark ? "text-white/90" : "text-charcoal/90"}`}
        >
          {slide.description}
        </p>

        <Link
          href={slide.href}
          className={`mt-8 inline-flex rounded-full px-10 py-3.5 text-sm uppercase tracking-widest transition-opacity hover:opacity-90 sm:mt-10 ${isDark ? "bg-white text-navy shadow-lg" : "bg-navy text-white shadow-lg"}`}
        >
          {slide.cta}
        </Link>
      </div>
    </div>
  );
}

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section className="relative overflow-hidden" aria-label="Featured highlights">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={slide.title} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-[16/9] min-h-[480px] w-full sm:min-h-[560px] lg:min-h-[640px]">
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="100vw"
                />
                <div
                  className={`absolute inset-0 ${
                    slide.theme === "dark"
                      ? "bg-gradient-to-r from-navy/70 via-navy/35 to-transparent"
                      : "bg-gradient-to-r from-white/85 via-white/50 to-transparent"
                  }`}
                />
                <div className="absolute inset-0 flex items-center">
                  <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
                    <HeroSlideContent slide={slide} isFirst={index === 0} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={scrollPrev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 text-2xl leading-none text-navy shadow-md transition hover:bg-white"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={scrollNext}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-3 text-2xl leading-none text-navy shadow-md transition hover:bg-white"
      >
        ›
      </button>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${selectedIndex === index ? "w-8 bg-white shadow" : "w-2 bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
}
