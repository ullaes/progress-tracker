import type { Entry, Skill } from "../types";
import { entryDateTime, trainingImpact } from "../utils/trainingMath";
import { deriveSkillState } from "./deriveSkillState";

export type HistoryGranularity = "day" | "month" | "year";

export type HistoryPoint = {
  date: string;
  periodStart: string;
  currentValue: number | null;
  currentLevel: number | null;
  latestTestValue: number | null;
  trainingIntensity: number | null;
  trainingVolume: number;
  trainingCount: number;
};

const WINDOW_SIZE: Record<HistoryGranularity, number> = {
  day: 30,
  month: 12,
  year: 6,
};

function localIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function periodBounds(today: Date, granularity: HistoryGranularity, offset: number) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let start: Date;

  if (granularity === "day") {
    start = new Date(end);
    start.setDate(start.getDate() - offset);
    return { start, end: new Date(start) };
  }

  if (granularity === "month") {
    start = new Date(end.getFullYear(), end.getMonth() - offset, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start, end: monthEnd > end ? end : monthEnd };
  }

  start = new Date(end.getFullYear() - offset, 0, 1);
  const yearEnd = new Date(start.getFullYear(), 11, 31);
  return { start, end: yearEnd > end ? end : yearEnd };
}

export function buildSkillHistory(
  skill: Skill,
  entries: Entry[],
  granularity: HistoryGranularity,
  today: Date = new Date(),
): HistoryPoint[] {
  const points: HistoryPoint[] = [];

  for (let offset = WINDOW_SIZE[granularity] - 1; offset >= 0; offset -= 1) {
    const { start, end } = periodBounds(today, granularity, offset);
    const periodStart = localIso(start);
    const date = localIso(end);
    const entriesToDate = entries.filter((entry) => entry.skillId === skill.id && entry.date <= date);
    const periodEntries = entriesToDate.filter((entry) => entry.date >= periodStart);
    const trainings = periodEntries.filter((entry) => entry.type === "training");
    const intensities = trainings
      .map((entry) => entry.trainingIntensity)
      .filter((value): value is number => value !== undefined);
    const tests = periodEntries
      .filter((entry) => entry.type === "test" && entry.value !== undefined)
      .sort((a, b) => entryDateTime(a).localeCompare(entryDateTime(b)));
    const state = deriveSkillState(skill, entriesToDate, date);

    points.push({
      date,
      periodStart,
      currentValue: state.currentValue,
      currentLevel: state.currentLevel,
      latestTestValue: tests.at(-1)?.value ?? null,
      trainingIntensity: intensities.length
        ? intensities.reduce((sum, value) => sum + value, 0) / intensities.length
        : null,
      trainingVolume: trainings.reduce((sum, entry) => sum + trainingImpact(entry), 0),
      trainingCount: trainings.length,
    });
  }

  return points;
}

export function historyWindowStart(points: HistoryPoint[]): string {
  return points[0]?.periodStart ?? "";
}
