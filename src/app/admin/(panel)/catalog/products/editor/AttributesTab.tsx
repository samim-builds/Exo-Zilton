"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/admin/form/Field";
import type { AttributeDef } from "@/lib/catalog/attributes";
import { AttributeInput, attributeLabel } from "./AttributeInput";
import type { EditorProps } from "./ProductEditor";

// Product-wide attributes. Per-variant ones (such as dimensions) live in each
// variant's panel on the Variants tab.
export function AttributesTab({ form, update, defs }: EditorProps & { defs: AttributeDef[] }) {
  const productDefs = defs.filter((d) => d.scope === "PRODUCT");
  const hasVariantDefs = defs.some((d) => d.scope === "VARIANT");

  if (!form.categoryId || productDefs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {!form.categoryId
            ? "Choose a category on the General tab to get its attributes."
            : hasVariantDefs
              ? "This category's attributes differ per variant. Edit them in each variant on the Variants tab."
              : "This category has no attributes yet."}{" "}
          <Link href="/admin/catalog/categories" className="text-navy underline">
            Manage categories
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product attributes</CardTitle>
        <CardDescription>
          Apply to every variant of this product.{hasVariantDefs && " Values that differ per variant are edited in each variant on the Variants tab."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {productDefs.map((def) => (
          <Field key={def.key} label={attributeLabel(def)}>
            <AttributeInput
              def={def}
              value={form.attributes[def.key]}
              onChange={(value) => update((f) => ({ ...f, attributes: { ...f.attributes, [def.key]: value } }))}
            />
          </Field>
        ))}
      </CardContent>
    </Card>
  );
}
