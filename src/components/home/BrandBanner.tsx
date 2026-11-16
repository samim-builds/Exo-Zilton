import Link from "next/link";
import { buttonVariants } from "@/components/site/Button";
import type { SectionData } from "@/lib/cms/sections";

export function BrandBanner({ data }: { data: SectionData<"brand-banner"> }) {
  return (
    <section className="bg-ink py-20 text-porcelain sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        {data.eyebrow && <p className="text-sm font-medium text-beech">{data.eyebrow}</p>}
        <h2 className="mt-4 text-3xl text-porcelain sm:text-4xl">{data.title}</h2>
        <p className="mx-auto mt-6 max-w-prose text-base text-porcelain/75 sm:text-lg">{data.body}</p>
        {data.ctaLabel && (
          <Link href={data.ctaHref || "/about"} className={buttonVariants({ variant: "inverse", className: "mt-9" })}>
            {data.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
