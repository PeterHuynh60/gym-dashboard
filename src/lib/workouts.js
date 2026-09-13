import { pb, pbDateTime } from './pocketbase'
import { addDays, dateKey, nextOrSameWeekday, startOfDay } from './dates'

// --- Sessions -----------------------------------------------------------

// Finds the session for the given date, or creates one if this is the
// first thing (planned or logged) attached to that date.
export async function getOrCreateSessionForDate(uid, date) {
  const start = startOfDay(date)
  const iso = pbDateTime(start)
  const existing = await pb
    .collection('sessions')
    .getFullList({ filter: pb.filter('user = {:uid} && date = {:date}', { uid, date: iso }) })
  if (existing.length > 0) return existing[0].id
  const created = await pb.collection('sessions').create({
    user: uid,
    sheetName: start.toLocaleDateString('en-US'),
    date: iso,
    tags: [],
  })
  return created.id
}

// Real-time subscription to a single date's session + its exercise entries.
// Calls onChange({ sessionId, entries }) whenever anything changes.
// entries is [] and sessionId is null if nothing exists for that date yet.
// (PocketBase's realtime events are per-record deltas, not full result
// sets, so on any matching change we just refetch the whole filtered list
// — simplest correct approach at this app's scale.)
export function subscribeToDate(uid, date, onChange) {
  const filter = pb.filter('user = {:uid} && date = {:date}', { uid, date: pbDateTime(startOfDay(date)) })
  return subscribeWithRefetch('exerciseEntries', filter, (entries) => {
    entries.sort((a, b) => a.exercise.localeCompare(b.exercise))
    const sessionId = entries[0]?.session ?? null
    onChange({ sessionId, entries })
  })
}

// Real-time subscription to all entries whose date falls within
// [rangeStart, rangeEnd] (inclusive), for building calendar-grid status.
export function subscribeToRange(uid, rangeStart, rangeEnd, onChange) {
  const filter = pb.filter('user = {:uid} && date >= {:start} && date <= {:end}', {
    uid,
    start: pbDateTime(startOfDay(rangeStart)),
    end: pbDateTime(startOfDay(rangeEnd)),
  })
  return subscribeWithRefetch('exerciseEntries', filter, onChange)
}

// Shared plumbing for both subscriptions above: fetch once immediately,
// then re-fetch on every realtime event matching the filter. Handles the
// case where the component unmounts before the async subscribe resolves.
function subscribeWithRefetch(collection, filter, onChange) {
  let unsub = null
  let cancelled = false

  async function refetch() {
    const entries = await pb.collection(collection).getFullList({ filter })
    onChange(entries)
  }

  refetch()
  pb.collection(collection)
    .subscribe('*', refetch, { filter })
    .then((fn) => {
      if (cancelled) fn()
      else unsub = fn
    })

  return () => {
    cancelled = true
    if (unsub) unsub()
  }
}

// Groups a flat list of entries (from subscribeToRange) by day, returning
// Map<dateKey, 'planned' | 'partial' | 'done'>:
//   planned = every entry for that day still has zero sets logged
//   done    = every entry has at least one set logged
//   partial = a mix of the two
export function summarizeEntriesByDate(entries) {
  const byDate = new Map()
  for (const entry of entries) {
    if (!entry.date) continue
    const key = dateKey(new Date(entry.date))
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(entry)
  }
  const statusByDate = new Map()
  for (const [key, dayEntries] of byDate) {
    const loggedCount = dayEntries.filter((e) => (e.sets?.length ?? 0) > 0).length
    if (loggedCount === 0) statusByDate.set(key, 'planned')
    else if (loggedCount === dayEntries.length) statusByDate.set(key, 'done')
    else statusByDate.set(key, 'partial')
  }
  return statusByDate
}

// --- Entries --------------------------------------------------------------

