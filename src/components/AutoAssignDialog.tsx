import { AssignResult } from "../lib/auto-assign";

export interface AutoPlan { result: AssignResult; before: number; after: number; names: Record<string, string>; labels: Record<string, string> }

/** 自動で作った案の中身（入れる日・埋められなかった日）。押すまでシフトは変わりません。 */
export function PlanView({ plan, displayShift }: { plan: AutoPlan; displayShift: (value: string) => string }) {
  const { result } = plan;
  const dates = [...new Set(result.changes.map(item => item.date))];
  return <div className="space-y-3">
    {result.notice && <p className="rounded-xl bg-slate-50 p-3 text-sm font-bold leading-7 text-slate-800">{result.notice}</p>}
    {result.changes.length > 0 && <>
      <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">{result.changes.length}か所に出勤を入れる案です。確認が必要なところは {plan.before}件 → {plan.after}件 になります。</p>
      <ul className="space-y-1 text-sm" data-auto-assign-changes>{dates.map(date => <li key={date}><b>{plan.labels[date] || date}</b>　{result.changes.filter(item => item.date === date).map(item => `${plan.names[item.employeeId] || ""}さん（${displayShift(item.shift)}）`).join("、")}</li>)}</ul>
    </>}
    {result.unresolved.length > 0 && <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" data-auto-assign-unresolved>
      <b>どうしても埋められなかった日（{result.unresolved.length}件）</b>
      <p className="mt-1 text-xs">決めたルールを守ると入れる人がいません。休み希望や条件を見直すか、手で調整してください。</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{result.unresolved.map((item, index) => <li key={index}><b>{item.label}</b> {item.message}</li>)}</ul>
    </div>}
  </div>;
}
