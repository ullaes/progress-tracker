import type { Entry } from "../types";

export function replaceEntry(entries: Entry[], replacement: Entry): Entry[] {
  return entries.map((entry) => entry.id === replacement.id ? replacement : entry);
}

export function removeEntry(entries: Entry[], entryId: string): Entry[] {
  return entries.filter((entry) => entry.id !== entryId);
}
