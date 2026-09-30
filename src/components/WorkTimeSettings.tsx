import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ABBREVIATIONS, WorkTimeOption, validateWorkTimes, workTimeValue } from "../lib/work-time-options";
interface Props { values: WorkTimeOption[]; ready: boolean; onSave: (values: WorkTimeOption[]) => Promise<void>; }
export function WorkTimeSettings({ values, ready, onSave }: Props) {
  const [draft, setDraft] = useState(values);
  const [editing, setEditing] = useState<WorkTimeOption | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (!dirty) setDraft(values); }, [values, dirty]);
  const change = (items: WorkTimeOption[]) => { setDraft(items); setDirty(true); setError(""); };
  const move = (index: number, direction: number) => { const items = [...draft]; [items[index], items[index + direction]] = [items[index + direction], items[index]]; change(items); };
  const save = async () => {
    const message = validateWorkTimes(draft);
    if (message) return setError(message);
    setSaving(true); setError("");
    try { await onSave(draft); setDirty(false); } catch (error) { setError(error instanceof Error ? error.message : "保存できませんでした"); }
    finally { setSaving(false); }
  };
  const commit = () => {
    if (!editing) return;
    const items = draft.some(item => item.id === editing.id) ? draft.map(item => item.id === editing.id ? editing : item) : [...draft, editing];
    const message = validateWorkTimes(items);
    if (message) return setError(message);
    change(items); setEditing(null);
  };
  const custom = editing && editing.abbreviation && !ABBREVIATIONS.includes(editing.abbreviation);
  const [freeInput, setFreeInput] = useState(false);
  return <section className="space-y-4">
    <p className="text-sm text-slate-600">時間・略語・表示順を登録します。保存した設定はPCとスマホで共通です。</p>
    {!ready && <p role="status" className="text-sm text-red-700">共通設定を取得できていません。再読み込みしてください。GAS更新前は共通保存を利用できません。</p>}
    <div className="space-y-2">{draft.map((item, index) => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3">
      <span className="text-xs font-bold text-slate-500">{index + 1}</span><strong className="flex-1 text-sm">{workTimeValue(item)}{item.nextDay && "（翌日終了）"}{item.abbreviation && <small className="ml-2 text-blue-700">{item.abbreviation}</small>}</strong>
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" disabled={!ready || saving} checked={item.visible} onChange={e => change(draft.map(row => row.id === item.id ? { ...row, visible: e.target.checked } : row))} />表示</label>
      <Button aria-label={`${workTimeValue(item)}を上へ`} variant="outline" size="sm" disabled={!ready || index === 0 || saving} onClick={() => move(index, -1)}>↑</Button><Button aria-label={`${workTimeValue(item)}を下へ`} variant="outline" size="sm" disabled={!ready || index === draft.length - 1 || saving} onClick={() => move(index, 1)}>↓</Button>
      <Button variant="outline" size="sm" disabled={!ready || saving} onClick={() => { setEditing({ ...item }); setFreeInput(Boolean(item.abbreviation && !ABBREVIATIONS.includes(item.abbreviation))); setError(""); }}>編集</Button>
      <Button variant="outline" size="sm" disabled={!ready || saving} className="text-red-600" onClick={() => change(draft.filter(row => row.id !== item.id))}>削除</Button>
    </div>)}</div>
    <Button variant="outline" disabled={!ready || saving} onClick={() => { setEditing({ id: crypto.randomUUID(), start: "09:00", end: "18:00", nextDay: false, abbreviation: "", visible: true }); setFreeInput(false); setError(""); }}>＋ 新しい勤務時間を追加</Button>
    {error && <p role="alert" className="text-sm font-bold text-red-600">{error}</p>}
    <div><Button disabled={!ready || saving || !dirty} onClick={() => void save()}>{saving ? "保存中…" : "勤務時間設定を保存"}</Button>{dirty && <span className="ml-3 text-xs text-amber-700">未保存の変更あり</span>}</div>
    <p className="text-xs text-slate-500">非表示・削除しても、入力済みのシフトは残ります。「有休」「休み」「任意入力」は常に選べます。</p>
    {editing && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="work-time-editor-title" className="max-h-[90vh] w-full max-w-md space-y-4 overflow-auto rounded-2xl bg-white p-5">
      <h2 id="work-time-editor-title" className="text-lg font-black">勤務時間の入力</h2>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-bold">開始<input type="time" className="mt-1 h-11 w-full rounded-lg border px-3" value={editing.start} onChange={e => setEditing({ ...editing, start: e.target.value })} /></label><label className="text-sm font-bold">終了<input type="time" className="mt-1 h-11 w-full rounded-lg border px-3" value={editing.end} onChange={e => setEditing({ ...editing, end: e.target.value })} /></label></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.nextDay} onChange={e => setEditing({ ...editing, nextDay: e.target.checked })} />終了は翌日</label>
      <label className="block text-sm font-bold">略語<select className="mt-1 h-11 w-full rounded-lg border bg-white px-3" value={freeInput || custom ? "custom" : editing.abbreviation} onChange={e => { setFreeInput(e.target.value === "custom"); setEditing({ ...editing, abbreviation: e.target.value === "custom" ? "" : e.target.value }); }}><option value="">なし</option>{ABBREVIATIONS.map(value => <option key={value}>{value}</option>)}<option value="custom">自由入力</option></select></label>
      {(freeInput || custom) && <input aria-label="略語の自由入力" maxLength={20} placeholder="例：短時間、応援" className="h-11 w-full rounded-lg border px-3" value={editing.abbreviation} onChange={e => setEditing({ ...editing, abbreviation: e.target.value })} />}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.visible} onChange={e => setEditing({ ...editing, visible: e.target.checked })} />プルダウンに表示する</label>
      <p className="rounded-lg bg-blue-50 p-3 text-sm">プレビュー：{workTimeValue(editing)}{editing.abbreviation && `（${editing.abbreviation}）`}</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setEditing(null); setError(""); }}>戻る</Button><Button onClick={commit}>一覧に反映</Button></div>
    </div></div>}
  </section>;
}
