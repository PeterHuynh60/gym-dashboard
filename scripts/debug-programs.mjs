import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const targetUid = process.env.TARGET_UID

const serviceAccount = JSON.parse(readFileSync(path.join(projectRoot, 'service-account.json'), 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function main() {
  const programsSnap = await db.collection('users').doc(targetUid).collection('programs').get()
  console.log(`Programs: ${programsSnap.size}`)
  for (const p of programsSnap.docs) {
    console.log(`  ${p.id} — ${p.data().name} (${p.data().weeks ? 'block' : 'simple'})`)
  }

  console.log('\nExercise entries with a programId set:')
  const entriesSnap = await db.collection('users').doc(targetUid).collection('exerciseEntries').get()
  const withProgramId = entriesSnap.docs.filter((d) => d.data().programId)
  console.log(`  ${withProgramId.length} of ${entriesSnap.size} total entries`)
  const byProgram = new Map()
  for (const d of withProgramId) {
    const pid = d.data().programId
    byProgram.set(pid, (byProgram.get(pid) ?? 0) + 1)
  }
  for (const [pid, count] of byProgram) {
    console.log(`    programId=${pid} -> ${count} entries`)
  }
}

main().then(() => process.exit(0))
