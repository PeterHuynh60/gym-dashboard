import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { dateKey } from '../../lib/dates'
import { deleteEntry, logSetOnEntry, moveDay, subscribeToDate } from '../../lib/workouts'
import LogWorkout from '../LogWorkout.jsx'
import ProgramPicker from './ProgramPicker.jsx'

function EntryCard({ entry }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('lb')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const hasPlan = entry.setsPlanned || entry.weightPlanned || entry.repGoal
  const isDone = (entry.sets?.length ?? 0) > 0

  async function handleRemove() {
    const message = isDone
      ? `"${entry.exercise}" already has logged sets. Remove it anyway?`
      : `Remove "${entry.exercise}" from this day?`
    if (!window.confirm(message)) return
    await deleteEntry(user.uid, entry.id)
  }

  async function handleLog(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await logSetOnEntry(user.uid, entry.id, { weight, unit, reps, rpe })
      setWeight('')
      setReps('')
      setRpe('')
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium">{entry.exercise}</p>
          {hasPlan && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {entry.setsPlanned && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {entry.setsPlanned} sets
                </span>
              )}
              {entry.repGoal && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {entry.repGoal} reps
                </span>
              )}
              {entry.weightPlanned && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-mono tabular-nums">
                  {entry.weightPlanned}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDone
                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            }`}
          >
            {isDone ? 'Logged' : 'Planned'}
          </span>
          <button
            onClick={handleRemove}
            aria-label={`Remove ${entry.exercise}`}
            className="text-neutral-400 hover:text-red-600 text-lg leading-none min-h-8 min-w-8"
          >
            &times;
          </button>
        </div>
      </div>

      {entry.sets?.length > 0 && (
        <ul className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 space-y-0.5">
          {entry.sets.map((s, i) => (
            <li key={i}>
              {s.weight ? `${s.weight}${s.unit ?? ''}` : ''}
              {s.reps ? ` x ${s.reps}` : ''}
              {s.rpe ? ` @ ${s.rpe} RPE` : ''}
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form onSubmit={handleLog} className="mt-3 grid grid-cols-4 gap-2 items-end">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="Weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="col-span-1 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 text-sm"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="col-span-1 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-1 text-sm"
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="col-span-1 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 text-sm"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            placeholder="RPE"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="col-span-1 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="col-span-4 min-h-11 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save set'}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 min-h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium"
        >
          + Log a set
        </button>
      )}
    </div>
  )
}

export default function DayView({ date, onMoved }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [showMove, setShowMove] = useState(false)
  const [moveTarget, setMoveTarget] = useState('')
  const [moving, setMoving] = useState(false)

  useEffect(() => {
    setLoaded(false)
    const unsub = subscribeToDate(user.uid, date, ({ entries }) => {
      setEntries(entries)
      setLoaded(true)
    })
    return unsub
  }, [user.uid, date])

  async function handleMove(e) {
    e.preventDefault()
    if (!moveTarget) return
    setMoving(true)
    try {
      const newDate = new Date(`${moveTarget}T00:00:00`)
      await moveDay(user.uid, date, newDate)
      setShowMove(false)
      setMoveTarget('')
      onMoved?.(newDate)
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>
        {entries.length > 0 && (
          <button
            onClick={() => setShowMove((v) => !v)}
            className="text-sm font-medium text-neutral-500"
          >
            Move day...
          </button>
        )}
      </div>

      {showMove && (
        <form onSubmit={handleMove} className="mb-4 flex gap-2 items-center rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
          <input
            type="date"
            required
            min={dateKey(new Date())}
            value={moveTarget}
            onChange={(e) => setMoveTarget(e.target.value)}
            className="flex-1 min-h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm"
          />
          <button
            type="submit"
            disabled={moving}
            className="min-h-10 px-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {moving ? 'Moving...' : 'Move'}
          </button>
        </form>
      )}

      {loaded && entries.length === 0 && (
        <div className="mb-6">
          <p className="text-sm text-neutral-500 mb-3">Nothing scheduled for this day yet.</p>
          <ProgramPicker date={date} />
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          Add an exercise
        </h3>
        <LogWorkout date={date} compact />
      </div>
    </div>
  )
}
