// Badge labels and styles for discount and voucher states. Plain module so both
// server pages and client tables can import it.

export type DiscountStatus = "active" | "scheduled" | "expired" | "used-up" | "inactive";

export const DISCOUNT_STATUS_STYLES: Record<DiscountStatus, string> = {
  active: "border-green-200 bg-green-50 text-green-800",
  scheduled: "border-sky-200 bg-sky-50 text-sky-800",
  expired: "border-zinc-200 bg-zinc-50 text-zinc-600",
  "used-up": "border-zinc-200 bg-zinc-50 text-zinc-600",
  inactive: "border-amber-200 bg-amber-50 text-amber-800",
};

export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  "used-up": "Used up",
  inactive: "Inactive",
};

export function voucherState(v: { active: boolean; balance: number; expiresAt: Date | null }, now = new Date()) {
  if (!v.active) return { label: "Inactive", className: "border-amber-200 bg-amber-50 text-amber-800" };
  if (v.expiresAt && v.expiresAt < now) return { label: "Expired", className: "border-zinc-200 bg-zinc-50 text-zinc-600" };
  if (v.balance === 0) return { label: "Used", className: "border-zinc-200 bg-zinc-50 text-zinc-600" };
  return { label: "Usable", className: "border-green-200 bg-green-50 text-green-800" };
}

/** Date → value for <input type="datetime-local"> in the admin's own timezone. */
export function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
