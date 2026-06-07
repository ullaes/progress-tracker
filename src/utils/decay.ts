import type { DecayStatus } from "../types";
import { daysBetween } from "./date";

export function decayValue(
  peakValue: number | null,
  lastActivityDate: string | null,
  graceDays: number,
  halfLifeDays: number,
  today: string | Date = new Date(),
): number | null {
  if (peakValue === null || !lastActivityDate) return peakValue;
  const inactive = daysBetween(today, lastActivityDate);
  if (inactive <= graceDays) return peakValue;
  const decayDays = inactive - graceDays;
  return Math.max(0, peakValue * Math.pow(0.5, decayDays / Math.max(1, halfLifeDays)));
}

export function decayStatus(
  lastActivityDate: string | null,
  graceDays: number,
  halfLifeDays: number,
  today: string | Date = new Date(),
): DecayStatus {
  if (!lastActivityDate) return "stale";
  const inactive = daysBetween(today, lastActivityDate);
  if (inactive <= graceDays) return "stable";
  if (inactive <= graceDays + halfLifeDays * 2) return "decaying";
  return "stale";
}
