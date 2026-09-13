import PocketBase from 'pocketbase'

const PB_URL = process.env.PB_URL || 'https://gym.huynh.place'
const pb = new PocketBase(PB_URL)

async function main() {
  await pb.collection('_superusers').authWithPassword(
    process.env.PB_ADMIN_EMAIL,
    process.env.PB_ADMIN_PASSWORD,
  )
  const user = await pb.collection('users').create({
    email: process.env.APP_USER_EMAIL,
    password: process.env.APP_USER_PASSWORD,
    passwordConfirm: process.env.APP_USER_PASSWORD,
    emailVisibility: true,
    verified: true,
  })
  console.log('Created user:', user.id, user.email)
}

main().catch((err) => {
  console.error(err?.response ?? err)
  process.exit(1)
})
