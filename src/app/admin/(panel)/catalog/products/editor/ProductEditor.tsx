"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { effectiveAttributes, type AttributeDef } from "@/lib/catalog/attributes";
import type { ProductInput } from "@/lib/catalog/schemas";
import { saveProduct } from "../actions";
import { STATUS_STYLES } from "../ProductsTable";
import { AttributesTab } from "./AttributesTab";
import { GeneralTab } from "./GeneralTab";
import { MediaTab } from "./MediaTab";
import { SeoTab } from "./SeoTab";
import { VariantsTab } from "./VariantsTab";

export type EditorCategory = { id: string; name: string; parentId: string | null; attributes: AttributeDef[] };

export type EditorProps = {
  form: ProductInput;
  update: (updater: (form: ProductInput) => ProductInput) => void;
};

const FIELD_TABS: Record<string, string> = {
  name: "general",
  slug: "general",
  description: "general",
  categoryId: "general",
  images: "media",
  options: "variants",
  variants: "variants",
  seoTitle: "seo",
  seoDescription: "seo",
};

export function ProductEditor({ initial, categories }: { initial: ProductInput; categories: EditorCategory[] }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState("general");
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(form) !== baseline;
  const attributeDefs = useMemo(() => effectiveAttributes(form.categoryId, categories), [form.categoryId, categories]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function update(updater: (form: ProductInput) => ProductInput) {
    setForm((prev) => updater(prev));
  }

  function save() {
    startSaving(async () => {
      const res = await saveProduct(form);
      if (!res.ok) {
        const fieldErrors = Object.entries(res.fieldErrors ?? {}).flatMap(([field, messages]) =>
          messages.map((m) => `${field}: ${m}`),
        );
        setErrors(fieldErrors.length > 0 ? fieldErrors : [res.error]);
        const firstField = Object.keys(res.fieldErrors ?? {})[0];
        if (firstField && FIELD_TABS[firstField]) setTab(FIELD_TABS[firstField]);
        toast.error(res.error);
        return;
      }
      setErrors([]);
      setBaseline(JSON.stringify(form));
      toast.success(res.data.created ? "Product created" : "Product saved");
      if (res.data.created) router.replace(`/admin/catalog/products/${res.data.id}`);
      else router.refresh();
    });
  }

  const variantCount = form.variants.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/catalog/products" className="text-sm text-muted-foreground hover:text-foreground">
            ← Products
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-[1.375rem] leading-tight font-semibold tracking-tight text-foreground sm:text-[1.5rem]">{form.name || "New product"}</h1>
            <Badge variant="outline" className={STATUS_STYLES[form.status]}>
              {form.status.charAt(0) + form.status.slice(1).toLowerCase()}
            </Badge>
          </div>
        </div>
        {initial.id && form.status === "ACTIVE" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/products/${initial.slug}`} target="_blank">
              <ExternalLink />
              View on site
            </Link>
          </Button>
        )}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">Couldn&apos;t save:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="media">Media ({form.images.length})</TabsTrigger>
          <TabsTrigger value="variants">Variants ({variantCount})</TabsTrigger>
          <TabsTrigger value="attributes">Attributes{attributeDefs.length > 0 ? ` (${attributeDefs.length})` : ""}</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralTab form={form} update={update} categories={categories} isNew={!initial.id} />
        </TabsContent>
        <TabsContent value="media">
          <MediaTab form={form} update={update} />
        </TabsContent>
        <TabsContent value="variants">
          <VariantsTab form={form} update={update} />
        </TabsContent>
        <TabsContent value="attributes">
          <AttributesTab form={form} update={update} defs={attributeDefs} />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab form={form} update={update} />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t bg-background/95 backdrop-blur sm:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="mr-auto text-sm text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</span>
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setForm(JSON.parse(baseline));
                setErrors([]);
              }}
            >
              Discard
            </Button>
          )}
          <Button onClick={save} disabled={saving || (!dirty && Boolean(initial.id))}>
            {saving && <Loader2 className="animate-spin" />}
            {initial.id ? "Save" : "Create product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
