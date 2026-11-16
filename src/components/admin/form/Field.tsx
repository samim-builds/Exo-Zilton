import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={error ? "text-destructive" : undefined}>{label}</Label>
      {children}
      {error?.[0] && <p className="text-xs text-destructive">{error[0]}</p>}
    </div>
  );
}
