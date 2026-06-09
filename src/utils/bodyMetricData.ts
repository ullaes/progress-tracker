import type { BodyMeasurement, BodyMetric } from "../types";

export function removeBodyMetric(
  metrics: BodyMetric[],
  measurements: BodyMeasurement[],
  metricId: string,
): { bodyMetrics: BodyMetric[]; bodyMeasurements: BodyMeasurement[] } {
  return {
    bodyMetrics: metrics.filter((metric) => metric.id !== metricId),
    bodyMeasurements: measurements.filter((measurement) => measurement.metricId !== metricId),
  };
}
