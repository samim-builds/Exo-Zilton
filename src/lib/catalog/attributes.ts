// Category attribute definitions: inheritance down the category tree and
// validation/coercion of the values entered on products and variants.

export type AttributeDef = {
  key: string;
  label: string;
  type: "TEXT" | "NUMBER" | "SELECT" | "BOOLEAN";
  unit: string | null;
  options: string[];
  scope: "PRODUCT" | "VARIANT";
  required: boolean;
  sortOrder: number;
};

type CategoryNode = { id: string; parentId: string | null; attributes: AttributeDef[] };

export type AttributeValue = string | number | boolean;

/** A category's own attributes plus its ancestors'; the nearest definition of a key wins. */
export function effectiveAttributes(categoryId: string | null, categories: CategoryNode[]): AttributeDef[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const chain: CategoryNode[] = [];
  const seen = new Set<string>();
  for (let id = categoryId; id && !seen.has(id); id = byId.get(id)?.parentId ?? null) {
    seen.add(id);
    const node = byId.get(id);
    if (node) chain.unshift(node);
  }

  const merged = new Map<string, AttributeDef>();
  for (const node of chain) for (const attr of node.attributes) merged.set(attr.key, attr);
  return [...merged.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

function humanize(label: string): string {
  const spaced = label.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function validateAttributeValues(
  defs: AttributeDef[],
  input: Record<string, unknown>,
): { ok: true; values: Record<string, AttributeValue> } | { ok: false; errors: Record<string, string> } {
  const values: Record<string, AttributeValue> = {};
  const errors: Record<string, string> = {};

  for (const def of defs) {
    const raw = input[def.key];
    const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
    if (empty) {
      if (def.required) errors[def.key] = `${humanize(def.label)} is required`;
      continue;
    }

    switch (def.type) {
      case "NUMBER": {
        const n = typeof raw === "number" ? raw : Number(String(raw).trim());
        if (Number.isFinite(n)) values[def.key] = n;
        else errors[def.key] = "Must be a number";
        break;
      }
      case "BOOLEAN":
        values[def.key] = raw === true || raw === "true";
        break;
      case "SELECT":
        if (def.options.includes(String(raw))) values[def.key] = String(raw);
        else errors[def.key] = `Choose one of: ${def.options.join(", ")}`;
        break;
      default:
        values[def.key] = String(raw).trim();
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}
