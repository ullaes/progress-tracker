import type { LevelThreshold } from "../types";

function sortedLevels(levels: LevelThreshold[]): LevelThreshold[] {
  return [...levels].sort((a, b) => a.threshold - b.threshold);
}

export function integerLevel(value: number | null, levels: LevelThreshold[]): number | null {
  if (value === null) return null;
  return sortedLevels(levels).reduce(
    (result, item) => (value >= item.threshold ? item.level : result),
    0,
  );
}

export function fractionalLevel(value: number | null, levels: LevelThreshold[]): number | null {
  if (value === null) return null;
  const sorted = sortedLevels(levels);
  if (!sorted.length) return 0;
  if (value <= 0) return 0;
  if (value < sorted[0].threshold) return (value / sorted[0].threshold) * sorted[0].level;

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];
    if (value < next.threshold) {
      const progress = (value - current.threshold) / (next.threshold - current.threshold);
      return current.level + progress * (next.level - current.level);
    }
  }

  return sorted.at(-1)?.level ?? 0;
}
