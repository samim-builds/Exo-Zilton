import { SectionHeading } from "@/components/shared/SectionHeading";

const features = [
  {
    title: "Vitrified Porcelain",
    description:
      "Dense unglazed porcelain provides the perfect abrasive finish for blending herbs and spices without staining.",
    icon: "◆",
  },
  {
    title: "Beechwood Handle",
    description:
      "Ergonomic beechwood handle offers comfortable grip and control when grinding even the toughest mixtures.",
    icon: "◆",
  },
  {
    title: "Gift-Ready Packaging",
    description:
      "Each set arrives in beautiful kraft packaging — perfect for weddings, housewarmings, and special occasions.",
    icon: "◆",
  },
  {
    title: "Worldwide Shipping",
    description:
      "Based in Pakistan with delivery across the country and international inquiries welcome via WhatsApp.",
    icon: "◆",
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-cream py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Why Exo Zilton"
          title="Craftsmanship You Can Trust"
          description="Every mortar and pestle is designed to maximise flavour, durability, and timeless kitchen elegance."
        />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-gold/20 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-gold" aria-hidden="true">
                {feature.icon}
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
