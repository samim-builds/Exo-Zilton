"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPKR } from "@/lib/format";

export function CartView() {
  const { items, ready, setQuantity, removeItem } = useCart();

  if (!ready) {
    return <p className="font-sans text-[15px] text-muted">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="border border-hairline bg-white p-10 text-center">
        <p className="font-serif text-2xl font-light text-navy">Your cart is empty</p>
        <Link
          href="/products"
          className="mt-6 inline-flex border border-navy bg-navy px-6 py-3 font-sans text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:border-bronze hover:bg-bronze"
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.pricePKR * i.quantity, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.618fr_1fr]">
      <ul className="divide-y divide-hairline border-y border-hairline">
        {items.map((item) => (
          <li key={item.key} className="flex gap-5 py-6">
            <div className="relative h-24 w-24 shrink-0 border border-hairline bg-porcelain">
              {item.image && (
                <Image src={item.image} alt="" fill sizes="96px" className="object-contain p-2" />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <Link href={item.href} className="font-serif text-xl text-navy hover:text-bronze">
                  {item.name}
                </Link>
                <p className="mt-1 font-sans text-[11px] uppercase tracking-[0.16em] text-muted">{item.variantTitle}</p>
                <p className="mt-2 font-sans text-[15px] text-charcoal">{formatPKR(item.pricePKR)}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="sr-only" htmlFor={`qty-${item.key}`}>
                  Quantity
                </label>
                <input
                  id={`qty-${item.key}`}
                  type="number"
                  min={1}
                  max={99}
                  value={item.quantity}
                  onChange={(e) => setQuantity(item.key, Number(e.target.value) || 1)}
                  className="w-20 border border-hairline bg-porcelain px-3 py-2 font-sans text-sm text-navy"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="font-sans text-[11px] uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-navy"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit border border-hairline bg-white p-6">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-bronze">Summary</p>
        <div className="mt-4 flex justify-between font-sans text-[15px] text-charcoal">
          <span>Subtotal</span>
          <span>{formatPKR(subtotal)}</span>
        </div>
        <p className="mt-3 font-sans text-[13px] leading-[1.7] text-muted">
          Free delivery across Pakistan with cash on delivery. International orders are priced in USD
          at checkout and we follow up with a shipping quote.
        </p>
        <Link
          href="/checkout"
          className="mt-6 inline-flex w-full justify-center border border-navy bg-navy px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:border-bronze hover:bg-bronze"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}
