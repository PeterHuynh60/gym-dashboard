import { WEEKDAY_LABELS, dateKey, isSameDay } from '../../lib/dates'

const STATUS_DOT = {
  planned: 'bg-blue-500',
  partial: 'bg-amber-500',
  done: 'bg-brand-500',
}

// Renders a grid of date cells, one row of 7 (or fewer, for work week).
// `days` is a flat array whose length is a multiple of the row width.
export default function DateGrid({ days, rowLength, currentMonth, today, selectedDate, statusByDate, onSelectDate }) {
  return (
    <div>
      <div className="grid gap-px text-xs font-medium text-neutral-400 mb-1" style={{ gridTemplateColumns: `repeat(${rowLength}, 1fr)` }}>
        {days.slice(0, rowLength).map((d) => (
          <div key={d.toISOString()} className="text-center py-1">
            {WEEKDAY_LABELS[d.getDay()]}
          </div>
        ))}
      </div>
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${rowLength}, 1fr)` }}>
        {days.map((d) => {
          const key = dateKey(d)
          const status = statusByDate.get(key)
          const inMonth = currentMonth == null || d.getMonth() === currentMonth
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`aspect-square min-h-11 flex flex-col items-center justify-center rounded-lg text-sm
                ${isSameDay(d, selectedDate) ? 'ring-2 ring-brand-500' : ''}
                ${isSameDay(d, today) ? 'font-semibold' : ''}
                ${inMonth ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-700'}
              `}
            >
              <span>{d.getDate()}</span>
              {status && <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
