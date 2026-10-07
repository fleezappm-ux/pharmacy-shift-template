import { Button } from "@/components/ui/button";
import { AssignResult } from "../lib/auto-assign";

export interface AutoPlan { result: AssignResult; before: number; after: number; names: Record<string, string>; labels: Record<string, string> }

/** 自動で作った案を見せて、「使う／やめる」を選んでもらう画面。押すまでシフトは変わりません。 */
export function AutoAssignDialog({ plan, displayShift, onApply, onClose }: { plan: AutoPlan; displayShift: (value: string) => string; onApply: () => void; onClose: () => void }) {
  const { result } = plan;
  const dates = [...new Set(result.changes.map(item => item.date))];
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="auto-assign-title" data-auto-assign-dialog>
    <div className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <h2 id="auto-assign-title" className="text-lg font-black">足りない日を埋める案</h2>
      {result.notice && <p className="rounded-xl bg-slate-50 p-3 text-sm font-bold leading-7 text-slate-800">{result.notice}</p>}
      {result.changes.length > 0 && <>
        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">{result.changes.length}か所に出勤を入れる案です。確認が必要なところは {plan.before}件 → {plan.after}件 になります。<span className="block text-xs font-normal">今入っている勤務・有休・休み希望は変えません。「この案を使う」を押すまで、シフトは変わりません。</span></p>
        <ul className="space-y-1 text-sm" data-auto-assign-changes>{dates.map(date => <li key={date}><b>{plan.labels[date] || date}</b>　{result.changes.filter(item => item.date === date).map(item => `${plan.names[item.employeeId] || ""}さん（${displayShift(item.shift)}）`).join("、")}</li>)}</ul>
      </>}
      {result.unresolved.length > 0 && <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" data-auto-assign-unresolved>
        <b>どうしても埋められなかった日（{result.unresolved.length}件）</b>
        <p className="mt-1 text-xs">決めたルールを守ると入れる人がいません。休み希望や条件を見直すか、手で調整してください。</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{result.unresolved.map((item, index) => <li key={index}><b>{item.label}</b> {item.message}</li>)}</ul>
      </div>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{result.changes.length ? "やめる" : "閉じる"}</Button>
        {result.changes.length > 0 && <Button onClick={onApply} data-auto-assign-apply>この案を使う</Button>}
      </div>
    </div>
  </div>;
}
