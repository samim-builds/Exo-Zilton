export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatDiameter(cm: number): string {
  return `Ø ${cm}cm`;
}
