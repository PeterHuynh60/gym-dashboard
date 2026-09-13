import PocketBase from 'pocketbase'

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'https://gym.huynh.place')

// Persist the auth session across reloads (PocketBase does this by default
// via localStorage, but we disable auto-cancellation of duplicate requests
// since several components legitimately fire similar queries in quick
// succession — e.g. switching calendar views).
pb.autoCancellation(false)

// PocketBase normalizes date-field values to "YYYY-MM-DD HH:mm:ss.sssZ"
// (space, not "T") when *storing* them — but its filter parser requires
// that same space-separated form for date literals in a filter query; the
// standard `Date#toISOString()` output (with "T") silently matches nothing.
// Always use this when building a filter that compares a date field.
export function pbDateTime(date) {
  return date.toISOString().replace('T', ' ')
}

export default pb
