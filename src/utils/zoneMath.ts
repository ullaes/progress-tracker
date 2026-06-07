import type { DerivedSkillState, Skill, ZoneId } from "../types";

export type ZoneHealth = {
  relatedCount: number;
  stableCount: number;
  decayingCount: number;
  staleCount: number;
  problemRatio: number | null;
};

export function getZoneLevel(
  zoneId: ZoneId,
  skills: Skill[],
  states: DerivedSkillState[],
): number {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const skill of skills) {
    const binding = skill.zoneBindings.find((item) => item.zoneId === zoneId);
    const state = states.find((item) => item.skillId === skill.id);
    if (binding && state?.currentLevel !== null && state?.currentLevel !== undefined) {
      weightedTotal += state.currentLevel * binding.weight;
      weightTotal += binding.weight;
    }
  }

  return weightTotal ? weightedTotal / weightTotal : 0;
}

export function getZoneHealth(
  zoneId: ZoneId,
  skills: Skill[],
  states: DerivedSkillState[],
): ZoneHealth {
  const relatedStates = skills
    .filter((skill) => skill.zoneBindings.some((binding) => binding.zoneId === zoneId))
    .map((skill) => states.find((state) => state.skillId === skill.id))
    .filter((state): state is DerivedSkillState => state !== undefined);
  const stableCount = relatedStates.filter((state) => state.decayStatus === "stable").length;
  const decayingCount = relatedStates.filter((state) => state.decayStatus === "decaying").length;
  const staleCount = relatedStates.filter((state) => state.decayStatus === "stale").length;
  const relatedCount = relatedStates.length;

  return {
    relatedCount,
    stableCount,
    decayingCount,
    staleCount,
    problemRatio: relatedCount ? (decayingCount + staleCount) / relatedCount : null,
  };
}

export function zoneHealthColor(problemRatio: number | null): string {
  if (problemRatio === null) return "#303844";
  const clamped = Math.max(0, Math.min(1, problemRatio));
  return `hsl(${120 * (1 - clamped)} 58% 43%)`;
}
