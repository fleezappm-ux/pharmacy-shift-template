import { getGasUrl } from "./gas-config";

// GASへの通信の窓口です。
// ・同時に送るのは最大4件まで（開いた瞬間に30件ほどが一斉に飛ぶと、Google側がエラー(404)を返すことがあるため）
// ・同じ「読み込み」が同時に重なったときは、1回にまとめる
// ・「読み込み」は、404／混雑／サーバーエラー／通信断のとき、間をあけて最大3回やり直す
// ・「保存」は自動でやり直さない（前の保存が裏で動いている最中に重ねると『別の保存処理を実行中』になるため）
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

async function sendWithRetry(init: RequestInit, canRetry: boolean): Promise<Response> {
  // 「読み込み」は25秒返事がなければ打ち切って、やり直す（固まった通信が枠を占領し続けないように）
  const attemptOnce = async (): Promise<Response | null> => {
    const timer = new AbortController();
    const timerId = canRetry ? window.setTimeout(() => timer.abort(), 25000) : undefined;
    const outer = init.signal;
    const onOuterAbort = () => timer.abort();
    outer?.addEventListener("abort", onOuterAbort);
    try { return await fetch(getGasUrl(), { ...init, signal: canRetry ? timer.signal : init.signal }); }
    catch { return null; }
    finally { if (timerId !== undefined) window.clearTimeout(timerId); outer?.removeEventListener("abort", onOuterAbort); }
  };
  let response = await attemptOnce();
  for (let attempt = 1; canRetry && !init.signal?.aborted && attempt <= 3 && (!response || response.status === 404 || response.status === 429 || response.status >= 500); attempt += 1) {
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
    try { return await sendWithRetry(init, isRead); } finally { release(); }
  };
  if (!isRead) return run();
  let shared = inflight.get(body);
  if (!shared) {
    shared = run().finally(() => { inflight.delete(body); });
    inflight.set(body, shared);
  }
  return shared.then(response => response.clone());
}
