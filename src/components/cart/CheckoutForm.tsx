"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { useCart } from "./CartProvider";
import { countries } from "@/lib/inquiry-schema";
import { checkoutSchema, formatMoney, isDomestic, type CheckoutFormData } from "@/lib/order-schema";

const inputClass =
  "w-full border border-hairline bg-white px-4 py-3 font-sans text-sm text-navy focus:border-navy focus:outline-none";
const labelClass = "mb-2 block font-sans text-[11px] uppercase tracking-[0.16em] text-navy";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 font-sans text-xs text-red-700">{message}</p> : null;
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { country: "Pakistan" },
  });

  const domestic = isDomestic(useWatch({ control, name: "country" }));
  const currency = domestic ? "PKR" : "USD";
  const subtotal = items.reduce(
    (sum, i) => sum + (domestic ? i.pricePKR : i.priceUSD) * i.quantity,
    0,
  );

  if (ready && items.length === 0) {
    return (
      <p className="font-sans text-[15px] text-muted">
        Your cart is empty.{" "}
        <Link href="/products" className="text-navy underline underline-offset-4">
          Browse the collection
        </Link>
      </p>
    );
  }

  async function onSubmit(data: CheckoutFormData) {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({ variantId: i.key, quantity: i.quantity })),
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Something went wrong");
      }

      track("order_placed", { currency, total: subtotal });
      clear();
      router.push(`/orders/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[1.618fr_1fr]">
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>Full name</label>
            <input id="name" autoComplete="name" {...register("name")} className={inputClass} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone / WhatsApp</label>
            <input id="phone" type="tel" autoComplete="tel" {...register("phone")} className={inputClass} />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" {...register("email")} className={inputClass} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>Country</label>
          <select id="country" autoComplete="country-name" {...register("country")} className={inputClass}>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FieldError message={errors.country?.message} />
        </div>
        <div>
          <label htmlFor="addressLine" className={labelClass}>Address</label>
          <input id="addressLine" autoComplete="street-address" {...register("addressLine")} className={inputClass} />
          <FieldError message={errors.addressLine?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input id="city" autoComplete="address-level2" {...register("city")} className={inputClass} />
            <FieldError message={errors.city?.message} />
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClass}>Postal code (optional)</label>
            <input id="postalCode" autoComplete="postal-code" {...register("postalCode")} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className={labelClass}>Order notes (optional)</label>
          <textarea id="notes" rows={3} {...register("notes")} className={inputClass} />
        </div>
      </div>

      <aside className="h-fit border border-hairline bg-white p-6">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-bronze">Your order</p>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-4 font-sans text-[14px] text-charcoal">
              <span>
                {i.quantity} × {i.name}
                {i.variantTitle && ` — ${i.variantTitle}`}
              </span>
              <span className="shrink-0">
                {formatMoney((domestic ? i.pricePKR : i.priceUSD) * i.quantity, currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-2 border-t border-hairline pt-4 font-sans text-[14px] text-charcoal">
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{domestic ? "Free" : "Quoted after order"}</span>
          </div>
          <div className="flex justify-between text-[16px] text-navy">
            <span>Total</span>
            <span>{formatMoney(subtotal, currency)}</span>
          </div>
        </div>
        <p className="mt-4 font-sans text-[13px] leading-[1.7] text-muted">
          {domestic
            ? "Pay cash on delivery. We'll confirm your order by phone or WhatsApp before dispatch."
            : "No payment now. We'll email a shipping quote and secure payment link within one business day."}
        </p>
        {error && <p className="mt-4 font-sans text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !ready}
          className="mt-6 inline-flex w-full justify-center border border-navy bg-navy px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:border-bronze hover:bg-bronze disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Placing order…" : domestic ? "Place order — cash on delivery" : "Place order"}
        </button>
      </aside>
    </form>
  );
}
