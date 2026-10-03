import { Employee, EmployeeRole } from "../types";
import { getShiftSession } from "./auth-sync";
import { getManagementApiKey } from "./auth-sync";

import { getGasUrl } from "./gas-config";

export interface EmployeeMasterItem {
  id: string;
  name: string;
  displayName: string;
  displayOrder: number;
  active: boolean;
  aliases: string[];
  role?: EmployeeRole;
  roleId?: string;
}

export interface ShiftRole { id: string; name: string }
export interface HomeLayout { visible: boolean; columns: string[][] }
export const DEFAULT_ROLES: ShiftRole[] = [{ id: "pharmacist", name: "薬剤師" }, { id: "clerk", name: "事務員" }, { id: "seller", name: "登録販売者" }];
export const DEFAULT_HOME_LAYOUT: HomeLayout = { visible: true, columns: [["pharmacist"], ["clerk", "seller"]] };

async function call(action: string, payload: Record<string, unknown> = {}) {
  const sessionToken = getShiftSession()?.token || "";
  const response = await fetch(getGasUrl(), { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action, sessionToken, ...payload }) });
  if (!response.ok) throw new Error(`通信に失敗しました（${response.status}）`);
  const json = await response.json();
  if (!json.success) throw new Error(json.message || "従業員マスタを処理できませんでした");
  return json;
}

export async function fetchEmployeeMaster(): Promise<EmployeeMasterItem[]> {
  // Never submit cached shift names to GAS: its legacy read endpoint auto-registers them.
  const json = await call("getShiftEmployeeMaster", { names: [] });
  return Array.isArray(json.employees) ? json.employees : [];
}

export async function saveEmployeeMaster(employees: EmployeeMasterItem[]): Promise<EmployeeMasterItem[]> {
  const json = await call("saveShiftEmployeeMaster", { employees });
  return Array.isArray(json.employees) ? json.employees : employees;
}

export async function fetchShiftRoles(): Promise<ShiftRole[]> {
  const json = await call("getShiftRoleMaster");
  return Array.isArray(json.roles) ? json.roles : DEFAULT_ROLES;
}
export async function saveShiftRoles(roles: ShiftRole[]): Promise<{ roles: ShiftRole[]; employees: EmployeeMasterItem[] }> {
  const json = await call("saveShiftRoleMaster", { roles, shiftApiKey: getManagementApiKey() });
  return { roles: json.roles, employees: json.employees };
}
export async function fetchHomeLayout(): Promise<HomeLayout> {
  const json = await call("getShiftHomeLayout");
  return json.layout || DEFAULT_HOME_LAYOUT;
}
export async function saveHomeLayout(layout: HomeLayout): Promise<HomeLayout> {
  const json = await call("saveShiftHomeLayout", { layout, shiftApiKey: getManagementApiKey() });
  return json.layout;
}

export function mergeEmployeesWithMaster(source: Employee[], master: EmployeeMasterItem[]): Employee[] {
  return master.filter(item => item.active && !/^従業員[A-EＡ-Ｅ]$/.test(String(item.name || "").trim())).sort((a, b) => a.displayOrder - b.displayOrder).map(item => {
    const names = new Set([item.name, ...(item.aliases || [])]);
    const matches = source.filter(employee => employee.id === item.id || names.has(employee.name));
    return {
      id: item.id,
      name: item.name,
      displayName: item.displayName || item.name,
      displayOrder: item.displayOrder,
      active: item.active,
      aliases: item.aliases || [],
      role: item.role || matches.find(employee => employee.role)?.role,
      roleId: item.roleId,
      shifts: matches.flatMap(employee => employee.shifts)
    };
  });
}
