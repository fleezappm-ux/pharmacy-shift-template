import { AutoDraftSettings } from "../types";
import { getManagementApiKey, getShiftSession } from "./auth-sync";
import { getGasUrl } from "./gas-config";
async function call(action: string, payload: Record<string, unknown> = {}) { const response = await fetch(getGasUrl(), { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action, sessionToken: getShiftSession()?.token || "", shiftApiKey: getManagementApiKey(), ...payload }) }); const json = await response.json(); if (!json.success) throw new Error(json.message || "自動作成設定を処理できませんでした"); return json; }
export async function fetchAutoDraftSettings(): Promise<AutoDraftSettings | null> { return (await call("getShiftAutoDraftSettings")).settings || null; }
export async function saveAutoDraftSettings(settings: AutoDraftSettings): Promise<AutoDraftSettings> { return (await call("saveShiftAutoDraftSettings", { settings })).settings; }
