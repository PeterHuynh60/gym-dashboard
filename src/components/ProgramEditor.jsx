import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  createProgram,
  deleteProgram,
  subscribeToPrograms,
  updateProgram,
} from '../lib/programs'
import { countEntriesByProgram, deleteEntriesByProgram } from '../lib/workouts'
import BlockBuilder from './BlockBuilder.jsx'
import ProgramDetail from './ProgramDetail.jsx'

const emptyExercise = () => ({ exercise: '', setsPlanned: '', weightPlanned: '', repGoal: '' })
const emptyTemplate = () => ({ label: '', exercises: [emptyExercise()] })

export default function ProgramEditor({ onClose }) {
  const { user } = useAuth()
  const [programs, setPrograms] = useState([])
  const [editingId, setEditingId] = useState(null) // null = not editing, 'new' = creating
  const [showBlockBuilder, setShowBlockBuilder] = useState(false)
  const [name, setName] = useState('')
  const [dayTemplates, setDayTemplates] = useState([emptyTemplate()])
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => subscribeToPrograms(user.uid, setPrograms), [user.uid])

  function startNew() {
    setEditingId('new')
    setName('')
    setDayTemplates([emptyTemplate()])
  }

  async function handleDelete(program) {
    const isBlock = !!program.weeks?.length
    if (!isBlock) {
      if (window.confirm(`Delete "${program.name}"? This only removes the template, not anything already scheduled.`)) {
        await deleteProgram(user.uid, program.id)
      }
      return
    }

    const { total, withLoggedSets } = await countEntriesByProgram(user.uid, program.id)
    const scheduleWarning =
      total === 0
        ? ''
        : withLoggedSets > 0
          ? ` This also removes ${total} scheduled workouts, including ${withLoggedSets} that already have logged sets.`
          : ` This also removes ${total} scheduled (not yet logged) workouts.`
    if (!window.confirm(`Delete "${program.name}"?${scheduleWarning}`)) {
      return
    }
    if (total > 0) {
      await deleteEntriesByProgram(user.uid, program.id)
    }
    await deleteProgram(user.uid, program.id)
  }

  function startEdit(program) {
    setEditingId(program.id)
    setName(program.name)
    setDayTemplates(program.dayTemplates.map((t) => ({ ...t, exercises: t.exercises.map((e) => ({ ...e })) })))
  }

  function updateTemplate(i, patch) {
    setDayTemplates((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  }

  function updateExercise(ti, ei, patch) {
    setDayTemplates((prev) =>
      prev.map((t, idx) =>
        idx !== ti
          ? t
          : { ...t, exercises: t.exercises.map((e, j) => (j === ei ? { ...e, ...patch } : e)) },
      ),
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const cleaned = dayTemplates
        .map((t) => ({ ...t, exercises: t.exercises.filter((ex) => ex.exercise.trim()) }))
        .filter((t) => t.label.trim() && t.exercises.length > 0)
      if (editingId === 'new') {
        await createProgram(user.uid, { name, dayTemplates: cleaned })
      } else {
        await updateProgram(user.uid, editingId, { name, dayTemplates: cleaned })
      }
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  if (showBlockBuilder) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BlockBuilder onClose={() => setShowBlockBuilder(false)} />
      </div>
    )
  }

  if (editingId) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Program name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
            />
          </div>

          {dayTemplates.map((template, ti) => (
            <div key={ti} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="flex items-center gap-2 mb-3">
                <input
                  value={template.label}
                  onChange={(e) => updateTemplate(ti, { label: e.target.value })}
                  placeholder="Day 1"
                  required
                  className="flex-1 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-base font-medium"
                />
                {dayTemplates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDayTemplates((prev) => prev.filter((_, i) => i !== ti))}
                    className="min-h-11 px-3 text-sm text-red-600"
                  >
                    Remove day
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {template.exercises.map((ex, ei) => (
                  <div key={ei} className="grid grid-cols-[1fr_auto] gap-2 items-start">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={ex.exercise}
                        onChange={(e) => updateExercise(ti, ei, { exercise: e.target.value })}
                        placeholder="Exercise"
                        className="col-span-2 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm"
                      />
                      <input
                        value={ex.setsPlanned}
                        onChange={(e) => updateExercise(ti, ei, { setsPlanned: e.target.value })}
                        placeholder="Sets (e.g. 4)"
                        className="min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm"
                      />
                      <input
                        value={ex.repGoal}
                        onChange={(e) => updateExercise(ti, ei, { repGoal: e.target.value })}
                        placeholder="Reps (e.g. 5)"
                        className="min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm"
                      />
                      <input
                        value={ex.weightPlanned}
                        onChange={(e) => updateExercise(ti, ei, { weightPlanned: e.target.value })}
                        placeholder="Target (e.g. 7-8RPE or 70kg)"
                        className="col-span-2 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateTemplate(ti, {
                          exercises: template.exercises.filter((_, j) => j !== ei),
                        })
                      }
                      className="min-h-11 px-2 text-sm text-red-600"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateTemplate(ti, { exercises: [...template.exercises, emptyExercise()] })}
                  className="min-h-10 px-3 text-sm font-medium text-neutral-600 dark:text-neutral-400"
                >
                  + Add exercise
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setDayTemplates((prev) => [...prev, emptyTemplate()])}
            className="w-full min-h-11 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-medium"
          >
            + Add day
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="flex-1 min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 min-h-12 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save program'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Programs</h2>
        <button onClick={onClose} className="text-sm font-medium text-neutral-500">
          Close
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={startNew}
          className="flex-1 min-h-12 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold"
        >
          + New program
        </button>
        <button
          onClick={() => setShowBlockBuilder(true)}
          className="flex-1 min-h-12 rounded-lg border border-brand-500 text-brand-700 dark:text-brand-400 text-base font-semibold"
        >
          + New block
        </button>
      </div>
      <p className="text-xs text-neutral-500 mb-4">
        A program repeats the same days every time you schedule it. A block is a multi-week
        ramp → push → deload cycle with auto-progressing targets.
      </p>

      <ul className="space-y-2">
        {programs.map((p) => {
          const isBlock = !!p.weeks?.length
          const labels = isBlock ? p.weeks.map((w) => w.label) : p.dayTemplates.map((t) => t.label)
          const isExpanded = expandedId === p.id
          return (
            <li key={p.id} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium">
                    {p.name}
                    {isBlock && (
                      <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                        Block
                      </span>
                    )}
                    <span className="ml-2 text-neutral-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </p>
                  <p className="text-sm text-neutral-500">{labels.join(', ')}</p>
                </button>
                <div className="flex gap-3 text-sm shrink-0 ml-2">
                  {!isBlock && (
                    <button
                      onClick={() => startEdit(p)}
                      className="font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      Edit
                    </button>
                  )}
                  <button onClick={() => handleDelete(p)} className="font-medium text-red-600">
                    Delete
                  </button>
                </div>
              </div>

              {isExpanded && <ProgramDetail program={p} />}
            </li>
          )
        })}
        {programs.length === 0 && (
          <p className="text-sm text-neutral-500">No programs yet. Create one to schedule workouts ahead.</p>
        )}
      </ul>
    </div>
  )
}
