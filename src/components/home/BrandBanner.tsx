import Link from "next/link";
import { Reveal } from "@/components/shared/Reveal";
import type { SectionData } from "@/lib/cms/sections";

export function BrandBanner({ data }: { data: SectionData<"brand-banner"> }) {
  return (
    <section className="bg-navy py-16 text-white sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{data.eyebrow}</p>
          <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl">{data.title}</h2>
        </Reveal>
        <p className="mt-6 text-base leading-relaxed text-white/85">{data.body}</p>
        {data.ctaLabel && (
          <Link
            href={data.ctaHref || "/about"}
            className="mt-8 inline-flex rounded-full border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-navy"
          >
            {data.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
