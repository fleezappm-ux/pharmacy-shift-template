import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarPlus, Check, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SpecialDayColor, SpecialDayRule } from "../types";
import { EmployeeMasterItem } from "../lib/employee-master-sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COLORS: { value: SpecialDayColor; label: string }[] = [
  { value: "red", label: "赤帯" }, { value: "blue", label: "青帯" }, { value: "green", label: "緑帯" },
  { value: "amber", label: "黄帯" }, { value: "purple", label: "紫帯" }, { value: "gray", label: "灰帯" }
];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
interface Props { rules: SpecialDayRule[]; employees: EmployeeMasterItem[]; loading: boolean; onSave: (rules: SpecialDayRule[]) => Promise<void>; }

function displayDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function SpecialDaySettings({ rules, employees, loading, onSave }: Props) {
  const [drafts, setDrafts] = useState<SpecialDayRule[]>(rules);
  const initialClosed = rules.find(rule => /^band-v3:closed-[0-6]$/.test(rule.id)) || rules.find(rule => rule.id === "band-v3:holiday");
  const [closedSettings, setClosedSettings] = useState(() => ({ name: initialClosed?.name || "定休日", color: initialClosed?.color || "red" as SpecialDayColor, showName: initialClosed?.showName !== false, restMode: initialClosed?.restMode || "none" as NonNullable<SpecialDayRule["restMode"]>, restEmployeeIds: initialClosed?.restEmployeeIds || [] as string[] }));
  const [dateInputs, setDateInputs] = useState<Record<string, string>>({});
  const [addLocked, setAddLocked] = useState(false);
  const [newRuleId, setNewRuleId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  useEffect(() => {
    setDrafts(rules);
    const source = rules.find(rule => /^band-v3:closed-[0-6]$/.test(rule.id)) || rules.find(rule => rule.id === "band-v3:holiday");
    if (source) setClosedSettings({ name: source.name, color: source.color, showName: source.showName !== false, restMode: source.restMode || "none", restEmployeeIds: source.restEmployeeIds || [] });
  }, [rules]);
  const fixedRule = (rule: SpecialDayRule) => /^band-v3:closed-[0-6]$/.test(rule.id) || rule.id === "band-v3:holiday";
  const unifyClosed = (items: SpecialDayRule[]) => items.map(rule => fixedRule(rule) ? { ...rule, ...closedSettings } : rule);
  const closedDays = WEEKDAYS.map((_, day) => drafts.some(rule => rule.id === `band-v3:closed-${day}` && rule.enabled));
  const holidayClosed = drafts.some(rule => rule.id === "band-v3:holiday" && rule.enabled);
  const setClosed = (patch: Partial<typeof closedSettings>) => {
    const next = { ...closedSettings, ...patch }; setClosedSettings(next);
    setDrafts(items => items.map(rule => fixedRule(rule) ? { ...rule, ...next } : rule));
  };
  const toggleClosed = (id: string, weekday: number, checked: boolean) => {
    setDrafts(items => checked ? [...items.filter(rule => rule.id !== id), { id, ...closedSettings, behavior: "information", enabled: true, mode: id === "band-v3:holiday" ? "annual" : "recurring", weekday, weeks: id === "band-v3:holiday" ? [] : [1, 2, 3, 4, 5], dates: [] } as SpecialDayRule] : items.filter(rule => rule.id !== id));
  };

  const update = (id: string, patch: Partial<SpecialDayRule>) => setDrafts(current => current.map(rule => rule.id === id ? { ...rule, ...patch } : rule));
  const add = () => {
    if (addLocked) return;
    const id = crypto.randomUUID();
    const rule: SpecialDayRule = { id: `band-v3:${id}`, name: "新しい帯色ルール", color: "amber", behavior: "information", enabled: true, mode: "annual", weekday: 0, weeks: [1], dates: [] };
    const ruleId = rule.id;
    setDrafts(current => [rule, ...current]);
    setNewRuleId(ruleId);
    setAddLocked(true);
    toast.success("新しい特殊日を一番上に追加しました");
    window.setTimeout(() => {
      document.getElementById(`special-rule-${ruleId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setAddLocked(false);
    }, 250);
    window.setTimeout(() => setNewRuleId(""), 1600);
  };

  const removeRule = async (id: string) => {
    const target = drafts.find(rule => rule.id === id);
    if (!target || !window.confirm(`「${target.name}」を完全に削除しますか？`)) return;
    const before = drafts;
    const next = drafts.filter(rule => rule.id !== id);
    setDrafts(next);
    setDeletingId(id);
    try {
      await onSave(unifyClosed(next));
      toast.success(`「${target.name}」を削除しました`);
    } catch {
      setDrafts(before);
    } finally { setDeletingId(""); }
  };

  const addDate = (rule: SpecialDayRule) => {
    const value = dateInputs[rule.id] || "";
    if (!value) return toast.error("日付を選んでください");
    if (rule.dates.includes(value)) return toast.info("その日付は登録済みです");
    update(rule.id, { dates: [...rule.dates, value].sort() });
    setDateInputs(current => ({ ...current, [rule.id]: "" }));
    toast.success(`${displayDate(value)}を追加しました`);
  };

  const restFields = (value: Pick<SpecialDayRule, "restMode" | "restEmployeeIds">, updateFields: (patch: Partial<SpecialDayRule>) => void) => <div className="mt-3 rounded-lg border bg-white p-3 text-sm">
    <label className="block font-bold">シフト案・クール適用時の扱い<select className="mt-2 h-10 w-full rounded-lg border bg-white px-2" value={value.restMode || "none"} onChange={event => updateFields({ restMode: event.target.value as SpecialDayRule["restMode"] })}><option value="none">勤務は変更しない</option><option value="all">全員を休みにする</option><option value="selected">指定従業員を休みにする</option></select></label>
    {value.restMode === "selected" && <fieldset className="mt-3 grid gap-2"><legend className="font-bold">休みにする従業員</legend>{employees.filter(item => item.active).map(item => <label key={item.id} className="flex items-center gap-2"><input type="checkbox" checked={(value.restEmployeeIds || []).includes(item.id)} onChange={event => updateFields({ restEmployeeIds: event.target.checked ? [...(value.restEmployeeIds || []), item.id] : (value.restEmployeeIds || []).filter(id => id !== item.id) })} />{item.displayName || item.name}</label>)}</fieldset>}
    <p className="mt-2 text-xs text-slate-500">帯色とは独立したルールです。設定を変えただけでは保存済みシフトを変更しません。</p>
  </div>;
  const validRest = (rule: Pick<SpecialDayRule, "restMode" | "restEmployeeIds">) => rule.restMode !== "selected" || !!rule.restEmployeeIds?.some(id => employees.some(item => item.active && item.id === id));

  return <section className="special-day-settings">
    <div className="special-settings-title">
      <div><CalendarPlus className="w-5 h-5" /><div><strong>定休日・帯色マスタ</strong><span>有効にした日だけ、全カレンダーへ帯色を表示します</span></div></div>
      <Button variant="outline" disabled={addLocked || loading} onClick={add} className={addLocked ? "special-add-done" : ""}>{addLocked ? <Check className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}{addLocked ? "追加しました" : "特殊日を追加"}</Button>
    </div>
    <p className="special-save-guide">設定を変えるだけでは既存シフトを変更しません。休み判定はシフト案の自動作成とクール適用時に反映します。重なる日は「指定した日付・毎年同じ日」→「祝日」→「第何週の曜日」→「毎週の定休日」の順に優先します。変更後は一番下の保存を押してください。</p>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <h3 className="font-black">定休日</h3><p className="text-xs text-slate-600">曜日と祝日を選ぶと、同じ帯色と休みルールを適用します。どちらも外すと帯は付きません。</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{WEEKDAYS.map((label, day) => <label key={day} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border font-bold ${closedDays[day] ? "bg-red-50 text-red-700 border-red-300" : "bg-white"}`}><input className="sr-only" type="checkbox" checked={closedDays[day]} onChange={event => toggleClosed(`band-v3:closed-${day}`, day, event.target.checked)} />{label}曜日</label>)}<label className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border font-bold ${holidayClosed ? "bg-red-50 text-red-700 border-red-300" : "bg-white"}`}><input className="sr-only" type="checkbox" checked={holidayClosed} onChange={event => toggleClosed("band-v3:holiday", 0, event.target.checked)} />祝日</label></div>
      <label className="block text-sm font-bold">名前<Input className="mt-1" value={closedSettings.name} onChange={event => setClosed({ name: event.target.value })} /></label>
      <label className="block text-sm font-bold">帯色<select className="mt-1 h-11 w-full rounded-lg border bg-white px-3" value={closedSettings.color} onChange={event => setClosed({ color: event.target.value as SpecialDayColor })}>{COLORS.map(color => <option key={color.value} value={color.value}>{color.label}</option>)}</select></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={closedSettings.showName} onChange={event => setClosed({ showName: event.target.checked })} />カレンダーに名前を表示</label>
      {restFields(closedSettings, patch => setClosed(patch))}
    </section>
    <div className="special-rule-list">
      {drafts.filter(rule => !fixedRule(rule)).map(rule => <div id={`special-rule-${rule.id}`} key={rule.id} className={`special-rule-card ${newRuleId === rule.id ? "is-new" : ""}`}>
        {newRuleId === rule.id && <div className="special-new-label">ここに追加しました</div>}
        <div className="special-rule-main"><Input value={rule.name} aria-label="特殊日の名前" onChange={event => update(rule.id, { name: event.target.value })} /><select aria-label="帯色" value={rule.color} onChange={event => update(rule.id, { color: event.target.value as SpecialDayColor })}>{COLORS.map(color => <option key={color.value} value={color.value}>{color.label}</option>)}</select><label><input type="checkbox" checked={rule.enabled} onChange={event => update(rule.id, { enabled: event.target.checked })} />有効</label><button type="button" className="special-delete" disabled={loading || deletingId === rule.id} aria-label={`${rule.name}を削除`} onClick={() => removeRule(rule.id)}><Trash2 className="w-4 h-4" /></button></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rule.showName !== false} onChange={event => update(rule.id, { showName: event.target.checked })} />カレンダーに名前を表示</label>
        {restFields(rule, patch => update(rule.id, patch))}
        <div className="special-mode-tabs"><button type="button" className={rule.mode === "recurring" ? "active" : ""} onClick={() => update(rule.id, { mode: "recurring" })}>毎月の曜日</button><button type="button" className={rule.mode === "annual" ? "active" : ""} onClick={() => update(rule.id, { mode: "annual" })}>指定日</button><button type="button" className={rule.mode === "yearly" ? "active" : ""} onClick={() => update(rule.id, { mode: "yearly" })}>毎年同じ日</button></div>
        {rule.mode === "recurring" ? <div className="special-recurring"><select value={rule.weekday} onChange={event => update(rule.id, { weekday: Number(event.target.value) })}>{WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}曜日</option>)}</select><div>{[1,2,3,4,5].map(week => <label key={week}><input type="checkbox" checked={rule.weeks.includes(week)} onChange={event => update(rule.id, { weeks: event.target.checked ? [...rule.weeks, week].sort() : rule.weeks.filter(value => value !== week) })} />第{week}</label>)}</div></div> : rule.mode === "yearly" ? <div className="special-annual">
          <label className="special-date-label">毎年の対象日（例：12-31）</label>
          <div className="special-date-entry"><input type="text" inputMode="numeric" placeholder="MM-DD" maxLength={5} value={dateInputs[rule.id] || ""} onChange={event => setDateInputs(current => ({ ...current, [rule.id]: event.target.value }))} /><Button type="button" variant="outline" onClick={() => { const value = dateInputs[rule.id] || ""; const date = new Date(`2024-${value}T00:00:00`); if (!/^\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || format(date, "MM-dd") !== value) return toast.error("MM-DD形式で実在する日付を入力してください"); update(rule.id, { monthDays: [...new Set([...(rule.monthDays || []), value])].sort() }); setDateInputs(current => ({ ...current, [rule.id]: "" })); }}><Plus className="w-4 h-4 mr-1" />追加</Button></div>
          <div className="special-date-list">{(rule.monthDays || []).map(day => <div key={day} className="special-date-chip"><span>{day}</span><button type="button" aria-label={`${day}を削除`} onClick={() => update(rule.id, { monthDays: (rule.monthDays || []).filter(value => value !== day) })}><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div>
        </div> : <div className="special-annual">
          <label className="special-date-label">反映する日付</label>
          <div className="special-date-entry"><input type="date" value={dateInputs[rule.id] || ""} onChange={event => setDateInputs(current => ({ ...current, [rule.id]: event.target.value }))} /><Button type="button" variant="outline" onClick={() => addDate(rule)}><Plus className="w-4 h-4 mr-1" />この日を追加</Button></div>
          <div className="special-date-list">{rule.dates.length ? rule.dates.map((date, index) => <div key={date} className="special-date-chip"><span><b>{index + 1}</b>{displayDate(date)}</span><button type="button" aria-label={`${date}を削除`} onClick={() => update(rule.id, { dates: rule.dates.filter(value => value !== date) })}><Trash2 className="w-3.5 h-3.5" /></button></div>) : <small>登録日はまだありません</small>}</div>
        </div>}
      </div>)}
    </div>
    <Button className="w-full h-11 font-bold" disabled={loading || (drafts.some(fixedRule) && !closedSettings.name.trim()) || drafts.some(rule => !fixedRule(rule) && (!rule.name.trim() || !validRest(rule))) || (drafts.some(fixedRule) && !validRest(closedSettings))} onClick={() => onSave(unifyClosed(drafts))}><Save className="w-4 h-4 mr-2" />変更内容を保存</Button>
  </section>;
}