export async function getOrCreateEntryForDate(uid, sessionId, date, exerciseName, plan = {}) {
  const existing = await pb.collection('exerciseEntries').getFullList({
    filter: pb.filter('session = {:sessionId} && exercise = {:exercise}', { sessionId, exercise: exerciseName }),
  })
  if (existing.length > 0) {
    const entry = existing[0]
    const hasLoggedSets = (entry.sets?.length ?? 0) > 0
    if (!hasLoggedSets) {
      // Refresh plan fields the caller actually specified (e.g. relinking
      // to a freshly recreated program) — but never touch anything once
      // real sets have been logged, and never blank a field just because
      // this particular caller didn't mention it (an ad hoc logSet() call
      // passes no plan at all).
      const updates = {}
      for (const key of ['day', 'setsPlanned', 'weightPlanned', 'repGoal']) {
        if (plan[key] !== undefined) updates[key] = plan[key]
      }
      if (plan.programId !== undefined) updates.program = plan.programId
      if (Object.keys(updates).length > 0) {
        await pb.collection('exerciseEntries').update(entry.id, updates)
      }
    }
    return entry.id
  }
  const start = startOfDay(date)
  const created = await pb.collection('exerciseEntries').create({
    user: uid,
    session: sessionId,
    program: plan.programId ?? null,
    day: plan.day ?? '',
    date: pbDateTime(start),
    tags: [],
    sheetName: start.toLocaleDateString('en-US'),
    exercise: exerciseName,
    setsPlanned: plan.setsPlanned ?? '',
    weightPlanned: plan.weightPlanned ?? '',
    repGoal: plan.repGoal ?? '',
    resultsRaw: '',
    sets: [],
    rpeOverall: '',
    video: '',
    notes: '',
  })
  return created.id
}

async function appendSet(entryId, set) {
  const entry = await pb.collection('exerciseEntries').getOne(entryId)
  const sets = [...(entry.sets ?? []), set]
  await pb.collection('exerciseEntries').update(entryId, { sets })
  return sets
}

// Logs one ad hoc set: finds/creates the session + entry for this
// exercise on the given date, then appends the set. Used for both
// "today, freeform" (default date = now) and adding an exercise beyond
// what a program planned for that day.
export async function logSet(uid, { date = new Date(), exercise, weight, unit, reps, rpe, rir, notes }) {
  const sessionId = await getOrCreateSessionForDate(uid, date)
  const entryId = await getOrCreateEntryForDate(uid, sessionId, date, exercise)
  const set = buildSet({ weight, unit, reps, rpe, rir, notes })
  await appendSet(entryId, set)
  await addToExerciseCatalog(uid, exercise)
  return { sessionId, entryId, set }
}

// Logs a set against an entry that already exists (e.g. a planned
// exercise from a scheduled program day) — no exercise-name lookup needed.
export async function logSetOnEntry(uid, entryId, { weight, unit, reps, rpe, rir, notes }) {
  const set = buildSet({ weight, unit, reps, rpe, rir, notes })
  await appendSet(entryId, set)
  return set
}

// Removes a single exercise entry entirely (both planned target and any
// sets already logged against it) — e.g. clearing something a block
// scheduled that you don't want to do that day.
export async function deleteEntry(uid, entryId) {
  await pb.collection('exerciseEntries').delete(entryId)
}

// Read-only preview of what deleteEntriesByProgram would remove, so
// callers can warn before losing real logged data.
export async function countEntriesByProgram(uid, programId) {
  const entries = await pb.collection('exerciseEntries').getFullList({
    filter: pb.filter('user = {:uid} && program = {:pid}', { uid, pid: programId }),
  })
  const withLoggedSets = entries.filter((e) => (e.sets?.length ?? 0) > 0).length
  return { total: entries.length, withLoggedSets }
}

// Removes every exercise entry a given program (block or simple) scheduled,
// across all dates — i.e. "undo the scheduling" without necessarily
// deleting the program definition itself.
export async function deleteEntriesByProgram(uid, programId) {
  const entries = await pb.collection('exerciseEntries').getFullList({
    filter: pb.filter('user = {:uid} && program = {:pid}', { uid, pid: programId }),
  })
  for (const entry of entries) {
    await pb.collection('exerciseEntries').delete(entry.id)
  }
}

