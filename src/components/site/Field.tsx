import * as React from "react";
import { cn } from "@/lib/utils";

// Label + control + hint/error, wired with aria-describedby.

export const controlClass =
  "block w-full rounded-[6px] border border-ink/20 bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-stone/70 transition-colors hover:border-ink/40 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-bronze aria-invalid:border-red-700 disabled:opacity-60";

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (describedBy: string | undefined, invalid: boolean) => React.ReactNode;
};

export function Field({ label, htmlFor, hint, error, optional, className, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-stone">(optional)</span>}
      </label>
      {children(describedBy, Boolean(error))}
      {hint && !error && (
        <p id={hintId} className="text-xs text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
