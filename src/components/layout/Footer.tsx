import Image from "next/image";
import Link from "next/link";
import { instagramUrl, type SiteSettings } from "@/lib/cms/settings";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { InstagramIcon } from "@/components/home/InstagramFeed";

export function Footer({ contact, links }: { contact: SiteSettings["contact"]; links: SiteSettings["navigation"]["footer"] }) {
  return (
    <footer className="mt-auto border-t border-cream bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt={`${contact.siteName} logo`}
              width={56}
              height={56}
              className="rounded-full"
            />
            <div>
              <p className="font-serif text-xl font-semibold">{contact.siteName}</p>
              <p className="text-sm text-gold">{contact.tagline}</p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80">
            {contact.description}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-gold">Navigate</h3>
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-gold">Stay Connected</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a
                href={instagramUrl(contact.instagramHandle)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-white"
              >
                <InstagramIcon className="h-5 w-5" />
                @{contact.instagramHandle.replace(/^@/, "")}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm uppercase tracking-widest text-gold">Contact</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <a href={`mailto:${contact.contactEmail}`} className="hover:text-white">
                {contact.contactEmail}
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
            <li>{contact.location}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {contact.siteName}. All rights reserved.
      </div>
    </footer>
  );
}
