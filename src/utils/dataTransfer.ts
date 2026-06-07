import { ZONE_IDS, type AppData, type Entry, type Skill, type TrainingSet, type ZoneBinding } from "../types";

const CURRENT_VERSION = 3;
const zoneIds = new Set<string>(ZONE_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value);
}

function isZoneBinding(value: unknown): value is ZoneBinding {
  return isRecord(value)
    && isString(value.zoneId)
    && zoneIds.has(value.zoneId)
    && isFiniteNumber(value.weight)
    && value.weight >= 0
    && value.weight <= 1;
}

function isSkill(value: unknown): value is Skill {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && (value.category === "physical" || value.category === "cognitive")
    && isString(value.metricName)
    && isString(value.unit)
    && value.betterDirection === "higher"
    && Array.isArray(value.zoneBindings)
    && value.zoneBindings.every(isZoneBinding)
    && isFiniteNumber(value.graceDays)
    && value.graceDays >= 0
    && isFiniteNumber(value.halfLifeDays)
    && value.halfLifeDays > 0
    && Array.isArray(value.levels)
    && value.levels.length > 0
    && value.levels.every((level) => isRecord(level) && isFiniteNumber(level.level) && isFiniteNumber(level.threshold))
    && isOptionalString(value.notes);
}

function isTrainingSet(value: unknown): value is TrainingSet {
  return isRecord(value)
    && isString(value.id)
    && isOptionalNumber(value.value)
    && isFiniteNumber(value.reps)
    && value.reps >= 0;
}

function isEntry(value: unknown): value is Entry {
  return isRecord(value)
    && isString(value.id)
    && (value.type === "training" || value.type === "test")
    && isString(value.skillId)
    && isString(value.date)
    && isOptionalString(value.time)
    && isOptionalNumber(value.value)
    && isOptionalNumber(value.trainingIntensity)
    && (value.sets === undefined || (Array.isArray(value.sets) && value.sets.every(isTrainingSet)))
    && isOptionalString(value.unit)
    && isOptionalString(value.notes);
}

export function parseAppDataBackup(text: string): AppData | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!isRecord(value) || !Array.isArray(value.skills) || !Array.isArray(value.entries)) return null;
    if (!value.skills.every(isSkill) || !value.entries.every(isEntry)) return null;

    const skills = value.skills.map((skill) => ({
      ...skill,
      levels: skill.levels.some((level) => level.level === 0)
        ? skill.levels
        : [{ level: 0, threshold: 0 }, ...skill.levels],
    }));
    const skillIds = new Set(skills.map((skill) => skill.id));
    const entryIds = new Set(value.entries.map((entry) => entry.id));
    if (
      skillIds.size !== skills.length
      || entryIds.size !== value.entries.length
      || value.entries.some((entry) => !skillIds.has(entry.skillId))
    ) return null;

    return {
      version: CURRENT_VERSION,
      skills,
      entries: value.entries.map((entry) => ({
        ...entry,
        time: entry.time ?? "12:00",
      })),
    };
  } catch {
    return null;
  }
}

export function serializeAppDataBackup(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function backupFileName(date = new Date()): string {
  return `progress-tracker-data-${date.toISOString().slice(0, 10)}.json`;
}
