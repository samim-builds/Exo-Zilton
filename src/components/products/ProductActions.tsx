"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Gift } from "lucide-react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useCart } from "@/components/cart/CartProvider";
import type { CatalogProduct, CatalogVariant } from "@/lib/product-types";
import { formatPKR } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { InquiryForm } from "@/components/shared/InquiryForm";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { Button } from "@/components/site/Button";
import { controlClass } from "@/components/site/Field";
import { QuantityStepper } from "@/components/site/QuantityStepper";
import { cn } from "@/lib/utils";

type ProductActionsProps = {
  product: CatalogProduct;
  variant: CatalogVariant;
  /** Product URL with this variant selected. */
  href: string;
};

export function ProductActions({ product, variant, href }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [country, setCountry] = useState("Pakistan");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyHidden, setBuyHidden] = useState(false);

  // On phones, a bar with the price and Add to cart appears once the buy
  // buttons have scrolled up out of view.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setBuyHidden(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleAddToCart() {
    addItem(
      {
        key: variant.key,
        href,
        name: product.name,
        variantTitle: variant.title,
        sku: variant.sku,
        image: variant.images[0]?.url,
        pricePKR: variant.pricePKR,
        priceUSD: variant.priceUSD,
      },
      Math.max(1, Math.min(99, quantity || 1)),
    );
    setAdded(true);
    track("add_to_cart", { product: product.slug, sku: variant.sku, quantity });
  }

  const whatsappUrl = buildWhatsAppUrl({
    productName: product.name,
    size: variant.title,
    quantity,
    country,
  });

  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 text-sm">
        <span className={cn("size-2 rounded-full", variant.inStock ? "bg-emerald-600" : "bg-stone/50")} aria-hidden />
        <span className="text-ink">{variant.inStock ? "In stock, ready to ship" : "Out of stock"}</span>
        <span className="ml-auto text-xs text-stone">SKU {variant.sku}</span>
      </p>

      <div ref={buyRef} className="space-y-3">
        <div className="flex gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <Button size="lg" className="flex-1" disabled={!variant.inStock} onClick={handleAddToCart}>
            {variant.inStock ? "Add to cart" : "Out of stock"}
          </Button>
        </div>
        {added && (
          <p className="flex items-center gap-2 text-sm text-ink" role="status">
            <Check className="size-4 text-emerald-700" aria-hidden />
            Added to your cart.
            <Link href="/cart" className="underline decoration-ink/30 underline-offset-4 hover:decoration-bronze">
              View cart
            </Link>
          </p>
        )}
        <Button asChild variant="secondary" size="lg" className="w-full">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            Order on WhatsApp
          </a>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone">
        <label htmlFor="order-country">Delivering to</label>
        <select id="order-country" value={country} onChange={(e) => setCountry(e.target.value)} className={cn(controlClass, "w-auto py-1.5 text-sm")}>
          <option value="Pakistan">Pakistan</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="United States">United States</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
          <option value="Other">Another country</option>
        </select>
      </div>

      <p className="flex items-start gap-2.5 border-t border-glaze pt-5 text-sm text-stone">
        <Gift className="mt-0.5 size-4 shrink-0 text-bronze" aria-hidden />
        Gift packaging included. Insured shipping across Pakistan and worldwide.
      </p>

      <div>
        <Button variant="quiet" onClick={() => setShowForm(!showForm)} aria-expanded={showForm}>
          {showForm ? "Close the question form" : "Ask a question about this size"}
        </Button>
        {showForm && (
          <div className="mt-4 rounded-[6px] border border-glaze bg-white p-5 sm:p-6">
            <InquiryForm defaultProduct={variant.title ? `${product.name} - ${variant.title}` : product.name} defaultSize={variant.title} />
          </div>
        )}
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-glaze bg-porcelain/95 px-4 py-3 backdrop-blur-sm transition-transform duration-200 lg:hidden",
          buyHidden ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        aria-hidden={!buyHidden}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-stone">{variant.title || product.name}</p>
          <p className="tabular font-medium text-ink">{formatPKR(variant.pricePKR)}</p>
        </div>
        <Button disabled={!variant.inStock} onClick={handleAddToCart} tabIndex={buyHidden ? 0 : -1}>
          {added ? "Added" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
