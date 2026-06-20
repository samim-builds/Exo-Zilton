import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.name} website and product inquiries.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold text-navy">Terms of Service</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-charcoal/85">
          <p>
            By using the {siteConfig.name} website, you agree to these terms. Please read them
            carefully before placing an inquiry or order.
          </p>
          <h2 className="font-serif text-xl text-navy">Orders & Inquiries</h2>
          <p>
            Product inquiries submitted via WhatsApp or our contact form constitute an expression
            of interest, not a binding contract. Final pricing, availability, and delivery terms
            will be confirmed directly with you before payment.
          </p>
          <h2 className="font-serif text-xl text-navy">Product Information</h2>
          <p>
            We strive to display accurate product descriptions and images. Minor variations in
            colour or finish may occur due to the natural characteristics of porcelain and wood
            materials.
          </p>
          <h2 className="font-serif text-xl text-navy">Contact</h2>
          <p>
            Questions about these terms? Email{" "}
            <a href={`mailto:${siteConfig.contactEmail}`} className="text-navy underline">
              {siteConfig.contactEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
