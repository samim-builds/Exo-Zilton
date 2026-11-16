import { formatPKR, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

type PriceProps = {
  pricePKR: number;
  priceUSD: number;
  compareAtPKR?: number | null;
  compareAtUSD?: number | null;
  size?: "sm" | "lg";
  className?: string;
};

// PKR is the primary price; USD is shown for international buyers.
export function Price({ pricePKR, priceUSD, compareAtPKR, compareAtUSD, size = "sm", className }: PriceProps) {
  return (
    <p className={cn("tabular flex flex-wrap items-baseline gap-x-2.5 gap-y-1", className)}>
      <span className={cn("text-ink", size === "lg" ? "font-display text-2xl" : "text-[0.9375rem] font-medium")}>{formatPKR(pricePKR)}</span>
      {compareAtPKR != null && compareAtPKR > pricePKR && (
        <s className="text-sm text-stone">
          <span className="sr-only">Was </span>
          {formatPKR(compareAtPKR)}
        </s>
      )}
      <span className="text-sm text-stone">
        {formatUSD(priceUSD)}
        {compareAtUSD != null && compareAtUSD > priceUSD && <s className="ml-1.5">{formatUSD(compareAtUSD)}</s>}
      </span>
    </p>
  );
}
