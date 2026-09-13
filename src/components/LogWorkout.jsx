import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { listExerciseCatalog, logSet } from '../lib/workouts'

// Freeform "add an exercise and log a set" form. Defaults to today, but
// accepts any date so it can be reused from a Day view for past/future
// dates (e.g. adding something outside what a program planned for that day).
export default function LogWorkout({ date = new Date(), compact = false }) {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [exercise, setExercise] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('lb')
  const [reps, setReps] = useState('')
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')
  const [loggedToday, setLoggedToday] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listExerciseCatalog(user.uid).then(setCatalog).catch(console.error)
  }, [user.uid])

  const suggestions = useMemo(() => {
    if (!exercise) return []
    const q = exercise.toLowerCase()
    return catalog.filter((name) => name.toLowerCase().includes(q)).slice(0, 8)
  }, [exercise, catalog])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!exercise.trim()) {
      setError('Enter an exercise name.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const result = await logSet(user.uid, {
        date,
        exercise: exercise.trim(),
        weight,
        unit,
        reps,
        rpe,
        notes,
      })
      setLoggedToday((prev) => [
        { exercise: exercise.trim(), weight, unit, reps, rpe, notes },
        ...prev,
      ])
      if (!catalog.includes(exercise.trim())) {
        setCatalog((prev) => [...prev, exercise.trim()].sort())
      }
      // Keep exercise selected (same lift, next set) but clear per-set fields.
      setWeight('')
      setReps('')
      setRpe('')
      setNotes('')
      void result
    } catch (err) {
      console.error(err)
      setError('Could not save that set. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={compact ? '' : 'px-4 py-6 max-w-md mx-auto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Exercise
          </label>
          <input
            type="text"
            value={exercise}
            onChange={(e) => {
              setExercise(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            placeholder="e.g. Barbell Squat"
            className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg">
              {suggestions.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => {
                      setExercise(name)
                      setShowSuggestions(false)
                    }}
                    className="w-full text-left min-h-11 px-4 text-base hover:bg-brand-50 dark:hover:bg-neutral-800"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Weight
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
              />
              <div className="flex rounded-lg border border-neutral-300 dark:border-neutral-700 overflow-hidden shrink-0">
                {['lb', 'kg'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`min-h-12 px-3 text-sm font-medium ${
                      unit === u
                        ? 'bg-brand-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Reps
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            RPE <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min="1"
            max="10"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Notes <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-14 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Log set'}
        </button>
      </form>

      {!compact && loggedToday.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Logged today
          </h2>
          <ul className="space-y-2">
            {loggedToday.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm"
              >
                <span className="font-medium">{s.exercise}</span>
                {s.weight && (
                  <span>
                    {' '}
                    — {s.weight}
                    {s.unit}
                  </span>
                )}
                {s.reps && <span> x {s.reps}</span>}
                {s.rpe && <span> @ {s.rpe} RPE</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
