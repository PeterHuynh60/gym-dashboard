import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { WEEKDAY_LABELS, dateKey } from '../../lib/dates'
import { subscribeToPrograms } from '../../lib/programs'
import { programWeeks, scheduleBlock, scheduleDayTemplate } from '../../lib/workouts'

// Reasonable default spread for up to 4 day labels so the picker isn't
// empty on first open; fully editable before scheduling.
const DEFAULT_WEEKDAYS = [1, 3, 5, 6] // Mon, Wed, Fri, Sat

function BlockScheduler({ program, date, onScheduled }) {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(dateKey(date))
  const [weekdayByDayLabel, setWeekdayByDayLabel] = useState({})
  const [scheduling, setScheduling] = useState(false)

  const dayLabels = useMemo(
    () => [...new Set(programWeeks(program).flatMap((w) => w.dayTemplates.map((d) => d.label)))],
    [program],
  )

  useEffect(() => {
    setWeekdayByDayLabel((prev) => {
      const next = { ...prev }
      dayLabels.forEach((label, i) => {
        if (next[label] == null) next[label] = DEFAULT_WEEKDAYS[i % DEFAULT_WEEKDAYS.length]
      })
      return next
    })
  }, [dayLabels])

  async function handleSchedule() {
    setScheduling(true)
    try {
      await scheduleBlock(user.uid, program, {
        startDate: new Date(`${startDate}T00:00:00`),
        weekdayByDayLabel,
      })
      onScheduled?.()
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div className="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 p-3 space-y-3">
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">Start date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="min-h-10 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-500 mb-1">Which day of the week?</label>
        <div className="space-y-1">
          {dayLabels.map((label) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <span className="text-sm">{label}</span>
              <select
                value={weekdayByDayLabel[label] ?? 1}
                onChange={(e) =>
                  setWeekdayByDayLabel((prev) => ({ ...prev, [label]: Number(e.target.value) }))
                }
                className="min-h-9 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 text-sm"
              >
                {WEEKDAY_LABELS.map((wd, i) => (
                  <option key={i} value={i}>
                    {wd}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={scheduling}
        onClick={handleSchedule}
        className="w-full min-h-11 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50"
      >
        {scheduling ? 'Scheduling...' : `Schedule all ${programWeeks(program).length} weeks`}
      </button>
    </div>
  )
}

export default function ProgramPicker({ date, onScheduled }) {
  const { user } = useAuth()
  const [programs, setPrograms] = useState([])
  const [scheduling, setScheduling] = useState(false)
  const [blockPickerId, setBlockPickerId] = useState(null)

  useEffect(() => subscribeToPrograms(user.uid, setPrograms), [user.uid])

  async function handlePick(program, templateIndex) {
    setScheduling(true)
    try {
      await scheduleDayTemplate(user.uid, date, program, templateIndex)
      onScheduled?.()
    } finally {
      setScheduling(false)
    }
  }

  if (programs.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No programs yet. Create one to schedule workouts ahead of time.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {programs.map((p) => {
        const isBlock = !!p.weeks?.length
        return (
          <div key={p.id}>
            <p className="text-sm font-medium mb-1">{p.name}</p>
            {isBlock ? (
              blockPickerId === p.id ? (
                <BlockScheduler
                  program={p}
                  date={date}
                  onScheduled={() => {
                    setBlockPickerId(null)
                    onScheduled?.()
                  }}
                />
              ) : (
                <button
                  onClick={() => setBlockPickerId(p.id)}
                  className="min-h-10 px-3 rounded-lg border border-brand-500 text-brand-700 dark:text-brand-400 text-sm font-medium"
                >
                  Schedule this block...
                </button>
              )
            ) : (
              <div className="flex flex-wrap gap-2">
                {p.dayTemplates.map((t, i) => (
                  <button
                    key={i}
                    disabled={scheduling}
                    onClick={() => handlePick(p, i)}
                    className="min-h-10 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 text-sm font-medium disabled:opacity-50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
