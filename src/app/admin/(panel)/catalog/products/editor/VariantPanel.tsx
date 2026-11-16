"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/admin/form/Field";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { MediaThumb } from "@/components/admin/media/MediaLibrary";
import type { AttributeDef } from "@/lib/catalog/attributes";
import type { VariantInput } from "@/lib/catalog/schemas";
import { copyPricesToAll, imagesFor, moveImageWithinGroup } from "@/lib/catalog/variant-editor";
import { variantTitle } from "@/lib/catalog/variants";
import { AttributeInput, attributeLabel } from "./AttributeInput";
import type { EditorProps } from "./ProductEditor";

function NumberField({
  label,
  value,
  onChange,
  nullable = false,
  placeholder,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  nullable?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="numeric"
        className="tabular-nums"
        value={value ?? ""}
        placeholder={placeholder}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? (nullable ? null : 0) : Math.round(Number(raw)));
        }}
      />
    </Field>
  );
}

// Everything about one variant: price, stock, details and photos.
export function VariantPanel({
  form,
  update,
  variant,
  defs,
}: EditorProps & { variant: VariantInput; defs: AttributeDef[] }) {
  const title = variantTitle(variant.combo) || "Default";
  const multiple = form.variants.length > 1;
  const set = (patch: Partial<VariantInput>) =>
    update((f) => ({ ...f, variants: f.variants.map((v) => (v.key === variant.key ? { ...v, ...patch } : v)) }));
  const setImages = (images: typeof form.images) => update((f) => ({ ...f, images }));
  const photos = imagesFor(form.images, variant.key);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="font-mono text-xs text-muted-foreground">{variant.sku || "No SKU yet"}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={variant.active} onCheckedChange={(active) => set({ active })} />
          {variant.active ? "Sold in the shop" : "Hidden from the shop"}
        </label>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Price</CardTitle>
            <CardDescription>Whole amounts. A compare-at price shows the old price crossed out.</CardDescription>
          </div>
          {multiple && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                update((f) => ({ ...f, variants: copyPricesToAll(f.variants, variant.key) }));
                toast.success(`Copied ${title}'s prices to all variants`);
              }}
            >
              <Copy />
              Use these prices for all
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Price (PKR)" value={variant.pricePKR} onChange={(n) => set({ pricePKR: n ?? 0 })} />
          <NumberField label="Price (USD)" value={variant.priceUSD} onChange={(n) => set({ priceUSD: n ?? 0 })} />
          <NumberField label="Cost (PKR)" value={variant.costPKR} nullable placeholder="Optional" onChange={(n) => set({ costPKR: n })} />
          <NumberField label="Compare-at (PKR)" value={variant.compareAtPKR} nullable placeholder="Optional" onChange={(n) => set({ compareAtPKR: n })} />
          <NumberField label="Compare-at (USD)" value={variant.compareAtUSD} nullable placeholder="Optional" onChange={(n) => set({ compareAtUSD: n })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock and shipping</CardTitle>
          <CardDescription>Untracked variants are always in stock; tracked ones sell out at 0.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="SKU">
            <Input value={variant.sku} onChange={(e) => set({ sku: e.target.value })} className="font-mono text-sm" />
          </Field>
          <NumberField label="Weight (grams)" value={variant.weightGrams} nullable placeholder="Optional" onChange={(n) => set({ weightGrams: n })} />
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={variant.trackInventory} onCheckedChange={(trackInventory) => set({ trackInventory })} />
              Track stock
            </label>
          </div>
          {variant.trackInventory && (
            <>
              {variant.id ? (
                // Saved variants change stock through the inventory ledger, never by overwriting it here.
                <Field label="In stock">
                  <p className="flex h-9 items-center gap-2 text-sm tabular-nums">
                    {variant.stockQty}
                    <Link
                      href={`/admin/catalog/inventory?q=${encodeURIComponent(variant.sku)}`}
                      className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      Adjust in Inventory
                    </Link>
                  </p>
                </Field>
              ) : (
                <NumberField label="Opening stock" value={variant.stockQty} onChange={(n) => set({ stockQty: n ?? 0 })} />
              )}
              <NumberField label="Low-stock alert at" value={variant.lowStockThreshold} onChange={(n) => set({ lowStockThreshold: Math.max(0, n ?? 0) })} />
            </>
          )}
        </CardContent>
      </Card>

      {defs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Shown in this variant&apos;s specifications on the product page.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {defs.map((def) => (
              <Field key={def.key} label={attributeLabel(def)}>
                <AttributeInput
                  def={def}
                  value={variant.attributes[def.key]}
                  onChange={(value) => set({ attributes: { ...variant.attributes, [def.key]: value } })}
                />
              </Field>
            ))}
          </CardContent>
        </Card>
      )}

      {/* A product with one variant keeps all its photos on the Media tab. */}
      {multiple && (
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              Shown when this variant is selected, before the shared photos on the Media tab.
            </CardDescription>
          </div>
          <MediaPicker
            multiple
            defaultFolder="products"
            onPick={(items) =>
              setImages([...form.images, ...items.map((item) => ({ url: item.url, alt: item.alt || `${form.name} ${title}`.trim(), variantKey: variant.key }))])
            }
            trigger={
              <Button size="sm" variant="outline">
                <ImagePlus />
                Add photos
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <p className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
              No photos of its own yet; it shows the shared photos.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {photos.map(({ image, index }, i) => (
                <li key={`${image.url}-${index}`} className="space-y-2 rounded-lg border p-2">
                  <MediaThumb item={image} />
                  <Input
                    aria-label="Alt text"
                    value={image.alt}
                    placeholder="Alt text"
                    className="h-8 text-xs"
                    onChange={(e) => setImages(form.images.map((img, j) => (j === index ? { ...img, alt: e.target.value } : img)))}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex">
                      <Button variant="ghost" size="icon-sm" aria-label="Move earlier" disabled={i === 0} onClick={() => setImages(moveImageWithinGroup(form.images, index, -1))}>
                        <ArrowLeft />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move later"
                        disabled={i === photos.length - 1}
                        onClick={() => setImages(moveImageWithinGroup(form.images, index, 1))}
                      >
                        <ArrowRight />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      title="Move to the shared photos on the Media tab"
                      onClick={() => setImages(form.images.map((img, j) => (j === index ? { ...img, variantKey: null } : img)))}
                    >
                      Share
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Remove photo" onClick={() => setImages(form.images.filter((_, j) => j !== index))}>
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
