// Read-only report of recent training history, used to inform block
// generation (by an LLM, human, or script). Not part of the app itself.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const targetUid = process.env.TARGET_UID
const days = Number(process.env.DAYS ?? 21)

const serviceAccount = JSON.parse(
  readFileSync(path.join(projectRoot, 'service-account.json'), 'utf8'),
)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setHours(0, 0, 0, 0)

  const snap = await db
    .collection('users')
    .doc(targetUid)
    .collection('exerciseEntries')
    .where('date', '>=', Timestamp.fromDate(since))
    .get()

  const entries = snap.docs
    .map((d) => d.data())
    .sort((a, b) => a.date.toMillis() - b.date.toMillis())

  console.log(`Entries since ${since.toISOString().slice(0, 10)}: ${entries.length}\n`)

  const byDate = new Map()
  for (const e of entries) {
    const key = e.date.toDate().toISOString().slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key).push(e)
  }

  for (const [date, dayEntries] of byDate) {
    console.log(`=== ${date} (${dayEntries[0]?.day ?? 'no day label'}) ===`)
    for (const e of dayEntries) {
      const setsStr = (e.sets ?? [])
        .map((s) => `${s.weight ?? ''}${s.unit ?? ''}x${s.reps ?? ''}${s.rpe ? `@${s.rpe}` : ''}`)
        .join(', ')
      console.log(
        `  ${e.exercise} | plan: ${e.setsPlanned || '-'}x${e.repGoal || '-'} @ ${e.weightPlanned || '-'} | actual: ${setsStr || '(not logged)'}`,
      )
    }
  }
}

main().then(() => process.exit(0))
