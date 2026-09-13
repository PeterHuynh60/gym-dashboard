import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { createProgram, updateProgram } from '../lib/programs'
import {
  buildWeeksFromBlock,
  emptyBlockDay,
  emptyBlockExercise,
  suggestDeloadTarget,
  suggestPushTarget,
} from '../lib/blocks'
import { blockTemplateCategories, blockTemplates } from '../lib/blockTemplates'

const inputCls =
  'min-h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 text-sm'

function ExerciseRow({ ex, rampWeeksCount, onChange, onRemove }) {
  function set(patch) {
    onChange({ ...ex, ...patch })
  }

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
      <div className="flex gap-2">
        <input
          value={ex.exercise}
          onChange={(e) => set({ exercise: e.target.value })}
          placeholder="Exercise"
          className={`${inputCls} flex-1`}
        />
        <select value={ex.mode} onChange={(e) => set({ mode: e.target.value })} className={inputCls}>
          <option value="rpe">RPE-based</option>
          <option value="weight">Weight-based</option>
          <option value="static">Fixed (no progression)</option>
        </select>
        <button type="button" onClick={onRemove} className="min-h-10 px-2 text-sm text-red-600">
          &times;
        </button>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">Ramp weeks (1–{rampWeeksCount})</p>
        <div className="grid grid-cols-4 gap-2">
          <input
            value={ex.rampSets}
            onChange={(e) => set({ rampSets: e.target.value })}
            placeholder="Sets"
            className={inputCls}
          />
          <input
            value={ex.rampReps}
            onChange={(e) => set({ rampReps: e.target.value })}
            placeholder="Reps"
            className={inputCls}
          />
          {ex.mode === 'rpe' && (
            <>
              <input
                value={ex.startRpe}
                onChange={(e) => set({ startRpe: e.target.value })}
                placeholder="Start RPE"
                className={inputCls}
              />
              <input
                value={ex.rpeIncrement}
                onChange={(e) => set({ rpeIncrement: e.target.value })}
                placeholder="+RPE/wk"
                className={inputCls}
              />
            </>
          )}
          {ex.mode === 'weight' && (
            <>
              <div className="flex gap-1 col-span-1">
                <input
                  value={ex.startWeight}
                  onChange={(e) => set({ startWeight: e.target.value })}
                  placeholder="Start wt"
                  className={`${inputCls} w-full`}
                />
                <select value={ex.unit} onChange={(e) => set({ unit: e.target.value })} className={inputCls}>
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                </select>
              </div>
              <input
                value={ex.weightIncrement}
                onChange={(e) => set({ weightIncrement: e.target.value })}
                placeholder="+wt/wk"
                className={inputCls}
              />
            </>
          )}
          {ex.mode === 'static' && (
            <input
              value={ex.staticTarget}
              onChange={(e) => set({ staticTarget: e.target.value })}
              placeholder="e.g. 2RIR"
              className="col-span-2"
            />
          )}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">Push week</p>
        <div className="grid grid-cols-4 gap-2">
          <input
            value={ex.pushSets}
            onChange={(e) => set({ pushSets: e.target.value })}
            placeholder="Sets"
            className={inputCls}
          />
          <input
            value={ex.pushReps}
            onChange={(e) => set({ pushReps: e.target.value })}
            placeholder="Reps"
            className={inputCls}
          />
          <input
            value={ex.pushTarget}
            onChange={(e) => set({ pushTarget: e.target.value })}
            placeholder="Target"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => set({ pushTarget: suggestPushTarget(ex, rampWeeksCount) })}
            className="min-h-10 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
          >
            Suggest
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">Deload week</p>
        <div className="grid grid-cols-4 gap-2">
          <input
            value={ex.deloadSets}
            onChange={(e) => set({ deloadSets: e.target.value })}
            placeholder="Sets"
            className={inputCls}
          />
          <input
            value={ex.deloadReps}
            onChange={(e) => set({ deloadReps: e.target.value })}
            placeholder="Reps"
            className={inputCls}
          />
          <input
            value={ex.deloadReduction}
            onChange={(e) => set({ deloadReduction: e.target.value })}
            placeholder={ex.mode === 'weight' ? '% lighter' : 'RPE lower'}
            className={inputCls}
          />
          <input
            value={ex.deloadTarget}
            onChange={(e) => set({ deloadTarget: e.target.value })}
            placeholder="Target"
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={() => set({ deloadTarget: suggestDeloadTarget(ex) })}
          className="mt-2 min-h-9 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium"
        >
          Suggest deload target
        </button>
      </div>
    </div>
  )
}

