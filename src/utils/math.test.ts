import { describe, expect, it } from "vitest";
import { deriveSkillState } from "../domain/deriveSkillState";
import { buildSkillHistory } from "../domain/history";
import { demoData, demoSkills } from "../data/demoData";
import type { Skill } from "../types";
import { decayStatus, decayValue } from "./decay";
import { fractionalLevel, integerLevel } from "./levelMath";
import { backupFileName, parseAppDataBackup, serializeAppDataBackup } from "./dataTransfer";
import { getZoneHealth, getZoneLevel, zoneHealthColor } from "./zoneMath";
import { entryDateTime, trainingReps, trainingVolume } from "./trainingMath";

const levels = [
  { level: 1, threshold: 1 },
  { level: 2, threshold: 3 },
  { level: 3, threshold: 5 },
];

describe("level math", () => {
  it("calculates integer and interpolated levels", () => {
    expect(integerLevel(4, levels)).toBe(2);
    expect(fractionalLevel(4, levels)).toBe(2.5);
    expect(fractionalLevel(0.5, levels)).toBe(0.5);
    expect(fractionalLevel(20, levels)).toBe(3);
  });

  it("supports an explicit zero-level threshold", () => {
    const withZero = [{ level: 0, threshold: 0 }, ...levels];
    expect(integerLevel(0, withZero)).toBe(0);
    expect(fractionalLevel(0, withZero)).toBe(0);
    expect(fractionalLevel(0.5, withZero)).toBe(0.5);
  });
});

describe("decay", () => {
  it("holds during grace and halves after a half-life", () => {
    expect(decayValue(20, "2026-01-01", 5, 10, "2026-01-06")).toBe(20);
    expect(decayValue(20, "2026-01-01", 5, 10, "2026-01-16")).toBeCloseTo(10);
    expect(decayStatus("2026-01-01", 5, 10, "2026-01-16")).toBe("decaying");
    expect(decayStatus("2026-01-01", 5, 10, "2026-02-01")).toBe("stale");
  });
});

const skill: Skill = {
  id: "test-skill",
  name: "Test",
  category: "physical",
  metricName: "score",
  unit: "points",
  betterDirection: "higher",
  zoneBindings: [{ zoneId: "chest", weight: 0.5 }],
  graceDays: 5,
  halfLifeDays: 10,
  levels,
};

describe("derived skill state", () => {
  it("uses tests for peak and all activity for decay", () => {
    const state = deriveSkillState(
      skill,
      [
        { id: "1", type: "test", skillId: skill.id, date: "2026-01-01", value: 5 },
        { id: "2", type: "training", skillId: skill.id, date: "2026-01-11" },
        { id: "3", type: "test", skillId: skill.id, date: "2026-01-05", value: 3 },
      ],
      "2026-01-16",
    );
    expect(state.latestTestValue).toBe(3);
    expect(state.peakValue).toBe(5);
    expect(state.currentValue).toBe(5);
    expect(state.currentLevel).toBe(3);
  });

  it("calculates weighted zone level", () => {
    const other = { ...skill, id: "other", zoneBindings: [{ zoneId: "chest" as const, weight: 1 }] };
    expect(
      getZoneLevel("chest", [skill, other], [
        { ...deriveSkillState(skill, []), currentLevel: 2 },
        { ...deriveSkillState(other, []), currentLevel: 5 },
      ]),
    ).toBe(4);
  });

  it("colors zones by the share of decaying and stale skills", () => {
    const decayingSkill = { ...skill, id: "decaying" };
    const staleSkill = { ...skill, id: "stale" };
    const health = getZoneHealth(
      "chest",
      [skill, decayingSkill, staleSkill],
      [
        { ...deriveSkillState(skill, []), decayStatus: "stable" },
        { ...deriveSkillState(decayingSkill, []), decayStatus: "decaying" },
        { ...deriveSkillState(staleSkill, []), decayStatus: "stale" },
      ],
    );

    expect(health.problemRatio).toBeCloseTo(2 / 3);
    expect(health.stableCount).toBe(1);
    expect(health.decayingCount).toBe(1);
    expect(health.staleCount).toBe(1);
    expect(zoneHealthColor(0)).toBe("hsl(120 58% 43%)");
    expect(zoneHealthColor(0.5)).toBe("hsl(60 58% 43%)");
    expect(zoneHealthColor(1)).toBe("hsl(0 58% 43%)");
    expect(zoneHealthColor(null)).toBe("#303844");
  });
});

describe("skill history", () => {
  it("recalculates historical decay and groups training strength", () => {
    const points = buildSkillHistory(
      skill,
      [
        { id: "test", type: "test", skillId: skill.id, date: "2026-01-01", value: 5 },
        { id: "training-1", type: "training", skillId: skill.id, date: "2026-01-10", time: "08:00", trainingIntensity: 6, sets: [{ id: "set-1", value: 15, reps: 10 }] },
        { id: "training-2", type: "training", skillId: skill.id, date: "2026-01-10", time: "18:00", trainingIntensity: 8, sets: [{ id: "set-2", value: 15, reps: 2 }] },
      ],
      "day",
      new Date("2026-01-15T12:00:00"),
    );
    const trainingDay = points.find((point) => point.date === "2026-01-10");
    expect(trainingDay?.trainingIntensity).toBe(7);
    expect(trainingDay?.trainingCount).toBe(2);
    expect(trainingDay?.trainingVolume).toBe(180);
    expect(points.at(-1)?.currentValue).toBe(5);
    expect(points[0].currentValue).toBeNull();
  });
});

describe("training sessions", () => {
  it("keeps same-day sessions distinct and calculates set volume", () => {
    const morning = {
      id: "morning",
      type: "training" as const,
      skillId: skill.id,
      date: "2026-01-10",
      time: "08:00",
      sets: [{ id: "1", value: 15, reps: 10 }, { id: "2", value: 15, reps: 8 }],
    };
    const evening = { ...morning, id: "evening", time: "18:00", sets: [{ id: "3", value: 15, reps: 2 }] };
    expect(entryDateTime(morning)).not.toBe(entryDateTime(evening));
    expect(trainingReps(morning)).toBe(18);
    expect(trainingVolume(morning)).toBe(270);
    expect(trainingVolume(evening)).toBe(30);
  });
});

describe("starter data", () => {
  it("gives every starter skill an explicit zero level and baseline test", () => {
    for (const starterSkill of demoSkills) {
      expect(starterSkill.levels).toContainEqual({ level: 0, threshold: 0 });
      expect(demoData.entries).toContainEqual(expect.objectContaining({
        type: "test",
        skillId: starterSkill.id,
        value: 0,
      }));
    }
  });
});

describe("data backup", () => {
  it("exports and restores all application data", () => {
    const restored = parseAppDataBackup(serializeAppDataBackup(demoData));
    expect(restored).toEqual({
      ...demoData,
      entries: demoData.entries.map((entry) => ({ ...entry, time: entry.time ?? "12:00" })),
    });
    expect(backupFileName(new Date("2026-06-07T12:00:00Z"))).toBe("progress-tracker-data-2026-06-07.json");
  });

  it("rejects malformed data and entries for missing skills", () => {
    expect(parseAppDataBackup("{bad json")).toBeNull();
    expect(parseAppDataBackup(JSON.stringify({
      version: 3,
      skills: [],
      entries: [{ id: "entry", type: "training", skillId: "missing", date: "2026-06-07" }],
    }))).toBeNull();
  });
});
