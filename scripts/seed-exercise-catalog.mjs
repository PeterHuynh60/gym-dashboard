// One-time seed: populates users/{uid}/exercises with every distinct
// exercise name found in the imported historical data, so the logging UI's
// autocomplete has the full list from day one instead of starting empty.
//
// Usage: TARGET_UID=<uid> node scripts/seed-exercise-catalog.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const targetUid = process.env.TARGET_UID
if (!targetUid) {
  console.error('Missing TARGET_UID. Usage: TARGET_UID=<uid> node scripts/seed-exercise-catalog.mjs')
  process.exit(1)
}

const serviceAccount = JSON.parse(
  readFileSync(path.join(projectRoot, 'service-account.json'), 'utf8'),
)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const sheets = JSON.parse(
  readFileSync(path.join(projectRoot, 'data', 'trainer_workouts.json'), 'utf8'),
)

function slug(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

async function main() {
  const names = new Set()
  for (const sheet of sheets) {
    for (const exercises of Object.values(sheet.days ?? {})) {
      for (const ex of exercises) {
        if (ex.exercise) names.add(ex.exercise.trim())
      }
    }
  }

  console.log(`Seeding ${names.size} distinct exercise names...`)
  const col = db.collection('users').doc(targetUid).collection('exercises')
  const entries = [...names]
  for (let i = 0; i < entries.length; i += 400) {
    const batch = db.batch()
    for (const name of entries.slice(i, i + 400)) {
      batch.set(col.doc(slug(name)), { name }, { merge: true })
    }
    await batch.commit()
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
