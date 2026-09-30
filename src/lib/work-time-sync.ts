import { getManagementApiKey, getShiftSession } from "./auth-sync";
import { getGasUrl } from "./gas-config";
import { WorkTimeOption } from "./work-time-options";
async function call(action: string, extra: Record<string, unknown> = {}) {
  const response = await fetch(getGasUrl(), { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action, sessionToken: getShiftSession()?.token || "", shiftApiKey: getManagementApiKey(), ...extra }) });
  if (!response.ok) throw new Error(`勤務時間設定の通信に失敗しました（${response.status}）`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message || "勤務時間設定を保存できませんでした");
  return json;
}
export async function fetchWorkTimeMaster(): Promise<{ items: WorkTimeOption[]; revision: string }> { return (await call("getShiftWorkTimeMaster")).master; }
export async function saveWorkTimeMaster(items: WorkTimeOption[], revision: string): Promise<{ items: WorkTimeOption[]; revision: string }> { return (await call("saveShiftWorkTimeMaster", { items, revision })).master; }
