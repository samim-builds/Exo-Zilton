export function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatDiameter(cm: number): string {
  return `Ø ${cm}cm`;
}

/** "samim@example.com" → "s••••@example.com", for pages anyone with the link can open. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  const local = at === -1 ? email : email.slice(0, at);
  const domain = at === -1 ? "" : email.slice(at);
  return `${local.slice(0, 1)}${"•".repeat(Math.max(0, local.length - 1))}${domain}`;
}
