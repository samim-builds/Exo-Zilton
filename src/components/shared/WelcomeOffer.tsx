"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { SiteSettings } from "@/lib/cms/settings";

const STORAGE_KEY = "exo_zilton_welcome_v1";
const HIDDEN_ON = ["/cart", "/checkout", "/orders"];

type Result =
  | { status: "created"; code: string }
  | { status: "resent" | "already-subscribed" | "returning-customer" };

function remembered(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
}

function remember(value: "dismissed" | "subscribed") {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode: the popup may show again next visit.
  }
}

const RESULT_COPY: Record<Exclude<Result["status"], "created">, string> = {
  resent: "You're already on the list. We've emailed your code to you again.",
  "already-subscribed": "You're already on the list. Thanks for being here.",
  "returning-customer": "You're on the list. This offer is for first orders, so keep an eye on your inbox for the next one.",
};

export function WelcomeOffer({ offer }: { offer: SiteSettings["welcomeOffer"] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const hiddenHere = HIDDEN_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!offer.enabled || hiddenHere || remembered()) return;
    const timer = window.setTimeout(() => setOpen(true), offer.delaySeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [offer.enabled, offer.delaySeconds, hiddenHere]);

  useEffect(() => {
    if (!open) return;
    (dialogRef.current?.querySelector<HTMLElement>("input") ?? dialogRef.current?.querySelector<HTMLElement>("button"))?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    if (!remembered()) remember("dismissed");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      remember("subscribed");
      setResult(body as Result);
    } catch {
      setError("Couldn't reach the shop. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard blocked; the code stays visible to copy by hand.
    }
  }

  if (!open || hiddenHere) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-navy/50 p-4 sm:items-center" onClick={close}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-md rounded-lg bg-porcelain p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl text-charcoal/60 hover:bg-cream hover:text-navy"
        >
          ×
        </button>

        {result?.status === "created" ? (
          <div className="text-center">
            <h2 id="welcome-title" className="font-serif text-2xl font-semibold text-navy">
              {offer.successTitle}
            </h2>
            <button
              type="button"
              onClick={() => copy(result.code)}
              className="mx-auto mt-5 block rounded-md border border-dashed border-gold bg-white px-5 py-3 font-mono text-lg tracking-wider text-navy"
            >
              {result.code}
            </button>
            <p className="mt-2 text-xs text-charcoal/60" aria-live="polite">
              {copied ? "Copied" : "Tap to copy"}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">{offer.successBody}</p>
            <button
              type="button"
              onClick={close}
              className="mt-6 w-full rounded-full bg-navy px-6 py-3 text-sm uppercase tracking-widest text-white hover:opacity-90"
            >
              Start shopping
            </button>
          </div>
        ) : result ? (
          <div className="text-center">
            <h2 id="welcome-title" className="font-serif text-2xl font-semibold text-navy">
              Thank you
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">{RESULT_COPY[result.status]}</p>
            <button
              type="button"
              onClick={close}
              className="mt-6 w-full rounded-full bg-navy px-6 py-3 text-sm uppercase tracking-widest text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">New here?</p>
            <h2 id="welcome-title" className="mt-2 font-serif text-2xl font-semibold text-navy">
              {offer.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{offer.body}</p>
            <label htmlFor="welcome-email" className="sr-only">
              Email address
            </label>
            <input
              id="welcome-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-5 w-full rounded-md border border-cream bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-navy"
            />
            <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-charcoal/70">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              Email me offers and news. I can unsubscribe at any time.
            </label>
            {error && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="mt-5 w-full rounded-full bg-navy px-6 py-3 text-sm uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Sending…" : offer.buttonLabel}
            </button>
            <button type="button" onClick={close} className="mt-3 w-full text-xs text-charcoal/60 underline-offset-4 hover:underline">
              No thanks
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
