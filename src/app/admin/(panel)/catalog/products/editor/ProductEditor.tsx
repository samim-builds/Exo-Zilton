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
import type { BundleComponentOption } from "@/lib/catalog/admin-queries";
import { saveProduct } from "../actions";
import { productEditHref } from "@/components/admin/shell/nav-config";
import { STATUS_STYLES } from "../ProductsTable";
import { AttributesTab } from "./AttributesTab";
import { BundleTab } from "./BundleTab";
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
  bundle: "contents",
  seoTitle: "seo",
  seoDescription: "seo",
};

export function ProductEditor({
  initial,
  categories,
  components = [],
}: {
  initial: ProductInput;
  categories: EditorCategory[];
  /** Bundles only: the variants that can go inside. */
  components?: BundleComponentOption[];
}) {
  const isBundle = initial.kind === "BUNDLE";
  const noun = isBundle ? "bundle" : "product";
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState("general");
  const [variantKey, setVariantKey] = useState<string | null>(initial.variants[0]?.key ?? null);
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
        const target = firstField && (isBundle && firstField === "variants" ? "contents" : FIELD_TABS[firstField]);
        if (target) setTab(target);
        toast.error(res.error);
        return;
      }
      setErrors([]);
      setBaseline(JSON.stringify(form));
      toast.success(`${isBundle ? "Bundle" : "Product"} ${res.data.created ? "created" : "saved"}`);
      if (res.data.created) router.replace(productEditHref(res.data.id, isBundle ? "BUNDLE" : "STANDARD"));
      else router.refresh();
    });
  }

  const variantCount = form.variants.length;
  const productAttributeCount = attributeDefs.filter((d) => d.scope === "PRODUCT").length;
  // Photos that belong to a variant are managed in that variant's panel.
  const sharedPhotoCount = variantCount > 1 ? form.images.filter((img) => !img.variantKey).length : form.images.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={isBundle ? "/admin/catalog/bundles" : "/admin/catalog/products"} className="text-sm text-muted-foreground hover:text-foreground">
            ← {isBundle ? "Bundles" : "Products"}
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-[1.375rem] leading-tight font-semibold tracking-tight text-foreground sm:text-[1.5rem]">{form.name || `New ${noun}`}</h1>
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
          {isBundle ? (
            <TabsTrigger value="contents">Contents and price ({form.bundle?.items.length ?? 0})</TabsTrigger>
          ) : (
            <TabsTrigger value="variants">{variantCount > 1 ? `Variants (${variantCount})` : "Price and stock"}</TabsTrigger>
          )}
          <TabsTrigger value="media">Media ({isBundle ? form.images.length : sharedPhotoCount})</TabsTrigger>
          {!isBundle && (
            <TabsTrigger value="attributes">Attributes{productAttributeCount > 0 ? ` (${productAttributeCount})` : ""}</TabsTrigger>
          )}
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralTab form={form} update={update} categories={categories} isNew={!initial.id} />
        </TabsContent>
        <TabsContent value="media">
          <MediaTab form={form} update={update} />
        </TabsContent>
        {isBundle ? (
          <TabsContent value="contents">
            <BundleTab form={form} update={update} components={components} />
          </TabsContent>
        ) : (
          <>
            <TabsContent value="variants">
              <VariantsTab form={form} update={update} defs={attributeDefs} selectedKey={variantKey} onSelect={setVariantKey} />
            </TabsContent>
            <TabsContent value="attributes">
              <AttributesTab form={form} update={update} defs={attributeDefs} />
            </TabsContent>
          </>
        )}
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
            {initial.id ? "Save" : `Create ${noun}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
