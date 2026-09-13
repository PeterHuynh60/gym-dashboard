import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  MONTH_LABELS,
  addDays,
  monthGridDays,
  startOfDay,
  weekDays,
  workWeekDays,
} from '../../lib/dates'
import { subscribeToRange, summarizeEntriesByDate } from '../../lib/workouts'
import DateGrid from './DateGrid.jsx'
import DayView from './DayView.jsx'

const VIEWS = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'workweek', label: 'Work Week' },
  { id: 'day', label: 'Day' },
]

export default function CalendarShell() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('day')
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()))
  const [statusByDate, setStatusByDate] = useState(new Map())
  const today = startOfDay(new Date())

  const days = useMemo(() => {
    if (viewMode === 'month') return monthGridDays(currentDate)
    if (viewMode === 'week') return weekDays(currentDate)
    if (viewMode === 'workweek') return workWeekDays(currentDate)
    return [currentDate]
  }, [viewMode, currentDate])

  useEffect(() => {
    if (viewMode === 'day') return
    const start = days[0]
    const end = days[days.length - 1]
    return subscribeToRange(user.uid, start, end, (entries) => {
      setStatusByDate(summarizeEntriesByDate(entries))
    })
  }, [user.uid, viewMode, days])

  function navigate(direction) {
    if (viewMode === 'month') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1))
    } else if (viewMode === 'day') {
      setCurrentDate((d) => addDays(d, direction))
    } else {
      setCurrentDate((d) => addDays(d, direction * 7))
    }
  }

  function selectDate(d) {
    setCurrentDate(startOfDay(d))
    setViewMode('day')
  }

  const title =
    viewMode === 'month'
      ? `${MONTH_LABELS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
      : currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={() => navigate(-1)} className="min-h-10 min-w-10 text-lg">
          &larr;
        </button>
        <div className="text-center">
          <p className="font-semibold">{title}</p>
          <button
            onClick={() => setCurrentDate(today)}
            className="text-xs text-neutral-500 font-medium"
          >
            Today
          </button>
        </div>
        <button onClick={() => navigate(1)} className="min-h-10 min-w-10 text-lg">
          &rarr;
        </button>
      </div>

      <div className="flex gap-1 px-4 py-3 overflow-x-auto">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setViewMode(v.id)}
            className={`min-h-9 px-3 rounded-full text-sm font-medium whitespace-nowrap ${
              viewMode === v.id
                ? 'bg-brand-600 text-white'
                : 'text-neutral-500'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {viewMode === 'day' ? (
        <DayView date={currentDate} onMoved={setCurrentDate} />
      ) : (
        <div className="px-4">
          <DateGrid
            days={days}
            rowLength={viewMode === 'workweek' ? 5 : 7}
            currentMonth={viewMode === 'month' ? currentDate.getMonth() : null}
            today={today}
            selectedDate={currentDate}
            statusByDate={statusByDate}
            onSelectDate={selectDate}
          />
        </div>
      )}
    </div>
  )
}
