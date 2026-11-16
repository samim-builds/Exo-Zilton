import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { formatPKR, formatUSD, formatDiameter } from "@/lib/format";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const primary = product.images[0];
  const hover = product.images[2] ?? product.images[1];
  const showHover = Boolean(hover && hover !== primary);

  return (
    <article className="border border-hairline bg-porcelain">
      <Link
        href={product.href}
        className="group block focus-visible:outline focus-visible:outline-offset-[3px] focus-visible:outline-bronze"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-porcelain">
          {primary && (
            <Image
              src={primary}
              alt={product.imageAlts?.[0]?.alt || product.name}
              fill
              className={`object-contain p-8 transition-opacity duration-500 motion-reduce:transition-none sm:p-10 ${
                showHover ? "group-hover:opacity-0" : ""
              }`}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          {showHover && hover && (
            <Image
              src={hover}
              alt=""
              fill
              className="object-contain p-8 opacity-0 transition-opacity duration-500 motion-reduce:transition-none group-hover:opacity-100 sm:p-10"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          {!product.inStock && (
            <span className="absolute left-4 top-4 border border-hairline bg-porcelain px-2 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-navy">
              Out of stock
            </span>
          )}
        </div>
        <div className="border-t border-hairline px-5 py-5">
          <h3 className="font-serif text-xl font-light tracking-tight text-navy">
            {product.name}
          </h3>
          {product.diameterCm > 0 && (
            <p className="mt-2 font-sans text-[12px] tracking-wide text-muted">
              {formatDiameter(product.diameterCm)}
              {product.capacityMl > 0 && ` · ${product.capacityMl}ml`}
            </p>
          )}
          <p className="mt-2 font-sans text-[12px] tracking-wide text-navy">
            {formatPKR(product.pricePKR)}
            <span className="mx-2 text-hairline" aria-hidden="true">
              |
            </span>
            <span className="text-muted">{formatUSD(product.priceUSD)}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
