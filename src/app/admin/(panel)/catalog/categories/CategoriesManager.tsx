"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, FolderTree, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form/Field";
import { MediaPicker } from "@/components/admin/media/MediaPicker";
import { MediaThumb } from "@/components/admin/media/MediaLibrary";
import type { CategoryNodeView } from "@/lib/catalog/admin-queries";
import type { CategoryInput } from "@/lib/catalog/schemas";
import { slugifyOptionValue } from "@/lib/catalog/variants";
import { deleteCategory, loadCategory, saveCategory } from "./actions";

type Attr = CategoryInput["attributes"][number];

const TYPE_LABELS: Record<Attr["type"], string> = {
  TEXT: "Text",
  NUMBER: "Number",
  SELECT: "Choice list",
  BOOLEAN: "Yes / no",
};

const emptyCategory = (sortOrder: number): CategoryInput => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: null,
  parentId: null,
  sortOrder,
  published: true,
  seoTitle: "",
  seoDescription: "",
  attributes: [],
});

export function CategoriesManager({ categories }: { categories: CategoryNodeView[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryInput | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function open(id: string) {
    setLoadingId(id);
    const res = await loadCategory({ id });
    setLoadingId(null);
    if (!res.ok) return void toast.error(res.error);
    setEditing(res.data);
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing(emptyCategory(categories.length))}>
          <Plus />
          New category
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>Attributes</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <FolderTree className="mx-auto mb-2 size-6" />
                  No categories yet. Create one to start organising products.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => open(c.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2" style={{ paddingLeft: c.depth * 20 }}>
                      {c.depth > 0 && <span className="text-muted-foreground">└</span>}
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">/{c.slug}</span>
                      {loadingId === c.id && <Loader2 className="size-3.5 animate-spin" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.attributes.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        c.attributes.map((a) => (
                          <Badge key={a.key} variant="secondary" className="font-normal">
                            {a.label}
                            {a.unit ? ` (${a.unit})` : ""}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.productCount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.published ? "border-green-200 bg-green-50 text-green-800" : ""}>
                      {c.published ? "Visible" : "Hidden"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {editing && (
            <CategoryForm
              key={editing.id ?? "new"}
              initial={editing}
              parents={categories.filter((c) => c.id !== editing.id)}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function CategoryForm({
  initial,
  parents,
  onDone,
}: {
  initial: CategoryInput;
  parents: CategoryNodeView[];
  onDone: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  const set = <K extends keyof CategoryInput>(key: K, value: CategoryInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setAttr = (i: number, patch: Partial<Attr>) =>
    set("attributes", form.attributes.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const moveAttr = (i: number, dir: -1 | 1) => {
    const next = [...form.attributes];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set("attributes", next);
  };

  function save() {
    startSaving(async () => {
      const res = await saveCategory(form);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      toast.success(initial.id ? "Category saved" : "Category created");
      onDone();
    });
  }

  function remove() {
    startDeleting(async () => {
      const res = await deleteCategory({ id: initial.id! });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Category deleted");
      onDone();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{initial.id ? `Edit ${initial.name}` : "New category"}</SheetTitle>
        <SheetDescription>Attributes defined here appear as fields on every product in this category.</SheetDescription>
      </SheetHeader>

      <div className="space-y-5 px-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugifyOptionValue(e.target.value));
              }}
            />
          </Field>
          <Field label="URL slug" error={errors.slug}>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
            />
          </Field>
        </div>

        <Field label="Parent category">
          <Select value={form.parentId ?? "none"} onValueChange={(v) => set("parentId", v === "none" ? null : v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (top level)</SelectItem>
              {parents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Description">
          <Textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </Field>

        <div className="flex items-end gap-4">
          <div className="space-y-2">
            <Label>Image</Label>
            <div className="flex items-center gap-3">
              {form.imageUrl && <MediaThumb item={{ url: form.imageUrl, alt: form.name }} className="size-16" />}
              <MediaPicker
                defaultFolder="categories"
                onPick={([item]) => set("imageUrl", item.url)}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    {form.imageUrl ? "Change" : "Choose image"}
                  </Button>
                }
              />
              {form.imageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set("imageUrl", null)}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 pb-1">
            <Switch id="cat-published" checked={form.published} onCheckedChange={(v) => set("published", v)} />
            <Label htmlFor="cat-published">Visible on site</Label>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Attributes</p>
              <p className="text-xs text-muted-foreground">
                Product-level apply to the whole product; variant-level differ per size/colour.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                set("attributes", [
                  ...form.attributes,
                  { key: "", label: "", type: "TEXT", unit: "", options: [], scope: "PRODUCT", required: false },
                ])
              }
            >
              <Plus />
              Add
            </Button>
          </div>

          {form.attributes.map((attr, i) => (
            <div key={i} className="space-y-3 rounded-md border bg-muted/30 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Label" error={errors.attributes && !attr.label ? ["Label is required"] : undefined}>
                  <Input
                    value={attr.label}
                    placeholder="Diameter"
                    onChange={(e) => {
                      const label = e.target.value;
                      // Derive a camelCase key from new attributes' labels.
                      const key = attr.id
                        ? attr.key
                        : label
                            .replace(/[^a-zA-Z0-9 ]/g, "")
                            .split(" ")
                            .filter(Boolean)
                            .map((w, j) => (j === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()))
                            .join("");
                      setAttr(i, { label, key });
                    }}
                  />
                </Field>
                <Field label="Key">
                  <Input value={attr.key} disabled={Boolean(attr.id)} onChange={(e) => setAttr(i, { key: e.target.value })} className="font-mono text-xs" />
                </Field>
                <Field label="Type">
                  <Select value={attr.type} onValueChange={(v) => setAttr(i, { type: v as Attr["type"] })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Applies to">
                  <Select value={attr.scope} onValueChange={(v) => setAttr(i, { scope: v as Attr["scope"] })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Whole product</SelectItem>
                      <SelectItem value="VARIANT">Each variant</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {attr.type === "NUMBER" && (
                  <Field label="Unit">
                    <Input value={attr.unit ?? ""} placeholder="cm" onChange={(e) => setAttr(i, { unit: e.target.value })} />
                  </Field>
                )}
                {attr.type === "SELECT" && (
                  <Field label="Choices (comma separated)" className="sm:col-span-2">
                    <Input
                      value={attr.options.join(", ")}
                      placeholder="Matte, Gloss"
                      onChange={(e) =>
                        setAttr(i, { options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
                      }
                    />
                  </Field>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch id={`req-${i}`} checked={attr.required} onCheckedChange={(v) => setAttr(i, { required: v })} />
                <Label htmlFor={`req-${i}`} className="text-sm font-normal">
                  Required
                </Label>
                <div className="ml-auto flex gap-1">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => moveAttr(i, -1)}>
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    disabled={i === form.attributes.length - 1}
                    onClick={() => moveAttr(i, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove attribute"
                    onClick={() => set("attributes", form.attributes.filter((_, j) => j !== i))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">Search engine listing</summary>
          <div className="mt-3 space-y-3">
            <Field label="SEO title">
              <Input value={form.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} placeholder={form.name} />
            </Field>
            <Field label="SEO description">
              <Textarea rows={2} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} />
            </Field>
          </div>
        </details>
      </div>

      <SheetFooter className="flex-row justify-between">
        {initial.id ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={deleting}>
                <Trash2 />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {initial.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Only empty categories can be deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <span />
        )}
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          {initial.id ? "Save" : "Create category"}
        </Button>
      </SheetFooter>
    </>
  );
}
