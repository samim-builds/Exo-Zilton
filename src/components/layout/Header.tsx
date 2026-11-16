"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import type { SiteSettings } from "@/lib/cms/settings";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ contact, links }: { contact: SiteSettings["contact"]; links: SiteSettings["navigation"]["header"] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-glaze bg-porcelain/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-[4.5rem] lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image src="/brand/logo.png" alt="" width={32} height={32} priority className="size-8 rounded-full" />
          <span className="font-display text-xl text-ink [font-variation-settings:'SOFT'_100,'opsz'_36]">{contact.siteName}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative py-2 text-[0.9375rem] text-ink/75 transition-colors hover:text-ink",
                  current && "text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-bronze",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/cart"
            aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="relative flex size-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.05]"
          >
            <ShoppingBag className="size-5" strokeWidth={1.6} />
            {count > 0 && (
              <span className="tabular absolute top-1.5 right-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-ink px-1 text-[0.6875rem] font-medium text-porcelain">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/[0.05] md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-5" strokeWidth={1.6} /> : <Menu className="size-5" strokeWidth={1.6} />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto bg-porcelain px-4 pt-4 pb-10 md:hidden" aria-label="Main">
          <ul className="divide-y divide-glaze border-b border-glaze">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
                  className="flex py-4 font-display text-2xl text-ink"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <a href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex py-2 text-[0.9375rem] text-ink underline decoration-ink/30 underline-offset-4">
            Order on WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}
