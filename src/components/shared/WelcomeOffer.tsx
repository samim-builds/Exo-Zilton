"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import type { SiteSettings } from "@/lib/cms/settings";
import { Button } from "@/components/site/Button";
import { controlClass } from "@/components/site/Field";

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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={close}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-md rounded-[10px] bg-porcelain p-6 shadow-[0_24px_60px_-20px_rgb(20_35_58/0.5)] sm:p-9"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-stone hover:bg-glaze hover:text-ink"
        >
          <X className="size-5" />
        </button>

        {result?.status === "created" ? (
          <div className="text-center">
            <h2 id="welcome-title" className="text-3xl text-ink">
              {offer.successTitle}
            </h2>
            <button
              type="button"
              onClick={() => copy(result.code)}
              className="tabular mx-auto mt-6 block rounded-[6px] border border-dashed border-bronze/60 bg-white px-6 py-3 text-xl font-medium tracking-wide text-ink"
            >
              {result.code}
            </button>
            <p className="mt-2 text-xs text-stone" aria-live="polite">
              {copied ? "Copied" : "Tap to copy"}
            </p>
            <p className="mt-4 text-[0.9375rem] text-stone">{offer.successBody}</p>
            <Button type="button" onClick={close} size="lg" className="mt-6 w-full">
              Start shopping
            </Button>
          </div>
        ) : result ? (
          <div className="text-center">
            <h2 id="welcome-title" className="text-3xl text-ink">
              Thank you
            </h2>
            <p className="mt-4 text-[0.9375rem] text-stone">{RESULT_COPY[result.status]}</p>
            <Button type="button" onClick={close} size="lg" className="mt-6 w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h2 id="welcome-title" className="text-3xl text-ink">
              {offer.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] text-stone">{offer.body}</p>
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
              className={`mt-6 ${controlClass}`}
            />
            <label className="mt-3 flex items-start gap-2.5 text-sm text-stone">
              <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-4 accent-ink" />
              Email me offers and news. I can unsubscribe at any time.
            </label>
            {error && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" loading={pending} size="lg" className="mt-5 w-full">
              {offer.buttonLabel}
            </Button>
            <button type="button" onClick={close} className="mt-2 w-full py-2 text-sm text-stone underline-offset-4 hover:text-ink hover:underline">
              No thanks
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
