/**
 * Utility helpers for the SCHOOLME101 MCP server.
 */

import { SubjectEntry, SearchResult } from "./types.js";

/**
 * Normalise a string for case-insensitive comparison.
 * Strips diacritics and converts to lower-case.
 */
export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Return up to `maxLen` characters around the first occurrence of `needle`
 * inside `haystack`, adding "…" when the excerpt is trimmed.
 */
export function excerpt(
  haystack: string,
  needle: string,
  maxLen = 300
): string {
  const idx = haystack.toLowerCase().indexOf(needle.toLowerCase());
  if (idx === -1) return haystack.slice(0, maxLen) + (haystack.length > maxLen ? "…" : "");

  const start = Math.max(0, idx - 80);
  const end = Math.min(haystack.length, idx + needle.length + 220);
  let text = haystack.slice(start, end);
  if (start > 0) text = "…" + text;
  if (end < haystack.length) text = text + "…";
  return text;
}

/**
 * Very simple TF-style relevance score: counts how many times `terms` appear
 * in `content`, weighted by whether the term appears in the heading.
 */
function scoreEntry(entry: SubjectEntry, terms: string[]): number {
  const body = normalise(entry.content);
  const heading = normalise(entry.name + " " + entry.grade);
  let score = 0;
  for (const t of terms) {
    const nt = normalise(t);
    // Each occurrence in body adds 1
    score += (body.match(new RegExp(nt, "g")) ?? []).length;
    // A match in the heading or subject name is worth 10×
    if (heading.includes(nt)) score += 10;
  }
  return score;
}

/**
 * Search curriculum entries and return ranked results.
 *
 * @param entries   Full curriculum loaded by curriculum-loader
 * @param query     Free-text search query
 * @param gradeFilter  Optional grade to restrict results to
 * @param maxResults   Maximum number of results to return (default 10)
 */
export function searchEntries(
  entries: SubjectEntry[],
  query: string,
  gradeFilter?: string,
  maxResults = 10
): SearchResult[] {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const candidates = gradeFilter
    ? entries.filter(
        (e) => normalise(e.grade) === normalise(gradeFilter)
      )
    : entries;

  const scored = candidates
    .map((e) => ({
      subject: e.name,
      grade: e.grade,
      phase: e.phase,
      filename: e.filename,
      excerpt: excerpt(e.content, terms[0]),
      score: scoreEntry(e, terms),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored;
}

/**
 * Find a single subject entry matching `subjectName` (and optionally `grade`).
 * Returns the best match or undefined.
 */
export function findSubject(
  entries: SubjectEntry[],
  subjectName: string,
  grade?: string
): SubjectEntry | undefined {
  const ns = normalise(subjectName);

  const candidates = grade
    ? entries.filter((e) => normalise(e.grade) === normalise(grade))
    : entries;

  // Prefer exact name match
  const exact = candidates.find((e) => normalise(e.name) === ns);
  if (exact) return exact;

  // Fall back to partial match
  return candidates.find(
    (e) => normalise(e.name).includes(ns) || ns.includes(normalise(e.name))
  );
}
