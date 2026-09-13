import { useState } from 'react'
import { groupWeeksForDisplay } from '../lib/blocks'
import { programWeeks } from '../lib/workouts'

// Read-only preview of a program's full schedule, paged one week-group at
// a time (Ramp / Push / Deload, or just one page for a simple program)
// instead of dumping everything in a long scroll.
export default function ProgramDetail({ program }) {
  const groups = groupWeeksForDisplay(programWeeks(program))
  const [index, setIndex] = useState(0)
  const group = groups[index]

  return (
    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
      {groups.length > 1 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="min-h-8 min-w-8 text-neutral-500 disabled:opacity-30"
              aria-label="Previous"
            >
              &larr;
            </button>
            <p className="text-base font-bold text-brand-700 dark:text-brand-400">{group.label}</p>
            <button
              onClick={() => setIndex((i) => Math.min(groups.length - 1, i + 1))}
              disabled={index === groups.length - 1}
              className="min-h-8 min-w-8 text-neutral-500 disabled:opacity-30"
              aria-label="Next"
            >
              &rarr;
            </button>
          </div>
          <div className="flex gap-1 mb-3 overflow-x-auto">
            {groups.map((g, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`min-h-8 px-3 rounded-full text-xs font-medium whitespace-nowrap ${
                  i === index
                    ? 'bg-brand-600 text-white'
                    : 'border border-neutral-300 dark:border-neutral-700 text-neutral-500'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </>
      )}

      {group.dayTemplates.map((day, di) => (
        <div
          key={di}
          className="mb-4 last:mb-0 pb-4 last:pb-0 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">
            {day.label}
          </p>
          <div className="space-y-2.5">
            {day.exercises.map((ex, ei) => (
              <div key={ei} className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {ex.exercise}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xs text-neutral-400">
                    {[ex.setsPlanned, ex.repGoal].filter(Boolean).join(' x ')}
                  </span>
                  {ex.weightPlanned && (
                    <span className="block text-sm font-semibold text-brand-700 dark:text-brand-400 font-mono tabular-nums">
                      {ex.weightPlanned}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
