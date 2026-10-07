import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StaffingRules } from "../types";
import { describeRules } from "../lib/staffing-describe";
import { DayGrid } from "./DayGrid";
import { AutoPlan, PlanView } from "./AutoAssignDialog";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const STEPS = ["最低人数", "役職", "連勤", "個人の条件", "まとめ"];
const zero = () => [0, 0, 0, 0, 0, 0, 0];

interface Props {
  rules: StaffingRules;
  roles: { id: string; name: string }[];
  employees: { id: string; name: string; displayName?: string; roleId?: string }[];
  periodLabel: string;
  leaveCount: number;
  makePlan: (rules: StaffingRules) => AutoPlan;
  displayShift: (value: string) => string;
  onApply: (plan: AutoPlan, rules: StaffingRules, saveRules: boolean) => void;
  onClose: () => void;
}

/** 質問に1つずつ答えると、最後に「こんなシフトになります」と言葉で見せて、案を作る画面。 */
export function ShiftWizard({ rules, roles, employees, periodLabel, leaveCount, makePlan, displayShift, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<StaffingRules>(() => ({ ...rules, roleMins: rules.roleMins.map(r => ({ ...r, min: [...r.min] })), minTotal: [...rules.minTotal], people: { ...rules.people } }));
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<AutoPlan | null>(null);
  const [saveRules, setSaveRules] = useState(true);
  const usedRoles = roles.filter(role => employees.some(e => e.roleId === role.id));
  const roleMin = (id: string) => draft.roleMins.find(r => r.roleId === id)?.min || zero();
  const roleNames = useMemo(() => Object.fromEntries(roles.map(r => [r.id, r.name])), [roles]);
  const personNames = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e.displayName || e.name])), [employees]);
  const person = (id: string) => draft.people[id] || { maxPerWeek: 0, ngWeekdays: [] };
  const setPerson = (id: string, value: { maxPerWeek: number; ngWeekdays: number[] }) => setDraft(d => ({ ...d, people: { ...d.people, [id]: value } }));
  const cleanRules = (): StaffingRules => ({ ...draft, roleMins: draft.roleMins.filter(r => r.min.some(n => n > 0)), people: Object.fromEntries((Object.entries(draft.people) as [string, { maxPerWeek: number; ngWeekdays: number[] }][]).filter(([, p]) => p.maxPerWeek > 0 || p.ngWeekdays.length)) });
  const noNeed = !draft.minTotal.some(n => n > 0) && !draft.roleMins.some(r => r.min.some(n => n > 0)) && !((draft.alwaysRoles || []).length > 0 && (draft.hours || []).some(Boolean));
  const visibleSteps = usedRoles.length ? STEPS : STEPS.filter(s => s !== "役職");
  const name = visibleSteps[step];
  const last = step === visibleSteps.length - 1;
  const lines = describeRules({ rules: cleanRules(), roleNames, personNames, leaveCount });

  const body = () => {
    if (plan) return <PlanView plan={plan} displayShift={displayShift} />;
    if (name === "最低人数") return <div className="space-y-3"><h3 className="text-base font-black">① 1日に、最低何人いれば足りますか？</h3><p className="text-xs leading-6 text-slate-500">曜日ごとの人数です。お休みの日や、決めない日は「0」にします。</p><DayGrid values={draft.minTotal} label="最低人数" quick onChange={next => setDraft(d => ({ ...d, minTotal: next }))} /></div>;
    if (name === "役職") return <div className="space-y-4"><h3 className="text-base font-black">② 役職ごとに、必ずいてほしい人数は？</h3><p className="text-xs leading-6 text-slate-500">例：薬剤師は平日いつも1人以上。決めない役職は「0」のままで大丈夫です。</p>{usedRoles.map(role => <div key={role.id} className="space-y-1"><b className="text-sm">{role.name}</b><DayGrid values={roleMin(role.id)} label={`${role.name}の最低人数`} quick onChange={next => setDraft(d => ({ ...d, roleMins: [...d.roleMins.filter(r => r.roleId !== role.id), { roleId: role.id, min: next }] }))} /></div>)}</div>;
    if (name === "連勤") return <div className="space-y-3"><h3 className="text-base font-black">{usedRoles.length ? "③" : "②"} 続けて、何日まで出勤していいですか？</h3><div className="grid grid-cols-3 gap-2">{[0, 4, 5, 6, 7].map(n => <button key={n} type="button" aria-pressed={draft.maxConsecutive === n} onClick={() => setDraft(d => ({ ...d, maxConsecutive: n }))} className={`h-12 rounded-xl border-2 text-sm font-bold ${draft.maxConsecutive === n ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700"}`}>{n === 0 ? "制限しない" : `最大${n}日`}</button>)}</div></div>;
    if (name === "個人の条件") return <div className="space-y-3"><h3 className="text-base font-black">{usedRoles.length ? "④" : "③"} 入れない曜日や、週の日数に制限がある人はいますか？</h3><p className="text-xs leading-6 text-slate-500">いなければ、何も選ばずに「次へ」を押してください。</p>{employees.map(emp => { const p = person(emp.id); return <div key={emp.id} className="rounded-xl bg-slate-50 p-3"><b className="text-sm">{emp.displayName || emp.name}</b><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-slate-600"><span className="flex items-center gap-2">入れない曜日：{[1, 2, 3, 4, 5, 6, 0].map(day => <label key={day} className="flex items-center gap-0.5"><input type="checkbox" aria-label={`${emp.displayName || emp.name}は${WEEK[day]}曜に入れない`} checked={p.ngWeekdays.includes(day)} onChange={event => setPerson(emp.id, { ...p, ngWeekdays: event.target.checked ? [...p.ngWeekdays, day].sort() : p.ngWeekdays.filter(item => item !== day) })} />{WEEK[day]}</label>)}</span><label className="flex items-center gap-1">週に最大<input aria-label={`${emp.displayName || emp.name}の週の最大日数`} type="number" inputMode="numeric" min={0} max={7} className="h-10 w-14 rounded-lg border border-slate-300 bg-white px-2 text-center" value={p.maxPerWeek} onChange={event => setPerson(emp.id, { ...p, maxPerWeek: Math.max(0, Math.min(7, Math.floor(Number(event.target.value) || 0))) })} />日（0＝制限なし）</label></div></div>; })}</div>;
    return <div className="space-y-3" data-wizard-summary><h3 className="text-base font-black">こんなシフトになります</h3><ul className="space-y-2 rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-sm leading-7 text-blue-950">{lines.map((line, i) => <li key={i} className="list-disc ml-4">{line}</li>)}</ul>{noNeed && <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">最低人数が決まっていません。「もどる」で、最低人数を入れてください。</p>}<label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" className="mt-1" checked={saveRules} onChange={event => setSaveRules(event.target.checked)} /><span><b>この答えを設定に保存する</b><span className="block text-xs text-slate-500">次からは、この条件がはじめから入った状態で始まります。シフト表の「⚠」の基準にもなります。</span></span></label></div>;
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="wizard-title" data-wizard>
    <div className="flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <div><h2 id="wizard-title" className="text-lg font-black">質問に答えて、シフト案を作る</h2><p className="text-xs text-slate-500">{periodLabel}　{plan ? "できた案" : `${step + 1} / ${visibleSteps.length}`}</p></div>
      {body()}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose}>やめる</Button>
        {plan ? <>
          <Button variant="outline" onClick={() => setPlan(null)}>もどる（答えを直す）</Button>
          {plan.result.changes.length > 0 && <Button data-wizard-apply onClick={() => onApply(plan, cleanRules(), saveRules)}>この案を使う</Button>}
        </> : <>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>もどる</Button>}
          {last ? <Button data-wizard-make disabled={noNeed} onClick={() => setPlan(makePlan(cleanRules()))}>この条件で案を作る</Button> : <Button onClick={() => setStep(step + 1)}>次へ</Button>}
        </>}
      </div>
    </div>
  </div>;
}
