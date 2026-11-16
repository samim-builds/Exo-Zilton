"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/admin/form/Field";
import { generateCode } from "@/lib/commerce/discounts";
import type { DiscountInput } from "@/lib/commerce/schemas";
import { saveDiscount } from "./actions";

export type DiscountFormValues = Omit<DiscountInput, "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };
type Option = { id: string; name: string };

function NumberField({
  label,
  value,
  onChange,
  error,
  placeholder = "None",
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  error?: string[];
  placeholder?: string;
}) {
  return (
    <Field label={label} error={error}>
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={placeholder}
        value={value ?? ""}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value))))}
      />
    </Field>
  );
}

function ScopePicker({ options, selected, onChange }: { options: Option[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [filter, setFilter] = useState("");
  const visible = options.filter((o) => o.name.toLowerCase().includes(filter.toLowerCase()));
  return (
    <div className="space-y-2">
      <Input placeholder="Filter…" value={filter} onChange={(e) => setFilter(e.target.value)} className="h-8" />
      <ScrollArea className="h-48 rounded-md border">
        <ul className="p-2">
          {visible.map((o) => (
            <li key={o.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                <Checkbox
                  checked={selected.includes(o.id)}
                  onCheckedChange={(c) => onChange(c ? [...selected, o.id] : selected.filter((id) => id !== o.id))}
                />
                {o.name}
              </label>
            </li>
          ))}
          {visible.length === 0 && <li className="px-2 py-1.5 text-sm text-muted-foreground">Nothing matches.</li>}
        </ul>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">{selected.length} selected</p>
    </div>
  );
}

export function DiscountForm({
  initial,
  categories,
  products,
}: {
  initial: DiscountFormValues;
  categories: Option[];
  products: Option[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, start] = useTransition();
  const set = <K extends keyof DiscountFormValues>(key: K, value: DiscountFormValues[K]) => setForm((f) => ({ ...f, [key]: value }));

  function save() {
    start(async () => {
      // datetime-local is in the admin's timezone; send ISO so the server doesn't read it as UTC.
      const iso = (v: string) => (v ? new Date(v).toISOString() : null);
      const res = await saveDiscount({ ...form, startsAt: iso(form.startsAt), endsAt: iso(form.endsAt) });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      setErrors({});
      toast.success("Discount saved");
      if (!form.id) router.push(`/admin/marketing/discounts/${res.data.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Code</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Code customers type" error={errors.code}>
              <div className="flex gap-2">
                <Input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className="font-mono uppercase" />
                <Button type="button" variant="outline" size="icon" aria-label="Generate a code" onClick={() => set("code", generateCode("EZ", [6]))}>
                  <Shuffle />
                </Button>
              </div>
            </Field>
            <Field label="Internal name" error={errors.title}>
              <Input value={form.title} placeholder="Eid sale 2026" onChange={(e) => set("title", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Type">
              <Select value={form.type} onValueChange={(v) => set("type", v as DiscountFormValues["type"])}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percentage off</SelectItem>
                  <SelectItem value="FIXED">Fixed amount off</SelectItem>
                  <SelectItem value="FREE_SHIPPING">Free shipping</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.type === "PERCENT" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField label="Percent off" value={form.percentOff} onChange={(v) => set("percentOff", v)} error={errors.percentOff} placeholder="10" />
                <NumberField label="Max discount PKR" value={form.maxDiscountPKR} onChange={(v) => set("maxDiscountPKR", v)} />
                <NumberField label="Max discount USD" value={form.maxDiscountUSD} onChange={(v) => set("maxDiscountUSD", v)} />
              </div>
            )}
            {form.type === "FIXED" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField label="Amount off PKR" value={form.valuePKR} onChange={(v) => set("valuePKR", v)} error={errors.valuePKR} placeholder="Not offered" />
                <NumberField label="Amount off USD" value={form.valueUSD} onChange={(v) => set("valueUSD", v)} placeholder="Not offered" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Minimum order PKR" value={form.minSubtotalPKR} onChange={(v) => set("minSubtotalPKR", v)} />
              <NumberField label="Minimum order USD" value={form.minSubtotalUSD} onChange={(v) => set("minSubtotalUSD", v)} />
            </div>
          </CardContent>
        </Card>

        {form.type !== "FREE_SHIPPING" && (
          <Card>
            <CardHeader>
              <CardTitle>Applies to</CardTitle>
              <CardDescription>Category codes include products in subcategories.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={form.appliesTo} onValueChange={(v) => set("appliesTo", v as DiscountFormValues["appliesTo"])}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Entire order</SelectItem>
                  <SelectItem value="CATEGORIES">Specific categories</SelectItem>
                  <SelectItem value="PRODUCTS">Specific products</SelectItem>
                </SelectContent>
              </Select>
              {form.appliesTo === "CATEGORIES" && (
                <Field label="Categories" error={errors.categoryIds}>
                  <ScopePicker options={categories} selected={form.categoryIds} onChange={(ids) => set("categoryIds", ids)} />
                </Field>
              )}
              {form.appliesTo === "PRODUCTS" && (
                <Field label="Products" error={errors.productIds}>
                  <ScopePicker options={products} selected={form.productIds} onChange={(ids) => set("productIds", ids)} />
                </Field>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between gap-4 text-sm">
              Active
              <Switch checked={form.active} onCheckedChange={(c) => set("active", c)} />
            </label>
            <Field label="Starts" error={errors.startsAt}>
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label="Ends" error={errors.endsAt}>
              <Input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberField label="Total uses" value={form.usageLimit} onChange={(v) => set("usageLimit", v || null)} placeholder="Unlimited" />
            <NumberField label="Uses per customer" value={form.perCustomerLimit} onChange={(v) => set("perCustomerLimit", v || null)} placeholder="Unlimited" />
            <label className="flex items-center justify-between gap-4 text-sm">
              First order only
              <Switch checked={form.firstOrderOnly} onCheckedChange={(c) => set("firstOrderOnly", c)} />
            </label>
            <label className="flex items-center justify-between gap-4 text-sm">
              Can combine with gift vouchers
              <Switch checked={form.combinable} onCheckedChange={(c) => set("combinable", c)} />
            </label>
            <p className="text-xs text-muted-foreground">Customers are matched by email and phone number.</p>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save discount
        </Button>
      </div>
    </div>
  );
}
