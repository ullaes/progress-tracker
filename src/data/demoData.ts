import type { AppData, BodyMetric, LevelThreshold, Skill, ZoneBinding } from "../types";
import { todayIso } from "../utils/date";

const levels = (...thresholds: number[]): LevelThreshold[] => [
  { level: 0, threshold: 0 },
  ...thresholds.map((threshold, index) => ({ level: index + 1, threshold })),
];

const bindings = (...items: [ZoneBinding["zoneId"], number][]): ZoneBinding[] =>
  items.map(([zoneId, weight]) => ({ zoneId, weight }));

const skill = (
  id: string,
  name: string,
  metricName: string,
  unit: string,
  zoneBindings: ZoneBinding[],
  thresholds: number[],
  graceDays = 7,
  halfLifeDays = 30,
  category: Skill["category"] = "physical",
): Skill => ({
  id,
  name,
  category,
  metricName,
  unit,
  betterDirection: "higher",
  zoneBindings,
  graceDays,
  halfLifeDays,
  levels: levels(...thresholds),
});

export const demoSkills: Skill[] = [
  skill(
    "skill-pushups",
    "Push-ups",
    "max strict reps",
    "reps",
    bindings(["chest", 0.5], ["leftUpperArm", 0.2], ["rightUpperArm", 0.2], ["abdomen", 0.1]),
    [1, 5, 10, 15, 20, 30, 40, 50],
  ),
  skill(
    "skill-pullups",
    "Pull-ups",
    "max strict reps",
    "reps",
    bindings(["chest", 0.4], ["leftUpperArm", 0.2], ["rightUpperArm", 0.2], ["leftForearm", 0.1], ["rightForearm", 0.1]),
    [1, 3, 5, 8, 10, 12, 15, 20],
  ),
  skill(
    "skill-shoulder-press",
    "Shoulder Press",
    "weight for clean reps",
    "kg",
    bindings(["leftUpperArm", 0.4], ["rightUpperArm", 0.4], ["chest", 0.2]),
    [5, 10, 15, 20, 25, 30, 40, 50],
    10,
    45,
  ),
  skill(
    "skill-biceps",
    "Biceps Curl Strength",
    "weight for clean reps",
    "kg",
    bindings(["leftUpperArm", 0.35], ["rightUpperArm", 0.35], ["leftForearm", 0.15], ["rightForearm", 0.15]),
    [5, 7.5, 10, 12.5, 15, 17.5, 20, 25],
    10,
    45,
  ),
  skill(
    "skill-grip",
    "Grip Strength",
    "grip dynamometer",
    "kg",
    bindings(["leftForearm", 0.3], ["rightForearm", 0.3], ["leftHand", 0.2], ["rightHand", 0.2]),
    [10, 20, 30, 40, 50, 60, 70, 80],
    10,
    45,
  ),
  skill(
    "skill-plank",
    "Plank",
    "maximum hold",
    "sec",
    bindings(["abdomen", 0.7], ["chest", 0.1], ["pelvis", 0.2]),
    [10, 20, 30, 45, 60, 90, 120, 180],
  ),
  skill(
    "skill-squats",
    "Bodyweight Squats",
    "max strict reps",
    "reps",
    bindings(["pelvis", 0.2], ["leftThigh", 0.35], ["rightThigh", 0.35], ["abdomen", 0.1]),
    [5, 10, 20, 30, 40, 50, 75, 100],
  ),
  skill(
    "skill-calf-raises",
    "Calf Raises",
    "max strict reps",
    "reps",
    bindings(["leftShin", 0.4], ["rightShin", 0.4], ["leftFoot", 0.1], ["rightFoot", 0.1]),
    [5, 10, 20, 30, 40, 50, 75, 100],
  ),
  skill(
    "skill-kegel",
    "Kegel Exercise",
    "maximum hold",
    "sec",
    bindings(["pelvis", 1]),
    [3, 5, 10, 15, 20, 30, 45, 60],
    3,
    14,
  ),
  skill(
    "skill-memory",
    "Memory Training",
    "words recalled",
    "words",
    bindings(["head", 1]),
    [4, 6, 8, 10, 12, 14, 16, 20],
    3,
    14,
    "cognitive",
  ),
  skill(
    "skill-focus",
    "Focus Training",
    "clean minutes",
    "min",
    bindings(["head", 1]),
    [3, 5, 10, 15, 20, 30, 45, 60],
    3,
    10,
    "cognitive",
  ),
];

demoSkills.find((item) => item.id === "skill-focus")!.trainingMode = "meditation";

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

const initialTests = demoSkills.map((item) => ({
  id: `initial-${item.id}`,
  type: "test" as const,
  skillId: item.id,
  date: dateDaysAgo(365),
  value: 0,
  unit: item.unit,
  notes: "Initial level",
}));

