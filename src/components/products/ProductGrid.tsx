"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/product-types";
import { ProductCard } from "./ProductCard";
import { controlClass } from "@/components/site/Field";
import { cn } from "@/lib/utils";

type SortOption = "name" | "price-asc" | "price-desc" | "size";

type ProductGridProps = {
  products: Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  const [sort, setSort] = useState<SortOption>("size");
  const [inStockOnly, setInStockOnly] = useState(false);

  const filtered = useMemo(() => {
    const result = inStockOnly ? products.filter((p) => p.inStock) : [...products];

    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-asc":
        result.sort((a, b) => a.pricePKR - b.pricePKR);
        break;
      case "price-desc":
        result.sort((a, b) => b.pricePKR - a.pricePKR);
        break;
      case "size":
      default:
        result.sort((a, b) => a.diameterCm - b.diameterCm);
    }

    return result;
  }, [products, sort, inStockOnly]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-glaze pb-4">
        <p className="tabular text-sm text-stone" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="size-4 accent-ink" />
            In stock only
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-stone">
              Sort by
            </label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className={cn(controlClass, "w-auto py-1.5 text-sm")}>
              <option value="size">Size</option>
              <option value="name">Name</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.variantKey} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-ink">Nothing in stock matches right now.</p>
          <button type="button" onClick={() => setInStockOnly(false)} className="mt-3 text-sm text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-bronze">
            Show all products
          </button>
        </div>
      )}
    </div>
  );
}
