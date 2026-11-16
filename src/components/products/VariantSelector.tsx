import Link from "next/link";
import type { CatalogProduct, CatalogVariant } from "@/lib/product-types";
import { selectionHref } from "@/lib/catalog/storefront";
import { cn } from "@/lib/utils";

type VariantSelectorProps = {
  product: CatalogProduct;
  current: CatalogVariant;
};

// One group of choices per option. Each choice is a link to the product URL with
// that option set (?size=size-3), so selections are shareable and indexable.

/** Desktop column count (3 or 4) that leaves the fullest last row. */
function columnsFor(count: number): 3 | 4 {
  if (count % 3 === 0) return 3;
  if (count % 4 === 0) return 4;
  return count % 4 > count % 3 ? 4 : 3;
}
export function VariantSelector({ product, current }: VariantSelectorProps) {
  return (
    <div className="space-y-6">
      {product.options.map((option) => {
        const selected = option.values.find((v) => current.selection[option.param] === v.slug);
        const count = option.values.length;
        return (
          <fieldset key={option.param}>
            <legend className="mb-3 text-sm text-stone">
              {option.name}
              {selected && <span className="ml-1.5 font-medium text-ink">{selected.value}</span>}
            </legend>
            <div className={cn("grid grid-cols-2 gap-2", columnsFor(count) === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
              {option.values.map((value, index) => {
                const isActive = current.selection[option.param] === value.slug;
                const { href } = selectionHref(product, current, option.param, value.slug);
                // Only one option: show the dimensions under each value, like the size chart.
                const sample = product.options.length === 1 ? product.variants.find((v) => v.selection[option.param] === value.slug) : undefined;
                const soldOut = Boolean(sample && !sample.inStock);
                const className = cn(
                  "flex min-h-14 flex-col justify-center rounded-[6px] border px-3 py-2.5 text-left transition-colors",
                  // On phones an odd last option spans both columns instead of sitting alone.
                  count % 2 === 1 && index === count - 1 && "col-span-2 sm:col-span-1",
                  isActive ? "border-ink bg-white ring-1 ring-ink" : "border-ink/15 bg-white hover:border-ink/40",
                  soldOut && !isActive && "text-stone",
                );
                const content = (
                  <>
                    <span className={cn("text-[0.9375rem] font-medium text-ink", soldOut && "line-through decoration-stone/60")}>{value.value}</span>
                    {sample && sample.diameterCm > 0 && (
                      <span className="tabular mt-0.5 flex flex-col text-xs leading-snug text-stone">
                        <span>{sample.diameterCm} cm</span>
                        {sample.capacityMl > 0 && <span>{sample.capacityMl} ml</span>}
                      </span>
                    )}
                    {soldOut && <span className="sr-only">(out of stock)</span>}
                  </>
                );

                return href ? (
                  <Link key={value.slug} href={href} replace scroll={false} aria-current={isActive ? "true" : undefined} className={className}>
                    {content}
                  </Link>
                ) : (
                  <span key={value.slug} aria-disabled="true" className={cn(className, "cursor-not-allowed opacity-40")}>
                    {content}
                  </span>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
