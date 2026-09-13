// Turns a "block spec" JSON file into a real program in Firestore,
// scheduled onto the calendar starting on a given date. This is the piece
// meant to be reused going forward: whatever produces the block-spec JSON
// (an LLM, a script, a human) hands it to this file, which does the actual
// Firestore writing — see scripts/block-schema.md for the JSON contract.
//
// Usage:
//   TARGET_UID=<uid> node scripts/apply-block.mjs <path-to-block-spec.json> [startDate=YYYY-MM-DD]
//
// Requires service-account.json in the project root.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { buildWeeksFromBlock, suggestDeloadTarget, suggestPushTarget } from '../src/lib/blocks.js'
import { addDays, nextOrSameWeekday, startOfDay } from '../src/lib/dates.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const targetUid = process.env.TARGET_UID
const specPath = process.argv[2]
const startDateArg = process.argv[3]

if (!targetUid || !specPath) {
  console.error('Usage: TARGET_UID=<uid> node scripts/apply-block.mjs <block-spec.json> [startDate=YYYY-MM-DD]')
  process.exit(1)
}

const serviceAccount = JSON.parse(
  readFileSync(path.join(projectRoot, 'service-account.json'), 'utf8'),
)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const spec = JSON.parse(readFileSync(path.resolve(specPath), 'utf8'))

// Fill in push/deload targets from the same suggestion formulas the app's
// UI uses, for any exercise that didn't specify one explicitly.
for (const day of spec.days) {
  for (const ex of day.exercises) {
    if (!ex.pushTarget) ex.pushTarget = suggestPushTarget(ex, spec.rampWeeksCount)
    if (!ex.deloadTarget) ex.deloadTarget = suggestDeloadTarget(ex)
  }
}

function validate(spec) {
  const errors = []
  if (!spec.name) errors.push('missing "name"')
  if (!spec.rampWeeksCount || spec.rampWeeksCount < 1) errors.push('"rampWeeksCount" must be >= 1')
  if (!Array.isArray(spec.days) || spec.days.length === 0) errors.push('"days" must be a non-empty array')
  if (!spec.weekdayByDayLabel) errors.push('missing "weekdayByDayLabel"')
  for (const day of spec.days ?? []) {
    if (!day.label) errors.push('a day is missing "label"')
    if (spec.weekdayByDayLabel && !(day.label in spec.weekdayByDayLabel)) {
      errors.push(`"${day.label}" has no entry in weekdayByDayLabel`)
    }
    for (const ex of day.exercises ?? []) {
      if (!ex.exercise) errors.push(`an exercise in "${day.label}" is missing "exercise"`)
      if (!['rpe', 'weight', 'static'].includes(ex.mode)) {
        errors.push(`"${ex.exercise}" has invalid mode "${ex.mode}"`)
      }
    }
  }
  return errors
}

async function getOrCreateSessionForDate(date) {
  const start = startOfDay(date)
  const col = db.collection('users').doc(targetUid).collection('sessions')
  const existing = await col.where('date', '==', Timestamp.fromDate(start)).get()
  if (!existing.empty) return existing.docs[0].id
  const ref = await col.add({
    sheetName: start.toLocaleDateString('en-US'),
    date: Timestamp.fromDate(start),
    tags: [],
    createdAt: Timestamp.now(),
  })
  return ref.id
}

async function getOrCreateEntryForDate(sessionId, date, exerciseName, plan) {
  const col = db.collection('users').doc(targetUid).collection('exerciseEntries')
  const existing = await col
    .where('sessionId', '==', sessionId)
    .where('exercise', '==', exerciseName)
    .get()
  if (!existing.empty) {
    const doc = existing.docs[0]
    const hasLoggedSets = (doc.data().sets?.length ?? 0) > 0
    if (!hasLoggedSets) {
      const updates = {}
      for (const key of ['day', 'setsPlanned', 'weightPlanned', 'repGoal', 'programId']) {
        if (plan[key] !== undefined) updates[key] = plan[key]
      }
      if (Object.keys(updates).length > 0) await doc.ref.update(updates)
    }
    return doc.id
  }
  const start = startOfDay(date)
  const ref = await col.add({
    sessionId,
    day: plan.day ?? null,
    date: Timestamp.fromDate(start),
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
    programId: plan.programId ?? null,
  })
  return ref.id
}

async function main() {
  const errors = validate(spec)
  if (errors.length) {
    console.error('Block spec is invalid:')
    errors.forEach((e) => console.error(`  - ${e}`))
    process.exit(1)
  }

  const weeks = buildWeeksFromBlock({ rampWeeksCount: spec.rampWeeksCount, days: spec.days })

  const programRef = await db
    .collection('users')
    .doc(targetUid)
    .collection('programs')
    .add({ name: spec.name, weeks, createdAt: Date.now() })
  console.log(`Created program "${spec.name}" (${programRef.id}) with ${weeks.length} weeks.`)

  const startDate = startDateArg ? new Date(`${startDateArg}T00:00:00`) : startOfDay(new Date())
  let cursor = startDate
  const scheduled = []
  for (const week of weeks) {
    for (const day of week.dayTemplates) {
      const weekday = spec.weekdayByDayLabel[day.label]
      const date = weekday == null ? cursor : nextOrSameWeekday(cursor, weekday)
      const sessionId = await getOrCreateSessionForDate(date)
      for (const ex of day.exercises) {
        await getOrCreateEntryForDate(sessionId, date, ex.exercise, {
          day: `${week.label} · ${day.label}`,
          setsPlanned: ex.setsPlanned,
          weightPlanned: ex.weightPlanned,
          repGoal: ex.repGoal,
          programId: programRef.id,
        })
      }
      scheduled.push({ date: date.toISOString().slice(0, 10), week: week.label, day: day.label })
      cursor = addDays(date, 1)
    }
  }

  console.log(`Scheduled ${scheduled.length} training days:`)
  for (const s of scheduled) console.log(`  ${s.date} — ${s.week} · ${s.day}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
