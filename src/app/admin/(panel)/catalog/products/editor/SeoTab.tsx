"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form/Field";
import { siteConfig } from "@/lib/site";
import type { EditorProps } from "./ProductEditor";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

function Counter({ length, max }: { length: number; max: number }) {
  return <span className={length > max ? "text-amber-700" : "text-muted-foreground"}>{length}/{max}</span>;
}

export function SeoTab({ form, update }: EditorProps) {
  const title = form.seoTitle || `${form.name} | ${siteConfig.name}`;
  const description = form.seoDescription || form.description.slice(0, DESCRIPTION_MAX);
  const url = `${siteConfig.url.replace(/^https?:\/\//, "")} › products › ${form.slug}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Search engine listing</CardTitle>
          <CardDescription>Leave blank to use the product name and description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Page title">
            <Input value={form.seoTitle ?? ""} placeholder={title} onChange={(e) => update((f) => ({ ...f, seoTitle: e.target.value }))} />
            <p className="text-right text-xs">
              <Counter length={title.length} max={TITLE_MAX} />
            </p>
          </Field>
          <Field label="Meta description">
            <Textarea
              rows={3}
              value={form.seoDescription ?? ""}
              placeholder={description}
              onChange={(e) => update((f) => ({ ...f, seoDescription: e.target.value }))}
            />
            <p className="text-right text-xs">
              <Counter length={description.length} max={DESCRIPTION_MAX} />
            </p>
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <p className="truncate text-xs text-zinc-600">{url}</p>
            <p className="mt-1 truncate text-lg text-[#1a0dab]">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
