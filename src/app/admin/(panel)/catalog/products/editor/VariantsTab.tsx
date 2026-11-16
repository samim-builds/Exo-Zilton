"use client";

import { useState } from "react";
import { ChevronDown, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/admin/form/Field";
import { MediaThumb } from "@/components/admin/media/MediaLibrary";
import type { AttributeDef } from "@/lib/catalog/attributes";
import type { VariantInput } from "@/lib/catalog/schemas";
import { imagesFor } from "@/lib/catalog/variant-editor";
import { fillMissingSkus, generateVariantCombos, suggestSku, syncVariants, variantTitle } from "@/lib/catalog/variants";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EditorProps } from "./ProductEditor";
import { VariantPanel } from "./VariantPanel";

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

function stockLabel(v: VariantInput): string {
  if (!v.active) return "Hidden";
  if (!v.trackInventory) return "Not tracked";
  return v.stockQty > 0 ? `${v.stockQty} in stock` : "Out of stock";
}

export function VariantsTab({
  form,
  update,
  defs,
  selectedKey,
  onSelect,
}: EditorProps & { defs: AttributeDef[]; selectedKey: string | null; onSelect: (key: string) => void }) {
  // Raw comma-separated text per option so typing isn't fighting the parser.
  const [valueText, setValueText] = useState(() => form.options.map((o) => o.values.join(", ")));
  const [skuBase, setSkuBase] = useState(() => form.variants[0]?.sku.split("-").slice(0, 2).join("-") || "EZ");

  // Variants are out of date when their combinations don't match the option matrix.
  const expected = generateVariantCombos(form.options.filter((o) => o.name.trim()));
  const signature = (combo: Record<string, string>) => JSON.stringify(form.options.map((o) => combo[o.name] ?? null));
  const current = new Set(form.variants.map((v) => signature(v.combo)));
  const outOfSync =
    expected.length !== form.variants.length || expected.some((combo) => !current.has(signature(combo)));
  const [optionsOpen, setOptionsOpen] = useState(form.options.length === 0 || outOfSync);

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

  const selected = form.variants.find((v) => v.key === selectedKey) ?? form.variants[0];
  const summary = form.options.filter((o) => o.name.trim()).map((o) => `${o.name}: ${o.values.length} value${o.values.length === 1 ? "" : "s"}`).join(" · ");
  const variantDefs = defs.filter((d) => d.scope === "VARIANT");
  const thumbFor = (v: VariantInput) => imagesFor(form.images, v.key)[0]?.image ?? imagesFor(form.images, null)[0]?.image;

  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0">
        <button
          type="button"
          onClick={() => setOptionsOpen((o) => !o)}
          aria-expanded={optionsOpen}
          className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
        >
          <span>
            <span className="block font-semibold">Options</span>
            <span className="block text-sm text-muted-foreground">
              {summary || "None. This product has a single variant."}
              {outOfSync && <span className="text-amber-700"> · Variants need updating</span>}
            </span>
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", optionsOpen && "rotate-180")} />
        </button>
        {optionsOpen && (
          <CardContent className="space-y-3 border-t pt-4 pb-6">
            <p className="text-sm text-muted-foreground">
              What customers choose between, e.g. Size or Colour. Each combination becomes a variant.
            </p>
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
        )}
      </Card>

      {form.variants.length > 1 ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <Card className="min-w-0 gap-0 py-2 lg:sticky lg:top-20">
            <CardHeader className="px-4 pt-2 pb-2">
              <CardTitle className="text-sm">Variants ({form.variants.length})</CardTitle>
              <CardDescription className="sr-only">Choose a variant to edit</CardDescription>
            </CardHeader>
            <ul
              className="flex snap-x gap-1 overflow-x-auto px-2 pb-1 [scrollbar-width:none] lg:max-h-[70vh] lg:snap-none lg:flex-col lg:overflow-x-visible lg:overflow-y-auto"
              role="listbox"
              aria-label="Variants"
            >
              {form.variants.map((v) => {
                const thumb = thumbFor(v);
                const isSelected = v.key === selected?.key;
                return (
                  <li key={v.key} className="w-44 shrink-0 snap-start lg:w-auto">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => onSelect(v.key)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                        isSelected ? "bg-accent text-accent-foreground ring-1 ring-border" : "hover:bg-muted/60",
                      )}
                    >
                      <span className="size-10 shrink-0">
                        {thumb ? <MediaThumb item={thumb} className="size-10" /> : <span className="block size-10 rounded-md bg-muted" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", !v.active && "text-muted-foreground line-through")}>
                          {variantTitle(v.combo)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground tabular-nums">{formatPKR(v.pricePKR)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{stockLabel(v)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
          {selected && <VariantPanel form={form} update={update} variant={selected} defs={variantDefs} />}
        </div>
      ) : (
        selected && <VariantPanel form={form} update={update} variant={selected} defs={variantDefs} />
      )}
    </div>
  );
}
