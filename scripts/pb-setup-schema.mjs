// One-time PocketBase schema setup: creates the collections the app needs
// (sessions, exercises, programs, exerciseEntries), each scoped to a
// `user` relation with access rules equivalent to the old Firestore rule
// `request.auth.uid == userId` — a user can only read/write their own rows.
//
// Usage: node scripts/pb-setup-schema.mjs

import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'https://gym.huynh.place'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error('Set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD env vars.')
  process.exit(1)
}

const pb = new PocketBase(PB_URL)

const OWN_ROW_RULE = 'user = @request.auth.id'
const CREATE_RULE = '@request.auth.id != "" && user = @request.auth.id'

async function ensureCollection(def) {
  try {
    const existing = await pb.collections.getOne(def.name)
    console.log(`Collection "${def.name}" already exists (${existing.id}), skipping.`)
    return existing
  } catch {
    const created = await pb.collections.create(def)
    console.log(`Created collection "${def.name}" (${created.id}).`)
    return created
  }
}

async function main() {
  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
  console.log('Authenticated as superuser.')

  const usersCollection = await pb.collections.getOne('users')

  const sessions = await ensureCollection({
    name: 'sessions',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCollection.id, maxSelect: 1, cascadeDelete: true },
      { name: 'sheetName', type: 'text' },
      { name: 'date', type: 'date' },
      { name: 'tags', type: 'json' },
    ],
    listRule: OWN_ROW_RULE,
    viewRule: OWN_ROW_RULE,
    createRule: CREATE_RULE,
    updateRule: OWN_ROW_RULE,
    deleteRule: OWN_ROW_RULE,
  })

  const exercises = await ensureCollection({
    name: 'exercises',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCollection.id, maxSelect: 1, cascadeDelete: true },
      { name: 'name', type: 'text', required: true },
    ],
    listRule: OWN_ROW_RULE,
    viewRule: OWN_ROW_RULE,
    createRule: CREATE_RULE,
    updateRule: OWN_ROW_RULE,
    deleteRule: OWN_ROW_RULE,
  })

  const programs = await ensureCollection({
    name: 'programs',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCollection.id, maxSelect: 1, cascadeDelete: true },
      { name: 'name', type: 'text', required: true },
      { name: 'dayTemplates', type: 'json' },
      { name: 'weeks', type: 'json' },
    ],
    listRule: OWN_ROW_RULE,
    viewRule: OWN_ROW_RULE,
    createRule: CREATE_RULE,
    updateRule: OWN_ROW_RULE,
    deleteRule: OWN_ROW_RULE,
  })

  await ensureCollection({
    name: 'exerciseEntries',
    type: 'base',
    fields: [
      { name: 'user', type: 'relation', required: true, collectionId: usersCollection.id, maxSelect: 1, cascadeDelete: true },
      { name: 'session', type: 'relation', required: true, collectionId: sessions.id, maxSelect: 1, cascadeDelete: true },
      { name: 'program', type: 'relation', collectionId: programs.id, maxSelect: 1, cascadeDelete: false },
      { name: 'day', type: 'text' },
      { name: 'date', type: 'date' },
      { name: 'tags', type: 'json' },
      { name: 'sheetName', type: 'text' },
      { name: 'exercise', type: 'text', required: true },
      { name: 'setsPlanned', type: 'text' },
      { name: 'weightPlanned', type: 'text' },
      { name: 'repGoal', type: 'text' },
      { name: 'resultsRaw', type: 'text' },
      { name: 'sets', type: 'json' },
      { name: 'rpeOverall', type: 'text' },
      { name: 'video', type: 'text' },
      { name: 'notes', type: 'text' },
    ],
    listRule: OWN_ROW_RULE,
    viewRule: OWN_ROW_RULE,
    createRule: CREATE_RULE,
    updateRule: OWN_ROW_RULE,
    deleteRule: OWN_ROW_RULE,
  })

  console.log('Schema setup complete.')
  console.log('exercises catalog id:', exercises.id)
}

main().catch((err) => {
  console.error(err?.response ?? err)
  process.exit(1)
})
