"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPKR } from "@/lib/format";
import { buttonVariants } from "@/components/site/Button";
import { QuantityStepper } from "@/components/site/QuantityStepper";

export function CartView() {
  const { items, ready, setQuantity, removeItem } = useCart();

  if (!ready) {
    return <p className="text-stone">Loading your cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md py-6">
        <p className="text-lg text-ink">Your cart is empty.</p>
        <p className="mt-2 text-stone">Pick a size and it will wait here until you check out.</p>
        <Link href="/products" className={buttonVariants({ size: "lg", className: "mt-8" })}>
          Shop all sizes
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + i.pricePKR * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <ul className="divide-y divide-glaze border-y border-glaze lg:col-span-7">
        {items.map((item) => (
          <li key={item.key} className="flex gap-4 py-6 sm:gap-6">
            <Link href={item.href} className="relative size-24 shrink-0 overflow-hidden rounded-[2px] bg-white sm:size-28" tabIndex={-1} aria-hidden>
              {item.image && <Image src={item.image} alt="" fill sizes="112px" className="object-contain p-2" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <Link href={item.href} className="font-medium text-ink hover:underline hover:decoration-ink/30 hover:underline-offset-4">
                  {item.name}
                </Link>
                {item.variantTitle && <p className="mt-0.5 text-sm text-stone">{item.variantTitle}</p>}
                <p className="tabular mt-2 text-[0.9375rem] text-ink">{formatPKR(item.pricePKR * item.quantity)}</p>
                {item.quantity > 1 && <p className="tabular text-xs text-stone">{formatPKR(item.pricePKR)} each</p>}
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-between">
                <QuantityStepper size="sm" value={item.quantity} onChange={(q) => setQuantity(item.key, q)} label={`Quantity of ${item.name} ${item.variantTitle}`} />
                <button type="button" onClick={() => removeItem(item.key)} className="py-1 text-sm text-stone underline decoration-stone/40 underline-offset-4 hover:text-ink">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-[6px] bg-glaze/50 p-6 sm:p-8 lg:sticky lg:top-24 lg:col-span-5" aria-labelledby="cart-summary">
        <h2 id="cart-summary" className="text-2xl text-ink">
          Order summary
        </h2>
        <dl className="mt-6 space-y-3 text-[0.9375rem]">
          <div className="flex justify-between">
            <dt className="text-stone">
              Subtotal ({count} {count === 1 ? "item" : "items"})
            </dt>
            <dd className="tabular text-ink">{formatPKR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-stone">Delivery in Pakistan</dt>
            <dd className="text-ink">Free</dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-ink/10 pt-4 text-sm text-stone">
          Pay cash on delivery in Pakistan. International orders are priced in USD at checkout, and we send a shipping quote before dispatch. Discount and gift voucher codes go in at checkout.
        </p>
        <Link href="/checkout" className={buttonVariants({ size: "lg", className: "mt-6 w-full" })}>
          Checkout
        </Link>
        <Link href="/products" className="mt-4 block text-center text-sm text-stone underline decoration-stone/40 underline-offset-4 hover:text-ink">
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
