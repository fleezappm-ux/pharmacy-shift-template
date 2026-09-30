# 薬局シフトツール 配布用テンプレート（完成版・仮）

シフト画面とシフト専用GASコードのひな型です。実運用の従業員、シフト、希望、認証情報は含みません。公開サイト用GAS URLはリポジトリに含めません。NotionテンプレートのDB IDは設定例と初期化の安全装置に記載しています。

## 先に用意するもの

- 新しい Google Apps Script プロジェクト（`gas/Code.gs` を貼り付ける）
- [Notionの空テンプレート](https://app.notion.com/p/3e693d1ba8d8811abd62cbb9608f2fbe?pvs=204)内の3つのDB。Notionインテグレーションに各DBへのアクセスを付与する
- 店舗専用のログインIDとパスワード、十分に長いランダムな管理者接続キー

## GASのスクリプトプロパティ

| キー | 内容 |
| --- | --- |
| `NOTION_API_KEY` | 上記3DBに接続できるNotionインテグレーションのシークレット |
| `NOTION_SHIFT_DATABASE_ID` | [シフト管理DB](https://app.notion.com/p/665ef4863f6040e9b542586083764148?pvs=204) のID `665ef4863f6040e9b542586083764148` |
| `NOTION_SHIFT_REQUEST_DATABASE_ID` | [シフト希望届](https://app.notion.com/p/a4d434ce8dbc4e9d860167971c631738?pvs=204) のID `a4d434ce8dbc4e9d860167971c631738` |
| `NOTION_STORE_DATABASE_ID` | [店舗設定DB](https://app.notion.com/p/23de2613332d4ef3b809d21006cec516?pvs=204) のID `23de2613332d4ef3b809d21006cec516` |
| `STORE_ID` | この店舗固有のID。例 `STORE-TEMPLATE-01` |
| `SHIFT_API_KEY` | 新規生成する管理者用接続キー |
| `SHIFT_ADMIN_LOGIN_ID` / `SHIFT_ADMIN_SETUP_PASSWORD` | 管理者ログイン初期設定用。設定後に `configureShiftAdmin()` を一度実行 |
| `SHIFT_EMPLOYEE_LOGIN_ID` / `SHIFT_EMPLOYEE_SETUP_PASSWORD` | 従業員ログイン初期設定用。設定後に `configureShiftEmployeeLogin()` を一度実行 |
| `SHIFT_INITIAL_OPERATOR_NAME` | 初回に登録する操作員名。設定後に `initializeShiftOperator()` を一度実行 |

初期設定関数はセットアップ用パスワードをハッシュ化し、元のプロパティを削除します。パスワードや接続キーはGitHubとNotionの公開ページに書かないでください。GASをウェブアプリとして新規デプロイした後、そのURLをフロント側に設定します。必ず新しい店舗用GASプロジェクトを利用してください。

## フロントの設定

`.env.example` を `.env.local` にコピーし、新しくデプロイしたGAS URLを `VITE_SHIFT_GAS_URL` に設定します。`npm ci`、`npm run dev` でローカル確認できます。GitHub Pagesではリポジトリの **Settings → Secrets and variables → Actions → New repository secret** に `VITE_SHIFT_GAS_URL` を設定します。デプロイ処理は未設定なら失敗し、誤った接続先のサイトを公開しません。サブパスは `VITE_BASE_PATH` で変更できます。標準値は `/pharmacy-shift-template/` です。GAS URLはブラウザの通信先として閲覧者にも見えるため、認証情報として扱わないでください。

既に公開されたGAS URLを後からGit履歴やビルドから完全に秘匿することはできません。既存の公開URLは元の店舗ではなく、この複製版専用GASのものか確認してください。店舗ごとに新しいGASプロジェクトとURLを使い、接続キーとログイン認証を別に設定します。

初回は `initializeShiftOperator()` で登録した操作員を選んでログインし、設定画面で従業員マスターを整えます。

### 複製先で業務データ初期化を使う場合

初期化は誤接続防止のため、デフォルトでは上記Notionテンプレートの3DBだけを対象にします。各店舗でDBを複製した場合、GASのスクリプトプロパティ `SHIFT_RESET_ALLOWED_DB_IDS` に、その店舗で初期化を許可する3つのIDを次の形で設定してください。`NOTION_*_DATABASE_ID` と3件すべて一致しない限り初期化できません。値はGAS管理者が設定し、ブラウザから変更できません。

```json
{"NOTION_SHIFT_DATABASE_ID":"店舗のシフトDB ID","NOTION_SHIFT_REQUEST_DATABASE_ID":"店舗の希望届DB ID","NOTION_STORE_DATABASE_ID":"店舗の店舗設定DB ID"}
```

この操作は対象DBのページをアーカイブします。3つのIDを複製先のものと照合してから設定してください。

## 2026年9月28日：複製版の公開手順

複製版のNotion接続・GAS初期設定・初回デプロイは完了しています。今回の変更は [`feature/closed-days-rest-rules`](https://github.com/fleezappm-ux/pharmacy-shift-template/pull/2) で準備しました。

1. [更新済みの `gas/Code.gs`](https://github.com/fleezappm-ux/pharmacy-shift-template/blob/feature/closed-days-rest-rules/gas/Code.gs) を**複製版専用GAS**の `Code.gs` に反映し、保存します。スクリプトプロパティのシークレットは変更しません。
2. GASの「デプロイを管理」から現在のウェブアプリの編集を開き、**新バージョン**を選んで再デプロイします。既存デプロイを更新した場合、ウェブアプリURLはそのままです。
3. 複製版GASの再デプロイ後にPRを `main` に取り込み、GitHub Pagesの公開完了を確認します。
4. 複製版で、日曜日・祝日の定休日設定、指定従業員の休み判定、クール適用時の既存勤務の上書き確認、従業員向け説明書①〜⑥を確認します。

GASを先に更新する理由は、新しい「休み判定」「対象従業員」「カレンダーに名前を表示」の保存に更新版GASが必要だからです。あおい薬局の本番リポジトリ・GAS・DBには適用しません。

初期の帯色は日曜日と祝日だけ赤です。帯色だけでは休みを判定しません。定休日と特殊日の設定で「勤務は変更しない／全員を休みにする／指定従業員を休みにする」を選ぶと、シフト案の自動作成とクールの適用時に反映します。設定を変えただけでは保存済みシフトは変更されません。

## 2026年9月30日：勤務時間の共通設定

「設定 → シフトマスタ → 勤務時間設定」で、時間・略語・表示順・表示／非表示を保存します。共通マスタは複製版GASの店舗別スクリプトプロパティ `SHIFT_WORK_TIME_MASTER_<STORE_ID>` に保存されます。PC・スマホはログイン時、設定画面を開くとき、他の画面では30秒ごとと画面復帰時に読み込みます。設定画面で編集中は再取得で入力を上書きしません。他端末での同時変更は保存時に検出し、上書きを拒否します。

初期候補は09:00～18:00（早番）、10:00～19:00（遅番）、09:00～13:00（午前勤務）です。あおい薬局固有の固定候補と初期クール例は削除しました。既存のシフト・利用者が保存済みのクールは変更しません。全体シフト・個人シートで時間＋略語／時間のみ／略語のみを切り替えられます。略語未設定または削除済みの勤務時間は時間表示に戻ります。表示の選択は端末内に保存します。

### 複製版GASの更新が必要

GitHub Pagesの公開だけでは共通保存APIは更新されません。`gas/Code.gs` の内容を **複製版専用GAS** に反映して保存し、「デプロイを管理 → 現在のウェブアプリを編集 → 新バージョン」で再デプロイしてください。URLと既存のスクリプトプロパティは変更しません。本番のあおい薬局GASには適用しません。未更新の間は勤務時間設定に取得失敗が表示され、共通保存ボタンは無効になります。

## 2026年9月30日：勤務時間の即時保存と複製版初期化の進行表示

勤務時間設定は、入力画面の「追加・変更を確定」、並べ替え、表示切替、削除のそれぞれで複製版GASに保存します。編集中・保存中・保存失敗・保存済みを画面内に表示し、未完了のまま画面を離れる際は確認します。通信失敗時には変更内容を画面に保持し、再試行できます。

初期化中は進行件数を赤字で表示し、操作画面を覆って誤操作による移動を防ぎます。再読み込みなどで止まった場合は、同じ管理者で開くと複製版GASの `getTemplateResetStatus` で確認済み件数を取得し、再確認後に続きから実行できます。完了時に `SHIFT_WORK_TIME_MASTER_<STORE_ID>` も消去します。件数確認はNotionの一覧取得上限により100件以上をそのまま表示します。

今回も **複製版専用GAS** の `gas/Code.gs` の反映と、ウェブアプリの新バージョンへの再デプロイが必要です。GitHub Pagesへの反映だけでは追加したAPIは有効になりません。URL・スクリプトプロパティは変更しません。本番のあおい薬局GASには適用しません。
