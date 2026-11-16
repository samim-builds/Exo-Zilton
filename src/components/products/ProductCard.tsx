import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/product-types";
import { Price } from "@/components/site/Price";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const primary = product.images[0];
  const hover = product.images[2] ?? product.images[1];
  const showHover = Boolean(hover && hover !== primary);
  const sizes = "(max-width: 1024px) 50vw, 25vw";

  return (
    <article>
      <Link href={product.href} className="group block rounded-[2px] focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-white">
          {primary && (
            <Image
              src={primary}
              alt={product.imageAlts?.[0]?.alt || product.name}
              fill
              // The second image only appears on devices that can hover.
              className={`object-contain p-6 transition-opacity duration-300 motion-reduce:transition-none sm:p-8 ${showHover ? "[@media(hover:hover)]:group-hover:opacity-0" : ""}`}
              sizes={sizes}
            />
          )}
          {showHover && hover && (
            <Image
              src={hover}
              alt=""
              fill
              className="object-contain p-6 opacity-0 transition-opacity duration-300 motion-reduce:transition-none sm:p-8 [@media(hover:hover)]:group-hover:opacity-100"
              sizes={sizes}
            />
          )}
          {!product.inStock && (
            <span className="absolute top-3 left-3 rounded-full bg-porcelain px-2.5 py-1 text-xs font-medium text-ink">Out of stock</span>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="font-sans text-[0.9375rem] font-medium text-ink group-hover:underline group-hover:decoration-ink/30 group-hover:underline-offset-4">
            {product.name}
          </h3>
          {product.diameterCm > 0 && (
            <p className="text-sm text-stone">
              {product.diameterCm} cm
              {product.capacityMl > 0 && `, ${product.capacityMl} ml`}
            </p>
          )}
          <Price pricePKR={product.pricePKR} priceUSD={product.priceUSD} className="pt-1" />
        </div>
      </Link>
    </article>
  );
}
