import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoData } from "../data/demoData";
import type { AppData, BodyMeasurement, BodyMetric, Entry, Skill } from "../types";

const STORAGE_KEY = "progress-tracker-data-v1";

type Store = AppData & {
  saveSkill: (skill: Skill) => void;
  deleteSkill: (skillId: string) => void;
  addEntry: (entry: Entry) => void;
  addBodyMetric: (metric: BodyMetric) => void;
  saveBodyMetric: (metric: BodyMetric) => void;
  addBodyMeasurement: (measurement: BodyMeasurement) => void;
  deleteBodyMeasurement: (measurementId: string) => void;
  importData: (data: AppData) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<Store | null>(null);

function normalizeBodyMetrics(metrics: BodyMetric[]): BodyMetric[] {
  return metrics.map((metric) => ({
    ...metric,
    zoneBindings: metric.zoneBindings ?? demoData.bodyMetrics.find((item) => item.id === metric.id)?.zoneBindings ?? [],
  }));
}

function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return demoData;
    const parsed = JSON.parse(saved) as Partial<AppData> & Pick<AppData, "skills" | "entries"> & { version?: number };
    if (
      parsed.version === demoData.version
      && Array.isArray(parsed.bodyMetrics)
      && Array.isArray(parsed.bodyMeasurements)
    ) {
      const normalized = { ...parsed, bodyMetrics: normalizeBodyMetrics(parsed.bodyMetrics) } as AppData;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
    const existingSkillIds = new Set(parsed.skills.map((skill) => skill.id));
    const existingEntryIds = new Set(parsed.entries.map((entry) => entry.id));
    const migrated: AppData = {
      version: demoData.version,
      skills: [
        ...parsed.skills.map((skill) => ({
          ...skill,
          ...(skill.trainingMode === undefined && skill.id === "skill-focus" ? { trainingMode: "meditation" as const } : {}),
          levels: skill.levels.some((level) => level.level === 0)
            ? skill.levels
            : [{ level: 0, threshold: 0 }, ...skill.levels],
        })),
        ...demoData.skills.filter((skill) => !existingSkillIds.has(skill.id)),
      ],
      entries: [
        ...parsed.entries.map((entry) => ({
          ...entry,
          time: entry.time ?? "12:00",
        })),
        ...demoData.entries.filter((entry) => !existingEntryIds.has(entry.id)),
      ],
      bodyMetrics: normalizeBodyMetrics(parsed.bodyMetrics ?? demoData.bodyMetrics),
      bodyMeasurements: parsed.bodyMeasurements ?? [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return demoData;
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  const update = (updater: (current: AppData) => AppData) => {
    setData((current) => {
      const next = updater(current);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo<Store>(
    () => ({
      ...data,
      saveSkill: (skill) =>
        update((current) => ({
          ...current,
          skills: current.skills.some((item) => item.id === skill.id)
            ? current.skills.map((item) => (item.id === skill.id ? skill : item))
            : [...current.skills, skill],
        })),
      deleteSkill: (skillId) =>
        update((current) => ({
          ...current,
          skills: current.skills.filter((item) => item.id !== skillId),
          entries: current.entries.filter((item) => item.skillId !== skillId),
        })),
      addEntry: (entry) => update((current) => ({ ...current, entries: [...current.entries, entry] })),
      addBodyMetric: (metric) => update((current) => ({ ...current, bodyMetrics: [...current.bodyMetrics, { ...metric, zoneBindings: metric.zoneBindings ?? [] }] })),
      saveBodyMetric: (metric) => update((current) => ({
        ...current,
        bodyMetrics: current.bodyMetrics.map((item) => item.id === metric.id ? { ...metric, zoneBindings: metric.zoneBindings ?? [] } : item),
      })),
      addBodyMeasurement: (measurement) => update((current) => ({ ...current, bodyMeasurements: [...current.bodyMeasurements, measurement] })),
      deleteBodyMeasurement: (measurementId) => update((current) => ({
        ...current,
        bodyMeasurements: current.bodyMeasurements.filter((measurement) => measurement.id !== measurementId),
      })),
      importData: (imported) => update(() => ({ ...imported, bodyMetrics: normalizeBodyMetrics(imported.bodyMetrics) })),
      resetDemo: () => update(() => demoData),
    }),
    [data],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useAppStore must be used inside AppStoreProvider");
  return store;
}
