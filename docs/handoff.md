# 申し送り（次のチャットのClaude向け）

最終更新：2026-10-07。この資料を最初に読めば、続きから始められます。

## 0. 依頼者と進め方

- 依頼者：フリちゃん（薬剤師・あおい薬局、長野県松本市）。パソコンに詳しくない。**短いやさしい日本語**で話す。
- 流れ：依頼 → 提案・実装 → 確認（tsc・テスト・ビルド・疑似画面・実ブラウザ）→ 公開 → 平易な日本語で報告 →「更新ボタンを押してください」と案内。
- **本番のあおい薬局GAS・DB・リポジトリには絶対に触らない**。このリポジトリ（`fleezappm-ux/pharmacy-shift-template`）は「完成版の複製」のマスターで、テンプレ専用GASだけを使う。
- パスワード・接続キーは**ユーザー本人が入力**する（Claudeは入力しない）。Notionのデータ・Script Propertiesを直接いじらない。Notionは、OKをもらうまで書き換えない。
- 最後にユーザーが「テンプレの初期化（テストデータ消去）」を行う。実Notionのテストデータ（10/5〜10/13のシフト、お知らせ、休み申請、10月の確定解除状態）の後片付けを必ず思い出させる。

## 1. 目標（いまのゴール）

**「人に配れるクオリティー」（100点満点で90点以上）**。2026-10-07時点の自己採点は約88点（別店舗への導入確認が済んだため）。

| 項目 | 配点 | 点 | 残りの課題 |
|---|---|---|---|
| 毎日の使いやすさ | 20 | 18 | 開く約0.3秒、押すとすぐ反映（済） |
| 壊れにくさ | 15 | 14 | 保存失敗の赤帯・自動再試行・エラー記録（済） |
| 安全面 | 15 | 12 | 共通IDの方式。有給の完全な非公開は保証しない（既知の制限として明記済） |
| 機能 | 15 | 13 | |
| 導入のしやすさ | 20 | 17 | 導入手順書・自己診断・**別店舗でゼロから導入する実地確認（2026-10-07済、手順書に反映）** |
| 説明書 | 10 | 8 | README・導入手順書・Notion説明書DB（済） |
| 品質の確かめ | 5 | 4 | 自動テスト＋CI＋疑似画面スクリプト（`tests/e2e`） |

**次にやること（ユーザーが「進めて」と言った）：画面の見た目・スマホでの使いやすさの総点検。**
スマホの狭い画面で、従業員・管理者それぞれの画面を一通り見て、見づらい・押しにくい所を洗い出して直す（疑似画面の`tests/e2e/s22.js`・`tour.js`が使える）。その後の候補：
1. ~~本物の別店舗でゼロから導入する通し確認~~ **2026-10-07済**（GitHub: shift-tool-test-store。ログイン〜Notion保存〜データ初期化まで確認）
2. `App.tsx`（約2,700行）・`Code.gs`（約2,400行）の分割（保守しやすさ）
3. ~~監査ログの操作員名が古いまま残る問題~~ **対応不要と判断（2026-10-07）**：監査ログは保存のみで画面には出ない。操作時点の名前＋IDを記録しており、記録としては正しい。表示機能を作るときにIDから現在名を引く
4. 従業員50人上限（Script Property 約9KB）の解消（配布先が大きい場合）
5. ~~個別ツールの説明（チュートリアル）の見直し~~ 2026-10-07に`ShiftToolGuide.tsx`を点検し、現行の画面と一致しているため変更なし。OR-Tools（自動作成）の話（未承認）

## 2. システム構成

| 部分 | 内容 |
|---|---|
| 画面 | React 19 / Vite / TypeScript / Tailwind。`src/`。GitHub Pages `https://fleezappm-ux.github.io/pharmacy-shift-template/` |
| サーバー | Google Apps Script 単体。`gas/Code.gs`（約119,000文字）。`doPost`にテキストJSON `{action, sessionToken, shiftApiKey, ...}` |
| データ | Notion の3DB（シフト管理DB／シフト希望届／店舗設定DB）。テンプレは `3e693d1ba8d8811abd62cbb9608f2fbe`。説明書DBも同じページ内 |
| テンプレ用GAS | スクリプトID `13SrPdRRE4tjqs5mQef3YMK129yunpC8wNDWKujoG7Vb5-YwhKpX0mwCV`。公開版は**v29**（2026-10-05 14:26） |

