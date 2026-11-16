import type { SectionData } from "@/lib/cms/sections";

export function TrustBar({ data }: { data: SectionData<"trust-bar"> }) {
  return (
    <section className="border-y border-glaze bg-porcelain">
      <dl className="mx-auto grid max-w-6xl divide-glaze px-4 sm:grid-cols-3 sm:divide-x sm:px-6 lg:px-8">
        {data.items.map((item, index) => (
          <div key={index} className="border-b border-glaze py-6 last:border-b-0 sm:border-b-0 sm:px-8 sm:first:pl-0 sm:last:pr-0">
            <dt className="font-medium text-ink">{item.label}</dt>
            <dd className="mt-1 text-sm text-stone">{item.description}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
