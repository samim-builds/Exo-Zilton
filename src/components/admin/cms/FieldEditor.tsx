"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/admin/form/Field";
import { MediaSelect } from "@/components/admin/media/MediaSelect";
import type { FieldDescriptor } from "@/lib/cms/sections";

// Renders a form from section field descriptors. Values are plain JSON objects;
// every change produces a new object so the parent can keep undo-free state.

type Obj = Record<string, unknown>;

function blankValue(field: FieldDescriptor): unknown {
  switch (field.kind) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "select":
      return field.options[0]?.value ?? "";
    case "strings":
    case "list":
      return [];
    case "link":
      return { label: "", href: "" };
    default:
      return "";
  }
}

export function blankItem(fields: FieldDescriptor[]): Obj {
  return Object.fromEntries(fields.map((f) => [f.key, blankValue(f)]));
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function RowControls({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        <ArrowDown />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <MediaSelect value={value} onChange={onChange} folder="pages" />;
}

function StringsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <Textarea rows={1} value={item} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} className="min-h-9" />
          <RowControls index={i} count={value.length} onMove={(to) => onChange(move(value, i, to))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
        <Plus />
        Add
      </Button>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDescriptor; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.kind) {
    case "text":
    case "url":
      return <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "textarea":
      return <Textarea rows={4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
    case "image":
      return <ImageInput value={String(value ?? "")} onChange={onChange} />;
    case "number":
      return (
        <Input
          type="number"
          value={Number(value ?? 0)}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(Math.round(Number(e.target.value)) || 0)}
          className="w-32"
        />
      );
    case "boolean":
      return <Switch checked={Boolean(value)} onCheckedChange={onChange} />;
    case "select":
      return (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "strings":
      return <StringsInput value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
    case "link": {
      const link = (value ?? { label: "", href: "" }) as { label: string; href: string };
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={link.label} placeholder="Label" onChange={(e) => onChange({ ...link, label: e.target.value })} />
          <Input value={link.href} placeholder="/products" onChange={(e) => onChange({ ...link, href: e.target.value })} />
        </div>
      );
    }
    case "list": {
      const items = Array.isArray(value) ? (value as Obj[]) : [];
      return (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-md border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {field.itemLabel} {i + 1}
                </span>
                <RowControls
                  index={i}
                  count={items.length}
                  onMove={(to) => onChange(move(items, i, to))}
                  onRemove={() => onChange(items.filter((_, j) => j !== i))}
                />
              </div>
              <FieldEditor fields={field.fields} value={item} onChange={(next) => onChange(items.map((v, j) => (j === i ? next : v)))} />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, blankItem(field.fields)])}>
            <Plus />
            Add {field.itemLabel.toLowerCase()}
          </Button>
        </div>
      );
    }
  }
}

export function FieldEditor({ fields, value, onChange }: { fields: FieldDescriptor[]; value: Obj; onChange: (next: Obj) => void }) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          <FieldInput field={field} value={value[field.key]} onChange={(v) => onChange({ ...value, [field.key]: v })} />
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </Field>
      ))}
    </div>
  );
}