export const demoBodyMetrics: BodyMetric[] = [
  { id: "body-biceps", name: "Biceps circumference", unit: "cm", betterDirection: "higher", zoneBindings: bindings(["leftUpperArm", 1], ["rightUpperArm", 1]) },
  { id: "body-waist", name: "Waist circumference", unit: "cm", betterDirection: "lower", zoneBindings: bindings(["abdomen", 1]) },
];

export const demoData: AppData = {
  version: 6,
  skills: demoSkills,
  entries: [
    ...initialTests,
    { id: "entry-b1", type: "test", skillId: "skill-biceps", date: dateDaysAgo(320), value: 7.5, unit: "kg" },
    { id: "entry-b2", type: "training", skillId: "skill-biceps", date: dateDaysAgo(250), time: "08:15", trainingIntensity: 5, sets: [{ id: "b2-1", value: 7.5, reps: 10 }, { id: "b2-2", value: 7.5, reps: 8 }] },
    { id: "entry-b3", type: "test", skillId: "skill-biceps", date: dateDaysAgo(180), value: 10, unit: "kg" },
    { id: "entry-b4", type: "training", skillId: "skill-biceps", date: dateDaysAgo(90), time: "18:30", trainingIntensity: 7, sets: [{ id: "b4-1", value: 12.5, reps: 10 }, { id: "b4-2", value: 12.5, reps: 8 }, { id: "b4-3", value: 10, reps: 12 }] },
    { id: "entry-1", type: "test", skillId: "skill-biceps", date: dateDaysAgo(18), value: 15, unit: "kg" },
    { id: "entry-2", type: "training", skillId: "skill-biceps", date: dateDaysAgo(2), time: "19:10", trainingIntensity: 8, sets: [{ id: "b6-1", value: 15, reps: 10 }, { id: "b6-2", value: 15, reps: 8 }, { id: "b6-3", value: 12.5, reps: 10 }, { id: "b6-4", value: 10, reps: 12 }] },
    { id: "entry-p1", type: "test", skillId: "skill-pullups", date: dateDaysAgo(300), value: 3, unit: "reps" },
    { id: "entry-p2", type: "training", skillId: "skill-pullups", date: dateDaysAgo(210), time: "07:30", trainingIntensity: 6, sets: [{ id: "p2-1", reps: 5 }, { id: "p2-2", reps: 4 }, { id: "p2-3", reps: 3 }] },
    { id: "entry-p3", type: "test", skillId: "skill-pullups", date: dateDaysAgo(120), value: 8, unit: "reps" },
    { id: "entry-3", type: "test", skillId: "skill-pullups", date: dateDaysAgo(40), value: 10, unit: "reps" },
    { id: "entry-4", type: "training", skillId: "skill-pullups", date: dateDaysAgo(12), time: "18:00", trainingIntensity: 7, sets: [{ id: "p4-1", reps: 8 }, { id: "p4-2", reps: 7 }, { id: "p4-3", reps: 6 }, { id: "p4-4", reps: 5 }] },
    { id: "entry-m1", type: "test", skillId: "skill-memory", date: dateDaysAgo(80), value: 8, unit: "words" },
    { id: "entry-m2", type: "training", skillId: "skill-memory", date: dateDaysAgo(35), time: "09:00", trainingIntensity: 4, sets: [{ id: "m2-1", value: 10, reps: 3 }] },
    { id: "entry-5", type: "test", skillId: "skill-memory", date: dateDaysAgo(8), value: 14, unit: "words" },
    { id: "entry-f1", type: "test", skillId: "skill-focus", date: dateDaysAgo(45), value: 10, unit: "min" },
    { id: "entry-f2", type: "training", skillId: "skill-focus", date: dateDaysAgo(20), time: "21:00", trainingIntensity: 6, meditationType: "sound", meditationQuality: 6, meditationDuration: 15 },
    { id: "entry-6", type: "test", skillId: "skill-focus", date: todayIso(), value: 20, unit: "min" },
  ],
  bodyMetrics: demoBodyMetrics,
  bodyMeasurements: [
    { id: "body-biceps-1", metricId: "body-biceps", date: dateDaysAgo(180), time: "08:00", value: 31.2 },
    { id: "body-biceps-2", metricId: "body-biceps", date: dateDaysAgo(90), time: "08:00", value: 32.1 },
    { id: "body-biceps-3", metricId: "body-biceps", date: dateDaysAgo(7), time: "08:00", value: 33 },
    { id: "body-waist-1", metricId: "body-waist", date: dateDaysAgo(180), time: "08:00", value: 91 },
    { id: "body-waist-2", metricId: "body-waist", date: dateDaysAgo(90), time: "08:00", value: 88.5 },
    { id: "body-waist-3", metricId: "body-waist", date: dateDaysAgo(7), time: "08:00", value: 86 },
  ],
};
