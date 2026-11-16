"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/admin/form/Field";
import type { VariantInput } from "@/lib/catalog/schemas";
import { fillMissingSkus, generateVariantCombos, suggestSku, syncVariants, variantTitle } from "@/lib/catalog/variants";
import type { EditorProps } from "./ProductEditor";

function NumberInput({
  value,
  onChange,
  nullable = false,
  label,
}: {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  nullable?: boolean;
  label: string;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      aria-label={label}
      className="h-8 w-24 tabular-nums"
      value={value ?? ""}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? (nullable ? null : 0) : Math.round(Number(raw)));
      }}
    />
  );
}

function newVariant(combo: Record<string, string>, template: VariantInput | undefined, skuBase: string): VariantInput {
  return {
    key: crypto.randomUUID(),
    combo,
    sku: suggestSku(skuBase, combo),
    pricePKR: template?.pricePKR ?? 0,
    priceUSD: template?.priceUSD ?? 0,
    compareAtPKR: null,
    compareAtUSD: null,
    costPKR: null,
    trackInventory: template?.trackInventory ?? false,
    stockQty: 0,
    lowStockThreshold: template?.lowStockThreshold ?? 5,
    attributes: {},
    active: true,
  };
}

export function VariantsTab({ form, update }: EditorProps) {
  // Raw comma-separated text per option so typing isn't fighting the parser.
  const [valueText, setValueText] = useState(() => form.options.map((o) => o.values.join(", ")));
  const [skuBase, setSkuBase] = useState(() => form.variants[0]?.sku.split("-").slice(0, 2).join("-") || "EZ");
  const [bulkPKR, setBulkPKR] = useState<number | null>(null);
  const [bulkUSD, setBulkUSD] = useState<number | null>(null);

  const setVariant = (i: number, patch: Partial<VariantInput>) =>
    update((f) => ({ ...f, variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)) }));

  const setOptionName = (i: number, name: string) =>
    update((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, name } : o)) }));

  const setOptionValues = (i: number, text: string) => {
    setValueText((t) => t.map((x, j) => (j === i ? text : x)));
    const values = [...new Set(text.split(",").map((v) => v.trim()).filter(Boolean))];
    update((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, values } : o)) }));
  };

  const removeOption = (i: number) => {
    setValueText((t) => t.filter((_, j) => j !== i));
    update((f) => ({ ...f, options: f.options.filter((_, j) => j !== i) }));
  };

  function regenerate() {
    update((f) => ({
      ...f,
      variants: fillMissingSkus(
        syncVariants(f.options, f.variants, (combo, template) => newVariant(combo, template, skuBase)),
        skuBase,
      ),
    }));
  }

  // Variants are out of date when their combinations don't match the option matrix.
  const expected = generateVariantCombos(form.options.filter((o) => o.name.trim()));
  const signature = (combo: Record<string, string>) => JSON.stringify(form.options.map((o) => combo[o.name] ?? null));
  const current = new Set(form.variants.map((v) => signature(v.combo)));
  const outOfSync =
    expected.length !== form.variants.length || expected.some((combo) => !current.has(signature(combo)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
          <CardDescription>
            What customers choose between, e.g. Size or Colour. Leave empty for a product with a single variant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.options.map((option, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
              <Field label="Option name">
                <Input value={option.name} placeholder="Size" onChange={(e) => setOptionName(i, e.target.value)} />
              </Field>
              <Field label="Values (comma separated)">
                <Input value={valueText[i] ?? ""} placeholder="Size 0, Size 1, Size 2" onChange={(e) => setOptionValues(i, e.target.value)} />
              </Field>
              <Button variant="ghost" size="icon" aria-label="Remove option" onClick={() => removeOption(i)}>
                <Trash2 />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-end gap-3">
            {form.options.length < 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setValueText((t) => [...t, ""]);
                  update((f) => ({ ...f, options: [...f.options, { name: "", values: [] }] }));
                }}
              >
                <Plus />
                Add option
              </Button>
            )}
            <div className="ml-auto flex items-end gap-2">
              <Field label="SKU prefix for new variants">
                <Input value={skuBase} onChange={(e) => setSkuBase(e.target.value)} className="h-8 w-32 font-mono text-xs" />
              </Field>
              <Button size="sm" variant={outOfSync ? "default" : "outline"} onClick={regenerate}>
                <RefreshCw />
                Update variants
              </Button>
            </div>
          </div>
          {outOfSync && (
            <p className="text-sm text-amber-700">
              Options changed. Click “Update variants” to add the new combinations and remove ones that no longer exist.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
          <div>
            <CardTitle>Variants</CardTitle>
            <CardDescription>
              Prices are whole amounts. Untracked variants are always in stock; tracked ones sell out at 0.
            </CardDescription>
          </div>
          {form.variants.length > 1 && (
            <div className="flex items-end gap-2">
              <NumberInput label="Set all PKR prices" value={bulkPKR} nullable onChange={setBulkPKR} />
              <NumberInput label="Set all USD prices" value={bulkUSD} nullable onChange={setBulkUSD} />
              <Button
                size="sm"
                variant="outline"
                disabled={bulkPKR === null && bulkUSD === null}
                onClick={() =>
                  update((f) => ({
                    ...f,
                    variants: f.variants.map((v) => ({
                      ...v,
                      ...(bulkPKR !== null && { pricePKR: bulkPKR }),
                      ...(bulkUSD !== null && { priceUSD: bulkUSD }),
                    })),
                  }))
                }
              >
                Apply to all
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price PKR</TableHead>
                <TableHead>Price USD</TableHead>
                <TableHead>Compare-at PKR</TableHead>
                <TableHead>Track stock</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.variants.map((v, i) => {
                const title = variantTitle(v.combo);
                return (
                  <TableRow key={v.key}>
                    <TableCell className="font-medium whitespace-nowrap">{title}</TableCell>
                    <TableCell>
                      <Input
                        aria-label={`${title} SKU`}
                        value={v.sku}
                        onChange={(e) => setVariant(i, { sku: e.target.value })}
                        className="h-8 w-36 font-mono text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <NumberInput label={`${title} price PKR`} value={v.pricePKR} onChange={(n) => setVariant(i, { pricePKR: n ?? 0 })} />
                    </TableCell>
                    <TableCell>
                      <NumberInput label={`${title} price USD`} value={v.priceUSD} onChange={(n) => setVariant(i, { priceUSD: n ?? 0 })} />
                    </TableCell>
                    <TableCell>
                      <NumberInput
                        label={`${title} compare-at PKR`}
                        value={v.compareAtPKR}
                        nullable
                        onChange={(n) => setVariant(i, { compareAtPKR: n })}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        aria-label={`Track stock for ${title}`}
                        checked={v.trackInventory}
                        onCheckedChange={(c) => setVariant(i, { trackInventory: c })}
                      />
                    </TableCell>
                    <TableCell>
                      {v.trackInventory && v.id ? (
                        // Saved variants change stock through the inventory ledger, never by overwriting it here.
                        <Link href={`/admin/catalog/inventory?q=${encodeURIComponent(v.sku)}`} className="text-sm tabular-nums underline-offset-4 hover:underline">
                          {v.stockQty} <span className="text-xs text-muted-foreground">· adjust</span>
                        </Link>
                      ) : v.trackInventory ? (
                        <NumberInput label={`${title} stock`} value={v.stockQty} onChange={(n) => setVariant(i, { stockQty: n ?? 0 })} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch aria-label={`${title} active`} checked={v.active} onCheckedChange={(c) => setVariant(i, { active: c })} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
