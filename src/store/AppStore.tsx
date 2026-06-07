import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { demoData } from "../data/demoData";
import type { AppData, Entry, Skill } from "../types";

const STORAGE_KEY = "progress-tracker-data-v1";

type Store = AppData & {
  saveSkill: (skill: Skill) => void;
  deleteSkill: (skillId: string) => void;
  addEntry: (entry: Entry) => void;
  importData: (data: AppData) => void;
  resetDemo: () => void;
};

const StoreContext = createContext<Store | null>(null);

function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return demoData;
    const parsed = JSON.parse(saved) as AppData & { version?: number };
    if ((parsed.version ?? 1) >= demoData.version) return parsed;
    const existingSkillIds = new Set(parsed.skills.map((skill) => skill.id));
    const existingEntryIds = new Set(parsed.entries.map((entry) => entry.id));
    const migrated: AppData = {
      version: demoData.version,
      skills: [
        ...parsed.skills.map((skill) => ({
          ...skill,
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
      importData: (imported) => update(() => imported),
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
