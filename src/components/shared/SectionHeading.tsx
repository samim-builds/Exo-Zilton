type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p
          className={`mb-2 text-xs uppercase tracking-[0.25em] ${light ? "text-gold" : "text-gold"}`}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-serif text-3xl font-semibold sm:text-4xl ${light ? "text-white" : "text-navy"}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed ${light ? "text-white/80" : "text-charcoal/80"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
