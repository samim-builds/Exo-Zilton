import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { SectionData } from "@/lib/cms/sections";

export function FeatureGrid({ data }: { data: SectionData<"feature-grid"> }) {
  return (
    <section className="bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading eyebrow={data.eyebrow} title={data.title} description={data.description} />
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((feature, index) => (
            <article
              key={index}
              className="rounded-lg border border-gold/20 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-gold" aria-hidden="true">
                ◆
              </span>
              <h3 className="mt-3 font-serif text-xl font-semibold text-navy">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/80">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
