import type { DerivedSkillState, Entry, Skill } from "../types";
import { decayStatus, decayValue } from "../utils/decay";
import { fractionalLevel } from "../utils/levelMath";
import { entryDateTime } from "../utils/trainingMath";

function latestDate(entries: Entry[]): string | null {
  return [...entries].sort((a, b) => entryDateTime(a).localeCompare(entryDateTime(b))).at(-1)?.date ?? null;
}

export function deriveSkillState(
  skill: Skill,
  entries: Entry[],
  today: string | Date = new Date(),
): DerivedSkillState {
  const skillEntries = entries.filter((entry) => entry.skillId === skill.id);
  const tests = skillEntries
    .filter((entry) => entry.type === "test" && entry.value !== undefined)
    .sort((a, b) => entryDateTime(a).localeCompare(entryDateTime(b)));
  const trainings = skillEntries.filter((entry) => entry.type === "training");
  const latestTestValue = tests.at(-1)?.value ?? null;
  const peakValue = tests.length ? Math.max(...tests.map((entry) => entry.value ?? 0)) : null;
  const lastTrainingDate = latestDate(trainings);
  const lastTestDate = latestDate(tests);
  const lastActivityDate = [lastTrainingDate, lastTestDate].filter(Boolean).sort().at(-1) ?? null;
  const currentValue = decayValue(
    peakValue,
    lastActivityDate,
    skill.graceDays,
    skill.halfLifeDays,
    today,
  );

  return {
    skillId: skill.id,
    latestTestValue,
    peakValue,
    peakLevel: fractionalLevel(peakValue, skill.levels),
    currentValue,
    currentLevel: fractionalLevel(currentValue, skill.levels),
    lastTrainingDate,
    lastTestDate,
    lastActivityDate,
    decayStatus: decayStatus(lastActivityDate, skill.graceDays, skill.halfLifeDays, today),
  };
}
