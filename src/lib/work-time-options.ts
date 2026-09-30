import { templateStorage } from "./template-storage";

const STORAGE_KEY = "work_time_options_v1";
export const DEFAULT_WORK_TIMES = [
  "8:45～18:15", "8:30～18:00", "8:30～13:30",
  "8:30～16:30", "9:30～13:30", "9:00～13:00",
];

export function isWorkTime(value: string): boolean {
  const match = /^(\d{1,2}):(\d{2})～(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const [, startHour, startMinute, endHour, endMinute] = match.map(Number);
  return startHour < 24 && endHour < 24 && startMinute < 60 && endMinute < 60 &&
    endHour * 60 + endMinute > startHour * 60 + startMinute;
}

export function readWorkTimes(): string[] {
  try {
    const stored: unknown = JSON.parse(templateStorage.getItem(STORAGE_KEY) || "null");
    if (Array.isArray(stored) && stored.every(value => typeof value === "string" && isWorkTime(value))) return stored;
  } catch { /* use initial options */ }
  return DEFAULT_WORK_TIMES;
}

export function saveWorkTimes(values: string[]): void {
  templateStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}
