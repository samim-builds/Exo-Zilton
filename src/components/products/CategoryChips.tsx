import Link from "next/link";
import { cn } from "@/lib/utils";

type CategoryChipsProps = {
  categories: { slug: string; name: string }[];
  /** Slug of the category being shown; undefined on the all-products page. */
  active?: string;
};

export function CategoryChips({ categories, active }: CategoryChipsProps) {
  if (categories.length === 0) return null;
  const chip = (isActive: boolean) =>
    cn(
      "inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors",
      isActive ? "border-ink bg-ink text-porcelain" : "border-ink/15 text-ink hover:border-ink/40",
    );

  return (
    <nav aria-label="Product categories" className="flex flex-wrap gap-2">
      <Link href="/products" aria-current={active ? undefined : "page"} className={chip(!active)}>
        All products
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={`/categories/${c.slug}`} aria-current={active === c.slug ? "page" : undefined} className={chip(active === c.slug)}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
