// RFC 4180 CSV, with values that start like a formula prefixed so Excel and
// Sheets show them as text (subscriber emails are visitor input).

function field(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";
}
