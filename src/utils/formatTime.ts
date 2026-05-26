// src/utils/formatTime.ts
//
// Shared AM/PM time formatting used wherever sessions are displayed.
// Times in the store are 24-hour "HH:mm" strings. Falsy inputs (missing
// endTime, etc.) return '' so callers can compose ranges without rendering
// the literal string "null".

export function formatTime(t?: string | null): string {
  if (!t) return ''
  const [hStr, mStr] = t.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h)) return ''
  const period = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return m && !isNaN(m)
    ? `${hh}:${String(m).padStart(2, '0')} ${period}`
    : `${hh} ${period}`
}

export function formatTimeRange(start?: string | null, end?: string | null): string {
  const s = formatTime(start)
  const e = formatTime(end)
  if (s && e) return `${s} – ${e}`
  return s || e
}
