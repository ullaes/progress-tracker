import { describe, expect, it } from "vitest";
import { deriveSkillState } from "../domain/deriveSkillState";
import { buildSkillHistory } from "../domain/history";
import { buildBodyMeasurementHistory } from "../domain/bodyMeasurementHistory";
import { createEmptyAppData } from "../data/appData";
import type { AppData, BodyMetric, Skill } from "../types";
import { decayStatus, decayValue } from "./decay";
import { fractionalLevel, integerLevel } from "./levelMath";
import { backupFileName, parseAppDataBackup, serializeAppDataBackup } from "./dataTransfer";
import { getZoneMeasurementProgress, getZoneTrainingMeasurementCorrelation, metricMeasurementChangePercent, metricMeasurementProgressPercent, zoneMeasurementColor } from "./bodyZoneMath";
import { removeBodyMetric } from "./bodyMetricData";
import { removeEntry, replaceEntry } from "./entryData";
import { getZoneHealth, getZoneLevel, zoneHealthColor } from "./zoneMath";
import { entryDateTime, meditationEffectiveMinutes, trainingImpact, trainingReps, trainingVolume } from "./trainingMath";

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
  levels: [{ level: 0, threshold: 0 }, ...levels],
};

const sampleData: AppData = {
  version: 6,
  skills: [skill],
  entries: [{ id: "sample-test", type: "test", skillId: skill.id, date: "2026-01-01", time: "09:00", value: 1 }],
  bodyMetrics: [{
    id: "sample-waist",
    name: "Waist",
    unit: "cm",
    betterDirection: "lower",
    zoneBindings: [{ zoneId: "abdomen", weight: 1 }],
  }],
  bodyMeasurements: [{ id: "sample-measurement", metricId: "sample-waist", date: "2026-01-01", time: "09:30", value: 90 }],
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

  it("weights meditation duration by concentration quality and type", () => {
    const focused = {
      id: "focused",
      type: "training" as const,
      skillId: "skill-focus",
      date: "2026-06-08",
      meditationType: "emptiness" as const,
      meditationQuality: 9,
      meditationDuration: 10,
    };
    const distracted = {
      ...focused,
      id: "distracted",
      meditationType: "visual" as const,
      meditationQuality: 4,
      meditationDuration: 15,
    };
    expect(meditationEffectiveMinutes(focused)).toBe(9);
    expect(meditationEffectiveMinutes(distracted)).toBeCloseTo(4.2);
    expect(trainingImpact(focused)).toBeGreaterThan(trainingImpact(distracted));
  });
});

describe("entry editing", () => {
  it("replaces one entry without changing its position or other entries", () => {
    const entries = [
      { id: "first", type: "test" as const, skillId: skill.id, date: "2026-01-01", value: 1 },
      { id: "second", type: "test" as const, skillId: skill.id, date: "2026-01-02", value: 2 },
    ];
    expect(replaceEntry(entries, { ...entries[0], value: 10 })).toEqual([
      { ...entries[0], value: 10 },
      entries[1],
    ]);
  });

  it("deletes only the selected entry", () => {
    const entries = [
      { id: "first", type: "test" as const, skillId: skill.id, date: "2026-01-01", value: 1 },
      { id: "second", type: "training" as const, skillId: skill.id, date: "2026-01-02", sets: [{ id: "set", reps: 5 }] },
    ];
    expect(removeEntry(entries, "first")).toEqual([entries[1]]);
  });
});

describe("body metric management", () => {
  it("deletes a metric together with only its linked measurements", () => {
    const otherMetric = { ...sampleData.bodyMetrics[0], id: "other-metric" };
    const result = removeBodyMetric(
      [sampleData.bodyMetrics[0], otherMetric],
      [
        sampleData.bodyMeasurements[0],
        { ...sampleData.bodyMeasurements[0], id: "other-measurement", metricId: otherMetric.id },
      ],
      sampleData.bodyMetrics[0].id,
    );

    expect(result.bodyMetrics).toEqual([otherMetric]);
    expect(result.bodyMeasurements).toEqual([expect.objectContaining({ id: "other-measurement" })]);
  });
});

describe("initial data", () => {
  it("starts without seeded user records", () => {
    expect(createEmptyAppData()).toEqual({
      version: 6,
      skills: [],
      entries: [],
      bodyMetrics: [],
      bodyMeasurements: [],
    });
  });
});

