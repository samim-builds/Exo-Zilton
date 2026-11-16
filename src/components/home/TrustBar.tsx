import type { SectionData } from "@/lib/cms/sections";

export function TrustBar({ data }: { data: SectionData<"trust-bar"> }) {
  return (
    <section className="border-y border-cream bg-porcelain py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {data.items.map((item, index) => (
          <div key={index} className="text-center">
            <p className="font-serif text-lg font-semibold text-navy">{item.label}</p>
            <p className="mt-1 text-sm text-charcoal/70">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
