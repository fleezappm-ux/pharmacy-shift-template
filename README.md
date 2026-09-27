# 薬局シフトツール 配布用テンプレート（完成版・仮）

シフト画面とシフト専用GASコードのひな型です。実運用の従業員、シフト、希望、認証情報は含みません。あおい薬局のGAS URLは含みません。この複製インスタンスの接続先は `.env.production` に設定しています。別店舗へ複製する場合は、GAS URLとNotion DB IDをその店舗専用の値に差し替えてください。

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

`.env.example` を `.env.local` にコピーし、新しくデプロイしたGAS URLを `VITE_SHIFT_GAS_URL` に設定します。`npm ci`、`npm run dev` でローカル確認できます。この複製インスタンスの公開ビルドは `.env.production` の `VITE_SHIFT_GAS_URL` を使用します。別店舗へ配布する際は各店舗の新しいGAS URLに差し替えてください。サブパスは `VITE_BASE_PATH` で変更できます。標準値は `/pharmacy-shift-template/` です。このリポジトリの画面は複製用GASへ接続します。

初回は `initializeShiftOperator()` で登録した操作員を選んでログインし、設定画面で従業員マスターを整えます。

## 2026年9月26日の画面更新

あおい薬局の現行版で追加された希望申請の判定履歴・削除、全体／個人シフトからの希望提出、従業員ホームでの訂正依頼表示、および画面サイズの調整を取り込みました。`deleteShiftLeaveRequest` は管理者ログインと管理者接続キーを要求し、対象のNotionページをアーカイブしてから申請ストアから削除します。Notionの「シフト希望届」DBに追加列は不要です。

## 注意

GASとNotionの複製環境は作成済みです。リポジトリを一般公開し、GitHub PagesをGitHub Actionsから公開する設定にしました。公開サイトは https://fleezappm-ux.github.io/pharmacy-shift-template/ です。実機での保存・再ログイン・権限・掲示板・希望時間・訂正依頼の確認は未完了です。認証情報はGitHubへコミットしないでください。
