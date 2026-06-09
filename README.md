# Progress Tracker

Local single-user React application for tracking physical and cognitive skills as an RPG-style character progression dashboard.

Training entries maintain activity, while test entries measure real progress. Current skill values decay after a configurable grace period.

## Run locally

```bash
npm install
npm run dev
```

Production build and tests:

```bash
npm run build
npm test
```

## Features

- Interactive SVG body map with 16 selectable zones
- Demo physical and cognitive skills
- Explicit level 0 baseline and starter exercises for major muscle groups, Kegel, focus and memory
- Training and test entry logging
- Multiple same-day training sessions with time, per-set value/weight, repetitions and calculated volume
- Independent body measurements with custom metrics, progress direction, history and charts
- Body-zone measurement bindings, switchable training/measurement body map and zone correlation
- Meditation-specific logging with practice type, concentration quality and effective minutes
- Peak, current and fractional level calculations
- Exponential inactivity decay
- Skill creation, editing, deletion and body-zone bindings
- Browser-local JSON persistence using `localStorage`
- JSON backup export and validated import
- English and Russian interface localization with a persisted language choice
- Analytics charts for daily, monthly and yearly progress, decay and training strength
- Illustrated English/Russian in-app usage guide with practical examples, status definitions and field reference

## Architecture

- `src/domain` and `src/utils`: pure derived-state and mathematics functions
- `src/store`: local persistent application state
- `src/components`: body map and reusable dashboard components
- `src/pages`: Dashboard, Log Entry and Skills Config screens

The PNG in the repository is used only as a visual reference. The interactive silhouette is implemented manually with SVG paths.