重要な仕組み：
- **2段階保存**：画面は `saveShiftMonth`（`partial:true, defer:true`）を送る → GASは行をScript Property `SHIFT_PENDING_JSON`に入れて即返す → 約1.5秒後に `flushShiftPending` がNotionへ書く。失敗時は残して記録し、画面が赤い帯＋再試行（4/10/20/40/60秒）。`getShifts`は未書込み行を重ねて返す。
- **読み込みの高速化**：`getShifts`は120秒キャッシュ（書込み・初期化で無効化）。設定類はScript Properties優先（書き込み時に同時保存）。画面側は読み込みをまとめ送り（30ms・8件）、`getShifts`は単独送信、同時最大4件、7秒で2本目を並走（hedge）。
- **押した瞬間に反映（楽観的更新）**：提出・承認・お知らせはtmp-idで即表示し、失敗時は元に戻して知らせる。
- **エラー記録**：画面のエラー（ErrorBoundary・window error・unhandledrejection）を `logShiftClientError` でGASへ送る（直近15件、約7KB、同内容は回数加算）。管理者は 設定→その他設定→「エラー記録」で閲覧・消去（`getShiftErrorLog`/`clearShiftErrorLog`）。
- **導入の自己診断**：GASで `checkShiftSetup` を実行（設定の抜け・Notion接続・接続キーの強さを一覧）。
- **自動チェック（GitHub Actions）**：`ci.yml`（PRごとにtsc・テスト・ビルド）、`health-check.yml`（6時間ごとにサイトとGASの生死確認。失敗でメール）、`deploy.yml`（mainへのマージで公開。`VITE_BASE_PATH`はリポジトリ名から自動）。
- 管理者の接続キーは端末ごとに1回入力（`shift-tool:v1:/pharmacy-shift-template/:shift_api_key`）。キー未設定の管理者には黄色い案内、初回ログイン直後に入力画面。

## 3. 作業手順（コピペで使える）

### 3-1. 確認コマンド（変更のたび）
```
npx tsc --noEmit --noUnusedLocals -p .
npm run test:worktime   # work-time / pending-queue / error-log / fresh-install / options
npm run test:reset
node -e "new Function(require('fs').readFileSync('gas/Code.gs','utf8'))"
```

### 3-2. 公開（ブランチ → PR → squashマージ）
```
git checkout -b feature/xxx
git commit -m "…

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01SY42FhE3HWUhV4cHGVsXMo"
git push -u origin feature/xxx
gh api repos/fleezappm-ux/pharmacy-shift-template/pulls -f title=… -f head=feature/xxx -f base=main -f body=… --jq .number
# CIが success になるのを確認（約1.5〜2分）
gh api -X PUT repos/fleezappm-ux/pharmacy-shift-template/pulls/<番号>/merge -f merge_method=squash
git checkout main && git pull && git branch -D feature/xxx
```
- `gh pr merge` はGraphQLがブロックされる → 上のREST（`gh api`）を使う。**PR番号は出力から確認**（番号の取り違えに注意。直近は #96）。
- Pagesは約40秒で反映。ユーザーには「更新ボタンを押してください」と伝える。

### 3-3. GAS（`gas/Code.gs`）を直したとき：Claudeのブラウザで公開する
1. 変更をmainにマージして、コミットSHAを控える（`git rev-parse HEAD`）。`python3 -c "print(len(open('gas/Code.gs').read()))"` で文字数を控える。
2. ブラウザ（ビルトインブラウザ）で `https://script.google.com/home/projects/13SrPdRRE4tjqs5mQef3YMK129yunpC8wNDWKujoG7Vb5-YwhKpX0mwCV/edit` を開く。
3. `javascript_exec` で、**コミットSHA指定のRaw URL**（ブランチ名は古い内容が返ることがある）からコードを取り、文字数が一致するのを確認してから、Monacoへ反映：
   `monaco.editor.getModels()[0].pushEditOperations([],[{range:m.getFullModelRange(),text:t}],()=>null)`。（top-levelの`return`は不可。式の値が返る）
