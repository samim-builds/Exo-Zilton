import Image from "next/image";
import Link from "next/link";
import { navLinks, siteConfig, getInstagramUrl } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { InstagramIcon } from "@/components/home/InstagramFeed";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cream bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={`${siteConfig.name} logo`}
              width={56}
              height={56}
              className="rounded-full"
            />
            <div>
              <p className="font-serif text-xl font-semibold">{siteConfig.name}</p>
              <p className="text-sm text-gold">{siteConfig.tagline}</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
            {siteConfig.description}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-gold">Navigate</h3>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/privacy" className="text-sm text-white/80 hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-sm text-white/80 hover:text-white">
                Terms
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-gold">Stay Connected</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a
                href={getInstagramUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <InstagramIcon className="h-5 w-5" />
                @{siteConfig.instagramHandle.replace(/^@/, "")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-gold">Contact</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-white">
                {siteConfig.contactEmail}
              </a>
            </li>
            <li>
              <a
                href={buildGeneralWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                WhatsApp Orders
              </a>
            </li>
            <li>{siteConfig.location}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
