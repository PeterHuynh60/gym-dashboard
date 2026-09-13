// Starter templates for the Block Builder. Picking one pre-fills the form
// (name, ramp weeks, days, exercises, progression settings) — nothing is
// saved until you review/edit and hit "Save block", same as building one
// from scratch. Shape matches BlockBuilder's exercise spec (see blocks.js).

function rpe(exercise, { rampSets, rampReps, startRpe, rpeIncrement, pushSets, pushReps, deloadSets, deloadReps, deloadReduction, pushTarget = '', deloadTarget = '' }) {
  return {
    exercise,
    mode: 'rpe',
    rampSets,
    rampReps,
    startRpe,
    rpeIncrement,
    startWeight: '',
    unit: 'lb',
    weightIncrement: '',
    staticTarget: '',
    pushSets,
    pushReps,
    pushTarget,
    deloadSets,
    deloadReps,
    deloadReduction,
    deloadTarget,
  }
}

function staticEx(exercise, { rampSets, rampReps, staticTarget, pushSets, pushReps, deloadSets, deloadReps }) {
  return {
    exercise,
    mode: 'static',
    rampSets,
    rampReps,
    startRpe: '',
    rpeIncrement: '',
    startWeight: '',
    unit: 'lb',
    weightIncrement: '',
    staticTarget,
    pushSets,
    pushReps,
    pushTarget: '',
    deloadSets,
    deloadReps,
    deloadReduction: '',
    deloadTarget: '',
  }
}

export const blockTemplateCategories = [
  { id: 'strength', label: 'Linear Strength', description: 'Straight-across sets, RPE-based, climbing week to week.' },
  { id: 'topset-backoff', label: 'Top Set + Backoff', description: 'One heavy top set, then lighter backoff sets.' },
  { id: 'peak', label: 'Powerlifting Peak', description: 'Low reps, builds toward a near-max single. For a meet or a planned test.' },
  { id: 'athletic', label: 'Athletic/Conditioning', description: 'Box jumps, sled work, sandbag carries, circuits — strength plus conditioning.' },
]

