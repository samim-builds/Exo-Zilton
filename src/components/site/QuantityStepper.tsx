"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function QuantityStepper({ value, onChange, min = 1, max = 99, label = "Quantity", size = "md", className }: QuantityStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, Number.isFinite(n) ? Math.round(n) : min));
  const box = size === "sm" ? "size-9" : "size-11";
  const step = cn(box, "flex items-center justify-center text-ink hover:bg-ink/[0.04] disabled:opacity-30");
  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-[6px] border border-ink/20 bg-surface", className)}>
      <button type="button" className={step} onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className={cn(
          "tabular w-10 border-x border-ink/10 bg-transparent text-center text-[0.9375rem] text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none",
          size === "sm" ? "h-9" : "h-11",
        )}
      />
      <button type="button" className={step} onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Increase quantity">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
