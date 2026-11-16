"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/admin/form/Field";
import type { AttributeDef } from "@/lib/catalog/attributes";
import { variantTitle } from "@/lib/catalog/variants";
import type { EditorProps } from "./ProductEditor";

function AttributeInput({
  def,
  value,
  onChange,
  compact = false,
}: {
  def: AttributeDef;
  value: unknown;
  onChange: (value: unknown) => void;
  compact?: boolean;
}) {
  const label = `${def.label}${def.unit ? ` (${def.unit})` : ""}`;
  switch (def.type) {
    case "BOOLEAN":
      return <Switch aria-label={label} checked={value === true || value === "true"} onCheckedChange={onChange} />;
    case "SELECT":
      return (
        <Select value={value ? String(value) : "__none"} onValueChange={(v) => onChange(v === "__none" ? undefined : v)}>
          <SelectTrigger size={compact ? "sm" : "default"} className={compact ? "w-32" : "w-full"} aria-label={label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">—</SelectItem>
            {def.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          aria-label={label}
          type={def.type === "NUMBER" ? "number" : "text"}
          step="any"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={compact ? "h-8 w-28" : undefined}
        />
      );
  }
}

export function AttributesTab({ form, update, defs }: EditorProps & { defs: AttributeDef[] }) {
  const productDefs = defs.filter((d) => d.scope === "PRODUCT");
  const variantDefs = defs.filter((d) => d.scope === "VARIANT");

  if (!form.categoryId || defs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {form.categoryId ? "This category has no attributes yet." : "Choose a category on the General tab to get its attributes."}{" "}
          <Link href="/admin/catalog/categories" className="text-navy underline">
            Manage categories
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {productDefs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product attributes</CardTitle>
            <CardDescription>Apply to every variant of this product.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {productDefs.map((def) => (
              <Field key={def.key} label={`${def.label}${def.unit ? ` (${def.unit})` : ""}${def.required ? " *" : ""}`}>
                <AttributeInput
                  def={def}
                  value={form.attributes[def.key]}
                  onChange={(value) => update((f) => ({ ...f, attributes: { ...f.attributes, [def.key]: value } }))}
                />
              </Field>
            ))}
          </CardContent>
        </Card>
      )}

      {variantDefs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variant attributes</CardTitle>
            <CardDescription>Values that differ per variant, such as dimensions.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  {variantDefs.map((def) => (
                    <TableHead key={def.key}>
                      {def.label}
                      {def.unit ? ` (${def.unit})` : ""}
                      {def.required ? " *" : ""}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.variants.map((v, i) => (
                  <TableRow key={v.key}>
                    <TableCell className="font-medium whitespace-nowrap">{variantTitle(v.combo)}</TableCell>
                    {variantDefs.map((def) => (
                      <TableCell key={def.key}>
                        <AttributeInput
                          compact
                          def={def}
                          value={v.attributes[def.key]}
                          onChange={(value) =>
                            update((f) => ({
                              ...f,
                              variants: f.variants.map((x, j) =>
                                j === i ? { ...x, attributes: { ...x.attributes, [def.key]: value } } : x,
                              ),
                            }))
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
