// 全部の設定画面で同じ見た目の「保存の状態」。押し忘れを防ぎます。
export function SaveStatus({ dirty, saving = false, className = "" }: { dirty: boolean; saving?: boolean; className?: string }) {
  const tone = saving ? "bg-blue-50 text-blue-800" : dirty ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-800";
  const text = saving ? "保存しています…画面を閉じないでください" : dirty ? "● まだ保存していません。下の保存ボタンを押してください" : "✓ 保存ずみ（変更はありません）";
  return <p role="status" aria-live="polite" className={`rounded-lg px-3 py-2 text-xs font-bold ${tone} ${className}`}>{text}</p>;
}
