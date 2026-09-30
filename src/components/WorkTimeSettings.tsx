import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isWorkTime } from "../lib/work-time-options";

interface Props { values: string[]; onSave: (values: string[]) => void; }

export function WorkTimeSettings({ values, onSave }: Props) {
  const [draft, setDraft] = useState(values);
  const [error, setError] = useState("");
  const update = (index: number, part: "start" | "end", value: string) => {
    setDraft(items => items.map((item, i) => {
      if (i !== index) return item;
      const [start, end] = item.split("～");
      return part === "start" ? `${value}～${end}` : `${start}～${value}`;
    }));
    setError("");
  };
  const save = () => {
    if (!draft.every(isWorkTime)) return setError("開始・終了時刻を確認してください。終了は開始より後にしてください。");
    if (new Set(draft).size !== draft.length) return setError("同じ就業時間が重複しています。");
    onSave(draft);
    setError("");
  };
  return <section className="space-y-4">
    <p className="text-sm text-slate-600">個人シートの勤務時間プルダウンに表示する候補です。「有休」「休み」「任意入力」は常に表示します。</p>
    <div className="space-y-2">{draft.map((item, index) => {
      const [start, end] = item.split("～");
      return <div key={index} className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3">
        <span className="w-7 text-sm font-bold text-slate-500">{index + 1}</span>
        <label className="text-xs font-bold">開始<input aria-label={`候補${index + 1}の開始`} type="time" className="ml-2 h-10 rounded-md border px-2 text-sm" value={start} onChange={event => update(index, "start", event.target.value)} /></label>
        <span>～</span>
        <label className="text-xs font-bold">終了<input aria-label={`候補${index + 1}の終了`} type="time" className="ml-2 h-10 rounded-md border px-2 text-sm" value={end} onChange={event => update(index, "end", event.target.value)} /></label>
        <Button variant="outline" size="sm" className="ml-auto text-red-600" onClick={() => setDraft(items => items.filter((_, i) => i !== index))}>削除</Button>
      </div>;
    })}</div>
    <Button variant="outline" onClick={() => setDraft(items => [...items, "9:00～17:00"])}>＋ 就業時間を追加</Button>
    {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}
    <div><Button onClick={save}>就業時間を保存</Button></div>
    <p className="text-xs text-slate-500">候補を削除しても、作成済みのシフトやクール設定は変更されません。</p>
  </section>;
}
