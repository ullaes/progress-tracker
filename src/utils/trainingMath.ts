import type { Entry, TrainingSet } from "../types";

export const MEDITATION_TYPE_MULTIPLIERS = {
  visual: 0.7,
  sound: 0.8,
  mentalImage: 0.9,
  emptiness: 1,
} as const;

export function setVolume(set: TrainingSet): number {
  return (set.value ?? 1) * set.reps;
}

export function trainingVolume(entry: Entry): number {
  if (entry.type !== "training") return 0;
  if (entry.sets?.length) return entry.sets.reduce((sum, set) => sum + setVolume(set), 0);
  return entry.value ?? 0;
}

export function trainingReps(entry: Entry): number {
  return entry.type === "training"
    ? entry.sets?.reduce((sum, set) => sum + set.reps, 0) ?? 0
    : 0;
}

export function meditationEffectiveMinutes(entry: Entry): number {
  if (
    entry.type !== "training"
    || entry.meditationType === undefined
    || entry.meditationQuality === undefined
    || entry.meditationDuration === undefined
  ) return 0;
  return entry.meditationDuration
    * (entry.meditationQuality / 10)
    * MEDITATION_TYPE_MULTIPLIERS[entry.meditationType];
}

export function trainingImpact(entry: Entry): number {
  return entry.meditationType ? meditationEffectiveMinutes(entry) : trainingVolume(entry);
}

export function entryDateTime(entry: Entry): string {
  return `${entry.date}T${entry.time ?? "00:00"}`;
}
