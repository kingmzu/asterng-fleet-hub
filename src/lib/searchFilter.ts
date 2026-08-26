/**
 * Helpers for safely building PostgREST filter strings from user input.
 *
 * PostgREST parses `.or()` arguments as filter syntax, so raw user text must be
 * stripped of characters that could inject additional filter clauses/operators.
 */

/** Remove PostgREST filter metacharacters and clamp length. */
export const sanitizeSearchTerm = (input: string, maxLength = 100): string =>
  input
    .replace(/[,().*%\\"'&|:\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

/** Build a safe `col.ilike.%term%` OR filter across the given columns. */
export const buildIlikeOrFilter = (columns: string[], term: string): string | null => {
  const safe = sanitizeSearchTerm(term);
  if (!safe) return null;
  return columns.map((col) => `${col}.ilike.%${safe}%`).join(',');
};
