"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/product-types";
import { ProductCard } from "./ProductCard";

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded border-charcoal/30 text-navy focus:ring-navy"
          />
          In stock only
        </label>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-charcoal/70">
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-charcoal/20 bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
          >
            <option value="size">Size</option>
            <option value="name">Name</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-charcoal/70">
          No products match your filters.
        </p>
      )}
    </div>
  );
}
