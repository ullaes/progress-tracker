import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createEmptyAppData, CURRENT_DATA_VERSION, normalizeBodyMetrics, normalizeEntries, normalizeSkills } from "../data/appData";
import type { AppData, BodyMeasurement, BodyMetric, Entry, Skill } from "../types";
import { removeBodyMetric } from "../utils/bodyMetricData";
import { removeEntry, replaceEntry } from "../utils/entryData";

const STORAGE_KEY = "progress-tracker-data-v1";

type Store = AppData & {
  saveSkill: (skill: Skill) => void;
  deleteSkill: (skillId: string) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (entryId: string) => void;
  addBodyMetric: (metric: BodyMetric) => void;
  saveBodyMetric: (metric: BodyMetric) => void;
  deleteBodyMetric: (metricId: string) => void;
  addBodyMeasurement: (measurement: BodyMeasurement) => void;
  deleteBodyMeasurement: (measurementId: string) => void;
  importData: (data: AppData) => void;
};

const StoreContext = createContext<Store | null>(null);

function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createEmptyAppData();
    const parsed = JSON.parse(saved) as Partial<AppData>;
    const migrated: AppData = {
      version: CURRENT_DATA_VERSION,
      skills: normalizeSkills(Array.isArray(parsed.skills) ? parsed.skills : []),
      entries: normalizeEntries(Array.isArray(parsed.entries) ? parsed.entries : []),
      bodyMetrics: normalizeBodyMetrics(Array.isArray(parsed.bodyMetrics) ? parsed.bodyMetrics : []),
      bodyMeasurements: Array.isArray(parsed.bodyMeasurements) ? parsed.bodyMeasurements : [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return createEmptyAppData();
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
      updateEntry: (entry) => update((current) => ({ ...current, entries: replaceEntry(current.entries, entry) })),
      deleteEntry: (entryId) => update((current) => ({ ...current, entries: removeEntry(current.entries, entryId) })),
      addBodyMetric: (metric) => update((current) => ({ ...current, bodyMetrics: [...current.bodyMetrics, { ...metric, zoneBindings: metric.zoneBindings ?? [] }] })),
      saveBodyMetric: (metric) => update((current) => ({
        ...current,
        bodyMetrics: current.bodyMetrics.some((item) => item.id === metric.id)
          ? current.bodyMetrics.map((item) => item.id === metric.id ? { ...metric, zoneBindings: metric.zoneBindings ?? [] } : item)
          : [...current.bodyMetrics, { ...metric, zoneBindings: metric.zoneBindings ?? [] }],
      })),
      deleteBodyMetric: (metricId) => update((current) => ({ ...current, ...removeBodyMetric(current.bodyMetrics, current.bodyMeasurements, metricId) })),
      addBodyMeasurement: (measurement) => update((current) => ({ ...current, bodyMeasurements: [...current.bodyMeasurements, measurement] })),
      deleteBodyMeasurement: (measurementId) => update((current) => ({
        ...current,
        bodyMeasurements: current.bodyMeasurements.filter((measurement) => measurement.id !== measurementId),
      })),
      importData: (imported) => update(() => ({ ...imported, bodyMetrics: normalizeBodyMetrics(imported.bodyMetrics) })),
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
