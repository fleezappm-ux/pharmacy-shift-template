import assert from "node:assert/strict";
import { buildAutoAssign } from "../src/lib/auto-assign";
import { checkStaffing } from "../src/lib/staffing-check";
import { Employee, LeaveRequest, StaffingRules } from "../src/types";

const dates = Array.from({ length: 14 }, (_, i) => new Date(2026, 9, i + 1)); // 10/1(木)〜10/14
const iso = (n: number) => `2026-10-${String(n).padStart(2, "0")}`;
const mk = (id: string, roleId: string, works: number[] = [], extra: Record<number, string> = {}): Employee => ({ id, name: id, roleId, shifts: dates.map((_, i) => ({ date: iso(i + 1), shift: extra[i + 1] || (works.includes(i + 1) ? "9:00～18:00" : "休み"), breakTime: "", workTime: "", comment: "" })) });
const base: StaffingRules = { minTotal: [0, 0, 0, 0, 0, 0, 0], roleMins: [], maxConsecutive: 0, people: {} };
const run = (emps: Employee[], rules: StaffingRules, leave: LeaveRequest[] = []) => buildAutoAssign({ dates, employees: emps, rules, specialDayRules: [], leaveRequests: leave, roleNames: { ph: "薬剤師", st: "事務" }, defaultShift: "9:00～18:00" });
const apply = (emps: Employee[], changes: { employeeId: string; date: string; shift: string }[]) => emps.map(e => ({ ...e, shifts: e.shifts.map(s => { const c = changes.find(x => x.employeeId === e.id && x.date === s.date); return c ? { ...s, shift: c.shift } : s; }) }));

// 最低人数が未設定なら案内だけ
assert.ok(run([mk("a", "ph")], base).notice?.includes("最低人数"));

// 平日(月〜金)は薬剤師1人以上。3人で回す→全日埋まり、偏りが小さい
const week: StaffingRules = { ...base, roleMins: [{ roleId: "ph", min: [0, 1, 1, 1, 1, 1, 0] }], maxConsecutive: 5 };
let emps = [mk("a", "ph"), mk("b", "ph"), mk("c", "ph")];
let r = run(emps, week);
assert.equal(r.unresolved.length, 0);
let after = apply(emps, r.changes);
assert.equal(Object.keys(checkStaffing({ dates, employees: after, rules: week, roleNames: {}, specialDayRules: [] }).byDate).length, 0, "案を入れたら警告ゼロ");
const per = ["a", "b", "c"].map(id => r.changes.filter(c => c.employeeId === id).length);
assert.ok(Math.max(...per) - Math.min(...per) <= 1, "出勤日数がほぼ均等: " + per);
// 土日は入れない
assert.ok(r.changes.every(c => ![0, 6].includes(new Date(c.date + "T00:00:00").getDay())));

// 休み希望は守る：10/5(月)にaが休み希望、bもcも入れない設定ならaを入れず「足りない」と報告
const leave: LeaveRequest[] = [{ id: "l", employeeId: "a", employeeName: "a", date: iso(5), periodStart: iso(1), periodEnd: iso(31), type: "休み希望", comment: "", status: "承認", submittedAt: "", updatedAt: "" }];
emps = [mk("a", "ph"), mk("b", "ph", [], {}), mk("c", "st")];
r = run(emps, { ...base, roleMins: [{ roleId: "ph", min: [0, 1, 0, 0, 0, 0, 0] }], people: { b: { maxPerWeek: 0, ngWeekdays: [1] } } }, leave);
assert.ok(!r.changes.some(c => c.date === iso(5)), "休み希望の日は入れない");
assert.ok(r.unresolved.some(u => u.date === iso(5) && /薬剤師があと1人/.test(u.message) && /休み希望/.test(u.message) && /入れない設定/.test(u.message)));
assert.ok(r.changes.some(c => c.date === iso(12) && c.employeeId === "a"), "10/12(月)はaが入る");

// 連勤の上限：aだけで毎日必要・上限2 → 3日目以降は足りないと報告
const daily: StaffingRules = { ...base, minTotal: [1, 1, 1, 1, 1, 1, 1], maxConsecutive: 2 };
r = run([mk("a", "ph")], daily);
assert.ok(r.unresolved.length > 0 && r.changes.length > 0);
assert.equal(Object.keys(checkStaffing({ dates, employees: apply([mk("a", "ph")], r.changes), rules: daily, roleNames: {}, specialDayRules: [] }).byCell).length, 0, "案は連勤上限を破らない");

// すでに入っている出勤は変えない・出勤を減らさない
emps = [mk("a", "ph", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])];
r = run(emps, week); assert.equal(r.changes.length, 0);
// 有休は動かさない
r = run([mk("a", "ph", [], { 6: "有休" }), mk("b", "ph")], { ...base, minTotal: [0, 0, 1, 0, 0, 0, 0] });
assert.ok(!r.changes.some(c => c.date === iso(6) && c.employeeId === "a"));
// 承認ずみの出勤希望は希望時間で入る
r = run([mk("a", "ph")], { ...base, minTotal: [0, 0, 0, 0, 0, 0, 0], roleMins: [{ roleId: "ph", min: [0, 0, 0, 0, 0, 0, 0] }] });
assert.ok(r.notice);
const want: LeaveRequest[] = [{ id: "w", employeeId: "a", employeeName: "a", date: iso(9), periodStart: iso(1), periodEnd: iso(31), type: "出勤希望", comment: "", desiredWorkStart: "10:00", desiredWorkEnd: "15:00", status: "承認", submittedAt: "", updatedAt: "" }];
r = run([mk("a", "ph")], { ...base, minTotal: [0, 0, 0, 0, 0, 0, 0], roleMins: [{ roleId: "ph", min: [0, 0, 0, 0, 0, 1, 0] }] }, want);
assert.ok(r.changes.some(c => c.date === iso(9) && c.shift === "10:00～15:00"));
console.log("auto-assign ok");
