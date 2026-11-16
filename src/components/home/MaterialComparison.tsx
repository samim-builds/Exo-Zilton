import { SectionHeading } from "@/components/shared/SectionHeading";
import type { SectionData } from "@/lib/cms/sections";

export function MaterialComparison({ data }: { data: SectionData<"material-comparison"> }) {
  const { columns, rows } = data;
  return (
    <section id={data.anchor || undefined} className="scroll-mt-24 bg-porcelain py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} description={data.intro} />

        {/* A real table; on small screens it scrolls sideways with the row labels pinned. */}
        <div className="-mx-4 mt-12 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[40rem] border-collapse text-left">
            <caption className="sr-only">{data.title}</caption>
            <thead>
              <tr className="border-b border-ink/15">
                <td className="sticky left-0 w-[22%] bg-porcelain py-4 pr-6" />
                {columns.map((column, index) => (
                  <th key={index} scope="col" className="py-4 pr-6 align-bottom font-display text-xl font-normal text-ink">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-glaze">
                  <th scope="row" className="sticky left-0 bg-porcelain py-5 pr-6 align-top text-sm font-medium text-ink">
                    {row.label}
                  </th>
                  {columns.map((_, index) => (
                    <td key={index} className="py-5 pr-6 align-top text-[0.9375rem] text-stone">
                      {row.cells[index] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
