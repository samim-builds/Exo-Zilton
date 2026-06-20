"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductWithId } from "@/lib/product-types";

type ImageField = { url: string; alt: string; sortOrder: number };

type ProductFormProps = {
  product?: ProductWithId;
};

const emptyImage = (): ImageField => ({ url: "", alt: "", sortOrder: 0 });

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(product?.id && !product.id.startsWith("static-"));

  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    size: product?.size ?? "",
    diameterCm: product?.diameterCm ?? 10,
    capacityMl: product?.capacityMl ?? 140,
    pricePKR: product?.pricePKR ?? 22500,
    priceUSD: product?.priceUSD ?? 80,
    inStock: product?.inStock ?? true,
    published: product?.published ?? true,
    sortOrder: product?.sortOrder ?? 0,
    description: product?.description ?? "",
    deliveryInfo: product?.deliveryInfo ?? "",
    features: product?.features.join("\n") ?? "",
    careInstructions: product?.careInstructions.join("\n") ?? "",
    specs: product?.specs
      ? Object.entries(product.specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : "",
    images:
      product?.imageAlts?.map((img, i) => ({
        url: img.url,
        alt: img.alt,
        sortOrder: i,
      })) ??
      product?.images.map((url, i) => ({ url, alt: "", sortOrder: i })) ??
      [emptyImage()],
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateImage(index: number, patch: Partial<ImageField>) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? { ...img, ...patch } : img)),
    }));
  }

  function addImage() {
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, { ...emptyImage(), sortOrder: prev.images.length }],
    }));
  }

  function removeImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  async function uploadImage(index: number, file: File) {
    setUploadingIndex(index);
    const body = new FormData();
    body.append("file", file);

    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      setUploadingIndex(null);
      return;
    }

    updateImage(index, { url: data.url });
    if (!form.images[index]?.alt) {
      updateImage(index, { alt: `${form.name || "Product"} image ${index + 1}` });
    }
    setUploadingIndex(null);
  }

  function parseSpecs(text: string): Record<string, string> {
    const specs: Record<string, string> = {};
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.indexOf(":");
        if (idx > 0) {
          specs[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      });
    return specs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: form.name,
      slug: form.slug,
      sku: form.sku,
      size: form.size,
      diameterCm: Number(form.diameterCm),
      capacityMl: Number(form.capacityMl),
      pricePKR: Number(form.pricePKR),
      priceUSD: Number(form.priceUSD),
      inStock: form.inStock,
      published: form.published,
      sortOrder: Number(form.sortOrder),
      description: form.description,
      deliveryInfo: form.deliveryInfo,
      features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      careInstructions: form.careInstructions.split("\n").map((s) => s.trim()).filter(Boolean),
      specs: parseSpecs(form.specs),
      images: form.images
        .filter((img) => img.url)
        .map((img, i) => ({ ...img, sortOrder: i })),
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      setLoading(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-charcoal/20 px-3 py-2 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-charcoal/10 bg-white p-6">
        <h2 className="mb-4 font-serif text-xl text-navy">Basic info</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => updateField("name", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input className={inputClass} value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">SKU</label>
            <input className={inputClass} value={form.sku} onChange={(e) => updateField("sku", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Size label</label>
            <input className={inputClass} value={form.size} onChange={(e) => updateField("size", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Diameter (cm)</label>
            <input type="number" step="0.1" className={inputClass} value={form.diameterCm} onChange={(e) => updateField("diameterCm", Number(e.target.value))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Capacity (ml)</label>
            <input type="number" className={inputClass} value={form.capacityMl} onChange={(e) => updateField("capacityMl", Number(e.target.value))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price PKR</label>
            <input type="number" className={inputClass} value={form.pricePKR} onChange={(e) => updateField("pricePKR", Number(e.target.value))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price USD</label>
            <input type="number" className={inputClass} value={form.priceUSD} onChange={(e) => updateField("priceUSD", Number(e.target.value))} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Sort order</label>
            <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => updateField("sortOrder", Number(e.target.value))} />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.inStock} onChange={(e) => updateField("inStock", e.target.checked)} />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => updateField("published", e.target.checked)} />
              Published
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-charcoal/10 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-navy">Photos</h2>
          <button type="button" onClick={addImage} className="text-sm text-navy underline">
            Add photo
          </button>
        </div>
        <div className="space-y-6">
          {form.images.map((image, index) => (
            <div key={index} className="grid gap-4 rounded-md border border-cream p-4 sm:grid-cols-[120px_1fr]">
              <div className="relative aspect-square overflow-hidden rounded-md bg-porcelain">
                {image.url ? (
                  <Image src={image.url} alt={image.alt || "Preview"} fill className="object-contain p-2" sizes="120px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-charcoal/50">No image</div>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(index, file);
                    }}
                    disabled={uploadingIndex === index}
                  />
                  {uploadingIndex === index && <p className="text-xs text-charcoal/60">Uploading...</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Image URL</label>
                  <input className={inputClass} value={image.url} onChange={(e) => updateImage(index, { url: e.target.value })} placeholder="/uploads/photo.webp or https://..." />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Alt text (SEO)</label>
                  <input className={inputClass} value={image.alt} onChange={(e) => updateImage(index, { alt: e.target.value })} placeholder="Exo Zilton mortar and pestle front view" />
                </div>
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImage(index)} className="text-sm text-red-600">
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-charcoal/10 bg-white p-6">
        <h2 className="mb-4 font-serif text-xl text-navy">Details</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea rows={4} className={inputClass} value={form.description} onChange={(e) => updateField("description", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Features (one per line)</label>
            <textarea rows={5} className={inputClass} value={form.features} onChange={(e) => updateField("features", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Specs (Key: Value per line)</label>
            <textarea rows={5} className={inputClass} value={form.specs} onChange={(e) => updateField("specs", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Care instructions (one per line)</label>
            <textarea rows={4} className={inputClass} value={form.careInstructions} onChange={(e) => updateField("careInstructions", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Delivery info</label>
            <textarea rows={3} className={inputClass} value={form.deliveryInfo} onChange={(e) => updateField("deliveryInfo", e.target.value)} required />
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="rounded-full bg-navy px-8 py-3 text-sm uppercase tracking-widest text-white disabled:opacity-50">
          {loading ? "Saving..." : isEdit ? "Update product" : "Create product"}
        </button>
      </div>
    </form>
  );
}
