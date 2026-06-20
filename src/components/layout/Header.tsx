"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { navLinks, siteConfig } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-cream bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/brand/logo.png"
            alt={`${siteConfig.name} logo`}
            width={48}
            height={48}
            priority
            className="rounded-full"
          />
          <div className="hidden sm:block">
            <p className="font-serif text-lg font-semibold tracking-wide text-navy">
              {siteConfig.name}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              {siteConfig.tagline}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm uppercase tracking-widest text-charcoal transition-colors hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={buildGeneralWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:inline-flex"
          >
            WhatsApp
          </a>
          <button
            type="button"
            className="inline-flex flex-col gap-1.5 p-2 md:hidden"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
          >
            <span className={`block h-0.5 w-6 bg-navy transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-navy transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-navy transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-cream bg-white px-4 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm uppercase tracking-widest text-charcoal"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex justify-center rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white"
            >
              Order via WhatsApp
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
