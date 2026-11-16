import type { Metadata } from "next";
import { InquiryForm } from "@/components/shared/InquiryForm";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { buttonVariants } from "@/components/site/Button";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { siteConfig } from "@/lib/site";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Contact Exo Zilton",
  description:
    "Get in touch with Exo Zilton for orders, wholesale inquiries, and international shipping. Contact us via WhatsApp or email.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h1"
          title="Contact us"
          description="Ordering for a kitchen in Pakistan or asking about delivery abroad, we reply to every message."
        />

        <div className="mt-14 grid gap-14 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-4">
            <div>
              <h2 className="font-sans text-sm font-medium text-stone">WhatsApp</h2>
              <p className="mt-2 text-ink">The quickest way to order. Send the size you want and your delivery country.</p>
              <a href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "secondary", className: "mt-4" })}>
                <WhatsAppIcon />
                Chat on WhatsApp
              </a>
            </div>
            <div>
              <h2 className="font-sans text-sm font-medium text-stone">Email</h2>
              <a href={`mailto:${siteConfig.contactEmail}`} className="mt-2 inline-block text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-bronze">
                {siteConfig.contactEmail}
              </a>
            </div>
            <div>
              <h2 className="font-sans text-sm font-medium text-stone">Based in</h2>
              <p className="mt-2 text-ink">{siteConfig.location}</p>
            </div>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="mb-6 text-2xl text-ink">Send a message</h2>
            <InquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
