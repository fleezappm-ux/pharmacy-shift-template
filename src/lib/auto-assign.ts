import { addDays, format } from "date-fns";
import { Employee, LeaveRequest, SpecialDayRule, StaffingRules } from "../types";
import { findSpecialDayRule } from "./special-day-utils";
import { isWorkingShift } from "./staffing-check";
import { formatMinutes, parseShiftRange, toMinutes, uncoveredGaps } from "./shift-time";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export interface AssignChange { employeeId: string; date: string; shift: string }
export interface AssignUnresolved { date: string; label: string; message: string }
export interface AssignResult {
  changes: AssignChange[];
  unresolved: AssignUnresolved[];
  /** 何も決まっていないとき（最低人数が未設定など）の案内 */
  notice?: string;
}

interface Input {
  dates: Date[];
  employees: Employee[];
  rules: StaffingRules;
  specialDayRules: SpecialDayRule[];
  leaveRequests: LeaveRequest[];
  roleNames: Record<string, string>;
  /** その人の「いつもの勤務」が分からないときに使う勤務時間 */
  defaultShift: string;
}

type Cell = "work" | "fixed-rest" | "free";
const AVOID_TYPES = ["有給希望", "休み希望", "午前休希望", "午後休希望"];
const ACTIVE_STATUS = ["申請中", "承認", "対応済み"];

/**
 * ルールどおりに「足りない日」を埋める案を作ります。
 * ・すでに入っている勤務（出勤・有休・休み希望）は変えません。出勤を増やすだけです。
 * ・入れる人は、出勤日が少ない人から順に選びます（かたよらないように）。
 * ・入れない曜日・週の上限・連勤の上限・休み希望は、必ず守ります。守れないときは「足りないまま」報告します。
 */
