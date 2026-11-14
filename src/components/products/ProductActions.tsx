"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/product-types";
import { formatDiameter } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { InquiryForm } from "@/components/shared/InquiryForm";

type ProductActionsProps = {
  product: Product;
};

function WhatsAppMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [country, setCountry] = useState("Pakistan");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  function handleAddToCart() {
    addItem(
      {
        slug: product.slug,
        name: product.name,
        size: product.size,
        image: product.images[0],
        pricePKR: product.pricePKR,
        priceUSD: product.priceUSD,
      },
      Math.max(1, Math.min(99, quantity || 1)),
    );
    setAdded(true);
    track("add_to_cart", { product: product.slug, quantity });
  }

  const whatsappUrl = buildWhatsAppUrl({
    productName: product.name,
    size: product.size,
    quantity,
    country,
  });

  return (
    <div className="space-y-6">
      <p
        className={`font-sans text-[10px] uppercase tracking-[0.2em] ${
          product.inStock ? "text-bronze" : "text-muted"
        }`}
      >
        {product.inStock ? "In stock" : "Out of stock"}
      </p>

      <p className="font-sans text-[12px] tracking-wide text-muted">
        {formatDiameter(product.diameterCm)} · {product.capacityMl}ml capacity
        <span className="mx-2 text-hairline">·</span>
        {product.sku}
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
          disabled={!product.inStock}
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
          <WhatsAppMark />
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
          <InquiryForm defaultProduct={product.name} defaultSize={product.size} />
        </div>
      )}
    </div>
  );
}
