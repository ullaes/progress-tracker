import { CURRENT_DATA_VERSION, normalizeBodyMetrics, normalizeEntries, normalizeSkills } from "../data/appData";
import { ZONE_IDS, type AppData, type BodyMeasurement, type BodyMetric, type Entry, type Skill, type TrainingSet, type ZoneBinding } from "../types";

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
    && (value.trainingMode === undefined || value.trainingMode === "standard" || value.trainingMode === "meditation")
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
    && (value.meditationType === undefined || value.meditationType === "visual" || value.meditationType === "sound" || value.meditationType === "mentalImage" || value.meditationType === "emptiness")
    && (value.meditationQuality === undefined || (isFiniteNumber(value.meditationQuality) && value.meditationQuality >= 1 && value.meditationQuality <= 10))
    && (value.meditationDuration === undefined || (isFiniteNumber(value.meditationDuration) && value.meditationDuration > 0))
    && (
      (value.meditationType === undefined && value.meditationQuality === undefined && value.meditationDuration === undefined)
      || (
        value.meditationType !== undefined
        && isFiniteNumber(value.meditationQuality)
        && value.meditationQuality >= 1
        && value.meditationQuality <= 10
        && isFiniteNumber(value.meditationDuration)
        && value.meditationDuration > 0
      )
    )
    && (value.sets === undefined || (Array.isArray(value.sets) && value.sets.every(isTrainingSet)))
    && isOptionalString(value.unit)
    && isOptionalString(value.notes);
}

function isBodyMetric(value: unknown): value is BodyMetric {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && isString(value.unit)
    && (value.betterDirection === "higher" || value.betterDirection === "lower")
    && (value.zoneBindings === undefined || (Array.isArray(value.zoneBindings) && value.zoneBindings.every(isZoneBinding)));
}

function isBodyMeasurement(value: unknown): value is BodyMeasurement {
  return isRecord(value)
    && isString(value.id)
    && isString(value.metricId)
    && isString(value.date)
    && isOptionalString(value.time)
    && isFiniteNumber(value.value)
    && isOptionalString(value.notes);
}

export function parseAppDataBackup(text: string): AppData | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!isRecord(value) || !Array.isArray(value.skills) || !Array.isArray(value.entries)) return null;
    if (!value.skills.every(isSkill) || !value.entries.every(isEntry)) return null;
    const rawBodyMetrics = value.bodyMetrics === undefined ? [] : value.bodyMetrics;
    const bodyMeasurements = value.bodyMeasurements === undefined ? [] : value.bodyMeasurements;
    if (!Array.isArray(rawBodyMetrics) || !Array.isArray(bodyMeasurements)) return null;
    if (!rawBodyMetrics.every(isBodyMetric) || !bodyMeasurements.every(isBodyMeasurement)) return null;
    const bodyMetrics = normalizeBodyMetrics(rawBodyMetrics);
    const skills = normalizeSkills(value.skills);
    const skillIds = new Set(skills.map((skill) => skill.id));
    const entryIds = new Set(value.entries.map((entry) => entry.id));
    const bodyMetricIds = new Set(bodyMetrics.map((metric) => metric.id));
    const bodyMeasurementIds = new Set(bodyMeasurements.map((measurement) => measurement.id));
    if (
      skillIds.size !== skills.length
      || entryIds.size !== value.entries.length
      || value.entries.some((entry) => !skillIds.has(entry.skillId))
      || bodyMetricIds.size !== bodyMetrics.length
      || bodyMeasurementIds.size !== bodyMeasurements.length
      || bodyMeasurements.some((measurement) => !bodyMetricIds.has(measurement.metricId))
    ) return null;

    return {
      version: CURRENT_DATA_VERSION,
      skills,
      entries: normalizeEntries(value.entries),
      bodyMetrics,
      bodyMeasurements: bodyMeasurements.map((measurement) => ({
        ...measurement,
        time: measurement.time ?? "12:00",
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
