"use client";

import Image from "next/image";
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
      <p className="mb-4 font-serif text-lg text-navy">
        Available in the following sizes:
      </p>
      <div className="flex flex-wrap gap-4">
        {products.map((product) => {
          const isActive = product.slug === currentSlug;
          const href = `/products/${product.slug}`;

          return (
            <Link
              key={product.slug}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center gap-2 rounded-lg p-2 transition-colors ${isActive ? "ring-2 ring-navy ring-offset-2" : "hover:bg-cream"}`}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-porcelain">
                <Image
                  src={product.images[2] ?? product.images[0]}
                  alt={`${product.size} top view`}
                  fill
                  className="object-contain p-2"
                  sizes="64px"
                />
              </div>
              <span className="text-center text-xs text-charcoal">
                {product.size}
                <br />
                {formatDiameter(product.diameterCm)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
