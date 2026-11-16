"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ORDER_STATUSES } from "@/lib/order-schema";

type OrderUpdateFormProps = {
  orderId: string;
  status: string;
  paid: boolean;
  courier: string | null;
  trackingNumber: string | null;
};

export function OrderUpdateForm({ orderId, status, paid, courier, trackingNumber }: OrderUpdateFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    status,
    paid,
    courier: courier ?? "",
    trackingNumber: trackingNumber ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    if (response.ok) {
      setMessage("Saved");
      router.refresh();
    } else {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Failed to save");
    }
  }

  const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label htmlFor="status" className="mb-1.5 block text-sm font-medium">Status</label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className={selectClass}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.paid} onCheckedChange={(checked) => setForm({ ...form, paid: checked === true })} />
        Payment received
      </label>
      <div>
        <label htmlFor="courier" className="mb-1.5 block text-sm font-medium">Courier</label>
        <Input id="courier" placeholder="e.g. TCS, Leopards, DHL" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} />
      </div>
      <div>
        <label htmlFor="trackingNumber" className="mb-1.5 block text-sm font-medium">Tracking number</label>
        <Input id="trackingNumber" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </form>
  );
}
