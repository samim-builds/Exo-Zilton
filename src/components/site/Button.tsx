import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Storefront button. One primary per view; secondary for the alternative;
// quiet for low-emphasis actions that read as text.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px] font-sans font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-ink text-porcelain hover:bg-ink/90",
        secondary: "border border-ink/25 bg-transparent text-ink hover:border-ink hover:bg-ink/[0.03]",
        inverse: "bg-porcelain text-ink hover:bg-porcelain/90",
        quiet: "text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-bronze",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[0.9375rem]",
        lg: "h-12 px-7 text-base",
      },
    },
    compoundVariants: [{ variant: "quiet", className: "h-auto px-0" }],
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export function Button({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }: ButtonProps) {
  if (asChild) {
    return (
      <Slot.Root className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
