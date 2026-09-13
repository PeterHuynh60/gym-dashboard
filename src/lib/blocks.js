// Turns a "block spec" (a set of exercises with starting values + weekly
// progression rules, entered once) into a full multi-week `weeks` array in
// the same shape a plain single-week Program uses — so scheduling code
// doesn't need to know a program came from the block builder.
//
// Each exercise in a block spec looks like:
// {
//   exercise: 'Barbell Squat',
//   mode: 'rpe' | 'weight' | 'static',
//   rampSets, rampReps,                        // constant across ramp weeks
//   startRpe, rpeIncrement,                     // mode: 'rpe'
//   startWeight, unit, weightIncrement,         // mode: 'weight'
//   staticTarget,                               // mode: 'static' (no progression, e.g. "2RIR")
//   pushSets, pushReps, pushTarget,
//   deloadSets, deloadReps, deloadTarget,
// }

export function emptyBlockExercise() {
  return {
    exercise: '',
    mode: 'rpe',
    rampSets: '',
    rampReps: '',
    startRpe: '',
    rpeIncrement: '0.5',
    startWeight: '',
    unit: 'lb',
    weightIncrement: '',
    staticTarget: '',
    pushSets: '',
    pushReps: '',
    pushTarget: '',
    deloadSets: '',
    deloadReps: '',
    deloadReduction: '',
    deloadTarget: '',
  }
}

export function emptyBlockDay() {
  return { label: '', exercises: [emptyBlockExercise()] }
}

function round(n, step) {
  return Math.round(n / step) * step
}

function formatRpe(value) {
  const v = round(value, 0.5)
  return `${Number.isInteger(v) ? v : v.toFixed(1)}RPE`
}

function formatWeight(value, unit) {
  const v = Math.round(value * 10) / 10
  return `${v}${unit}`
}

// The weightPlanned text for ramp week `weekIndex` (0-based).
export function rampWeekTarget(ex) {
  return (weekIndex) => {
    if (ex.mode === 'rpe') {
      const rpe = Number(ex.startRpe) + weekIndex * Number(ex.rpeIncrement || 0)
      return formatRpe(rpe)
    }
    if (ex.mode === 'weight') {
      const weight = Number(ex.startWeight) + weekIndex * Number(ex.weightIncrement || 0)
      return formatWeight(weight, ex.unit)
    }
    return ex.staticTarget
  }
}

// Suggests a push-week target by continuing the same progression one step
// past the last ramp week. Purely a starting point — stored as plain text
// on the exercise spec (ex.pushTarget) so the user can edit it.
export function suggestPushTarget(ex, rampWeeksCount) {
  if (ex.mode === 'rpe') {
    const rpe = Number(ex.startRpe) + rampWeeksCount * Number(ex.rpeIncrement || 0)
    return formatRpe(rpe)
  }
  if (ex.mode === 'weight') {
    const weight = Number(ex.startWeight) + rampWeeksCount * Number(ex.weightIncrement || 0)
    return formatWeight(weight, ex.unit)
  }
  return ex.staticTarget
}

// Suggests a deload-week target: `deloadReduction` RPE points below the
// block's starting RPE (rpe mode), or that percent below the starting
// weight (weight mode) — e.g. deloadReduction=35 on a 100kg start -> 65kg.
export function suggestDeloadTarget(ex) {
  const reduction = Number(ex.deloadReduction || 0)
  if (ex.mode === 'rpe') {
    return formatRpe(Number(ex.startRpe) - reduction)
  }
  if (ex.mode === 'weight') {
    return formatWeight(Number(ex.startWeight) * (1 - reduction / 100), ex.unit)
  }
  return ex.staticTarget
}

