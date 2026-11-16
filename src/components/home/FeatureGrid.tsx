import { SectionHeading } from "@/components/shared/SectionHeading";
import type { SectionData } from "@/lib/cms/sections";

export function FeatureGrid({ data }: { data: SectionData<"feature-grid"> }) {
  return (
    <section className="bg-glaze/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} description={data.description} />

        <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((feature, index) => (
            <article key={index} className="border-t border-ink/15 pt-6">
              <h3 className="text-xl text-ink">{feature.title}</h3>
              <p className="mt-3 text-[0.9375rem] text-stone">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
