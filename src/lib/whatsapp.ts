import { siteConfig } from "./site";

type OrderMessageParams = {
  productName: string;
  size: string;
  quantity?: number;
  country?: string;
};

export function buildWhatsAppUrl({
  productName,
  size,
  quantity = 1,
  country = "Pakistan",
}: OrderMessageParams): string {
  const message = [
    "Hi Exo Zilton, I'd like to order:",
    `Product: ${productName}`,
    `Size: ${size}`,
    `Qty: ${quantity}`,
    `Country: ${country}`,
  ].join("\n");

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encoded}`;
}

export function buildGeneralWhatsAppUrl(message?: string): string {
  const text =
    message ??
    "Hi Exo Zilton, I have a question about your mortar and pestle products.";
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
