"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { MediaThumb } from "@/components/admin/media/MediaLibrary";
import { variantTitle } from "@/lib/catalog/variants";
import type { EditorProps } from "./ProductEditor";

export function MediaTab({ form, update }: EditorProps) {
  const setImages = (images: typeof form.images) => update((f) => ({ ...f, images }));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...form.images];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setImages(next);
  };
  const hasVariants = form.options.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Media</CardTitle>
          <CardDescription>
            The first image is the main one. {hasVariants && "Assign images to a variant to show them when it's selected."}
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
        {form.images.length === 0 ? (
          <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
            No images yet. Products without images show a placeholder.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {form.images.map((image, i) => (
              <li key={`${image.url}-${i}`} className="space-y-2 rounded-lg border p-2">
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
                  onChange={(e) => setImages(form.images.map((img, j) => (j === i ? { ...img, alt: e.target.value } : img)))}
                />
                {hasVariants && (
                  <Select
                    value={image.variantKey ?? "all"}
                    onValueChange={(v) =>
                      setImages(form.images.map((img, j) => (j === i ? { ...img, variantKey: v === "all" ? null : v } : img)))
                    }
                  >
                    <SelectTrigger size="sm" className="w-full" aria-label="Variant">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All variants</SelectItem>
                      {form.variants.map((v) => (
                        <SelectItem key={v.key} value={v.key}>
                          {variantTitle(v.combo)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex justify-between">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>
                      <ArrowLeft />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move later"
                      disabled={i === form.images.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowRight />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label="Remove image" onClick={() => setImages(form.images.filter((_, j) => j !== i))}>
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
