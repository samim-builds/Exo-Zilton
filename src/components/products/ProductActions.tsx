"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useCart } from "@/components/cart/CartProvider";
import type { CatalogProduct, CatalogVariant } from "@/lib/product-types";
import { formatDiameter } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { InquiryForm } from "@/components/shared/InquiryForm";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

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
      <p
        className={`font-sans text-[10px] uppercase tracking-[0.2em] ${
          variant.inStock ? "text-bronze" : "text-muted"
        }`}
      >
        {variant.inStock ? "In stock" : "Out of stock"}
      </p>

      <p className="font-sans text-[12px] tracking-wide text-muted">
        {variant.diameterCm > 0 && (
          <>
            {formatDiameter(variant.diameterCm)}
            {variant.capacityMl > 0 && ` · ${variant.capacityMl}ml capacity`}
            <span className="mx-2 text-hairline">·</span>
          </>
        )}
        {variant.sku}
      </p>

      <div className="flex items-center gap-4">
        <label htmlFor="qty" className="font-sans text-[11px] uppercase tracking-[0.16em] text-navy">
          Qty
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-20 border border-hairline bg-porcelain px-3 py-2 font-sans text-sm text-navy"
        />
      </div>

      <div>
        <label
          htmlFor="order-country"
          className="mb-2 block font-sans text-[11px] uppercase tracking-[0.16em] text-navy"
        >
          Delivery country
        </label>
        <select
          id="order-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full border border-hairline bg-porcelain px-4 py-3 font-sans text-sm text-navy"
        >
          <option value="Pakistan">Pakistan</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="United States">United States</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={!variant.inStock}
          onClick={handleAddToCart}
          className="inline-flex w-full items-center justify-center border border-navy bg-navy px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:border-bronze hover:bg-bronze disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? "Added to cart" : "Add to cart"}
        </button>
        {added && (
          <Link
            href="/cart"
            className="text-center font-sans text-[11px] uppercase tracking-[0.16em] text-bronze underline underline-offset-4"
          >
            View cart & checkout
          </Link>
        )}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-3 border border-hairline bg-porcelain px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-navy transition-colors hover:border-bronze"
        >
          <WhatsAppIcon />
          Order via WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex w-full items-center justify-center border border-hairline bg-porcelain px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-navy transition-colors hover:border-bronze"
        >
          {showForm ? "Hide form" : "Send inquiry"}
        </button>
      </div>

      <p className="font-sans text-[13px] leading-[1.7] text-muted">
        Complimentary gift packaging & insured shipping across Pakistan and worldwide.
      </p>

      {showForm && (
        <div className="border border-hairline bg-porcelain p-6">
          <InquiryForm defaultProduct={variant.title ? `${product.name} - ${variant.title}` : product.name} defaultSize={variant.title} />
        </div>
      )}
    </div>
  );
}