export function buildAutoAssign(input: Input): AssignResult {
  const { dates, employees, rules, specialDayRules, leaveRequests, roleNames, defaultShift } = input;
  const keys = dates.map(d => format(d, "yyyy-MM-dd"));
  const inRange = new Set(keys);
  const dateOf = new Map(keys.map((k, i) => [k, dates[i]]));
  const nameOf = (e: Employee) => e.displayName || e.name;
  const label = (key: string) => { const d = dateOf.get(key)!; return `${d.getMonth() + 1}/${d.getDate()}（${WEEK[d.getDay()]}）`; };

  const coverRoles = (rules.hours || []).some(Boolean) ? (rules.alwaysRoles || []) : [];
  const needAny = rules.minTotal.some(n => n > 0) || rules.roleMins.some(r => r.min.some(n => n > 0)) || coverRoles.length > 0;
  if (!needAny) return { changes: [], unresolved: [], notice: "最低人数がまだ決まっていません。「設定 → シフトマスタ → 人数・連勤のチェック」で、曜日ごとの最低人数を決めてください。" };

  // --- いまの状態 ---
  const state = new Map<string, Map<string, Cell>>();
  const reasonRest = new Map<string, Map<string, string>>();
  const requestedWork = new Map<string, Map<string, string>>();
  employees.forEach(emp => {
    const cells = new Map<string, Cell>(); const why = new Map<string, string>();
    keys.forEach(key => {
      const s = emp.shifts?.find(item => item.date.startsWith(key))?.shift;
      if (isWorkingShift(s)) cells.set(key, "work");
      else if (s === "有休") { cells.set(key, "fixed-rest"); why.set(key, "有休"); }
      else cells.set(key, "free");
    });
    state.set(emp.id, cells); reasonRest.set(emp.id, why); requestedWork.set(emp.id, new Map());
  });
  const matches = (req: LeaveRequest, emp: Employee) => req.employeeId ? req.employeeId === emp.id : (req.employeeName === (emp.displayName || emp.name) || req.employeeName === emp.name);
  leaveRequests.filter(r => ACTIVE_STATUS.includes(r.status) && inRange.has(r.date)).forEach(req => {
    const emp = employees.find(e => matches(req, e)); if (!emp) return;
    const cell = state.get(emp.id)!;
    if (AVOID_TYPES.includes(req.type) && cell.get(req.date) === "free") { cell.set(req.date, "fixed-rest"); reasonRest.get(emp.id)!.set(req.date, req.type === "有給希望" ? "有給希望" : "休み希望"); }
    if (req.type === "出勤希望" && cell.get(req.date) === "free" && req.status !== "申請中") {
      const time = req.desiredWorkStart && req.desiredWorkEnd ? `${req.desiredWorkStart}～${req.desiredWorkEnd}` : "";
      requestedWork.get(emp.id)!.set(req.date, time);
    }
  });

  // 閉める日（祝日・全員お休み）は触らない
  const closed = new Set(keys.filter(key => { const r = findSpecialDayRule(dateOf.get(key)!, specialDayRules); return !!r && (r.id === "band-v3:holiday" || r.restMode === "all"); }));
  const personalRest = (emp: Employee, key: string) => {
    const r = findSpecialDayRule(dateOf.get(key)!, specialDayRules);
    return r?.restMode === "selected" && (r.restEmployeeIds || []).includes(emp.id);
  };
  employees.forEach(emp => keys.forEach(key => { if (personalRest(emp, key) && state.get(emp.id)!.get(key) === "free") { state.get(emp.id)!.set(key, "fixed-rest"); reasonRest.get(emp.id)!.set(key, "お店の決めた休み"); } }));

  const usualShift = (emp: Employee) => {
    const counts = new Map<string, number>();
    (emp.shifts || []).forEach(s => { if (isWorkingShift(s.shift) && s.shift !== "任意入力") counts.set(s.shift, (counts.get(s.shift) || 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || defaultShift;
  };

  const working = (emp: Employee, key: string) => inRange.has(key)
    ? state.get(emp.id)!.get(key) === "work"
    : isWorkingShift(emp.shifts?.find(item => item.date.startsWith(key))?.shift);
  const rel = (key: string, n: number) => format(addDays(new Date(`${key}T00:00:00`), n), "yyyy-MM-dd");

  /** 入れない理由。入れるなら ""。 */
  const blocker = (emp: Employee, key: string): string => {
    const cell = state.get(emp.id)!.get(key);
    if (cell === "work") return "すでに出勤";
    if (cell === "fixed-rest") return reasonRest.get(emp.id)!.get(key) || "休み";
    const person = rules.people[emp.id];
    const date = dateOf.get(key)!;
    if (person?.ngWeekdays.includes(date.getDay())) return `${WEEK[date.getDay()]}曜は入れない設定`;
    if (person && person.maxPerWeek > 0) {
      const start = rel(key, -date.getDay());
      let count = 0; for (let i = 0; i < 7; i++) if (working(emp, rel(start, i))) count++;
      if (count + 1 > person.maxPerWeek) return `週${person.maxPerWeek}日までの設定`;
    }
    if (rules.maxConsecutive > 0) {
      let run = 1;
      for (let i = 1; i <= rules.maxConsecutive; i++) { if (working(emp, rel(key, -i))) run++; else break; }
      for (let i = 1; i <= rules.maxConsecutive; i++) { if (working(emp, rel(key, i))) run++; else break; }
      if (run > rules.maxConsecutive) return `${rules.maxConsecutive}連勤までの設定`;
    }
    return "";
  };

  const changes: AssignChange[] = [];
  const assigned = new Map<string, string>();
  const assign = (emp: Employee, key: string, shift?: string) => {
    state.get(emp.id)!.set(key, "work");
    assigned.set(`${emp.id}|${key}`, shift || usualShift(emp));
    changes.push({ employeeId: emp.id, date: key, shift: shift || usualShift(emp) });
  };
  const load = (emp: Employee) => keys.filter(k => state.get(emp.id)!.get(k) === "work").length;

  /** その日その役職の、営業時間内のすき間。時間が読めない勤務があれば、判定しない（[]）。 */
  const coverGaps = (roleId: string, key: string): [number, number][] => {
    const hours = rules.hours?.[dateOf.get(key)!.getDay()];
    if (!hours) return [];
    const ranges: [number, number][] = [];
    for (const emp of employees.filter(e => e.roleId === roleId && state.get(e.id)!.get(key) === "work")) {
      const text = assigned.get(`${emp.id}|${key}`);
      const range = text ? parseShiftRange({ date: key, shift: text, breakTime: "", workTime: "", comment: "" }) : parseShiftRange(emp.shifts?.find(item => item.date.startsWith(key)));
      if (!range) return [];
      ranges.push(range);
    }
    return uncoveredGaps(toMinutes(hours.open), toMinutes(hours.close), ranges);
  };
  const coverShift = (emp: Employee, gap: [number, number]) => {
    const usual = usualShift(emp);
    const range = parseShiftRange({ date: "", shift: usual, breakTime: "", workTime: "", comment: "" });
    return range && range[0] <= gap[0] && range[1] >= gap[1] ? usual : `${formatMinutes(gap[0])}～${formatMinutes(gap[1])}`;
  };

  // 1) 出勤希望（承認ずみ）は、そのとおり入れる
  employees.forEach(emp => requestedWork.get(emp.id)!.forEach((time, key) => { if (!closed.has(key)) assign(emp, key, time || undefined); }));

  // 2) 足りない分を、「候補が少ない日」から埋める
  type Demand = { key: string; roleId?: string; cover?: [number, number]; candidates: Employee[] };
  const stuck = new Set<string>();
  for (let guard = 0; guard < 2000; guard++) {
    const demands: Demand[] = [];
    keys.forEach(key => {
      if (closed.has(key)) return;
      const wd = dateOf.get(key)!.getDay();
      const on = employees.filter(e => state.get(e.id)!.get(key) === "work");
      rules.roleMins.forEach(rule => {
        const need = rule.min[wd] || 0;
        if (need > on.filter(e => e.roleId === rule.roleId).length && !stuck.has(`${key}|${rule.roleId}`))
          demands.push({ key, roleId: rule.roleId, candidates: employees.filter(e => e.roleId === rule.roleId && !blocker(e, key)) });
      });
      coverRoles.forEach(roleId => {
        const gap = coverGaps(roleId, key)[0];
        if (gap && !stuck.has(`${key}|cover|${roleId}`)) demands.push({ key, roleId, cover: gap, candidates: employees.filter(e => e.roleId === roleId && !blocker(e, key)) });
      });
      const total = rules.minTotal[wd] || 0;
      if (total > on.length && !stuck.has(`${key}|*`)) demands.push({ key, candidates: employees.filter(e => !blocker(e, key)) });
    });
    if (!demands.length) break;
    demands.sort((a, b) => a.candidates.length - b.candidates.length || (a.roleId ? 0 : 1) - (b.roleId ? 0 : 1) || a.key.localeCompare(b.key));
    const next = demands[0];
    if (!next.candidates.length) { stuck.add(next.cover ? `${next.key}|cover|${next.roleId}` : `${next.key}|${next.roleId || "*"}`); continue; }
    const pick = [...next.candidates].sort((a, b) => load(a) - load(b) || employees.indexOf(a) - employees.indexOf(b))[0];
    assign(pick, next.key, next.cover ? coverShift(pick, next.cover) : undefined);
  }

  // 3) 埋められなかった所の理由
  const unresolved: AssignUnresolved[] = [];
  keys.forEach(key => {
    if (closed.has(key)) return;
    const wd = dateOf.get(key)!.getDay();
    const on = employees.filter(e => state.get(e.id)!.get(key) === "work");
    const why = (pool: Employee[]) => pool.filter(e => state.get(e.id)!.get(key) !== "work").map(e => `${nameOf(e)}さん：${blocker(e, key)}`).join("、") || "入れる人がいません";
    rules.roleMins.forEach(rule => {
      const need = rule.min[wd] || 0; const have = on.filter(e => e.roleId === rule.roleId).length;
      if (need > have) unresolved.push({ date: key, label: label(key), message: `${roleNames[rule.roleId] || "この役職"}があと${need - have}人足りません（${why(employees.filter(e => e.roleId === rule.roleId))}）` });
    });
    coverRoles.forEach(roleId => coverGaps(roleId, key).forEach(([from, to]) => unresolved.push({ date: key, label: label(key), message: `${roleNames[roleId] || "この役職"}が ${formatMinutes(from)}〜${formatMinutes(to)} にいません（${why(employees.filter(e => e.roleId === roleId))}）` })));
    const total = rules.minTotal[wd] || 0;
    if (total > on.length) unresolved.push({ date: key, label: label(key), message: `出勤があと${total - on.length}人足りません（${why(employees)}）` });
  });

  changes.sort((a, b) => a.date.localeCompare(b.date) || a.employeeId.localeCompare(b.employeeId));
  return { changes, unresolved, notice: changes.length === 0 && unresolved.length === 0 ? "足りない日はありません。このままで基準を満たしています。" : undefined };
}
