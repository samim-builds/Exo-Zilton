// Pure helpers for the admin command palette. Client-safe.

const MAX_QUERY = 80;

/** Trims the query and reads an order number from "12" or "#12". */
export function parseSearch(raw: string): { text: string; orderNumber: number | null } {
  const text = raw.trim().slice(0, MAX_QUERY);
  const match = /^#?(\d{1,9})$/.exec(text);
  return { text, orderNumber: match ? Number(match[1]) : null };
}

/** Admin pages whose label has a word starting with the query. */
export function matchNav<T extends { label: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.label.toLowerCase().split(/\s+/).some((word) => word.startsWith(q)));
}
