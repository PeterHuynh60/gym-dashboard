export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Sunday-start week containing `date`.
export function startOfWeek(date) {
  const d = startOfDay(date)
  return addDays(d, -d.getDay())
}

export function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

// The 6x7 grid of days a month view needs, including leading/trailing days
// from adjacent months so every week row is full.
export function monthGridDays(date) {
  const gridStart = startOfWeek(startOfMonth(date))
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export function weekDays(date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function workWeekDays(date) {
  const start = addDays(startOfWeek(date), 1) // Monday
  return Array.from({ length: 5 }, (_, i) => addDays(start, i))
}

export function dateKey(date) {
  return startOfDay(date).toISOString().slice(0, 10)
}

// The next date on/after `date` that falls on `weekday` (0=Sun..6=Sat).
// Returns `date` itself if it already matches.
export function nextOrSameWeekday(date, weekday) {
  const d = startOfDay(date)
  const diff = (weekday - d.getDay() + 7) % 7
  return addDays(d, diff)
}
