import { format } from "date-fns";
import { getJapaneseHolidayDates } from "./japanese-holidays";
import { GlobalRemark, SpecialDayRule } from "../types";

export const DEFAULT_SPECIAL_DAY_RULES: SpecialDayRule[] = [
  {
    id: "sunday",
    name: "日曜日",
    color: "red",
    behavior: "information",
    enabled: true,
    mode: "recurring",
    weekday: 0,
    weeks: [1, 2, 3, 4, 5],
    dates: [],
    order: 0
  },
  {
    id: "national-holiday",
    name: "祝日",
    color: "red",
    behavior: "all-off",
    enabled: true,
    mode: "annual",
    weekday: 0,
    weeks: [1],
    dates: [],
    order: 0
  },
  {
    id: "store-closed",
    name: "店休日",
    color: "red",
    behavior: "all-off",
    enabled: true,
    mode: "annual",
    weekday: 0,
    weeks: [1],
    dates: [],
    order: 1
  },
  {
    id: "duty-pharmacy",
    name: "当番薬局",
    color: "green",
    behavior: "duty",
    enabled: true,
    mode: "annual",
    weekday: 0,
    weeks: [1],
    dates: [],
    order: 2
  }
];

/** 保存済みの削除を尊重し、標準ルールを勝手に復元しません。 */
export function withDefaultSpecialDayRules(rules: SpecialDayRule[]): SpecialDayRule[] {
  return rules.map((rule, index) => ({ ...rule, order: rule.order ?? index }))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function matchesSpecialDayRule(date: Date, rule: SpecialDayRule): boolean {
  if (!rule.enabled) return false;
  const key = format(date, "yyyy-MM-dd");
  if (["national-holiday", "national-holiday-v2"].includes(rule.id.replace(/^band-v2:/, ""))) return getJapaneseHolidayDates(date, date).includes(key) && date.getDay() !== 0;
  if (rule.mode === "annual") return rule.dates.includes(key);
  const week = Math.ceil(date.getDate() / 7);
  return date.getDay() === rule.weekday && rule.weeks.includes(week);
}

/** 帯は特殊日設定で保存して有効にしたルールだけを描画する。 */
export function buildDisplayRemarks(manualRemarks: GlobalRemark[], rules: SpecialDayRule[], dates: Date[]): GlobalRemark[] {
  const byDate = new Map<string, GlobalRemark>(manualRemarks.map(remark => [remark.date, { ...remark, color: undefined, source: "manual" }]));
  dates.forEach(date => {
    const key = format(date, "yyyy-MM-dd");
    const matching = rules.find(rule => rule.id.startsWith("band-v2:") && matchesSpecialDayRule(date, rule));
    const manual = byDate.get(key);
    if (manual) {
      if (matching) byDate.set(key, { ...manual, color: matching.color });
    } else if (matching) {
      byDate.set(key, { date: key, type: matching.name, text: "", color: matching.color, source: "rule" });
    }
  });
  return Array.from(byDate.values());
}

export function findSpecialDayRule(date: Date, rules: SpecialDayRule[]) {
  return rules.find(rule => rule.id.startsWith("band-v2:") && matchesSpecialDayRule(date, rule));
}

export function colorForRemark(remark: GlobalRemark | undefined, _rules: SpecialDayRule[]) {
  return remark?.color;
}
