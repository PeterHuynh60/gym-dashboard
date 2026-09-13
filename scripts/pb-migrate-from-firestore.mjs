// One-time migration: copies real historical data (sessions,
// exerciseEntries, exercise catalog) from Firestore into PocketBase.
// Does NOT migrate `programs` — the only one that existed (the test block)
// already has zero linked entries after earlier cleanup, so there's
// nothing real to carry over there.
//
// Usage: PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... APP_USER_ID=... \
//        FIRESTORE_UID=... node scripts/pb-migrate-from-firestore.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import PocketBase from 'pocketbase'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const PB_URL = process.env.PB_URL || 'https://gym.huynh.place'
const firestoreUid = process.env.FIRESTORE_UID
const appUserId = process.env.APP_USER_ID

if (!firestoreUid || !appUserId) {
  console.error('Set FIRESTORE_UID and APP_USER_ID env vars.')
  process.exit(1)
}

const serviceAccount = JSON.parse(readFileSync(path.join(projectRoot, 'service-account.json'), 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const fdb = getFirestore()

const pb = new PocketBase(PB_URL)

function toIso(value) {
  if (!value) return null
  return (value.toDate ? value.toDate() : value).toISOString()
}

async function main() {
  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD)
  console.log('Authenticated as PocketBase superuser.')

  // --- exercises catalog ---
  const exercisesSnap = await fdb.collection('users').doc(firestoreUid).collection('exercises').get()
  console.log(`Migrating ${exercisesSnap.size} exercise catalog entries...`)
  for (const doc of exercisesSnap.docs) {
    await pb.collection('exercises').create({ user: appUserId, name: doc.data().name })
  }

  // --- sessions ---
  const sessionsSnap = await fdb.collection('users').doc(firestoreUid).collection('sessions').get()
  console.log(`Migrating ${sessionsSnap.size} sessions...`)
  const sessionIdMap = new Map() // Firestore doc id -> PocketBase record id
  let count = 0
  for (const doc of sessionsSnap.docs) {
    const d = doc.data()
    const created = await pb.collection('sessions').create({
      user: appUserId,
      sheetName: d.sheetName ?? '',
      date: toIso(d.date),
      tags: d.tags ?? [],
    })
    sessionIdMap.set(doc.id, created.id)
    count++
    if (count % 20 === 0) console.log(`  ${count}/${sessionsSnap.size}`)
  }

  // --- exercise entries ---
  const entriesSnap = await fdb.collection('users').doc(firestoreUid).collection('exerciseEntries').get()
  console.log(`Migrating ${entriesSnap.size} exercise entries...`)
  count = 0
  let skipped = 0
  for (const doc of entriesSnap.docs) {
    const d = doc.data()
    const sessionId = sessionIdMap.get(d.sessionId)
    if (!sessionId) {
      skipped++
      continue
    }
    await pb.collection('exerciseEntries').create({
      user: appUserId,
      session: sessionId,
      program: null, // no programs are migrated (see file header)
      day: d.day != null ? String(d.day) : '',
      date: toIso(d.date),
      tags: d.tags ?? [],
      sheetName: d.sheetName ?? '',
      exercise: d.exercise ?? '',
      setsPlanned: d.setsPlanned ?? '',
      weightPlanned: d.weightPlanned ?? '',
      repGoal: d.repGoal ?? '',
      resultsRaw: d.resultsRaw ?? '',
      sets: d.sets ?? [],
      rpeOverall: d.rpeOverall ?? '',
      video: d.video ?? '',
      notes: d.notes ?? '',
    })
    count++
    if (count % 50 === 0) console.log(`  ${count}/${entriesSnap.size}`)
  }

  console.log(`Done. Migrated ${count} entries, skipped ${skipped} (no matching session).`)
}

main().catch((err) => {
  console.error(err?.response ?? err)
  process.exit(1)
})
