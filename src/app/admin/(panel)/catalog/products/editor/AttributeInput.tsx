"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AttributeDef } from "@/lib/catalog/attributes";

export const attributeLabel = (def: AttributeDef) => `${def.label}${def.unit ? ` (${def.unit})` : ""}${def.required ? " *" : ""}`;

export function AttributeInput({
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
