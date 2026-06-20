import type { Metadata } from "next";
import { InquiryForm } from "@/components/shared/InquiryForm";
import { SectionHeading } from "@/components/shared/SectionHeading";
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
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="left"
          eyebrow="Get in Touch"
          title="Contact Exo Zilton"
          description="Whether you're ordering for your kitchen in Pakistan or inquiring about international delivery, we're here to help."
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="space-y-6 rounded-lg border border-cream bg-cream/30 p-8">
              <div>
                <h2 className="font-serif text-xl font-semibold text-navy">WhatsApp Orders</h2>
                <p className="mt-2 text-sm text-charcoal/80">
                  The fastest way to place an order. Message us with your preferred size and
                  delivery country.
                </p>
                <a
                  href={buildGeneralWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div>
                <h2 className="font-serif text-xl font-semibold text-navy">Email</h2>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="mt-2 block text-sm text-navy hover:underline"
                >
                  {siteConfig.contactEmail}
                </a>
              </div>

              <div>
                <h2 className="font-serif text-xl font-semibold text-navy">Location</h2>
                <p className="mt-2 text-sm text-charcoal/80">{siteConfig.location}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-cream p-8">
            <h2 className="mb-6 font-serif text-xl font-semibold text-navy">Send an Inquiry</h2>
            <InquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