// Moves every exercise entry scheduled on `fromDate` to `toDate` — e.g.
// "I planned Monday but I'm actually going Tuesday." Works whether the
// entries are still Planned or already have logged sets (a logged workout
// can legitimately need its date corrected too). If `toDate` already has
// entries of its own, the moved ones just join them under the same
// session rather than conflicting.
export async function moveDay(uid, fromDate, toDate) {
  const fromIso = pbDateTime(startOfDay(fromDate))
  const entries = await pb
    .collection('exerciseEntries')
    .getFullList({ filter: pb.filter('user = {:uid} && date = {:date}', { uid, date: fromIso }) })
  if (entries.length === 0) return { moved: 0 }

  const toSessionId = await getOrCreateSessionForDate(uid, toDate)
  const toIso = pbDateTime(startOfDay(toDate))
  for (const entry of entries) {
    await pb.collection('exerciseEntries').update(entry.id, { date: toIso, session: toSessionId })
  }
  return { moved: entries.length }
}

function buildSet({ weight, unit, reps, rpe, rir, notes }) {
  const set = {}
  if (weight !== '' && weight != null) set.weight = Number(weight)
  if (unit) set.unit = unit
  if (reps !== '' && reps != null) set.reps = Number(reps)
  if (rpe !== '' && rpe != null) set.rpe = Number(rpe)
  if (rir !== '' && rir != null) set.rir = Number(rir)
  if (notes) set.setNotes = notes
  return set
}

// --- Exercise catalog (autocomplete) --------------------------------------

export async function addToExerciseCatalog(uid, exerciseName) {
  const name = exerciseName.trim()
  if (!name) return
  const existing = await pb
    .collection('exercises')
    .getFullList({ filter: pb.filter('user = {:uid} && name = {:name}', { uid, name }) })
  if (existing.length === 0) {
    await pb.collection('exercises').create({ user: uid, name })
  }
}

export async function listExerciseCatalog(uid) {
  const records = await pb.collection('exercises').getFullList({
    filter: pb.filter('user = {:uid}', { uid }),
    sort: 'name',
  })
  return records.map((r) => r.name)
}

// --- Scheduling from a program --------------------------------------------

// Assigns a program's day template to a calendar date: creates the
// session (if needed) and one planned (sets: []) entry per exercise in
// the template. Safe to call again for the same date/template — existing
// entries for the same exercise are left alone rather than duplicated.
export async function scheduleDayTemplate(uid, date, program, templateIndex) {
  const template = program.dayTemplates[templateIndex]
  const sessionId = await getOrCreateSessionForDate(uid, date)
  for (const ex of template.exercises) {
    await getOrCreateEntryForDate(uid, sessionId, date, ex.exercise, {
      day: template.label,
      setsPlanned: ex.setsPlanned,
      weightPlanned: ex.weightPlanned,
      repGoal: ex.repGoal,
      programId: program.id,
    })
  }
  return sessionId
}

// Older programs store a flat `dayTemplates` array (repeats identically
// every time you schedule it). Block-built programs store `weeks`, each
// with its own dayTemplates. This normalizes either shape to a weeks array
// so calling code doesn't need to care which kind of program it has.
export function programWeeks(program) {
  if (program.weeks?.length) return program.weeks
  if (program.dayTemplates?.length) return [{ label: program.name, dayTemplates: program.dayTemplates }]
  return []
}

// Bulk-schedules every week/day of a multi-week block starting on
// `startDate`. `weekdayByDayLabel` maps each day template's label (e.g.
// "Day 1") to a weekday number (0=Sun..6=Sat). Walks the weeks in order,
// assigning each day to the next matching weekday on/after a moving
// cursor, so later weeks naturally land after earlier ones.
export async function scheduleBlock(uid, program, { startDate, weekdayByDayLabel }) {
  let cursor = startOfDay(startDate)
  const scheduled = []
  for (const week of programWeeks(program)) {
    for (const day of week.dayTemplates) {
      const weekday = weekdayByDayLabel[day.label]
      const date = weekday == null ? cursor : nextOrSameWeekday(cursor, weekday)
      const sessionId = await getOrCreateSessionForDate(uid, date)
      for (const ex of day.exercises) {
        await getOrCreateEntryForDate(uid, sessionId, date, ex.exercise, {
          day: week.label ? `${week.label} · ${day.label}` : day.label,
          setsPlanned: ex.setsPlanned,
          weightPlanned: ex.weightPlanned,
          repGoal: ex.repGoal,
          programId: program.id,
        })
      }
      scheduled.push({ date, weekLabel: week.label, dayLabel: day.label })
      cursor = addDays(date, 1)
    }
  }
  return scheduled
}
