// Pure helpers for product options and variants (shared by admin and storefront).

export type OptionInput = { name: string; values: string[] };
export type OptionCombo = Record<string, string>;

export function slugifyOptionValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Every combination of option values, in option order. No options → one default combo. */
export function generateVariantCombos(options: OptionInput[]): OptionCombo[] {
  return options
    .filter((o) => o.values.length > 0)
    .reduce<OptionCombo[]>(
      (combos, option) => combos.flatMap((combo) => option.values.map((value) => ({ ...combo, [option.name]: value }))),
      [{}],
    );
}

export function variantTitle(combo: OptionCombo): string {
  const values = Object.values(combo);
  return values.length > 0 ? values.join(" / ") : "Default";
}

export function suggestSku(base: string, combo: OptionCombo): string {
  const codes = Object.values(combo).map((v) => v.replace(/[^a-z0-9]/gi, "").toUpperCase());
  return [base.toUpperCase(), ...codes].join("-");
}

/**
 * Rebuilds the variant list for the current options: variants whose option
 * values still form a valid combination are kept (with their prices, stock,
 * SKU), missing combinations are created from `make`, stale ones are dropped.
 * A lone option-less variant becomes the first combination so its data survives.
 */
export function syncVariants<V extends { combo: OptionCombo }>(
  options: OptionInput[],
  existing: V[],
  make: (combo: OptionCombo, template: V | undefined) => V,
): V[] {
  const names = options.filter((o) => o.values.length > 0).map((o) => o.name);
  const signature = (combo: OptionCombo) => names.map((n) => combo[n] ?? "").join("\u0000");
  const normalize = (combo: OptionCombo) => Object.fromEntries(names.map((n) => [n, combo[n]]));

  const byCombo = new Map(existing.map((v) => [signature(v.combo), v]));
  let promotable = existing.length === 1 && Object.keys(existing[0].combo).length === 0 ? existing[0] : undefined;

  return generateVariantCombos(options).map((combo) => {
    const match = byCombo.get(signature(combo));
    if (match) return { ...match, combo: normalize(match.combo) };
    if (promotable) {
      const promoted = { ...promotable, combo };
      promotable = undefined;
      return promoted;
    }
    return make(combo, existing[0]);
  });
}

/** Gives every variant with a blank SKU a suggested one, leaving typed SKUs alone. */
export function fillMissingSkus<V extends { combo: OptionCombo; sku: string }>(variants: V[], base: string): V[] {
  return variants.map((v) => (v.sku.trim() ? v : { ...v, sku: suggestSku(base, v.combo) }));
}
