import { Reveal } from "@/components/shared/Reveal";

const columns = ["Porcelain", "Stone", "European heritage imports"] as const;

const rows = [
  {
    label: "Surface",
    cells: [
      "Unglazed vitrified porcelain. It does not hold stain or the odour of the last spice.",
      "Open stone can keep oils and colour from one grind to the next.",
      "A glazed bowl stays pale, and the pestle can slip across a polished wall.",
    ],
  },
  {
    label: "Grind",
    cells: [
      "A dense, lightly abrasive finish for herbs, spices, and pastes.",
      "Grain varies with the quarry. Many bowls grind coarser than the cook intends.",
      "Smooth heritage ware asks for more force and still leaves whole seeds.",
    ],
  },
  {
    label: "Handle",
    cells: [
      "Beechwood, shaped for a steady grip on a long grind.",
      "Usually cut from the same block as the bowl.",
      "Wood, metal, or stone, depending on the workshop.",
    ],
  },
  {
    label: "Arrival",
    cells: [
      "Packed as a gift, ready to give.",
      "Often sent bare, or in a plain carton.",
      "Sold as open stock, with packing left to the importer.",
    ],
  },
  {
    label: "Reach",
    cells: [
      "Ships across Pakistan, and worldwide on inquiry.",
      "Usually found close to where the stone is cut.",
      "Import lead times, and duties, sit between the order and the kitchen.",
    ],
  },
];

export function MaterialComparison() {
  return (
    <section id="why-porcelain" className="scroll-mt-24 bg-porcelain py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-bronze">
            Material notes
          </p>
          <h2 className="mt-4 max-w-xl font-serif text-4xl font-light tracking-tight text-navy sm:text-[42px] sm:leading-[1.05]">
            Porcelain, stone, and the European import
          </h2>
          <p className="mt-5 max-w-2xl font-sans text-[15px] leading-[1.7] text-charcoal">
            A short comparison of the bowl in the hand: what it keeps, what it grinds, and how it arrives.
          </p>
        </Reveal>

        <div className="mt-14 hidden border-t border-hairline md:grid md:grid-cols-[0.8fr_1fr_1fr_1.15fr]">
          <div className="border-b border-hairline py-4 pr-6" />
          {columns.map((column) => (
            <div key={column} className="border-b border-hairline py-4 pr-6">
              <h3 className="font-serif text-2xl font-light text-navy">{column}</h3>
            </div>
          ))}
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <p className="border-b border-hairline py-6 pr-6 font-sans text-[11px] uppercase tracking-[0.18em] text-muted">
                {row.label}
              </p>
              {row.cells.map((cell) => (
                <p
                  key={cell}
                  className="border-b border-hairline py-6 pr-6 font-sans text-[15px] leading-[1.7] text-charcoal"
                >
                  {cell}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-hairline md:hidden">
          {rows.map((row) => (
            <article key={row.label} className="border-b border-hairline py-8">
              <h3 className="font-sans text-[11px] uppercase tracking-[0.18em] text-muted">
                {row.label}
              </h3>
              <dl className="mt-5 space-y-5">
                {columns.map((column, index) => (
                  <div key={column}>
                    <dt className="font-serif text-xl font-light text-navy">{column}</dt>
                    <dd className="mt-1 font-sans text-[15px] leading-[1.7] text-charcoal">
                      {row.cells[index]}
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
