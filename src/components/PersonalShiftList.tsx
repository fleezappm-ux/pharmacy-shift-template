import { format } from "date-fns";
import { ja } from "date-fns/locale/ja";
import { CalendarDays, Clock3 } from "lucide-react";
import { Employee, GlobalRemark } from "../types";

import { WorkTimeOption, ShiftDisplayMode, displayShift } from "../lib/work-time-options";
interface Props { employee: Employee; dates: Date[]; remarks: GlobalRemark[]; workTimes: WorkTimeOption[]; displayMode: ShiftDisplayMode; }

export function PersonalShiftList({ employee, dates, remarks, workTimes, displayMode }: Props) {
  return <div className="personal-shift-list">
    <div className="personal-shift-head"><span>日付</span><span>勤務</span><span>実働</span></div>
    {dates.map(date => {
      const key = format(date, "yyyy-MM-dd");
      const shift = employee.shifts.find(item => item.date.slice(0, 10) === key);
      const remark = remarks.find(item => item.date === key);
      const label = shift?.shift === "任意入力" ? shift.customShiftText || "任意入力" : shift?.shift || "未入力";
      const isOff = label === "休み" || label === "有休";
      return <div key={key} className={`personal-shift-row ${remark?.color === "red" ? "is-holiday" : ""} ${remark?.color ? `special-${remark.color}` : ""}`}>
        <div className="personal-date"><strong>{format(date, "M/d")}</strong><span>{format(date, "E", { locale: ja })}</span></div>
        <div className={`personal-shift-value ${isOff ? "is-off" : ""}`} title={label}>{displayShift(label, workTimes, displayMode)}</div>
        <div className="personal-work">{!isOff && shift?.workTime ? <><Clock3 className="w-3.5 h-3.5" />{shift.workTime}</> : "―"}</div>
        {remark?.type && remark.type !== "なし" && <div className="personal-global-remark"><CalendarDays className="w-3.5 h-3.5" />{remark.type}{remark.text ? `：${remark.text}` : ""}</div>}
      </div>;
    })}
  </div>;
}
