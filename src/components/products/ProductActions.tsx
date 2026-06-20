"use client";

import { useState } from "react";
import type { Product } from "@/lib/product-types";
import { formatPKR, formatUSD, formatDiameter } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { InquiryForm } from "@/components/shared/InquiryForm";

type ProductActionsProps = {
  product: Product;
};

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [country, setCountry] = useState("Pakistan");

  const whatsappUrl = buildWhatsAppUrl({
    productName: product.name,
    size: product.size,
    quantity,
    country,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-semibold text-navy">{formatPKR(product.pricePKR)}</p>
        <p className="text-sm text-charcoal/60">{formatUSD(product.priceUSD)} USD</p>
        <p className="mt-1 text-xs text-charcoal/50">SKU: {product.sku}</p>
      </div>

      <p
        className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-wider ${product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
      >
        {product.inStock ? "In Stock" : "Out of Stock"}
      </p>

      <p className="text-sm text-charcoal/70">
        {formatDiameter(product.diameterCm)} · {product.capacityMl}ml capacity
      </p>

      <div className="flex items-center gap-4">
        <label htmlFor="qty" className="text-sm font-medium text-navy">
          Qty
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={99}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-20 rounded-md border border-charcoal/20 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
        />
      </div>

      <div>
        <label htmlFor="order-country" className="mb-1 block text-sm font-medium text-navy">
          Delivery Country
        </label>
        <select
          id="order-country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full rounded-md border border-charcoal/20 px-4 py-3 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
        >
          <option value="Pakistan">Pakistan</option>
          <option value="United Kingdom">United Kingdom</option>
          <option value="United States">United States</option>
          <option value="United Arab Emirates">United Arab Emirates</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90"
        >
          Order via WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-navy px-6 py-3 text-sm uppercase tracking-wider text-navy transition-colors hover:bg-navy hover:text-white"
        >
          {showForm ? "Hide Form" : "Send Inquiry"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-cream bg-cream/30 p-6">
          <InquiryForm defaultProduct={product.name} defaultSize={product.size} />
        </div>
      )}
    </div>
  );
}
