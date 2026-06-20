const items = [
  { label: "Made in Pakistan", description: "Proudly crafted with care" },
  { label: "Quality Guarantee", description: "Built to last for years" },
  { label: "Worldwide Inquiries", description: "Ship across Pakistan & abroad" },
];

export function TrustBar() {
  return (
    <section className="border-y border-cream bg-porcelain py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className="font-serif text-lg font-semibold text-navy">{item.label}</p>
            <p className="mt-1 text-sm text-charcoal/70">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
