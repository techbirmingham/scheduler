// src/utils/findDuplicateByName.ts
//
// Detects an existing record whose name matches an input string after
// normalization. Intentionally just exact case-insensitive matching today —
// no fuzzy / suffix-strip logic. Fuzzy matching has false positives that
// would warrant a softer "warning" UX, which we don't have yet.

export function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

export function findDuplicateByName<T extends { id: string; name: string }>(
  name: string,
  records: T[],
  excludeId?: string | null,
): T | null {
  const norm = normalizeName(name)
  if (!norm) return null
  return (
    records.find(r => r.id !== excludeId && normalizeName(r.name) === norm) ?? null
  )
}
