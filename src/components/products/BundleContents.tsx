import Link from "next/link";
import type { BundleContent } from "@/lib/product-types";

// "What's inside" for a bundle: each component, how many, and a link to it.
export function BundleContents({ items }: { items: BundleContent[] }) {
  return (
    <section aria-labelledby="bundle-contents" className="rounded-[6px] bg-glaze/50 p-5">
      <h2 id="bundle-contents" className="font-sans text-sm font-medium text-ink">
        What&apos;s inside
      </h2>
      <ul className="mt-3 space-y-2 text-[0.9375rem]">
        {items.map((item) => (
          <li key={item.variantId} className="flex gap-3">
            <span className="tabular w-7 shrink-0 text-stone">{item.quantity}×</span>
            <Link href={item.href} className="text-ink underline decoration-ink/20 underline-offset-4 hover:decoration-bronze">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
