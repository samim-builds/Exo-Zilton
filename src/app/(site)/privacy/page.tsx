import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.name} website and inquiry forms.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold text-navy">Privacy Policy</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-charcoal/85">
          <p>
            {siteConfig.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your
            privacy. This policy explains how we collect and use information when you visit our
            website or submit an inquiry form.
          </p>
          <h2 className="font-serif text-xl text-navy">Information We Collect</h2>
          <p>
            When you contact us, we may collect your name, email address, phone number, country,
            and any message you provide. We use this information solely to respond to your
            inquiries and process orders.
          </p>
          <h2 className="font-serif text-xl text-navy">How We Use Your Information</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>To respond to product inquiries and orders</li>
            <li>To provide delivery and shipping information</li>
            <li>To improve our website and customer service</li>
          </ul>
          <h2 className="font-serif text-xl text-navy">Contact</h2>
          <p>
            For privacy-related questions, contact us at{" "}
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
