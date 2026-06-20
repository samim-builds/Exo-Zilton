import Link from "next/link";

export function BrandBanner() {
  return (
    <section className="bg-navy py-16 text-white sm:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          Part of the Exo Zilton collection
        </p>
        <h2 className="mt-4 font-serif text-3xl font-semibold sm:text-4xl">
          Synonymous with the Iconic Mortar &amp; Pestle
        </h2>
        <p className="mt-6 text-base leading-relaxed text-white/85">
          Exo Zilton expertly combines traditional designs and contemporary flair to create
          timeless pieces that take pride of place in kitchens across Pakistan and beyond. Our
          mortar and pestle sets offer durability, practicality, and an ageless charm to enhance
          any kitchen — from home cooks to professional chefs.
        </p>
        <Link
          href="/about"
          className="mt-8 inline-flex rounded-full border border-gold px-8 py-3 text-sm uppercase tracking-widest text-gold transition-colors hover:bg-gold hover:text-navy"
        >
          About Exo Zilton
        </Link>
      </div>
    </section>
  );
}
