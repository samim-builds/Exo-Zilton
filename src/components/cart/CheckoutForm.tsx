"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { useCart } from "./CartProvider";
import { Button, buttonVariants } from "@/components/site/Button";
import { controlClass } from "@/components/site/Field";
import { countries } from "@/lib/inquiry-schema";
import { checkoutSchema, formatMoney, isDomestic, type CheckoutFormData } from "@/lib/order-schema";

const inputClass = controlClass;
const labelClass = "mb-1.5 block text-sm font-medium text-ink";
const legendClass = "mb-5 font-display text-2xl text-ink";

type Quote = {
  totals: { subtotal: number; discountAmount: number; shipping: number; voucherAmount: number; total: number };
  discount: { code: string; title: string; amount: number; freeShipping: boolean } | null;
  voucher: { code: string; amount: number; remaining: number } | null;
  errors: { discount?: string; voucher?: string };
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1.5 text-xs text-red-700" role="alert">
      {message}
    </p>
  ) : null;
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
      <div className="max-w-md py-6">
        <p className="text-lg text-ink">Your cart is empty.</p>
        <Link href="/products" className={buttonVariants({ size: "lg", className: "mt-6" })}>
          Shop all sizes
        </Link>
      </div>
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="space-y-12 lg:col-span-7">
        <fieldset className="space-y-5">
          <legend className={legendClass}>Contact</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>Full name</label>
              <input id="name" autoComplete="name" {...register("name")} aria-invalid={errors.name ? true : undefined} className={inputClass} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone or WhatsApp number</label>
              <input id="phone" type="tel" autoComplete="tel" {...register("phone")} aria-invalid={errors.phone ? true : undefined} className={inputClass} />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={errors.email ? true : undefined} className={inputClass} />
            <FieldError message={errors.email?.message} />
          </div>
        </fieldset>
        <fieldset className="space-y-5">
          <legend className={legendClass}>Delivery</legend>
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
            <input id="addressLine" autoComplete="street-address" {...register("addressLine")} aria-invalid={errors.addressLine ? true : undefined} className={inputClass} />
            <FieldError message={errors.addressLine?.message} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelClass}>City</label>
              <input id="city" autoComplete="address-level2" {...register("city")} aria-invalid={errors.city ? true : undefined} className={inputClass} />
              <FieldError message={errors.city?.message} />
            </div>
            <div>
              <label htmlFor="postalCode" className={labelClass}>
                Postal code <span className="font-normal text-stone">(optional)</span>
              </label>
              <input id="postalCode" autoComplete="postal-code" {...register("postalCode")} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className={labelClass}>
              Order notes <span className="font-normal text-stone">(optional)</span>
            </label>
            <textarea id="notes" rows={3} {...register("notes")} className={inputClass} />
          </div>
        </fieldset>
      </div>

      <aside className="h-fit rounded-[6px] bg-glaze/50 p-6 sm:p-8 lg:sticky lg:top-24 lg:col-span-5" aria-labelledby="checkout-summary">
        <h2 id="checkout-summary" className="text-2xl text-ink">
          Your order
        </h2>
        <ul className="mt-5 space-y-3">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-4 text-[0.9375rem] text-ink">
              <span>
                {i.name}
                {i.variantTitle && <span className="text-stone">, {i.variantTitle}</span>}
                {i.quantity > 1 && <span className="tabular text-stone"> × {i.quantity}</span>}
              </span>
              <span className="tabular shrink-0">
                {formatMoney((domestic ? i.pricePKR : i.priceUSD) * i.quantity, currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-ink/10 pt-5">
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
              className={`${inputClass} py-2 uppercase`}
            />
            <Button type="button" variant="secondary" onClick={applyCode} loading={applying} disabled={!codeInput.trim()}>
              Apply
            </Button>
          </div>
          <FieldError message={codeError} />
        </div>
        <div className="tabular mt-5 space-y-2.5 border-t border-ink/10 pt-5 text-[0.9375rem] text-ink">
          {quote?.discount && (
            <div className="flex justify-between gap-4 text-emerald-800">
              <span>
                {quote.discount.code}
                <button
                  type="button"
                  onClick={() => removeCode("discount")}
                  className="ml-2 text-xs text-stone underline underline-offset-4 hover:text-ink"
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
            <span className="text-stone">Delivery</span>
            <span>{domestic ? "Free" : "Quoted after order"}</span>
          </div>
          {quote?.voucher && (
            <div className="flex justify-between gap-4 text-emerald-800">
              <span>
                Gift voucher {quote.voucher.code}
                <button
                  type="button"
                  onClick={() => removeCode("voucher")}
                  className="ml-2 text-xs text-stone underline underline-offset-4 hover:text-ink"
                >
                  Remove
                </button>
              </span>
              <span>-{formatMoney(quote.totals.voucherAmount, currency)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-ink/10 pt-3 text-lg font-medium text-ink">
            <span>Total</span>
            <span>{formatMoney(total, currency)}</span>
          </div>
          {quote?.voucher && quote.voucher.remaining > 0 && (
            <p className="text-xs text-stone">
              {formatMoney(quote.voucher.remaining, currency)} will stay on your gift voucher.
            </p>
          )}
        </div>
        <p className="mt-5 text-sm text-stone">
          {domestic
            ? "Pay cash on delivery. We'll confirm your order by phone or WhatsApp before dispatch."
            : "No payment now. We'll email a shipping quote and secure payment link within one business day."}
        </p>
        {error && (
          <p className="mt-4 rounded-[6px] bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="mt-6 w-full" loading={submitting} disabled={!ready}>
          {domestic ? "Place order, pay on delivery" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}
