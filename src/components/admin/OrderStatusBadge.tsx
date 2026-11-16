import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-800",
  SHIPPED: "border-indigo-200 bg-indigo-50 text-indigo-800",
  DELIVERED: "border-green-200 bg-green-50 text-green-800",
  CANCELLED: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status] ?? styles.CANCELLED)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
