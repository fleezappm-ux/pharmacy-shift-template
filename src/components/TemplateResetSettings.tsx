import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getManagementApiKey, getShiftSession } from "@/lib/auth-sync";
import { getGasUrl } from "@/lib/gas-config";
import { templateStorage } from "@/lib/template-storage";

type Preview = { token: string; counts: { label: string; count: number }[]; employees: number; operatorName: string };

async function resetRequest(action: string, payload: Record<string, unknown>) {
  const session = getShiftSession();
  if (session?.role !== "admin") throw new Error("管理者としてログインしてください。");
  const apiKey = getManagementApiKey();
  if (!apiKey) throw new Error("店舗マスターでGAS接続キーを設定してください。");
  const response = await fetch(getGasUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, sessionToken: session.token, apiKey, ...payload })
  });
  if (!response.ok) throw new Error("GASへの通信に失敗しました。");
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "処理に失敗しました。");
  return result;
}

export function TemplateResetSettings({ onBack }: { onBack: () => void }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [archived, setArchived] = useState(0);

  const inspect = async () => {
    setBusy(true);
    try {
      const result = await resetRequest("previewTemplateReset", {});
      setPreview(result as Preview);
      setConfirmation("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "対象を確認できませんでした。");
    } finally { setBusy(false); }
  };

  const run = async () => {
    if (!preview || confirmation !== "初期化") return;
    setRunning(true);
    setBusy(true);
    try {
      let count = archived;
      // 1リクエストにつき最大20件。途中失敗時は同じ画面から再開できる。
      for (;;) {
        const result = await resetRequest("runTemplateReset", { token: preview.token, confirmation: "初期化" });
        count += Number(result.archived || 0);
        setArchived(count);
        if (result.done) break;
      }
      templateStorage.clearBusinessData();
      toast.success("業務データを初期化しました。ログイン画面へ戻ります。");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "初期化が中断しました。同じ画面から再試行してください。");
    } finally { setBusy(false); setRunning(false); }
  };

  return <div className="space-y-4">
    <Button variant="outline" size="sm" onClick={onBack} disabled={running}><ArrowLeft className="mr-1 h-4 w-4" />設定へ戻る</Button>
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-red-700"><Trash2 className="h-5 w-5" />複製版の業務データ初期化</CardTitle>
        <CardDescription>シフト、希望届、店舗の公開設定、従業員・勤務設定を初期化します。現在ログインしている操作員1名と、接続情報・ログインID・パスワードは残します。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-slate-600">Notionのページはアーカイブされ、完全削除はしません。ほかの端末も初期化後に再読み込みしてください。</p>
        <Button variant="outline" disabled={busy} onClick={() => void inspect()}>対象件数を確認</Button>
        {preview && <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-semibold">初期化対象（複製用DB）</p>
          <ul className="list-inside list-disc">{preview.counts.map(item => <li key={item.label}>{item.label}: {item.count}件</li>)}<li>従業員登録: {preview.employees}件（無効・非表示の登録も含む。{preview.operatorName}のみ残す）</li></ul>
          <label className="block space-y-2"><span>実行する場合は「初期化」と入力</span><Input value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} placeholder="初期化" /></label>
          {archived > 0 && <p>アーカイブ済み: {archived}件</p>}
          <Button variant="destructive" disabled={busy || confirmation !== "初期化"} onClick={() => void run()}>{busy ? "処理中…" : archived ? "初期化を再開" : "業務データを初期化"}</Button>
        </div>}
      </CardContent>
    </Card>
  </div>;
}
