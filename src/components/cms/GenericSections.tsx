import { Fragment } from "react";
import Image from "next/image";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { SectionData } from "@/lib/cms/sections";

// Building blocks for content pages (about, legal, custom pages).

const EMAIL = /([\w.+-]+@[\w-]+\.[\w.-]+)/g;

/** Plain text with email addresses turned into mailto links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(EMAIL);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={`mailto:${part.replace(/\.$/, "")}`} className="text-navy underline">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function PageHeading({ data }: { data: SectionData<"page-heading"> }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <SectionHeading align="left" eyebrow={data.eyebrow || undefined} title={data.title} description={data.description || undefined} />
    </div>
  );
}

export function ImageText({ data }: { data: SectionData<"image-text"> }) {
  const contain = data.imageFit === "contain";
  return (
    <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className={`grid items-center ${contain ? "gap-12 lg:grid-cols-2" : "gap-8 sm:grid-cols-2"}`}>
        {data.image && (
          <div
            className={`relative overflow-hidden rounded-lg ${contain ? "aspect-square bg-cream" : "aspect-[4/3]"} ${
              data.imageSide === "right" ? "sm:order-last" : ""
            }`}
          >
            <Image
              src={data.image}
              alt={data.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={contain ? "object-contain p-8" : "object-cover"}
            />
          </div>
        )}
        <div className={`flex flex-col justify-center ${data.heading ? "space-y-4" : "space-y-6 text-base"} leading-relaxed text-charcoal/85`}>
          {data.heading && <h2 className="font-serif text-2xl font-semibold text-navy">{data.heading}</h2>}
          {paragraphs(data.body).map((p, i) => (
            <p key={i}>
              <Linkified text={p} />
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RichText({ data }: { data: SectionData<"rich-text"> }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      {data.title && <h1 className="font-serif text-3xl font-semibold text-navy">{data.title}</h1>}
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-charcoal/85">
        {data.blocks.map((block, i) => (
          <Fragment key={i}>
            {block.heading && <h2 className="font-serif text-xl text-navy">{block.heading}</h2>}
            {paragraphs(block.body).map((p, j) => (
              <p key={j}>
                <Linkified text={p} />
              </p>
            ))}
            {block.bullets.length > 0 && (
              <ul className="list-disc space-y-2 pl-5">
                {block.bullets.map((b, j) => (
                  <li key={j}>
                    <Linkified text={b} />
                  </li>
                ))}
              </ul>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function Faq({ data }: { data: SectionData<"faq"> }) {
  const items = data.items.filter((item) => item.question);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <section className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SectionHeading align="left" eyebrow={data.eyebrow || undefined} title={data.title} />
      <div className="mt-8 divide-y divide-cream border-y border-cream">
        {items.map((item, i) => (
          <details key={i} className="group py-5">
            <summary className="cursor-pointer list-none font-serif text-lg text-navy marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span className="text-gold transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </span>
            </summary>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-charcoal/85">
              {paragraphs(item.answer).map((p, j) => (
                <p key={j}>
                  <Linkified text={p} />
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
