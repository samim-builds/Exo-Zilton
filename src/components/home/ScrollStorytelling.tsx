import Image from "next/image";
import type { SectionData } from "@/lib/cms/sections";

// Story points scroll past a pinned photograph on large screens.
export function ScrollStorytelling({ data }: { data: SectionData<"scroll-story"> }) {
  return (
    <section className="bg-ink py-20 text-porcelain sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            {data.eyebrow && <p className="text-sm font-medium text-beech">{data.eyebrow}</p>}
            <h2 className="mt-4 text-3xl text-porcelain sm:text-4xl">{data.title}</h2>

            <div className="mt-12 space-y-12 lg:mt-20 lg:space-y-24 lg:pb-24">
              {data.pillars.map((item, index) => (
                <article key={index} className="border-t border-porcelain/15 pt-6">
                  <h3 className="text-2xl text-porcelain">{item.title}</h3>
                  <p className="mt-4 max-w-md text-[0.9375rem] text-porcelain/70 sm:text-base">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-[2px] bg-porcelain/5 lg:sticky lg:top-28">
              <Image src={data.image} alt={data.imageAlt} fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
