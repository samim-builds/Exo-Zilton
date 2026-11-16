import Link from "next/link";
import type { CatalogProduct, CatalogVariant } from "@/lib/product-types";
import { selectionHref } from "@/lib/catalog/storefront";
import { formatDiameter } from "@/lib/format";

type VariantSelectorProps = {
  product: CatalogProduct;
  current: CatalogVariant;
};

// One row of choices per option. Each choice is a link to the product URL with
// that option set (?size=size-3), so selections are shareable and indexable.
export function VariantSelector({ product, current }: VariantSelectorProps) {
  return (
    <div className="space-y-6">
      {product.options.map((option) => (
        <div key={option.param}>
          <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.2em] text-muted">{option.name}</p>
          <div className="flex flex-wrap" role="group" aria-label={`Available ${option.name.toLowerCase()} options`}>
            {option.values.map((value) => {
              const isActive = current.selection[option.param] === value.slug;
              const { href } = selectionHref(product, current, option.param, value.slug);
              // Only one option: show the dimension under each value, like the size chart.
              const sample = product.options.length === 1 ? product.variants.find((v) => v.selection[option.param] === value.slug) : undefined;
              const className = `-ml-px flex min-w-[5.5rem] flex-col items-center border border-hairline px-3 py-3 text-center first:ml-0 ${
                isActive ? "relative z-10 border-navy bg-navy text-porcelain" : "bg-porcelain text-navy hover:border-bronze"
              } ${sample && !sample.inStock && !isActive ? "opacity-60" : ""}`;
              const content = (
                <>
                  <span className="font-sans text-[11px] uppercase tracking-[0.16em]">{value.value}</span>
                  {sample && sample.diameterCm > 0 && (
                    <span className={`mt-1 font-sans text-[11px] tracking-normal ${isActive ? "text-porcelain/80" : "text-muted"}`}>
                      {formatDiameter(sample.diameterCm)}
                    </span>
                  )}
                </>
              );

              return href ? (
                <Link key={value.slug} href={href} replace scroll={false} aria-current={isActive ? "true" : undefined} className={className}>
                  {content}
                </Link>
              ) : (
                <span key={value.slug} aria-disabled="true" className={`${className} cursor-not-allowed opacity-40`}>
                  {content}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
