import type { Metadata } from "next";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Checkout | Exo Zilton",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading as="h1" title="Checkout" />
        <div className="mt-10">
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