4. `ctrl+s`で保存し、約3秒待つ（ファイル名の横の橙色の点が消えれば保存済み）。
5. **画面サイズの罠**：ペインが細いと「デプロイ」ボタンが隠れる。`resize_window`で **800x600** にし、**一度ページを開き直した後**に操作する（開く前にサイズ変更するとズームがずれる）。クリック後は**必ず`wait` 2秒してから`screenshot`**（描画が遅れて、開いていないように見える）。
6. 800x600の座標（フレーム1:1）：デプロイボタン (680,32) → 「デプロイを管理」(665,129) → 3秒待つ → 鉛筆 (707,97) → バージョン欄 (480,162) → 「新バージョン」(300,175) → 「デプロイ」(712,552) → 9秒待つ → 「バージョン N」を確認 → 「完了」(726,552)。座標がずれるときは、スクリーンショットで確認してから押す。**ボタンは1回押して画面を見てから次を押す**（連打するとメニューが閉じる）。
7. 終わったら `resize_window` を `desktop` に戻し、**ペインを必ず `https://fleezappm-ux.github.io/pharmacy-shift-template/` に戻す**（戻さないとユーザーのアプリ画面が消える）。
8. ユーザーに、GASを更新したことと、新しいバージョン番号を伝える。

### 3-4. 疑似画面での確認（Playwright）
- `tests/e2e/README.md` を参照（ビルド→`http.server 5199`→`node s22.js`など）。`/tmp`は消えるので、必要なら再作成する。サーバーが止まったら `setsid nohup python3 -m http.server …` で再起動（`pkill -f` は使わない）。
- 実ブラウザでの計測：`window.fetch`を包んで時間を測る。`window.confirm=()=>true`。localStorageは名前空間付き（上記）。

## 4. 初回の接続確認（新しいチャットの最初にやること）

「Claudeのブラウザで、AIがGASを更新する方法」を、次回も使えるか確認する。**2026-10-07に確認済み（すべてOK）**。新しいチャットでは、次を順に実行する。
1. ブラウザ：`mcp__remote-devices__Claude_Browser__tabs_context` で `browserOpen:true` を確認（ツールは `ToolSearch` の `select:` で読み込む。`navigate`・`javascript_tool`・`computer`・`find`・`resize_window`）。見つからない・開けないときは、ユーザーに「デスクトップアプリで、このチャットを開き直して、パソコンにつなぐ」よう伝える。
2. GAS編集画面：`https://script.google.com/home/projects/13SrPdRRE4tjqs5mQef3YMK129yunpC8wNDWKujoG7Vb5-YwhKpX0mwCV/edit` に移動し、タイトルが「薬局シフトツール 配布用GAS（仮）…プロジェクト編集者」であること、`monaco`が使えること、コード文字数が `gas/Code.gs` と一致することを確認（ログインが切れていたら、ユーザーに画面でのログインを頼む。Claudeはパスワードを入力しない）。確認後、**ペインをアプリのURLに戻す**。
3. GitHub：`gh api user --jq .login`（`fleezappm-ux`）、`gh api repos/fleezappm-ux/pharmacy-shift-template --jq .permissions`（push可）。
4. Notion：`notion-search` が通ること。ツールは `ToolSearch` で `select:mcp__Notion__notion-search,mcp__Notion__notion-fetch` 等を読み込む。
5. サンドボックスから github.io へは直接つながらない（`curl`は失敗する）。公開サイトの確認は、ブラウザペインの `fetch('/pharmacy-shift-template/version.json')` か、GitHub Actionsの `Health check` で行う。
6. 接続に問題があっても、できる作業（コード修正・テスト・PR）は進め、できないこと（GAS更新）を平易に伝える。

## 5. 既知の注意・制限

- 従業員は最大50人（Script Property 上限約9KB）。
- 共通ID＋操作員の名前選びの方式。有給の完全な非公開は保証しない。
- 疑似画面`flow4.js`の「掲示板: 公開」は失敗（未調査。`flow5.js`は成功）。
- Notionの「テンプレ」ページ冒頭の文は「3つのデータベース」のまま（説明書DBを足したので4つ。直すかユーザーに確認中）。
- `App.tsx`・`Code.gs`が大きい（分割は未着手）。
- 実Notionにテスト用データが残っている（上記0.）。

## 6. 関連資料

- 導入手順書：`docs/setup-guide.md`
- README：`README.md`
- 疑似画面スクリプト：`tests/e2e/`
- Notion：📖 シフトツール説明書（テンプレページ内）、「シフトツール（テンプレ版）初期設定の記録と、初期化のやり方（2026-10-03）」（MyOS/薬局OS/ナレッジ）
