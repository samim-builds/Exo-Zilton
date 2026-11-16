"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { MediaThumb } from "@/components/admin/media/MediaLibrary";
import { imagesFor, moveImageWithinGroup } from "@/lib/catalog/variant-editor";
import { variantTitle } from "@/lib/catalog/variants";
import type { EditorProps } from "./ProductEditor";

// With several variants this tab holds the photos every variant shares; each
// variant's own photos are managed in its panel on the Variants tab.
export function MediaTab({ form, update }: EditorProps) {
  const setImages = (images: typeof form.images) => update((f) => ({ ...f, images }));
  const hasVariants = form.variants.length > 1;
  const shown = hasVariants ? imagesFor(form.images, null) : form.images.map((image, index) => ({ image, index }));
  const variantPhotoCount = form.images.length - shown.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{hasVariants ? "Shared photos" : "Media"}</CardTitle>
          <CardDescription>
            {hasVariants
              ? `Shown for every variant, after its own photos. ${variantPhotoCount > 0 ? `${variantPhotoCount} more belong to individual variants; edit those on the Variants tab.` : "Add a variant's own photos on the Variants tab."}`
              : "The first image is the main one."}
          </CardDescription>
        </div>
        <MediaPicker
          multiple
          defaultFolder="products"
          onPick={(items) =>
            setImages([...form.images, ...items.map((item) => ({ url: item.url, alt: item.alt || form.name, variantKey: null }))])
          }
          trigger={
            <Button size="sm">
              <ImagePlus />
              Add images
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            {hasVariants ? "No shared photos." : "No images yet. Products without images show a placeholder."}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(({ image, index }, i) => (
              <li key={`${image.url}-${index}`} className="space-y-2 rounded-lg border p-2">
                <div className="relative">
                  <MediaThumb item={image} />
                  {i === 0 && (
                    <span className="absolute top-2 left-2 rounded bg-primary px-1.5 py-0.5 text-[11px] text-primary-foreground">Main</span>
                  )}
                </div>
                <Input
                  aria-label="Alt text"
                  value={image.alt}
                  placeholder="Alt text"
                  onChange={(e) => setImages(form.images.map((img, j) => (j === index ? { ...img, alt: e.target.value } : img)))}
                />
                {hasVariants && (
                  <Select
                    value="all"
                    onValueChange={(v) =>
                      setImages(form.images.map((img, j) => (j === index ? { ...img, variantKey: v === "all" ? null : v } : img)))
                    }
                  >
                    <SelectTrigger size="sm" className="w-full" aria-label="Move to a variant">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Shared by all variants</SelectItem>
                      {form.variants.map((v) => (
                        <SelectItem key={v.key} value={v.key}>
                          Only {variantTitle(v.combo)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Move earlier" disabled={i === 0} onClick={() => setImages(moveImageWithinGroup(form.images, index, -1))}>
                      <ArrowLeft />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move later"
                      disabled={i === shown.length - 1}
                      onClick={() => setImages(moveImageWithinGroup(form.images, index, 1))}
                    >
                      <ArrowRight />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove image" onClick={() => setImages(form.images.filter((_, j) => j !== index))}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
