import Link from "next/link";

type CategoryChipsProps = {
  categories: { slug: string; name: string }[];
  /** Slug of the category being shown; undefined on the all-products page. */
  active?: string;
};

export function CategoryChips({ categories, active }: CategoryChipsProps) {
  if (categories.length === 0) return null;
  const chip = (isActive: boolean) =>
    `border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.16em] transition-colors ${
      isActive ? "border-navy bg-navy text-porcelain" : "border-hairline bg-porcelain text-navy hover:border-bronze"
    }`;

  return (
    <nav aria-label="Product categories" className="flex flex-wrap gap-2">
      <Link href="/products" aria-current={active ? undefined : "page"} className={chip(!active)}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/categories/${c.slug}`}
          aria-current={active === c.slug ? "page" : undefined}
          className={chip(active === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