describe("data backup", () => {
  it("exports and restores all application data", () => {
    const restored = parseAppDataBackup(serializeAppDataBackup(sampleData));
    expect(restored).toEqual(sampleData);
    expect(backupFileName(new Date("2026-06-07T12:00:00Z"))).toBe("progress-tracker-data-2026-06-07.json");
  });

  it("rejects malformed data and entries for missing skills", () => {
    expect(parseAppDataBackup("{bad json")).toBeNull();
    expect(parseAppDataBackup(JSON.stringify({
      version: 3,
      skills: [],
      entries: [{ id: "entry", type: "training", skillId: "missing", date: "2026-06-07" }],
    }))).toBeNull();
    expect(parseAppDataBackup(JSON.stringify({
      ...sampleData,
      entries: [{ id: "incomplete-meditation", type: "training", skillId: skill.id, date: "2026-06-08", meditationType: "visual" }],
    }))).toBeNull();
  });

  it("upgrades backups without body measurements", () => {
    const restored = parseAppDataBackup(JSON.stringify({
      version: 3,
      skills: sampleData.skills,
      entries: sampleData.entries,
    }));
    expect(restored?.version).toBe(6);
    expect(restored?.bodyMetrics).toEqual([]);
    expect(restored?.bodyMeasurements).toEqual([]);
  });

  it("normalizes missing zone bindings without adding preset bindings", () => {
    const restored = parseAppDataBackup(JSON.stringify({
      ...sampleData,
      version: 5,
      bodyMetrics: sampleData.bodyMetrics.map(({ zoneBindings: _zoneBindings, ...metric }) => metric),
      bodyMeasurements: [],
    }));
    expect(restored?.bodyMetrics[0].zoneBindings).toEqual([]);
  });
});

describe("body zone measurement progress", () => {
  const waistMetric = {
    id: "waist",
    name: "Waist",
    unit: "cm",
    betterDirection: "lower" as const,
    zoneBindings: [{ zoneId: "abdomen" as const, weight: 1 }],
  };

  it("treats a smaller lower-is-better measurement as progress", () => {
    const progress = getZoneMeasurementProgress("abdomen", [waistMetric], [
      { id: "1", metricId: "waist", date: "2026-01-01", value: 100 },
      { id: "2", metricId: "waist", date: "2026-03-01", value: 90 },
    ]);
    expect(progress.progressPercent).toBe(10);
    expect(zoneMeasurementColor(progress.progressPercent)).toBe("hsl(120 58% 43%)");
    expect(zoneMeasurementColor(-10)).toBe("hsl(0 58% 43%)");
    expect(zoneMeasurementColor(0)).toBe("hsl(60 58% 43%)");
    expect(zoneMeasurementColor(5)).toBe("hsl(90 58% 43%)");
  });

  it("keeps actual measurement change separate from directed progress", () => {
    const measurements = [
      { id: "1", metricId: "waist", date: "2026-01-01", value: 90 },
      { id: "2", metricId: "waist", date: "2026-03-01", value: 99 },
    ];

    expect(metricMeasurementChangePercent(waistMetric, measurements)).toBe(10);
    expect(metricMeasurementProgressPercent(waistMetric, measurements)).toBe(-10);
    expect(getZoneMeasurementProgress("abdomen", [waistMetric], measurements)).toEqual({
      relatedCount: 1,
      measuredCount: 1,
      changePercent: 10,
      progressPercent: -10,
    });
    expect(zoneMeasurementColor(metricMeasurementProgressPercent(waistMetric, measurements))).toBe("hsl(0 58% 43%)");
  });

  it("correlates linked monthly training impact and directed measurement changes", () => {
    const linkedSkill = { ...skill, zoneBindings: [{ zoneId: "abdomen" as const, weight: 1 }] };
    const correlation = getZoneTrainingMeasurementCorrelation(
      "abdomen",
      [linkedSkill],
      [
        { id: "t1", type: "training", skillId: linkedSkill.id, date: "2026-02-01", sets: [{ id: "s1", reps: 1 }] },
        { id: "t2", type: "training", skillId: linkedSkill.id, date: "2026-03-01", sets: [{ id: "s2", reps: 2 }] },
        { id: "t3", type: "training", skillId: linkedSkill.id, date: "2026-04-01", sets: [{ id: "s3", reps: 3 }] },
      ],
      [waistMetric],
      [
        { id: "m0", metricId: "waist", date: "2026-01-01", value: 100 },
        { id: "m1", metricId: "waist", date: "2026-02-01", value: 99 },
        { id: "m2", metricId: "waist", date: "2026-03-01", value: 97.02 },
        { id: "m3", metricId: "waist", date: "2026-04-01", value: 94.1094 },
      ],
    );
    expect(correlation.sampleCount).toBe(3);
    expect(correlation.coefficient).toBeCloseTo(1);
  });

  it("handles legacy metrics without zone bindings without crashing", () => {
    const legacyMetric = {
      id: "legacy",
      name: "Legacy",
      unit: "cm",
      betterDirection: "higher",
    } as BodyMetric;
    expect(getZoneMeasurementProgress("abdomen", [legacyMetric], []).progressPercent).toBeNull();
    expect(getZoneTrainingMeasurementCorrelation("abdomen", [], [], [legacyMetric], [])).toEqual({
      coefficient: null,
      sampleCount: 0,
    });
  });
});

describe("body measurement history", () => {
  it("keeps the latest same-day measurement and filters the selected window", () => {
    const points = buildBodyMeasurementHistory(
      "waist",
      [
        { id: "old", metricId: "waist", date: "2025-01-01", value: 95 },
        { id: "morning", metricId: "waist", date: "2026-06-07", time: "08:00", value: 88 },
        { id: "evening", metricId: "waist", date: "2026-06-07", time: "18:00", value: 87.5 },
      ],
      "day",
      new Date("2026-06-08T12:00:00"),
    );
    expect(points).toEqual([{ date: "2026-06-07", value: 87.5 }]);
  });
});
