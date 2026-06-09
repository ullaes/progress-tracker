export const ZONE_IDS = [
  "head",
  "chest",
  "abdomen",
  "pelvis",
  "leftUpperArm",
  "leftForearm",
  "leftHand",
  "rightUpperArm",
  "rightForearm",
  "rightHand",
  "leftThigh",
  "leftShin",
  "leftFoot",
  "rightThigh",
  "rightShin",
  "rightFoot",
] as const;

export type ZoneId = (typeof ZONE_IDS)[number];

export type ZoneBinding = {
  zoneId: ZoneId;
  weight: number;
};

export type LevelThreshold = {
  level: number;
  threshold: number;
};

export type Skill = {
  id: string;
  name: string;
  category: "physical" | "cognitive";
  metricName: string;
  unit: string;
  betterDirection: "higher";
  trainingMode?: "standard" | "meditation";
  zoneBindings: ZoneBinding[];
  graceDays: number;
  halfLifeDays: number;
  levels: LevelThreshold[];
  notes?: string;
};

export type TrainingSet = {
  id: string;
  value?: number;
  reps: number;
};

export type Entry = {
  id: string;
  type: "training" | "test";
  skillId: string;
  date: string;
  time?: string;
  value?: number;
  trainingIntensity?: number;
  meditationType?: "visual" | "sound" | "mentalImage" | "emptiness";
  meditationQuality?: number;
  meditationDuration?: number;
  sets?: TrainingSet[];
  unit?: string;
  notes?: string;
};

export type BodyMetric = {
  id: string;
  name: string;
  unit: string;
  betterDirection: "higher" | "lower";
  zoneBindings: ZoneBinding[];
};

export type BodyMeasurement = {
  id: string;
  metricId: string;
  date: string;
  time?: string;
  value: number;
  notes?: string;
};

export type DecayStatus = "stable" | "decaying" | "stale";

export type DerivedSkillState = {
  skillId: string;
  latestTestValue: number | null;
  peakValue: number | null;
  peakLevel: number | null;
  currentValue: number | null;
  currentLevel: number | null;
  lastTrainingDate: string | null;
  lastTestDate: string | null;
  lastActivityDate: string | null;
  decayStatus: DecayStatus;
};

export type AppData = {
  version: 6;
  skills: Skill[];
  entries: Entry[];
  bodyMetrics: BodyMetric[];
  bodyMeasurements: BodyMeasurement[];
};