export const blockTemplates = [
  {
    id: 'coach-top-set-backoff',
    category: 'topset-backoff',
    name: "Coach's Top Set + Backoff",
    description:
      'Real structure from your actual training (May–June 2024): one heavy triple, then three backoff triples at ~85-90%, on each main lift — not a generic invention.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat (Top Set)', { rampSets: '1', rampReps: '3', startRpe: 7.5, rpeIncrement: 0.5, pushSets: '1', pushReps: '1', deloadSets: '1', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Squat (Backoff)', { rampSets: '3', rampReps: '3', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '2', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Barbell RDL', { rampSets: '3', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '2', pushReps: '5', deloadSets: '2', deloadReps: '5', deloadReduction: 1.5 }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press (Top Set)', { rampSets: '1', rampReps: '3', startRpe: 7.5, rpeIncrement: 0.5, pushSets: '1', pushReps: '1', deloadSets: '1', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Bench Press (Backoff)', { rampSets: '3', rampReps: '3', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '2', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Barbell Overhead Press', { rampSets: '3', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '2', pushReps: '5', deloadSets: '2', deloadReps: '5', deloadReduction: 1.5 }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlift (Top Set)', { rampSets: '1', rampReps: '3', startRpe: 7.5, rpeIncrement: 0.5, pushSets: '1', pushReps: '1', deloadSets: '1', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Deadlift (Backoff)', { rampSets: '3', rampReps: '3', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '2', deloadReps: '3', deloadReduction: 2.5 }),
          staticEx('Larsen Press', { rampSets: '3', rampReps: '8-10', staticTarget: '7RPE', pushSets: '1', pushReps: '8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
    ],
  },
  {
    id: 'coach-peak-singles',
    category: 'peak',
    name: "Coach's Peak Testing (Singles)",
    description:
      'From your actual July 2024 competition-depth cycle: a heavy single held at a constant testing RPE each week (with spotters), plus backoff doubles at ~80-85%. Real max-effort retesting, not a climbing ramp.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat (Top Single)', { rampSets: '1', rampReps: '1', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '1', deloadReduction: 2.5 }),
          rpe('Squat (Backoff Double)', { rampSets: '3', rampReps: '2', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '2', deloadReps: '2', deloadReduction: 2 }),
          staticEx('Barbell Good Mornings', { rampSets: '3', rampReps: '5', staticTarget: '7RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press (Top Single)', { rampSets: '1', rampReps: '1', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '1', deloadReduction: 2.5 }),
          rpe('Bench Press (Backoff Double)', { rampSets: '3', rampReps: '2', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '2', deloadReps: '2', deloadReduction: 2 }),
          staticEx('Barbell Overhead Press', { rampSets: '3', rampReps: '5', staticTarget: '7RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
          staticEx('Seated Cable Row', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '6-8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlift (Top Single)', { rampSets: '1', rampReps: '1', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '1', deloadReduction: 2.5 }),
          rpe('Deadlift (Backoff Double)', { rampSets: '3', rampReps: '2', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '2', deloadReps: '2', deloadReduction: 2 }),
          staticEx('KB Hip Thrusts', { rampSets: '3', rampReps: '10-15', staticTarget: '2RIR', pushSets: '3', pushReps: '10', deloadSets: '2', deloadReps: '15' }),
        ],
      },
    ],
  },
  {
    id: 'coach-peak-triples',
    category: 'peak',
    name: "Coach's Peak Testing (Triples)",
    description:
      'From your actual November 2024 cycle: a top triple held near a constant testing RPE, plus 75-80% backoff for 3x5. 4-day split with more accessory volume than the singles version.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat (Top Triple)', { rampSets: '1', rampReps: '3', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '2', pushTarget: '9RPE', deloadSets: '1', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Squat (Backoff)', { rampSets: '3', rampReps: '5', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5', deloadReduction: 2 }),
          staticEx('RDLs', { rampSets: '3', rampReps: '6', staticTarget: '7RPE', pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '6' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press (Top Triple)', { rampSets: '1', rampReps: '3', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '2', pushTarget: '9RPE', deloadSets: '1', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Bench Press (Backoff)', { rampSets: '3', rampReps: '5', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5', deloadReduction: 2 }),
          staticEx('Barbell Overhead Press', { rampSets: '3', rampReps: '6', staticTarget: '7RPE', pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '6' }),
          staticEx('Lat Pulldown', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '6-8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlift (Top Triple)', { rampSets: '1', rampReps: '3', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '2', pushTarget: '9RPE', deloadSets: '1', deloadReps: '3', deloadReduction: 2.5 }),
          rpe('Deadlift (Backoff)', { rampSets: '3', rampReps: '5', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5', deloadReduction: 2 }),
          staticEx('Pendlay Row', { rampSets: '3', rampReps: '8-10', staticTarget: '7-8RPE', pushSets: '1', pushReps: '8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
      {
        label: 'Day 4',
        exercises: [
          staticEx('Bench Press to Pins w/ Chains', { rampSets: '4', rampReps: '6', staticTarget: '7-8RPE', pushSets: '3', pushReps: '6', deloadSets: '2', deloadReps: '6' }),
          staticEx('DB Bench Press', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '8', deloadSets: '2', deloadReps: '12' }),
        ],
      },
    ],
  },
  {
    id: 'coach-strength-feb2024',
    category: 'strength',
    name: "Coach's Strength Block (Feb 2024)",
    description: 'Your actual first logged block: straight-across 4x5, climbing RPE, 3-day squat/bench/deadlift split.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Barbell Squat', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '3', deloadReps: '5', deloadReduction: 2 }),
          rpe('Barbell RDL', { rampSets: '3', rampReps: '8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '8', deloadSets: '2', deloadReps: '8', deloadReduction: 1.5 }),
          staticEx('Weighted Step-Ups', { rampSets: '3', rampReps: '10-15/side', staticTarget: '2RIR', pushSets: '2', pushReps: '10/side', deloadSets: '2', deloadReps: '12/side' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '3', deloadReps: '5', deloadReduction: 2 }),
          rpe('Barbell Overhead Press', { rampSets: '3', rampReps: '8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '8', deloadReduction: 2 }),
          staticEx('Tricep Rope Pushdowns', { rampSets: '3', rampReps: '10-12', staticTarget: '2RIR', pushSets: '3', pushReps: '8', deloadSets: '2', deloadReps: '12' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Barbell Deadlift', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '2', deloadSets: '3', deloadReps: '5', deloadReduction: 2.5 }),
          rpe('Incline DB Bench Press', { rampSets: '3', rampReps: '8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '8', deloadReduction: 2 }),
          staticEx('Seated Cable Row', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '6-8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
    ],
  },
  {
    id: 'coach-strength-mar2024',
    category: 'strength',
    name: "Coach's Strength Block (Mar 2024)",
    description: 'The next block in your real progression: 4x4 instead of 4x5, Pendlay Row and GHR added.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Barbell Squat', { rampSets: '4', rampReps: '4', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '2', deloadSets: '3', deloadReps: '4', deloadReduction: 2 }),
          rpe('Barbell RDL', { rampSets: '3', rampReps: '6', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '6', deloadReduction: 1.5 }),
          staticEx('Weighted Walking Lunges', { rampSets: '3', rampReps: '10-15/side', staticTarget: '2RIR', pushSets: '2', pushReps: '10/side', deloadSets: '2', deloadReps: '12/side' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause', { rampSets: '4', rampReps: '4', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '2', deloadSets: '3', deloadReps: '4', deloadReduction: 2 }),
          rpe('Barbell Overhead Press', { rampSets: '3', rampReps: '6', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '6', deloadReduction: 2 }),
          staticEx('Pendlay Row', { rampSets: '3', rampReps: '8-10', staticTarget: '7-8RPE', pushSets: '3', pushReps: '6', deloadSets: '2', deloadReps: '10' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Barbell Deadlift', { rampSets: '4', rampReps: '4', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '2', deloadSets: '3', deloadReps: '4', deloadReduction: 2.5 }),
          staticEx('Close-Grip Bench Press', { rampSets: '3', rampReps: '8-10', staticTarget: '7-8RPE', pushSets: '2', pushReps: '6', deloadSets: '2', deloadReps: '10' }),
          staticEx('GHR', { rampSets: '3', rampReps: '8-10', staticTarget: '2RIR', pushSets: '2', pushReps: '6', deloadSets: '2', deloadReps: '10' }),
        ],
      },
    ],
  },
  {
    id: 'coach-strength-4day',
    category: 'strength',
    name: "Coach's Strength Block (4-Day, Sep 2024)",
    description: 'Your real 4-day expansion of the strength split — same climbing-RPE 4x5 main lifts, spread across an extra day.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '3', deloadReps: '5', deloadReduction: 2 }),
          rpe('Barbell RDLs', { rampSets: '3', rampReps: '8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '8', deloadSets: '2', deloadReps: '8', deloadReduction: 1.5 }),
          staticEx('Goblet Split Squats', { rampSets: '3', rampReps: '8-12/side', staticTarget: '2RIR', pushSets: '2', pushReps: '8/side', deloadSets: '2', deloadReps: '12/side' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '3', deloadReps: '5', deloadReduction: 2 }),
          staticEx('DB Push Press', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '8', deloadSets: '2', deloadReps: '12' }),
          staticEx('Lat Pulldown', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '6-8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlifts', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '2', deloadSets: '3', deloadReps: '5', deloadReduction: 2.5 }),
          staticEx('Single Leg Hip Thrusts', { rampSets: '3', rampReps: '8-12/side', staticTarget: 'BW', pushSets: '2', pushReps: '10/side', deloadSets: '2', deloadReps: '12/side' }),
        ],
      },
      {
        label: 'Day 4',
        exercises: [
          staticEx('Incline DB Bench Press', { rampSets: '3', rampReps: '8-10', staticTarget: '2RIR', pushSets: '2', pushReps: '8', deloadSets: '2', deloadReps: '10' }),
          rpe('Pendlay Row', { rampSets: '3', rampReps: '8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '8', deloadReduction: 2 }),
        ],
      },
    ],
  },
  {
    id: 'coach-strength-boxsquat',
    category: 'strength',
    name: "Coach's Strength Block (Box Squat, Mar 2025)",
    description: 'Your most recent real block before the gap: box squat variation, front squat added on day 3.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Barbell Squat to Box (FULL SIT)', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '3', deloadReps: '5', deloadReduction: 2 }),
          rpe('Barbell Good Mornings', { rampSets: '3', rampReps: '8', startRpe: 6.5, rpeIncrement: 0.5, pushSets: '1', pushReps: '8', deloadSets: '2', deloadReps: '8', deloadReduction: 1.5 }),
          staticEx('Hollow Body Flutter Kicks', { rampSets: '3', rampReps: '20-25 seconds', staticTarget: 'BW', pushSets: '3', pushReps: '20-25 seconds', deloadSets: '2', deloadReps: '20 seconds' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '3', deloadReps: '5', deloadReduction: 2 }),
          staticEx('Alternating DB Overhead Press', { rampSets: '3', rampReps: '8-10/side', staticTarget: '2RIR', pushSets: '3', pushReps: '8/side', deloadSets: '2', deloadReps: '10/side' }),
          staticEx('Band-Assisted Pull Ups', { rampSets: '3', rampReps: '6-10', staticTarget: '2RIR', pushSets: '3', pushReps: '5-6', deloadSets: '2', deloadReps: '8' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Barbell Front Squat', { rampSets: '3', rampReps: '6', startRpe: 6.5, rpeIncrement: 0.5, pushSets: '1', pushReps: '3', deloadSets: '2', deloadReps: '6', deloadReduction: 2 }),
          rpe('Deadlift', { rampSets: '4', rampReps: '5', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '2', deloadSets: '3', deloadReps: '5', deloadReduction: 2.5 }),
          rpe('Close-Grip Bench Press', { rampSets: '3', rampReps: '8', startRpe: 6.5, rpeIncrement: 0.5, pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '8', deloadReduction: 2 }),
        ],
      },
    ],
  },
  {
    id: 'coach-topset-backoff-doubles',
    category: 'topset-backoff',
    name: "Coach's Top Set + Backoff (Doubles)",
    description: 'Your real June-July 2024 cycle: same top set + backoff structure, but doubles instead of triples, with full-competition-depth cues.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat (Top Set)', { rampSets: '1', rampReps: '2', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          rpe('Squat (Backoff)', { rampSets: '3', rampReps: '2', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '2', deloadReps: '2', deloadReduction: 2 }),
          staticEx('Barbell Good Mornings', { rampSets: '3', rampReps: '5', staticTarget: '7RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause (Top Set)', { rampSets: '1', rampReps: '2', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          rpe('Bench Press w/ Pause (Backoff)', { rampSets: '3', rampReps: '2', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '2', deloadReps: '2', deloadReduction: 2 }),
          staticEx('Barbell Overhead Press', { rampSets: '3', rampReps: '5', staticTarget: '7RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlift (Top Set)', { rampSets: '1', rampReps: '2', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          rpe('Deadlift (Backoff)', { rampSets: '3', rampReps: '2', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '2', deloadReps: '2', deloadReduction: 2 }),
          staticEx('Long Pause Bench Press', { rampSets: '3', rampReps: '3', staticTarget: '7RPE', pushSets: '1', pushReps: '3', deloadSets: '2', deloadReps: '3' }),
        ],
      },
    ],
  },
  {
    id: 'coach-peak-doubles',
    category: 'peak',
    name: "Coach's Peak Testing (Doubles, 3-tier)",
    description: 'Your real December 2024 cycle: top double, backoff at 75-80%, plus a third lighter box-squat tier. 4-day, the most complete real peaking structure in your history.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat (Top Set)', { rampSets: '1', rampReps: '2', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          rpe('Squat (Backoff)', { rampSets: '3', rampReps: '4', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '4', deloadSets: '2', deloadReps: '4', deloadReduction: 2 }),
          staticEx('RDLs', { rampSets: '3', rampReps: '5', staticTarget: '7RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause (Top Set)', { rampSets: '1', rampReps: '2', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          rpe('Bench Press w/ Pause (Backoff)', { rampSets: '3', rampReps: '4', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '4', deloadSets: '2', deloadReps: '4', deloadReduction: 2 }),
          staticEx('Barbell Overhead Press', { rampSets: '3', rampReps: '5', staticTarget: '7RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlifts (Top Set)', { rampSets: '1', rampReps: '2', startRpe: 8, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9RPE', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          rpe('Deadlifts (Backoff)', { rampSets: '3', rampReps: '4', startRpe: 7, rpeIncrement: 0, pushSets: '1', pushReps: '4', deloadSets: '2', deloadReps: '4', deloadReduction: 2 }),
          staticEx('Squat to 14-inch Box', { rampSets: '3', rampReps: '5', staticTarget: '6.5RPE', pushSets: '1', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
        ],
      },
      {
        label: 'Day 4',
        exercises: [
          staticEx('Bench Press to Pins w/ Chains', { rampSets: '4', rampReps: '5', staticTarget: '7-8RPE', pushSets: '3', pushReps: '5', deloadSets: '2', deloadReps: '5' }),
          staticEx('2-Arm Bent Over DB Row', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '8', deloadSets: '2', deloadReps: '12' }),
        ],
      },
    ],
  },
  {
    id: 'coach-athletic-conditioning',
    category: 'athletic',
    name: "Coach's Athletic/Conditioning Block",
    description: 'From your actual August 2024 cycle: box squats, box jumps, sled work, and sandbag cleans mixed into a strength split. Higher reps, more general athleticism than pure powerlifting.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Barbell Squat to Box w/ Pause', { rampSets: '3', rampReps: '6-8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '8', deloadReduction: 1.5 }),
          staticEx('Alternating One-Arm KB Swings', { rampSets: '3', rampReps: '6-10/side', staticTarget: '2RIR', pushSets: '3', pushReps: '8/side', deloadSets: '2', deloadReps: '10/side' }),
          staticEx('Hamstring Curl Machine', { rampSets: '3', rampReps: '10-15', staticTarget: '2RIR', pushSets: '2', pushReps: '10', deloadSets: '2', deloadReps: '15' }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press (touch & go)', { rampSets: '3', rampReps: '8-10', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '8', deloadSets: '2', deloadReps: '10', deloadReduction: 1.5 }),
          staticEx('Sled Power Pull', { rampSets: '3', rampReps: 'turf length', staticTarget: '7RPE', pushSets: '2', pushReps: 'turf length', deloadSets: '2', deloadReps: 'turf length' }),
          staticEx('Pull-Ups', { rampSets: '3', rampReps: '6-10', staticTarget: '2RIR', pushSets: '3', pushReps: '6', deloadSets: '2', deloadReps: '8' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Barbell Deadlift', { rampSets: '3', rampReps: '6-8', startRpe: 7, rpeIncrement: 0.5, pushSets: '1', pushReps: '6', deloadSets: '2', deloadReps: '8', deloadReduction: 2 }),
          staticEx('Box Jump', { rampSets: '3', rampReps: '8-12', staticTarget: '2RIR', pushSets: '3', pushReps: '8', deloadSets: '2', deloadReps: '10' }),
          staticEx('Sandbag Clean', { rampSets: '3', rampReps: '8-12', staticTarget: '6RPE', pushSets: '2', pushReps: '8', deloadSets: '2', deloadReps: '12' }),
        ],
      },
      {
        label: 'Day 4',
        exercises: [
          staticEx('Alternating DB Bench Press', { rampSets: '3', rampReps: '8-10/side', staticTarget: '2RIR', pushSets: '3', pushReps: '8/side', deloadSets: '2', deloadReps: '10/side' }),
          staticEx('Gorilla Row', { rampSets: '3', rampReps: '8-10/side', staticTarget: '2RIR', pushSets: '3', pushReps: '8/side', deloadSets: '2', deloadReps: '10/side' }),
        ],
      },
    ],
  },
  {
    id: 'coach-competition-prep',
    category: 'peak',
    taperBeforeTest: true,
    name: "Coach's Competition Prep (Meet Peak)",
    description:
      'From your actual Dec 2024-Jan 2025 build to the Boston Open: 4 weeks of near-max single testing, then a real taper — not a push week — right before the meet.',
    rampWeeksCount: 4,
    days: [
      {
        label: 'Day 1',
        exercises: [
          rpe('Squat (Top Single)', { rampSets: '1', rampReps: '1', startRpe: 8.5, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9.5RPE', deloadSets: '1', deloadReps: '1', deloadReduction: 3 }),
          rpe('Squat (Backoff)', { rampSets: '3', rampReps: '3', startRpe: 7.5, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
        ],
      },
      {
        label: 'Day 2',
        exercises: [
          rpe('Bench Press w/ Pause (Top Single)', { rampSets: '1', rampReps: '1', startRpe: 8.5, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9.5RPE', deloadSets: '1', deloadReps: '1', deloadReduction: 3 }),
          rpe('Bench Press w/ Pause (Backoff)', { rampSets: '3', rampReps: '3', startRpe: 7.5, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          staticEx('Long Pause Bench Press', { rampSets: '3', rampReps: '3', staticTarget: '8RPE', pushSets: '1', pushReps: '3', deloadSets: '1', deloadReps: '3' }),
        ],
      },
      {
        label: 'Day 3',
        exercises: [
          rpe('Deadlift (Top Single)', { rampSets: '1', rampReps: '1', startRpe: 8.5, rpeIncrement: 0, pushSets: '1', pushReps: '1', pushTarget: '9.5RPE', deloadSets: '1', deloadReps: '1', deloadReduction: 3 }),
          rpe('Deadlift (Backoff)', { rampSets: '3', rampReps: '3', startRpe: 7.5, rpeIncrement: 0, pushSets: '1', pushReps: '2', deloadSets: '1', deloadReps: '2', deloadReduction: 2.5 }),
          staticEx('Bear Squats', { rampSets: '3', rampReps: '8-12', staticTarget: 'BW', pushSets: '2', pushReps: '8', deloadSets: '2', deloadReps: '10' }),
        ],
      },
    ],
  },
]
