"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useMemo, useState } from "react";

const slides = [
  {
    image: "/hero/grind.webp",
    alt: "Unglazed porcelain mortar and pestle with whole spices on stone",
  },
  {
    image: "/hero/crush.webp",
    alt: "Pestle grinding spices in an unglazed porcelain mortar",
  },
  {
    image: "/hero/craft.webp",
    alt: "Porcelain mortars arranged with spices, citrus, and rosemary",
  },
];

function pad(index: number) {
  return String(index + 1).padStart(2, "0");
}

export function HeroCarousel() {
  const plugins = useMemo(
    () => [Autoplay({ delay: 6000, stopOnInteraction: false })],
    [],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 32 }, plugins);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      emblaApi.plugins()?.autoplay?.stop();
    }

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const progress = ((selectedIndex + 1) / slides.length) * 100;

  return (
    <section className="bg-porcelain" aria-label="Featured highlights">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:gap-x-16 lg:px-10 lg:py-20">
        <div className="@container flex flex-col lg:h-full">
          <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-[#8F6E3E]">
            01 — Unglazed vitrified porcelain
          </p>
          <h1 className="mt-5 font-serif text-[2.75rem] font-medium leading-[0.95] tracking-tight text-navy sm:text-6xl lg:text-[4.25rem]">
            Pure Flavour.
          </h1>
          <p className="mt-2 whitespace-nowrap font-serif font-medium italic leading-none tracking-tight text-navy [font-size:clamp(1.35rem,7.6cqi,3rem)]">
            Zero Staining. Zero Odours.
          </p>
          <p className="mt-6 max-w-md font-sans text-[15px] leading-[1.7] text-[#4A4742] sm:text-[16px]">
            Engineered from vitrified unglazed porcelain, designed to grind without retaining
            previous flavours. An indestructible culinary tool for life.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link
              href="/products"
              className="inline-flex bg-[#0D1929] px-7 py-3.5 font-sans text-[12px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-bronze"
            >
              Explore collection
            </Link>
            <Link
              href="/#why-porcelain"
              className="font-sans text-[15px] text-navy transition-colors hover:text-bronze"
            >
              Why Porcelain? →
            </Link>
          </div>

          <div className="mt-12 max-w-md lg:mt-auto lg:pt-16">
            <p className="flex items-baseline gap-3 font-sans text-[12px] tracking-[0.22em] text-navy">
              <span>{pad(selectedIndex)}</span>
              <span className="font-serif text-[1.15em] font-light tracking-normal text-[#8F6E3E]" aria-hidden="true">
                —
              </span>
              <span className="text-[#4A4742]">{pad(slides.length - 1)}</span>
            </p>
            <div
              className="relative mt-4 h-px bg-[#EBE7DE]"
              role="tablist"
              aria-label="Slides"
            >
              <div
                className="absolute -top-px left-0 h-[2px] bg-[#0D1929] transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
              />
              {slides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  role="tab"
                  aria-selected={selectedIndex === index}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className="absolute top-1/2 h-8 -translate-y-1/2"
                  style={{
                    left: `${(index / slides.length) * 100}%`,
                    width: `${100 / slides.length}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex lg:w-fit lg:items-start">
          <div className="w-full border border-[#EBE7DE] bg-porcelain p-3 sm:p-4 lg:w-[32rem]">
            <div className="relative aspect-[5/4]">
              <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
                <div className="flex h-full">
                  {slides.map((slide, index) => (
                    <div key={slide.image} className="relative h-full min-w-0 flex-[0_0_100%]">
                      <Image
                        src={slide.image}
                        alt={slide.alt}
                        fill
                        priority={index === 0}
                        className="object-cover object-center"
                        sizes="(max-width: 1024px) 100vw, 512px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
