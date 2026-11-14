import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { SectionHeading } from "@/components/shared/SectionHeading";

export const metadata: Metadata = {
  title: "Cart | Exo Zilton",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading align="left" eyebrow="Your Selection" title="Cart" />
        <div className="mt-10">
          <CartView />
        </div>
      </div>
    </div>
  );
}
