import type { BodyMeasurement, BodyMetric, Entry, Skill, ZoneId } from "../types";
import { trainingImpact } from "./trainingMath";

export type ZoneMeasurementProgress = {
  relatedCount: number;
  measuredCount: number;
  changePercent: number | null;
  progressPercent: number | null;
};

export type ZoneCorrelation = {
  coefficient: number | null;
  sampleCount: number;
};

export function metricMeasurementChangePercent(metric: BodyMetric, measurements: BodyMeasurement[]): number | null {
  const values = measurements
    .filter((measurement) => measurement.metricId === metric.id)
    .sort((a, b) => `${a.date}T${a.time ?? "00:00"}`.localeCompare(`${b.date}T${b.time ?? "00:00"}`));
  const first = values[0]?.value;
  const latest = values.at(-1)?.value;
  if (first === undefined || latest === undefined || first === 0 || values.length < 2) return null;
  return ((latest - first) / Math.abs(first)) * 100;
}

export function metricMeasurementProgressPercent(metric: BodyMetric, measurements: BodyMeasurement[]): number | null {
  const change = metricMeasurementChangePercent(metric, measurements);
  if (change === null) return null;
  const direction = metric.betterDirection === "higher" ? 1 : -1;
  return change * direction;
}

export function getZoneMeasurementProgress(
  zoneId: ZoneId,
  metrics: BodyMetric[],
  measurements: BodyMeasurement[],
): ZoneMeasurementProgress {
  const related = metrics.filter((metric) => (metric.zoneBindings ?? []).some((binding) => binding.zoneId === zoneId));
  let weightedChange = 0;
  let weightedProgress = 0;
  let totalWeight = 0;

  for (const metric of related) {
    const binding = (metric.zoneBindings ?? []).find((item) => item.zoneId === zoneId);
    const change = metricMeasurementChangePercent(metric, measurements);
    const progress = metricMeasurementProgressPercent(metric, measurements);
    if (binding && change !== null && progress !== null) {
      weightedChange += change * binding.weight;
      weightedProgress += progress * binding.weight;
      totalWeight += binding.weight;
    }
  }

  return {
    relatedCount: related.length,
    measuredCount: totalWeight > 0 ? related.filter((metric) => metricMeasurementProgressPercent(metric, measurements) !== null).length : 0,
    changePercent: totalWeight ? weightedChange / totalWeight : null,
    progressPercent: totalWeight ? weightedProgress / totalWeight : null,
  };
}

export function zoneMeasurementColor(progressPercent: number | null): string {
  if (progressPercent === null) return "#303844";
  const normalized = Math.max(-1, Math.min(1, progressPercent / 10));
  return `hsl(${60 + normalized * 60} 58% 43%)`;
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let numerator = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < xs.length; index += 1) {
    const dx = xs[index] - meanX;
    const dy = ys[index] - meanY;
    numerator += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  return varianceX && varianceY ? numerator / Math.sqrt(varianceX * varianceY) : null;
}

export function getZoneTrainingMeasurementCorrelation(
  zoneId: ZoneId,
  skills: Skill[],
  entries: Entry[],
  metrics: BodyMetric[],
  measurements: BodyMeasurement[],
): ZoneCorrelation {
  const trainingByMonth = new Map<string, number>();
  for (const skill of skills) {
    const binding = skill.zoneBindings.find((item) => item.zoneId === zoneId);
    if (!binding) continue;
    for (const entry of entries.filter((item) => item.skillId === skill.id && item.type === "training")) {
      const month = entry.date.slice(0, 7);
      trainingByMonth.set(month, (trainingByMonth.get(month) ?? 0) + trainingImpact(entry) * binding.weight);
    }
  }

  const progressByMonth = new Map<string, number>();
  for (const metric of metrics) {
    const binding = (metric.zoneBindings ?? []).find((item) => item.zoneId === zoneId);
    if (!binding) continue;
    const sorted = measurements
      .filter((measurement) => measurement.metricId === metric.id)
      .sort((a, b) => `${a.date}T${a.time ?? "00:00"}`.localeCompare(`${b.date}T${b.time ?? "00:00"}`));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1].value;
      if (previous === 0) continue;
      const direction = metric.betterDirection === "higher" ? 1 : -1;
      const progress = ((sorted[index].value - previous) / Math.abs(previous)) * 100 * direction * binding.weight;
      const month = sorted[index].date.slice(0, 7);
      progressByMonth.set(month, (progressByMonth.get(month) ?? 0) + progress);
    }
  }

  const months = [...progressByMonth.keys()].filter((month) => trainingByMonth.has(month)).sort();
  return {
    coefficient: pearson(months.map((month) => trainingByMonth.get(month) ?? 0), months.map((month) => progressByMonth.get(month) ?? 0)),
    sampleCount: months.length,
  };
}
