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
