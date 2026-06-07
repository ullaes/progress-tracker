import type { Entry, TrainingSet } from "../types";

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

export function entryDateTime(entry: Entry): string {
  return `${entry.date}T${entry.time ?? "00:00"}`;
}
