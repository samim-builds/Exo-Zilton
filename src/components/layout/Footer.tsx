import Link from "next/link";
import { instagramUrl, type SiteSettings } from "@/lib/cms/settings";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { InstagramIcon } from "@/components/home/InstagramFeed";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

const linkClass = "text-on-night/80 transition-colors hover:text-on-night";

export function Footer({ contact, links }: { contact: SiteSettings["contact"]; links: SiteSettings["navigation"]["footer"] }) {
  const handle = contact.instagramHandle.replace(/^@/, "");
  return (
    <footer className="mt-auto bg-night text-on-night">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-16 pb-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-5">
          <p className="font-display text-3xl [font-variation-settings:'SOFT'_100]">{contact.siteName}</p>
          <p className="mt-4 max-w-sm text-[0.9375rem] text-on-night/70">{contact.description}</p>
        </div>

        <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-7">
          <h2 className="mb-4 font-sans text-sm font-medium text-on-night/60">Explore</h2>
          <ul className="space-y-3 text-[0.9375rem]">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <h2 className="mb-4 font-sans text-sm font-medium text-on-night/60">Get in touch</h2>
          <ul className="space-y-3 text-[0.9375rem]">
            <li>
              <a href={`mailto:${contact.contactEmail}`} className={linkClass}>
                {contact.contactEmail}
              </a>
            </li>
            <li>
              <a href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${linkClass}`}>
                <WhatsAppIcon className="size-4" />
                Order on WhatsApp
              </a>
            </li>
            <li>
              <a href={instagramUrl(contact.instagramHandle)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 ${linkClass}`}>
                <InstagramIcon className="size-4" />@{handle}
              </a>
            </li>
            <li className="text-on-night/60">{contact.location}</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-6xl border-t border-on-night/10 px-4 py-6 text-sm text-on-night/50 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} {contact.siteName}
      </div>
    </footer>
  );
}
