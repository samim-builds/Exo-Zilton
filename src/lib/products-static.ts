export type Product = {
  slug: string;
  name: string;
  sku: string;
  size: string;
  diameterCm: number;
  capacityMl: number;
  pricePKR: number;
  priceUSD: number;
  inStock: boolean;
  images: string[];
  features: string[];
  specs: Record<string, string>;
  description: string;
  careInstructions: string[];
  deliveryInfo: string;
};

const sharedFeatures = [
  "Unglazed vitrified porcelain — no staining or odour absorption",
  "Classic beechwood handle for comfortable, efficient grinding",
  "Dense abrasive finish ideal for herbs, spices, and pastes",
  "Pouring lip for easy transfer of ground ingredients",
  "Beautiful gift-ready packaging",
];

const sharedCare = [
  "Hand wash with mild detergent recommended",
  "Dry thoroughly after washing",
  "Avoid abrasive cleaners on the wooden handle",
  "Mortar is oven and freezer safe",
];

const sharedDelivery =
  "We ship across Pakistan and accept international inquiries. Contact us via WhatsApp or the inquiry form for delivery quotes to your country.";

function makeProduct(
  sizeNum: number,
  diameterCm: number,
  capacityMl: number,
  pricePKR: number,
  priceUSD: number,
  inStock = true,
): Product {
  const size = `Size ${sizeNum}`;
  const slug = `mortar-and-pestle-size-${sizeNum}`;

  return {
    slug,
    name: `Mortar and Pestle - ${size}`,
    sku: `EZ-${sizeNum.toString().padStart(3, "0")}`,
    size,
    diameterCm,
    capacityMl,
    pricePKR,
    priceUSD,
    inStock,
    images: [
      `/products/size-${sizeNum}/front.webp`,
      `/products/size-${sizeNum}/angle.webp`,
      `/products/size-${sizeNum}/top.webp`,
    ],
    features: sharedFeatures,
    specs: {
      Size: size,
      Diameter: `${diameterCm}cm`,
      Capacity: `${capacityMl}ml`,
      Material: "Unglazed vitrified porcelain with beechwood handle",
      Finish: "Matte unglazed porcelain",
      "Oven Safe": "Yes",
      "Freezer Safe": "Yes",
    },
    description: `Add more flavour to every meal with the Exo Zilton ${size} Mortar & Pestle. Crafted from dense unglazed porcelain with a stylish beechwood handle, this timeless kitchen essential is perfect for spice rubs, pastes, sauces, and marinades. Vitrified porcelain prevents cross-contamination of tastes and odours, while the abrasive texture delivers fuss-free grinding every time.`,
    careInstructions: sharedCare,
    deliveryInfo: sharedDelivery,
  };
}

export const staticProducts: Product[] = [
  makeProduct(0, 10, 140, 22500, 80),
  makeProduct(1, 11.2, 200, 28000, 100),
  makeProduct(2, 12.5, 300, 34000, 120),
  makeProduct(3, 15.2, 400, 45000, 160),
  makeProduct(4, 17, 600, 56000, 200),
  makeProduct(6, 19, 900, 67000, 240, false),
];

export function getStaticProductBySlug(slug: string): Product | undefined {
  return staticProducts.find((p) => p.slug === slug);
}

export function getAllStaticProductSlugs(): string[] {
  return staticProducts.map((p) => p.slug);
}

// Re-export for backward compatibility during migration
export const products = staticProducts;
export const getProductBySlug = getStaticProductBySlug;
export const getAllProductSlugs = getAllStaticProductSlugs;
