import type { AppData, BodyMetric, Entry, Skill } from "../types";

export const CURRENT_DATA_VERSION: AppData["version"] = 6;

export function createEmptyAppData(): AppData {
  return {
    version: CURRENT_DATA_VERSION,
    skills: [],
    entries: [],
    bodyMetrics: [],
    bodyMeasurements: [],
  };
}

export function normalizeSkills(skills: Skill[]): Skill[] {
  return skills.map((skill) => ({
    ...skill,
    levels: skill.levels.some((level) => level.level === 0)
      ? skill.levels
      : [{ level: 0, threshold: 0 }, ...skill.levels],
  }));
}

export function normalizeEntries(entries: Entry[]): Entry[] {
  return entries.map((entry) => ({
    ...entry,
    time: entry.time ?? "12:00",
  }));
}

export function normalizeBodyMetrics(metrics: BodyMetric[]): BodyMetric[] {
  return metrics.map((metric) => ({
    ...metric,
    zoneBindings: metric.zoneBindings ?? [],
  }));
}
