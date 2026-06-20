import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { formatPKR, formatUSD, formatDiameter } from "@/lib/format";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-porcelain">
          <Image
            src={product.images[0]}
            alt={`${product.name} — ${formatDiameter(product.diameterCm)} porcelain mortar and pestle`}
            fill
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {!product.inStock && (
            <span className="absolute left-3 top-3 rounded-full bg-charcoal/80 px-3 py-1 text-xs uppercase tracking-wider text-white">
              Out of Stock
            </span>
          )}
        </div>
        <div className="mt-4">
          <h3 className="font-serif text-lg font-semibold text-navy group-hover:underline">
            {product.name}
          </h3>
          <p className="mt-1 text-sm text-charcoal/70">
            {formatDiameter(product.diameterCm)} · {product.capacityMl}ml
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-lg font-semibold text-navy">{formatPKR(product.pricePKR)}</p>
            <p className="text-sm text-charcoal/60">{formatUSD(product.priceUSD)}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
