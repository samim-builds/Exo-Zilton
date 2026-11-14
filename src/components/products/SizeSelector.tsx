import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { formatDiameter } from "@/lib/format";

type SizeSelectorProps = {
  products: Product[];
  currentSlug: string;
};

export function SizeSelector({ products, currentSlug }: SizeSelectorProps) {
  return (
    <div>
      <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.2em] text-muted">
        Size
      </p>
      <div className="flex flex-wrap" role="group" aria-label="Available sizes">
        {products.map((product) => {
          const isActive = product.slug === currentSlug;

          return (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              aria-current={isActive ? "page" : undefined}
              className={`-ml-px flex min-w-[5.5rem] flex-col items-center border border-hairline px-3 py-3 text-center first:ml-0 ${
                isActive
                  ? "relative z-10 border-navy bg-navy text-porcelain"
                  : "bg-porcelain text-navy hover:border-bronze"
              }`}
            >
              <span className="font-sans text-[11px] uppercase tracking-[0.16em]">
                {product.size}
              </span>
              <span
                className={`mt-1 font-sans text-[11px] tracking-normal ${
                  isActive ? "text-porcelain/80" : "text-muted"
                }`}
              >
                {formatDiameter(product.diameterCm)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
