import { Reveal } from "@/components/shared/Reveal";
import type { SectionData } from "@/lib/cms/sections";

export function MaterialComparison({ data }: { data: SectionData<"material-comparison"> }) {
  const { columns, rows } = data;
  // The original three-column layout keeps its tuned widths; other counts share evenly.
  const gridStyle = columns.length === 3 ? undefined : { gridTemplateColumns: `0.8fr repeat(${columns.length}, minmax(0, 1fr))` };
  return (
    <section id={data.anchor || undefined} className="scroll-mt-24 bg-porcelain py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-bronze">
            {data.eyebrow}
          </p>
          <h2 className="mt-4 max-w-xl font-serif text-4xl font-light tracking-tight text-navy sm:text-[42px] sm:leading-[1.05]">
            {data.title}
          </h2>
          <p className="mt-5 max-w-2xl font-sans text-[15px] leading-[1.7] text-charcoal">
            {data.intro}
          </p>
        </Reveal>

        <div className="mt-14 hidden border-t border-hairline md:grid md:grid-cols-[0.8fr_1fr_1fr_1.15fr]" style={gridStyle}>
          <div className="border-b border-hairline py-4 pr-6" />
          {columns.map((column, index) => (
            <div key={index} className="border-b border-hairline py-4 pr-6">
              <h3 className="font-serif text-2xl font-light text-navy">{column}</h3>
            </div>
          ))}
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="contents">
              <p className="border-b border-hairline py-6 pr-6 font-sans text-[11px] uppercase tracking-[0.18em] text-muted">
                {row.label}
              </p>
              {columns.map((_, index) => (
                <p
                  key={index}
                  className="border-b border-hairline py-6 pr-6 font-sans text-[15px] leading-[1.7] text-charcoal"
                >
                  {row.cells[index] ?? ""}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-hairline md:hidden">
          {rows.map((row, rowIndex) => (
            <article key={rowIndex} className="border-b border-hairline py-8">
              <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted">
                {row.label}
              </h3>
              <dl className="mt-5 space-y-5">
                {columns.map((column, index) => (
                  <div key={index}>
                    <dt className="font-serif text-xl font-light text-navy">{column}</dt>
                    <dd className="mt-1 font-sans text-[15px] leading-[1.7] text-charcoal">
                      {row.cells[index] ?? ""}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
