"use client";

import { usePathname } from "next/navigation";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

// Floating WhatsApp contact. Hidden where the page already offers WhatsApp
// (product pages) or where it would cover the form (checkout).
const PRODUCT_PAGE = new RegExp("^/products/[^/]+$");

export function WhatsAppButton() {
  const pathname = usePathname();
  if (PRODUCT_PAGE.test(pathname) || pathname.startsWith("/checkout")) return null;

  return (
    <a
      href={buildGeneralWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-13 items-center justify-center rounded-full bg-ink text-porcelain shadow-[0_6px_20px_-6px_rgb(20_35_58/0.45)] transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
