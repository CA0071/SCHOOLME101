export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
}
