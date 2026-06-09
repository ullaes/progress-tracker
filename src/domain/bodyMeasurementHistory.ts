import type { BodyMeasurement } from "../types";
import type { HistoryGranularity } from "./history";

export type BodyMeasurementPoint = {
  date: string;
  value: number;
};

const WINDOW_SIZE: Record<HistoryGranularity, number> = {
  day: 30,
  month: 12,
  year: 6,
};

function windowStart(today: Date, granularity: HistoryGranularity): Date {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (granularity === "day") start.setDate(start.getDate() - WINDOW_SIZE.day + 1);
  if (granularity === "month") start.setMonth(start.getMonth() - WINDOW_SIZE.month + 1, 1);
  if (granularity === "year") start.setFullYear(start.getFullYear() - WINDOW_SIZE.year + 1, 0, 1);
  return start;
}

export function bodyMeasurementDateTime(measurement: BodyMeasurement): string {
  return `${measurement.date}T${measurement.time ?? "00:00"}`;
}

export function buildBodyMeasurementHistory(
  metricId: string,
  measurements: BodyMeasurement[],
  granularity: HistoryGranularity,
  today: Date = new Date(),
): BodyMeasurementPoint[] {
  const start = windowStart(today, granularity);
  const startIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const latestByPeriod = new Map<string, BodyMeasurement>();

  for (const measurement of measurements.filter((item) => item.metricId === metricId && item.date >= startIso)) {
    const period = granularity === "day"
      ? measurement.date
      : granularity === "month"
        ? measurement.date.slice(0, 7)
        : measurement.date.slice(0, 4);
    const existing = latestByPeriod.get(period);
    if (!existing || bodyMeasurementDateTime(measurement) > bodyMeasurementDateTime(existing)) {
      latestByPeriod.set(period, measurement);
    }
  }

  return [...latestByPeriod.values()]
    .sort((a, b) => bodyMeasurementDateTime(a).localeCompare(bodyMeasurementDateTime(b)))
    .map((measurement) => ({ date: measurement.date, value: measurement.value }));
}
