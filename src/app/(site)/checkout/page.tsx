import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Checkout | Exo Zilton",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading align="left" eyebrow="Secure Checkout" title="Delivery details" />
        <div className="mt-10">
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
