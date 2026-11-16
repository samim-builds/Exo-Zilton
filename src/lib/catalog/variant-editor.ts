// Pure helpers for the per-variant panel in the product editor. Client-safe.

type Img = { variantKey?: string | null };

/** Photos belonging to one variant (or shared ones, for null), with their index in the full list. */
export function imagesFor<T extends Img>(images: T[], variantKey: string | null): { image: T; index: number }[] {
  return images.flatMap((image, index) => ((image.variantKey ?? null) === variantKey ? [{ image, index }] : []));
}

/** Moves a photo one place earlier or later among photos of the same variant. */
export function moveImageWithinGroup<T extends Img>(images: T[], index: number, dir: -1 | 1): T[] {
  const group = images[index]?.variantKey ?? null;
  let j = index + dir;
  while (j >= 0 && j < images.length && (images[j].variantKey ?? null) !== group) j += dir;
  if (j < 0 || j >= images.length) return images;
  const next = [...images];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

type Priced = {
  key: string;
  pricePKR: number;
  priceUSD: number;
  compareAtPKR?: number | null;
  compareAtUSD?: number | null;
};

/** Gives every variant the prices of one variant. */
export function copyPricesToAll<T extends Priced>(variants: T[], fromKey: string): T[] {
  const from = variants.find((v) => v.key === fromKey);
  if (!from) return variants;
  const { pricePKR, priceUSD, compareAtPKR, compareAtUSD } = from;
  return variants.map((v) => ({ ...v, pricePKR, priceUSD, compareAtPKR, compareAtUSD }));
}
