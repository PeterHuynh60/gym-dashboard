# Block spec format

This is the contract for generating a training block. See `example-block.json` for a full worked
example (a real 3-day/week restart block, actually applied and verified against this app). Produce
a JSON file matching this shape, then run:

```
TARGET_UID=<uid> node scripts/apply-block.mjs <path-to-file.json> [startDate=YYYY-MM-DD]
```

`startDate` defaults to today. `TARGET_UID` is the Firebase Auth UID of the account to schedule into (fixed per user — ask if you don't already have it).

## Shape

```json
{
  "name": "Block name, e.g. 'Sept 2026 Block 1'",
  "rampWeeksCount": 4,
  "weekdayByDayLabel": {
    "Day 1": 1,
    "Day 2": 3,
    "Day 3": 5
  },
  "days": [
    {
      "label": "Day 1",
      "exercises": [
        {
          "exercise": "Barbell Squat to Box",
          "mode": "rpe",
          "rampSets": "4",
          "rampReps": "5",
          "startRpe": 7,
          "rpeIncrement": 0.5,
          "pushSets": "1",
          "pushReps": "3",
          "deloadSets": "3",
          "deloadReps": "5",
          "deloadReduction": 2
        }
      ]
    }
  ]
}
```

## Field notes

- **`rampWeeksCount`**: how many ramp weeks before push + deload. Total block length = `rampWeeksCount + 2`.
- **`weekdayByDayLabel`**: maps each day label to a weekday number, `0`=Sunday .. `6`=Saturday. Every label used in `days[].label` must appear here.
- **`days`**: the day structure, defined once — reused with different numeric targets across every ramp week (same exercises each week; only the target climbs).
- **Per exercise, `mode` is one of:**
  - `"rpe"` — needs `startRpe` (number) and `rpeIncrement` (number, per ramp week). Ramp week *n*'s target = `startRpe + (n-1) * rpeIncrement`, formatted as e.g. `"7.5RPE"`.
  - `"weight"` — needs `startWeight` (number), `unit` (`"lb"` or `"kg"`), and `weightIncrement` (number, per ramp week, same units).
  - `"static"` — needs `staticTarget` (string, e.g. `"2RIR"`) — no week-to-week progression, used for accessories.
- **`rampSets` / `rampReps`**: strings, constant across all ramp weeks (e.g. `"4"`, `"5"`).
- **`pushSets` / `pushReps`**: the push week's rep scheme — typically lower reps, higher effort than ramp (e.g. a top single or triple).
- **`deloadSets` / `deloadReps`**: the deload week's rep scheme — typically similar to or higher than ramp, at much lower intensity.
- **`deloadReduction`**: how much lighter the deload target is than the block's *starting* value — RPE points subtracted (`mode: "rpe"`) or percent subtracted (`mode: "weight"`, e.g. `35` means the deload target is 65% of `startWeight`).
- **`pushTarget` / `deloadTarget`** (optional, both modes): if you already know exactly what text you want (e.g. `"9RPE"`, `"70kg"`, or something that doesn't fit the simple formula — a genuinely different rep scheme, a specific known number), set these directly and the script uses them as-is instead of computing a suggestion.

## What the script does

1. Validates the spec (every day label has a weekday, every exercise has a valid mode, etc.) and refuses to run if anything's missing.
2. Computes each ramp week's concrete text target from the progression formula (same math the app's UI uses), and fills in `pushTarget`/`deloadTarget` from the reduction formula for any exercise that didn't specify them directly.
3. Creates the program in Firestore (`users/{uid}/programs`).
4. Schedules every week onto the calendar starting from `startDate`, walking forward chronologically — each day label lands on its assigned weekday, later weeks always land after earlier ones.

## What informs a good block

Before generating, look at what's actually been logged recently (`TARGET_UID=<uid> DAYS=<n> node scripts/recent-history.mjs`) — the split (which exercises, how many days/week), the most recent working weights/RPEs, and whether recent sets were hit as planned or missed (a sign to hold or reduce the next block's starting point rather than blindly increasing it).
