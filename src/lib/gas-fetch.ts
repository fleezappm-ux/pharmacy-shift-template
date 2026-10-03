import { getGasUrl } from "./gas-config";

// GASへの通信の窓口です。
// ・同時に送るのは最大4件まで（開いた瞬間に30件ほどが一斉に飛ぶと、Google側がエラー(404)を返すことがあるため）
// ・同じ「読み込み」が同時に重なったときは、1回にまとめる
// ・404／混雑／サーバーエラー／通信断のときは、間をあけて最大3回やり直す
const MAX_PARALLEL = 4;
let active = 0;
const waiting: Array<() => void> = [];
const inflight = new Map<string, Promise<Response>>();

async function acquire() {
  if (active < MAX_PARALLEL) { active += 1; return; }
  await new Promise<void>(resolve => waiting.push(resolve));
  active += 1;
}
function release() { active -= 1; waiting.shift()?.(); }

async function sendWithRetry(init: RequestInit): Promise<Response> {
  const attemptOnce = async (): Promise<Response | null> => { try { return await fetch(getGasUrl(), init); } catch { return null; } };
  let response = await attemptOnce();
  for (let attempt = 1; attempt <= 3 && (!response || response.status === 404 || response.status === 429 || response.status >= 500); attempt += 1) {
    await new Promise(resolve => window.setTimeout(resolve, attempt * 1200));
    response = await attemptOnce();
  }
  if (!response) throw new Error("通信できませんでした（電波・Wi-Fiを確認してください）。編集内容は端末に残っています。電波が戻ったら「再保存」を押してください。");
  return response;
}

export function gasFetch(init: RequestInit): Promise<Response> {
  const body = typeof init.body === "string" ? init.body : "";
  const isRead = /"action"\s*:\s*"get/.test(body);
  const run = async () => {
    await acquire();
    try { return await sendWithRetry(init); } finally { release(); }
  };
  if (!isRead) return run();
  let shared = inflight.get(body);
  if (!shared) {
    shared = run().finally(() => { inflight.delete(body); });
    inflight.set(body, shared);
  }
  return shared.then(response => response.clone());
}
