import { templateStorage } from "../lib/template-storage";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPeriodSettings } from "../lib/calendar-period-sync";
import { SpecialDayColor } from "../types";

export interface StoreMaster {
  storeName: string;
  leaveRequestBoardVisibility: "immediate" | "after_approval" | "private";
  businessDays: number[];
  useJapaneseHolidays: boolean;
  yearEndEnabled: boolean;
  yearEndStart: string;
  yearEndEnd: string;
  obonEnabled: boolean;
  obonStart: string;
  obonEnd: string;
  holidayBandEnabled: boolean;
  holidayColor: SpecialDayColor;
  yearEndBandEnabled: boolean;
  yearEndColor: SpecialDayColor;
  obonBandEnabled: boolean;
  obonColor: SpecialDayColor;
}

export const DEFAULT_STORE_MASTER: StoreMaster = {
  storeName: "薬局名を設定", leaveRequestBoardVisibility: "immediate", businessDays: [1, 2, 3, 4, 5, 6], useJapaneseHolidays: true,
  yearEndEnabled: true, yearEndStart: "12-31", yearEndEnd: "01-03",
  obonEnabled: true, obonStart: "08-13", obonEnd: "08-15",
  holidayBandEnabled: true, holidayColor: "red", yearEndBandEnabled: true, yearEndColor: "red", obonBandEnabled: true, obonColor: "red"
};

interface Props {
  master: StoreMaster;
  onMasterChange: (master: StoreMaster) => void;
  period: CalendarPeriodSettings;
  periodDraft: CalendarPeriodSettings;
  saving: boolean;
  onPeriodDraftChange: (settings: CalendarPeriodSettings) => void;
  onSavePeriod: () => Promise<void>;
  onSaveBoardVisibility: (visibility: StoreMaster["leaveRequestBoardVisibility"]) => Promise<void>;
  onOpenBandSettings: () => void;
}

const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const heading = "text-sm font-bold text-slate-900";
const description = "mt-1 text-xs leading-5 text-slate-500";
const field = "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function StoreMasterSettings({ master, onMasterChange, period, periodDraft, saving, onPeriodDraftChange, onSavePeriod, onOpenBandSettings }: Props) {
  const [draft, setDraft] = useState(master);
  useEffect(() => setDraft(master), [master.businessDays.join(",")]);
  const save = async () => {
    onMasterChange(draft);
    templateStorage.setItem("store_master_settings", JSON.stringify(draft));
    if (period.startDay !== periodDraft.startDay || period.endDay !== periodDraft.endDay) await onSavePeriod();
    toast.success("店舗マスタを保存しました");
  };

  return <section className="space-y-4 font-sans text-slate-900">
    <div className={panel}>
      <label className={heading}>店舗名</label><p className={description}>シフト画面で使用する店舗名です。</p>
      <Input className="mt-3 h-11 rounded-xl text-sm" value={draft.storeName} onChange={event => setDraft(current => ({ ...current, storeName: event.target.value }))} />
    </div>
    <div className={panel}>
      <h4 className={heading}>シフトの集計期間</h4><p className={description}>シフトを1か月分として扱う開始日を選びます。終了日は自動で決まり、画面表示とCSV・Excelの出力期間も同じになります。</p>
      <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <label><span className="mb-2 block text-xs font-bold text-slate-600">開始日</span><select className={field} value={periodDraft.startDay} onChange={event => { const startDay = Number(event.target.value); onPeriodDraftChange({ startDay, endDay: startDay === 1 ? 0 : startDay - 1 }); }}>{Array.from({ length: 28 }, (_, index) => index + 1).map(day => <option key={day} value={day}>毎月{day}日</option>)}</select></label>
        <span className="pb-3 text-center text-sm font-bold text-blue-600">→</span>
        <label><span className="mb-2 block text-xs font-bold text-slate-600">終了日（自動）</span><div className={`${field} flex items-center bg-slate-50`}>{periodDraft.endDay === 0 ? "同月末日" : `翌月${periodDraft.endDay}日`}</div></label>
      </div>
    </div>
    <div className={panel}>
      <h4 className={heading}>定休日</h4><p className={description}>曜日と祝日、帯色、シフト案・クール適用時の休み判定を一か所で設定できます。</p>
      <Button variant="outline" className="mt-3" onClick={onOpenBandSettings}>定休日を設定 →</Button>
    </div>
    <Button className="h-11 w-full font-bold" disabled={saving || !draft.storeName.trim()} onClick={() => void save()}><Save className="mr-2 h-4 w-4" />店舗マスタを保存</Button>
  </section>;
}
