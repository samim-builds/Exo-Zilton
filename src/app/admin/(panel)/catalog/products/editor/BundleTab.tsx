"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field } from "@/components/admin/form/Field";
import type { BundleComponentOption } from "@/lib/catalog/admin-queries";
import { bundleAvailability, bundlePricing } from "@/lib/catalog/bundles";
import { formatMoney } from "@/lib/order-schema";
import type { ProductInput } from "@/lib/catalog/schemas";
import { cn } from "@/lib/utils";
import type { EditorProps } from "./ProductEditor";

type Bundle = NonNullable<ProductInput["bundle"]>;

const emptyBundle: Bundle = { mode: "PERCENT_OFF", discountPercent: 10, items: [] };

function wholeNumber(raw: string): number {
  return raw === "" ? 0 : Math.max(0, Math.round(Number(raw)));
}

function AddItem({ options, taken, onAdd }: { options: BundleComponentOption[]; taken: Set<string>; onAdd: (variantId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add item
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products or SKUs…" />
          <CommandList>
            <CommandEmpty>No matching products.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.variantId}
                  value={`${o.label} ${o.sku}`}
                  disabled={taken.has(o.variantId)}
                  onSelect={() => {
                    onAdd(o.variantId);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("size-4", taken.has(o.variantId) ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {o.sku} · {formatMoney(o.pricePKR, "PKR")}
                      {!o.sellable && " · not on sale"}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function BundleTab({ form, update, components }: EditorProps & { components: BundleComponentOption[] }) {
  const bundle = form.bundle ?? emptyBundle;
  const variant = form.variants[0];
  const byId = new Map(components.map((c) => [c.variantId, c]));

  const setBundle = (changes: Partial<Bundle>) => update((f) => ({ ...f, bundle: { ...(f.bundle ?? emptyBundle), ...changes } }));
  const setVariant = (changes: Partial<typeof variant>) =>
    update((f) => ({ ...f, variants: f.variants.map((v, i) => (i === 0 ? { ...v, ...changes } : v)) }));

  // Live preview with the same rules the storefront uses.
  const parts = bundle.items.flatMap((item) => {
    const c = byId.get(item.variantId);
    return c ? [{ ...c, active: c.sellable, quantity: item.quantity }] : [];
  });
  const missing = bundle.items.length - parts.length;
  const price = bundlePricing({ mode: bundle.mode, discountPercent: bundle.discountPercent, fixedPKR: variant.pricePKR, fixedUSD: variant.priceUSD }, parts);
  const separatePKR = parts.reduce((sum, p) => sum + p.pricePKR * p.quantity, 0);
  const separateUSD = parts.reduce((sum, p) => sum + p.priceUSD * p.quantity, 0);
  const available = missing > 0 ? 0 : bundleAvailability(parts);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>What&apos;s inside</CardTitle>
            <CardDescription>The items one bundle contains. Stock is taken from these items when an order is confirmed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bundle.items.length === 0 && <p className="text-sm text-muted-foreground">No items yet. Add the products this bundle includes.</p>}
            {bundle.items.map((item, i) => {
              const c = byId.get(item.variantId);
              return (
                <div key={item.variantId} className="flex items-center gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", !c && "text-destructive")}>{c ? c.label : "Item no longer available"}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {c
                        ? `${c.sku} · ${formatMoney(c.pricePKR, "PKR")} each${c.trackInventory ? ` · ${c.stockQty} in stock` : ""}${c.sellable ? "" : " · not on sale"}`
                        : "Remove it to save the bundle."}
                    </p>
                  </div>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    aria-label={`Quantity of ${c?.label ?? "item"}`}
                    className="h-8 w-20 tabular-nums"
                    value={item.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setBundle({ items: bundle.items.map((it, j) => (j === i ? { ...it, quantity: Math.max(1, wholeNumber(e.target.value)) } : it)) })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${c?.label ?? "item"}`}
                    onClick={() => setBundle({ items: bundle.items.filter((_, j) => j !== i) })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              );
            })}
            <AddItem
              options={components}
              taken={new Set(bundle.items.map((i) => i.variantId))}
              onAdd={(variantId) => setBundle({ items: [...bundle.items, { variantId, quantity: 1 }] })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div role="radiogroup" aria-label="Pricing" className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["PERCENT_OFF", "Percent off the items", "Follows the items' prices"],
                  ["FIXED", "Fixed price", "You set the bundle price"],
                ] as const
              ).map(([mode, title, hint]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={bundle.mode === mode}
                  onClick={() => setBundle({ mode, discountPercent: mode === "PERCENT_OFF" ? (bundle.discountPercent ?? 10) : bundle.discountPercent })}
                  className={cn(
                    "rounded-md border p-3 text-left text-sm transition-colors",
                    bundle.mode === mode ? "border-primary ring-1 ring-primary" : "hover:bg-muted/50",
                  )}
                >
                  <span className="block font-medium">{title}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </button>
              ))}
            </div>
            {bundle.mode === "PERCENT_OFF" ? (
              <Field label="Discount (%)" className="max-w-40">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  className="tabular-nums"
                  value={bundle.discountPercent ?? ""}
                  onChange={(e) => setBundle({ discountPercent: e.target.value === "" ? null : wholeNumber(e.target.value) })}
                />
              </Field>
            ) : (
              <div className="grid max-w-md gap-4 sm:grid-cols-2">
                <Field label="Price (PKR)">
                  <Input type="number" inputMode="numeric" className="tabular-nums" value={variant.pricePKR} onChange={(e) => setVariant({ pricePKR: wholeNumber(e.target.value) })} />
                </Field>
                <Field label="Price (USD)">
                  <Input type="number" inputMode="numeric" className="tabular-nums" value={variant.priceUSD} onChange={(e) => setVariant({ priceUSD: wholeNumber(e.target.value) })} />
                </Field>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SKU</CardTitle>
          </CardHeader>
          <CardContent>
            <Field label="Bundle SKU" className="max-w-xs">
              <Input value={variant.sku} onChange={(e) => setVariant({ sku: e.target.value.toUpperCase() })} placeholder="e.g. EZ-GIFT-01" />
            </Field>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit lg:sticky lg:top-20">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm tabular-nums">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Bought separately</dt>
              <dd>
                {formatMoney(separatePKR, "PKR")} · {formatMoney(separateUSD, "USD")}
              </dd>
            </div>
            <div className="flex justify-between gap-4 font-medium">
              <dt>Bundle price</dt>
              <dd>
                {formatMoney(price.pricePKR, "PKR")} · {formatMoney(price.priceUSD, "USD")}
              </dd>
            </div>
            {price.compareAtPKR !== null && (
              <div className="flex justify-between gap-4 text-emerald-700">
                <dt>Customer saves</dt>
                <dd>{formatMoney(price.compareAtPKR - price.pricePKR, "PKR")}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t pt-2">
              <dt className="text-muted-foreground">Can be made now</dt>
              <dd className={available === 0 ? "text-amber-700" : undefined}>
                {available === null ? "Not tracked" : available === 0 ? "None, out of stock" : available}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
