import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";

type GuideSection = { title: string; points: string[] };

const commonSections: GuideSection[] = [
  { title: "ログインと操作員", points: [
    "ログインID・パスワードを入力し、今回操作する自分の名前を選びます。別の名前を選んだ場合は、ホームの『操作員：名前』からログアウトして入り直してください。",
    "管理者と従業員では使える操作が異なります。ログイン情報が分からない場合は店舗の管理者に確認してください。",
  ] },
  { title: "ホームと今日のシフト", points: [
    "前週・次週で週を切り替え、日付を選ぶと、その日に出勤する人と勤務内容を確認できます。従業員名から個人のシフトを開けます。",
    "月の全体シフト、お知らせ掲示板、休み希望への入口があります。日付の帯色はカレンダー帯色設定を表示します。帯色は勤務内容に影響しません。",
  ] },
  { title: "全体・個人シフト", points: [
    "全体シフトでは期間内の全員の勤務を確認できます。従業員名を選ぶと個人シフトが開き、期間を切り替えられます。",
    "『シフト案』は編集中、『確定』は公開後の状態です。色付きの日付も勤務の有無とは別に確認してください。",
  ] },
  { title: "休み希望・出勤希望", points: [
    "休み希望ページで対象期間と日付を選び、希望の種類と必要なコメントを入力して提出します。出勤希望では開始・終了時間を入力してください。",
    "提出内容と状態はマイページで確認できます。確定済みシフトの変更が必要なときは訂正依頼を使います。",
  ] },
  { title: "お知らせ掲示板とマイページ", points: [
    "掲示板で表示対象のお知らせ、希望申請、訂正依頼を確認できます。公開範囲によって見える内容が変わります。",
    "マイページで自分の希望、承認・却下の状態、有給残数を確認します。有給残数の登録・更新は画面の案内に従ってください。",
  ] },
];

const adminSections: GuideSection[] = [
  { title: "シフトの作成・自動保存", points: [
    "『シフト作成』から期間と従業員を選び、勤務を編集します。変更後は保存状態の表示を確認してください。通信できないときは、再接続後の保存状態も確認します。",
    "期間を確定すると従業員へ確定シフトを共有します。確定前に勤務と希望申請を確認してください。",
  ] },
  { title: "希望申請の対応", points: [
    "管理者画面で提出された希望と訂正依頼を確認します。承認・却下・対応済みなどの処理結果は申請者の画面にも反映されます。",
    "掲示板への表示範囲は設定画面で調整できます。非公開の申請をほかの従業員に共有しないよう注意してください。",
  ] },
  { title: "店舗・従業員・勤務の設定", points: [
    "設定の店舗マスタで店舗名・営業曜日、従業員マスタで氏名・役職とホーム表示、シフトマスタで自動作成・クール・帯色を管理します。",
    "自動作成は設定でONにして開始します。既に確定したシフトや手作業で変更した勤務は、実行後に画面で確認してください。",
  ] },
  { title: "管理者のお知らせ", points: ["掲示板の「管理者からのお知らせを作成」で本文を入れ、全員または指定従業員を選んで公開します。既定の公開範囲はお知らせ掲示板設定で変更できます。", "指定従業員のお知らせは対象の従業員と管理者だけが読めます。"] },
  { title: "カレンダーの帯色", points: [
    "カレンダー帯色設定の初期値は日曜日と祝日だけ赤帯です。無効にすると帯は消えます。店舗マスタで日曜日を営業にすると日曜日の定休日帯も消えます。",
    "帯色の優先順位は「特定日・毎年の日付 → 祝日 → 第何週の曜日 → 毎週の定休日」です。帯色は表示用で、シフト自体は変更しません。",
  ] },
  { title: "データ出力・接続・初期化", points: [
    "シフトはCSV・Excelで出力できます。ブラウザが対応する場合はExcelの保存先フォルダも選べます。",
    "管理者用GAS接続キーとヒートマップ、Excel保存先は「その他設定」にあります。接続キーやパスワードを掲示板やGitHubへ書き込まないでください。",
    "複製版の業務データ初期化は、対象件数を確認したうえで実行する操作です。Notionのページはアーカイブされ、通常の画面からは戻せません。",
  ] },
];

export function ShiftToolGuide({ role, onClose }: { role: "admin" | "employee"; onClose: (hideNextTime: boolean) => void }) {
  const [hideNextTime, setHideNextTime] = useState(false);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(hideNextTime); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hideNextTime, onClose]);

  return <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/65 p-3 sm:p-6" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="shift-guide-title" className="mx-auto my-3 max-w-3xl rounded-2xl bg-white text-slate-900 shadow-2xl sm:my-8">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 rounded-t-2xl border-b bg-white px-5 py-4 sm:px-7">
        <div><h2 id="shift-guide-title" className="flex items-center gap-2 text-xl font-black"><BookOpen className="h-6 w-6 text-blue-600" />シフトツールの使い方</h2><p className="mt-1 text-sm text-slate-600">読みたい項目を開いて確認できます。ホームからいつでも読み直せます。</p></div>
        <button type="button" aria-label="説明書を閉じる" className="rounded-lg p-2 hover:bg-slate-100" onClick={() => onClose(hideNextTime)}><X className="h-5 w-5" /></button>
      </header>
      <div className="max-h-[68vh] space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
        <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">この説明書はシフトツールの基本操作をまとめています。初めて使うときは「ログインと操作員」から順に読んでください。</div>
        <div><h3 className="mb-3 text-base font-black">全員共通</h3><div className="space-y-2">{commonSections.map((section, index) => <GuideEntry key={section.title} section={section} initiallyOpen={index === 0} />)}</div></div>
        {role === "admin" && <div><h3 className="mb-3 text-base font-black">管理者の操作</h3><div className="space-y-2">{adminSections.map(section => <GuideEntry key={section.title} section={section} />)}</div></div>}
        {role === "employee" && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">シフトの変更や設定は管理者が行います。提出した希望の扱いはマイページで確認してください。</p>}
      </div>
      <footer className="flex flex-col gap-3 rounded-b-2xl border-t bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" checked={hideNextTime} onChange={event => setHideNextTime(event.target.checked)} className="h-4 w-4 accent-blue-600" />次回からこの説明書を自動表示しない</label>
        <button type="button" className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white" onClick={() => onClose(hideNextTime)}>使い始める</button>
      </footer>
    </section>
  </div>;
}

function GuideEntry({ section, initiallyOpen = false }: { key?: string; section: GuideSection; initiallyOpen?: boolean }) {
  return <details defaultOpen={initiallyOpen} className="group rounded-xl border border-slate-200 bg-white p-4">
    <summary className="cursor-pointer text-sm font-bold">{section.title}</summary>
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">{section.points.map(point => <li key={point}>{point}</li>)}</ul>
  </details>;
}

