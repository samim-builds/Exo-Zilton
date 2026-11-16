"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form/Field";
import { slugifyOptionValue } from "@/lib/catalog/variants";
import type { EditorCategory, EditorProps } from "./ProductEditor";

// Multi-line text ⇄ string[] (one entry per line).
const toLines = (items: string[]) => items.join("\n");
const fromLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export function GeneralTab({
  form,
  update,
  categories,
  isNew,
}: EditorProps & { categories: EditorCategory[]; isNew: boolean }) {
  const [slugTouched, setSlugTouched] = useState(!isNew);
  // Keep raw textarea text locally so blank lines survive while typing.
  const [features, setFeatures] = useState(toLines(form.features));
  const [care, setCare] = useState(toLines(form.careInstructions));
  const [tags, setTags] = useState(form.tags.join(", "));

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => update((f) => ({ ...f, [key]: value }));

  const categoryPath = (id: string): string => {
    const names: string[] = [];
    const seen = new Set<string>();
    for (let c = categories.find((x) => x.id === id); c && !seen.has(c.id); c = categories.find((x) => x.id === c!.parentId)) {
      seen.add(c.id);
      names.unshift(c.name);
    }
    return names.join(" › ");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    update((f) => ({ ...f, name, ...(!slugTouched && { slug: slugifyOptionValue(name) }) }));
                  }}
                />
              </Field>
              <Field label="URL slug">
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value);
                  }}
                />
              </Field>
            </div>
            <Field label="Subtitle">
              <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} placeholder="Short line under the name" />
            </Field>
            <Field label="Description">
              <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Features (one per line)">
                <Textarea
                  rows={5}
                  value={features}
                  onChange={(e) => {
                    setFeatures(e.target.value);
                    set("features", fromLines(e.target.value));
                  }}
                />
              </Field>
              <Field label="Care instructions (one per line)">
                <Textarea
                  rows={5}
                  value={care}
                  onChange={(e) => {
                    setCare(e.target.value);
                    set("careInstructions", fromLines(e.target.value));
                  }}
                />
              </Field>
            </div>
            <Field label="Delivery info">
              <Textarea rows={2} value={form.deliveryInfo} onChange={(e) => set("deliveryInfo", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Free-form rows shown in the product&apos;s spec table, e.g. Material → Porcelain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {form.specs.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label="Spec name"
                  value={spec.key}
                  placeholder="Name"
                  onChange={(e) => set("specs", form.specs.map((s, j) => (j === i ? { ...s, key: e.target.value } : s)))}
                />
                <Input
                  aria-label="Spec value"
                  value={spec.value}
                  placeholder="Value"
                  onChange={(e) => set("specs", form.specs.map((s, j) => (j === i ? { ...s, value: e.target.value } : s)))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove spec"
                  onClick={() => set("specs", form.specs.filter((_, j) => j !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => set("specs", [...form.specs, { key: "", value: "" }])}>
              <Plus />
              Add row
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
              <SelectTrigger className="w-full" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active — visible in the shop</SelectItem>
                <SelectItem value="DRAFT">Draft — hidden</SelectItem>
                <SelectItem value="ARCHIVED">Archived — hidden, kept for records</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured on homepage</Label>
              <Switch id="featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
            </div>
            <Field label="Sort order">
              <Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Category">
              <Select value={form.categoryId ?? "none"} onValueChange={(v) => set("categoryId", v === "none" ? null : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorised</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {categoryPath(c.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tags (comma separated)">
              <Input
                value={tags}
                placeholder="gift, kitchen"
                onChange={(e) => {
                  setTags(e.target.value);
                  set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean));
                }}
              />
            </Field>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
