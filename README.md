# 薬局シフトツール 配布用テンプレート（完成版・仮）

シフト画面とシフト専用GASコードのひな型です。実運用の従業員、シフト、希望、認証情報は含みません。元の店舗のGAS URLやNotion IDはコードから除いてあります。未設定のままではGASへ通信しません。

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

`.env.example` を `.env.local` にコピーし、新しくデプロイしたGAS URLを `VITE_SHIFT_GAS_URL` に設定します。`npm ci`、`npm run dev` でローカル確認できます。GitHub Pages等の公開ビルド時にも同じ環境変数を設定してください。サブパスは `VITE_BASE_PATH` で変更できます。標準値は `/pharmacy-shift-template/` です。接続先未設定のまま公開しても実運用データには接続しません。

初回は `initializeShiftOperator()` で登録した操作員を選んでログインし、設定画面で従業員マスターを整えます。

## 2026年9月28日：複製版の公開手順

複製版のNotion接続・GAS初期設定・初回デプロイは完了しています。今回の変更は [`feature/closed-days-rest-rules`](https://github.com/fleezappm-ux/pharmacy-shift-template/pull/2) で準備しました。

1. [更新済みの `gas/Code.gs`](https://github.com/fleezappm-ux/pharmacy-shift-template/blob/feature/closed-days-rest-rules/gas/Code.gs) を**複製版専用GAS**の `Code.gs` に反映し、保存します。スクリプトプロパティのシークレットは変更しません。
2. GASの「デプロイを管理」から現在のウェブアプリの編集を開き、**新バージョン**を選んで再デプロイします。既存デプロイを更新した場合、ウェブアプリURLはそのままです。
3. 複製版GASの再デプロイ後にPRを `main` に取り込み、GitHub Pagesの公開完了を確認します。
4. 複製版で、日曜日・祝日の定休日設定、指定従業員の休み判定、クール適用時の既存勤務の上書き確認、従業員向け説明書①〜⑥を確認します。

GASを先に更新する理由は、新しい「休み判定」「対象従業員」「カレンダーに名前を表示」の保存に更新版GASが必要だからです。あおい薬局の本番リポジトリ・GAS・DBには適用しません。

初期の帯色は日曜日と祝日だけ赤です。帯色だけでは休みを判定しません。定休日と特殊日の設定で「勤務は変更しない／全員を休みにする／指定従業員を休みにする」を選ぶと、シフト案の自動作成とクールの適用時に反映します。設定を変えただけでは保存済みシフトは変更されません。
