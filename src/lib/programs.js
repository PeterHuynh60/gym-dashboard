import { pb } from './pocketbase'

// A "simple" program (single repeating week) looks like:
// {
//   name: 'Standard split',
//   dayTemplates: [
//     { label: 'Day 1', exercises: [{ exercise, setsPlanned, weightPlanned, repGoal }, ...] },
//     { label: 'Day 2', exercises: [...] },
//   ],
// }
//
// A block (built via the Block Builder, multiple distinct weeks) instead
// stores `weeks`, each shaped like a simple program's dayTemplates:
// {
//   name: 'Powerlifting Block 1',
//   weeks: [
//     { label: 'Week 1 (Ramp)', type: 'ramp', dayTemplates: [...] },
//     { label: 'Week 2 (Ramp)', type: 'ramp', dayTemplates: [...] },
//     { label: 'Week 5 (Push)', type: 'push', dayTemplates: [...] },
//     { label: 'Week 6 (Deload)', type: 'deload', dayTemplates: [...] },
//   ],
// }

export function subscribeToPrograms(uid, onChange) {
  const filter = pb.filter('user = {:uid}', { uid })
  let unsub = null
  let cancelled = false

  async function refetch() {
    const records = await pb.collection('programs').getFullList({ filter, sort: '-created' })
    onChange(records)
  }

  refetch()
  pb.collection('programs')
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

export async function createProgram(uid, data) {
  const record = await pb.collection('programs').create({ ...data, user: uid })
  return record.id
}

export async function updateProgram(uid, programId, data) {
  await pb.collection('programs').update(programId, data)
}

export async function deleteProgram(uid, programId) {
  await pb.collection('programs').delete(programId)
}