// Builds the full weeks[] array for a block: `rampWeeksCount` ramp weeks
// (auto-progressed per exercise), then a push week and a deload week — all
// sharing the same day/exercise structure.
//
// By default the push week comes first, then deload (a hard test followed
// by recovery — the shape every block except competition prep follows).
// Pass `taperBeforeTest: true` to flip that: deload becomes a genuine
// pre-meet taper that comes *before* the push week (the true meet/test
// day), so the calendar schedules them in the right chronological order —
// otherwise "Meet Day" would land before "Taper," which is backwards.
export function buildWeeksFromBlock({ rampWeeksCount, days, taperBeforeTest = false }) {
  const weeks = []

  for (let w = 0; w < rampWeeksCount; w++) {
    weeks.push({
      label: `Week ${w + 1} (Ramp)`,
      type: 'ramp',
      dayTemplates: days.map((day) => ({
        label: day.label,
        exercises: day.exercises
          .filter((ex) => ex.exercise.trim())
          .map((ex) => ({
            exercise: ex.exercise.trim(),
            setsPlanned: ex.rampSets,
            repGoal: ex.rampReps,
            weightPlanned: rampWeekTarget(ex)(w),
          })),
      })),
    })
  }

  const pushWeekNumber = rampWeeksCount + (taperBeforeTest ? 2 : 1)
  const deloadWeekNumber = rampWeeksCount + (taperBeforeTest ? 1 : 2)

  const pushWeek = {
    label: `Week ${pushWeekNumber} (${taperBeforeTest ? 'Meet Day' : 'Push'})`,
    type: 'push',
    dayTemplates: days.map((day) => ({
      label: day.label,
      exercises: day.exercises
        .filter((ex) => ex.exercise.trim())
        .map((ex) => ({
          exercise: ex.exercise.trim(),
          setsPlanned: ex.pushSets,
          repGoal: ex.pushReps,
          weightPlanned: ex.pushTarget,
        })),
    })),
  }

  const deloadWeek = {
    label: `Week ${deloadWeekNumber} (${taperBeforeTest ? 'Taper' : 'Deload'})`,
    type: 'deload',
    dayTemplates: days.map((day) => ({
      label: day.label,
      exercises: day.exercises
        .filter((ex) => ex.exercise.trim())
        .map((ex) => ({
          exercise: ex.exercise.trim(),
          setsPlanned: ex.deloadSets,
          repGoal: ex.deloadReps,
          weightPlanned: ex.deloadTarget,
        })),
    })),
  }

  if (taperBeforeTest) {
    weeks.push(deloadWeek, pushWeek)
  } else {
    weeks.push(pushWeek, deloadWeek)
  }

  return weeks
}

// --- Display grouping -------------------------------------------------

const WEEK_LABEL_RE = /^Week\s+(\d+)\s*(\(.+\))?$/i

function structureKey(week) {
  return JSON.stringify(
    week.dayTemplates.map((day) => ({
      label: day.label,
      exercises: day.exercises.map((ex) => ({
        exercise: ex.exercise,
        setsPlanned: ex.setsPlanned,
        repGoal: ex.repGoal,
      })),
    })),
  )
}

function mergeWeekLabels(weeksInGroup) {
  if (weeksInGroup.length === 1) return weeksInGroup[0].label
  const first = weeksInGroup[0].label.match(WEEK_LABEL_RE)
  const last = weeksInGroup[weeksInGroup.length - 1].label.match(WEEK_LABEL_RE)
  if (first && last) {
    const suffix = first[2] ?? ''
    return `Weeks ${first[1]}-${last[1]} ${suffix}`.trim()
  }
  return weeksInGroup.map((w) => w.label).join(', ')
}

function mergeTargets(values) {
  const unique = [...new Set(values)]
  return unique.join(' → ')
}

// Collapses consecutive weeks that share the same exercises/sets/reps
// (differing only in the numeric target) into one display group — e.g.
// 4 identically-structured ramp weeks become one "Weeks 1-4 (Ramp)"
// entry with each exercise's target shown as "7RPE → 7.5RPE → 8RPE → 8.5RPE"
// instead of four separate, mostly-duplicate week blocks. Purely a display
// transform — doesn't change what's stored or scheduled.
export function groupWeeksForDisplay(weeks) {
  const groups = []
  let i = 0
  while (i < weeks.length) {
    let j = i + 1
    const key = structureKey(weeks[i])
    while (j < weeks.length && structureKey(weeks[j]) === key) j++
    groups.push(weeks.slice(i, j))
    i = j
  }

  return groups.map((group) => ({
    label: mergeWeekLabels(group),
    dayTemplates: group[0].dayTemplates.map((day, di) => ({
      label: day.label,
      exercises: day.exercises.map((ex, ei) => ({
        exercise: ex.exercise,
        setsPlanned: ex.setsPlanned,
        repGoal: ex.repGoal,
        weightPlanned: mergeTargets(group.map((w) => w.dayTemplates[di].exercises[ei].weightPlanned)),
      })),
    })),
  }))
}
