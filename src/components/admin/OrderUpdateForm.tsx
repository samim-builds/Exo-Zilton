"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const inputClass = "w-full rounded-md border border-charcoal/20 px-3 py-2 text-sm";

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-navy">Status</label>
        <select
          id="status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className={inputClass}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          checked={form.paid}
          onChange={(e) => setForm({ ...form, paid: e.target.checked })}
        />
        Payment received
      </label>
      <div>
        <label htmlFor="courier" className="mb-1 block text-sm font-medium text-navy">Courier</label>
        <input
          id="courier"
          placeholder="e.g. TCS, Leopards, DHL"
          value={form.courier}
          onChange={(e) => setForm({ ...form, courier: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="trackingNumber" className="mb-1 block text-sm font-medium text-navy">Tracking number</label>
        <input
          id="trackingNumber"
          value={form.trackingNumber}
          onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-navy px-5 py-2.5 text-sm uppercase tracking-widest text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && <span className="text-sm text-charcoal/70">{message}</span>}
      </div>
    </form>
  );
}
