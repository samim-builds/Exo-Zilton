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

type Quote = {
  totals: { subtotal: number; discountAmount: number; shipping: number; voucherAmount: number; total: number };
  discount: { code: string; title: string; amount: number; freeShipping: boolean } | null;
  voucher: { code: string; amount: number; remaining: number } | null;
  errors: { discount?: string; voucher?: string };
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 font-sans text-xs text-red-700">{message}</p> : null;
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [applying, setApplying] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
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
  const cartLines = items.map((i) => ({ variantId: i.key, quantity: i.quantity }));
  const discountCode = quote?.discount?.code;
  const voucherCode = quote?.voucher?.code;
  const total = quote ? quote.totals.total : subtotal;

  // Asks the server to price the cart with the applied codes, plus a newly typed one.
  async function requestQuote(code?: string, current = { discountCode, voucherCode }) {
    const { country, email, phone } = getValues();
    const response = await fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartLines, country, email, phone, ...current, code }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "We couldn't check that code.");
    const next = body as Quote;
    setQuote(next.discount || next.voucher ? next : null);
    return next;
  }

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setApplying(true);
    setCodeError("");
    try {
      const next = await requestQuote(code);
      const message = next.errors.discount ?? next.errors.voucher;
      if (message) setCodeError(message);
      else setCodeInput("");
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : "We couldn't check that code.");
    } finally {
      setApplying(false);
    }
  }

  function removeCode(kind: "discount" | "voucher") {
    setCodeError("");
    const current = {
      discountCode: kind === "discount" ? undefined : discountCode,
      voucherCode: kind === "voucher" ? undefined : voucherCode,
    };
    if (!current.discountCode && !current.voucherCode) {
      setQuote(null);
      return;
    }
    requestQuote(undefined, current).catch(() => setQuote(null));
  }

  // The country decides the currency, so applied codes are re-priced when it changes.
  function onCountryChange() {
    if (!discountCode && !voucherCode) return;
    requestQuote()
      .then((next) => setCodeError(next.errors.discount ?? next.errors.voucher ?? ""))
      .catch(() => setQuote(null));
  }

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
          items: cartLines,
          discountCode,
          voucherCode,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        if (body.field === "code") requestQuote().catch(() => setQuote(null));
        throw new Error(body.error ?? "Something went wrong");
      }

      track("order_placed", { currency, total });
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
          <select id="country" autoComplete="country-name" {...register("country", { onChange: onCountryChange })} className={inputClass}>
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
        <div className="mt-4 border-t border-hairline pt-4">
          <label htmlFor="code" className={labelClass}>Discount or gift voucher code</label>
          <div className="flex gap-2">
            <input
              id="code"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCode();
                }
              }}
              autoComplete="off"
              className={`${inputClass} uppercase`}
            />
            <button
              type="button"
              onClick={applyCode}
              disabled={applying || !codeInput.trim()}
              className="shrink-0 border border-navy px-4 font-sans text-[11px] uppercase tracking-[0.16em] text-navy transition-colors hover:border-bronze hover:text-bronze disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applying ? "Checking…" : "Apply"}
            </button>
          </div>
          <FieldError message={codeError} />
        </div>
        <div className="mt-4 space-y-2 border-t border-hairline pt-4 font-sans text-[14px] text-charcoal">
          {quote?.discount && (
            <div className="flex justify-between gap-4 text-bronze">
              <span>
                {quote.discount.code}
                <button
                  type="button"
                  onClick={() => removeCode("discount")}
                  className="ml-2 text-[12px] text-muted underline underline-offset-4"
                >
                  Remove
                </button>
              </span>
              <span>
                {quote.discount.freeShipping ? "Free delivery" : `-${formatMoney(quote.totals.discountAmount, currency)}`}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{domestic ? "Free" : "Quoted after order"}</span>
          </div>
          {quote?.voucher && (
            <div className="flex justify-between gap-4 text-bronze">
              <span>
                Gift voucher {quote.voucher.code}
                <button
                  type="button"
                  onClick={() => removeCode("voucher")}
                  className="ml-2 text-[12px] text-muted underline underline-offset-4"
                >
                  Remove
                </button>
              </span>
              <span>-{formatMoney(quote.totals.voucherAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between text-[16px] text-navy">
            <span>Total</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
          {quote?.voucher && quote.voucher.remaining > 0 && (
            <p className="text-[12px] text-muted">
              {formatMoney(quote.voucher.remaining, currency)} will stay on your gift voucher.
            </p>
          )}
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
