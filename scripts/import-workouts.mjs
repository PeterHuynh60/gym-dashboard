// One-time import of data/trainer_workouts.json into Firestore.
//
// Uses the Firebase Admin SDK, which bypasses security rules entirely —
// appropriate here because this is a bulk historical import run once from
// a trusted machine, not something end users trigger.
//
// Usage:
//   TARGET_UID=<your-auth-uid> node scripts/import-workouts.mjs
//
// Requires service-account.json in the project root (Firebase console ->
// Project settings -> Service accounts -> Generate new private key).
// That file and the UID are both gitignored/never committed.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const targetUid = process.env.TARGET_UID
if (!targetUid) {
  console.error('Missing TARGET_UID. Usage: TARGET_UID=<uid> node scripts/import-workouts.mjs')
  process.exit(1)
}

const serviceAccountPath = path.join(projectRoot, 'service-account.json')
let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
} catch (err) {
  console.error(`Could not read service-account.json at ${serviceAccountPath}`)
  console.error(err.message)
  process.exit(1)
}

initializeApp({
  credential: cert(serviceAccount),
})

const db = getFirestore()

const dataPath = path.join(projectRoot, 'data', 'trainer_workouts.json')
const sheets = JSON.parse(readFileSync(dataPath, 'utf8'))

// Firestore batches cap at 500 writes; chunk to stay safely under that.
async function commitInChunks(writeFns, chunkSize = 400) {
  let total = 0
  for (let i = 0; i < writeFns.length; i += chunkSize) {
    const chunk = writeFns.slice(i, i + chunkSize)
    const batch = db.batch()
    for (const fn of chunk) fn(batch)
    await batch.commit()
    total += chunk.length
    console.log(`  committed ${total}/${writeFns.length}`)
  }
}

async function main() {
  const sessionsCol = db.collection('users').doc(targetUid).collection('sessions')
  const entriesCol = db.collection('users').doc(targetUid).collection('exerciseEntries')

  console.log(`Importing ${sheets.length} sessions for uid ${targetUid}...`)

  const sessionWrites = []
  const entryWrites = []

  for (const sheet of sheets) {
    const sessionRef = sessionsCol.doc()
    const sessionDate = sheet.date ? new Date(sheet.date) : null

    sessionWrites.push((batch) =>
      batch.set(sessionRef, {
        sheetName: sheet.sheet_name,
        date: sessionDate,
        tags: sheet.tags ?? [],
      }),
    )

    for (const [day, exercises] of Object.entries(sheet.days ?? {})) {
      for (const ex of exercises) {
        const entryRef = entriesCol.doc()
        entryWrites.push((batch) =>
          batch.set(entryRef, {
            sessionId: sessionRef.id,
            day,
            date: sessionDate,
            tags: sheet.tags ?? [],
            sheetName: sheet.sheet_name,
            exercise: ex.exercise,
            setsPlanned: ex.sets_planned ?? '',
            weightPlanned: ex.weight_planned ?? '',
            repGoal: ex.rep_goal ?? '',
            resultsRaw: ex.results_raw ?? '',
            sets: ex.sets ?? [],
            rpeOverall: ex.rpe_overall ?? '',
            video: ex.video ?? '',
            notes: ex.notes ?? '',
          }),
        )
      }
    }
  }

  console.log(`Writing ${sessionWrites.length} sessions...`)
  await commitInChunks(sessionWrites)

  console.log(`Writing ${entryWrites.length} exercise entries...`)
  await commitInChunks(entryWrites)

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
