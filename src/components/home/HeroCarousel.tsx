"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useMemo, useState } from "react";
import type { SectionData } from "@/lib/cms/sections";
import { buttonVariants } from "@/components/site/Button";
import { cn } from "@/lib/utils";

export function HeroCarousel({ data }: { data: SectionData<"hero-carousel"> }) {
  const { slides } = data;
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

  return (
    <section className="overflow-hidden bg-porcelain" aria-label="Featured highlights">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-8 lg:py-16">
        <div className="hero-in lg:col-span-6 xl:col-span-5">
          {data.eyebrow && <p className="text-sm font-medium text-bronze">{data.eyebrow}</p>}
          <h1 className="mt-4 text-[clamp(2.5rem,5.2vw,4.25rem)] leading-[1.02] text-ink [font-variation-settings:'SOFT'_100,'opsz'_144] [letter-spacing:-0.025em]">
            {data.title}
            {data.titleAccent && (
              <>
                {" "}
                <span className="block">{data.titleAccent}</span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-md text-base text-stone sm:text-lg">{data.body}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href={data.primaryCta.href} className={buttonVariants({ size: "lg" })}>
              {data.primaryCta.label}
            </Link>
            {data.secondaryCta.label && (
              <Link href={data.secondaryCta.href} className={buttonVariants({ variant: "quiet" })}>
                {data.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>

        <div className="hero-in-late relative -mx-4 sm:mx-0 lg:col-span-6 xl:col-span-7">
          <div className="relative aspect-[4/3] bg-glaze sm:rounded-[2px] lg:aspect-auto lg:h-[min(34rem,calc(100svh-11rem))]">
            <div ref={emblaRef} className="absolute inset-0 overflow-hidden sm:rounded-[2px]">
              <div className="flex h-full">
                {slides.map((slide, index) => (
                  <div key={index} className="relative h-full min-w-0 flex-[0_0_100%]" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`}>
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={index === 0}
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 100vw, 640px"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {slides.length > 1 && (
            <div className="mt-4 flex gap-1 px-4 sm:px-0" role="group" aria-label="Choose slide">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show slide ${index + 1}: ${slide.alt}`}
                  aria-current={selectedIndex === index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className="group flex h-8 items-center px-1"
                >
                  <span className={cn("block h-[3px] rounded-full transition-all duration-300", selectedIndex === index ? "w-8 bg-ink" : "w-4 bg-ink/20 group-hover:bg-ink/40")} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