export default function BlockBuilder({ existing, onClose }) {
  const { user } = useAuth()
  const [step, setStep] = useState(existing ? 'form' : 'categories') // 'categories' | 'templates' | 'form'
  const [activeCategory, setActiveCategory] = useState(null)
  const [name, setName] = useState(existing?.name ?? '')
  const [rampWeeksCount, setRampWeeksCount] = useState(4)
  const [days, setDays] = useState([emptyBlockDay()])
  const [taperBeforeTest, setTaperBeforeTest] = useState(false)
  const [saving, setSaving] = useState(false)

  function startFromTemplate(template) {
    const withSuggestions = template.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((ex) => ({
        ...ex,
        pushTarget: ex.pushTarget || suggestPushTarget(ex, template.rampWeeksCount),
        deloadTarget: ex.deloadTarget || suggestDeloadTarget(ex),
      })),
    }))
    setName(template.name)
    setRampWeeksCount(template.rampWeeksCount)
    setDays(withSuggestions)
    setTaperBeforeTest(!!template.taperBeforeTest)
    setStep('form')
  }

  function startBlank() {
    setName('')
    setRampWeeksCount(4)
    setDays([emptyBlockDay()])
    setTaperBeforeTest(false)
    setStep('form')
  }

  if (step === 'categories') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-neutral-500 mb-2">What kind of block do you want to build?</p>
        {blockTemplateCategories.map((c) => {
          const count = blockTemplates.filter((t) => t.category === c.id).length
          if (count === 0) return null
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCategory(c.id)
                setStep('templates')
              }}
              className="w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-brand-500"
            >
              <p className="font-medium">{c.label}</p>
              <p className="text-sm text-neutral-500 mt-0.5">{c.description}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {count} template{count === 1 ? '' : 's'}
              </p>
            </button>
          )
        })}
        <button
          type="button"
          onClick={startBlank}
          className="w-full min-h-12 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-medium"
        >
          + Start from blank
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 text-base font-medium"
        >
          Cancel
        </button>
      </div>
    )
  }

  if (step === 'templates') {
    const category = blockTemplateCategories.find((c) => c.id === activeCategory)
    const templates = blockTemplates.filter((t) => t.category === activeCategory)
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setStep('categories')}
          className="text-sm font-medium text-neutral-500 mb-1"
        >
          &larr; Back to categories
        </button>
        <p className="text-sm text-neutral-500 mb-2">{category?.label} — pick a starting point</p>
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => startFromTemplate(t)}
            className="w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 hover:border-brand-500"
          >
            <p className="font-medium">{t.name}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{t.description}</p>
            <p className="text-xs text-neutral-400 mt-1">
              {t.days.length} day{t.days.length === 1 ? '' : 's'}/week · {t.rampWeeksCount} ramp weeks + push + deload
            </p>
          </button>
        ))}
        <button
          type="button"
          onClick={startBlank}
          className="w-full min-h-12 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-medium"
        >
          + Start from blank
        </button>
      </div>
    )
  }

  function updateDay(i, patch) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  }

  function updateExercise(di, ei, ex) {
    setDays((prev) =>
      prev.map((d, idx) => (idx !== di ? d : { ...d, exercises: d.exercises.map((e, j) => (j === ei ? ex : e)) })),
    )
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const cleanDays = days.filter((d) => d.label.trim() && d.exercises.some((ex) => ex.exercise.trim()))
      const weeks = buildWeeksFromBlock({ rampWeeksCount: Number(rampWeeksCount), days: cleanDays, taperBeforeTest })
      if (existing) {
        await updateProgram(user.uid, existing.id, { name, weeks })
      } else {
        await createProgram(user.uid, { name, weeks })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Block name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ramp weeks</label>
          <input
            type="number"
            min="1"
            max="8"
            value={rampWeeksCount}
            onChange={(e) => setRampWeeksCount(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-4 text-base"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={taperBeforeTest}
          onChange={(e) => setTaperBeforeTest(e.target.checked)}
          className="h-4 w-4"
        />
        This is competition prep — taper comes before the test, not after
      </label>

      <p className="text-sm text-neutral-500">
        {rampWeeksCount} ramp week{Number(rampWeeksCount) === 1 ? '' : 's'}, then{' '}
        {taperBeforeTest ? '1 taper week, then 1 meet/test week' : '1 push week, then 1 deload week'} —{' '}
        {Number(rampWeeksCount) + 2} weeks total.
      </p>

      {days.map((day, di) => (
        <div key={di} className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={day.label}
              onChange={(e) => updateDay(di, { label: e.target.value })}
              placeholder="Day 1"
              required
              className="flex-1 min-h-11 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-base font-medium"
            />
            {days.length > 1 && (
              <button
                type="button"
                onClick={() => setDays((prev) => prev.filter((_, i) => i !== di))}
                className="min-h-11 px-3 text-sm text-red-600"
              >
                Remove day
              </button>
            )}
          </div>

          <div className="space-y-3">
            {day.exercises.map((ex, ei) => (
              <ExerciseRow
                key={ei}
                ex={ex}
                rampWeeksCount={Number(rampWeeksCount)}
                onChange={(next) => updateExercise(di, ei, next)}
                onRemove={() => updateDay(di, { exercises: day.exercises.filter((_, j) => j !== ei) })}
              />
            ))}
            <button
              type="button"
              onClick={() => updateDay(di, { exercises: [...day.exercises, emptyBlockExercise()] })}
              className="min-h-10 px-3 text-sm font-medium text-neutral-600 dark:text-neutral-400"
            >
              + Add exercise
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setDays((prev) => [...prev, emptyBlockDay()])}
        className="w-full min-h-11 rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-sm font-medium"
      >
        + Add day
      </button>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 min-h-12 rounded-lg border border-neutral-300 dark:border-neutral-700 text-base font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 min-h-12 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-base font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save block'}
        </button>
      </div>
    </form>
  )
}
