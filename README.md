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

## 注意

新規GASの発行、NotionインテグレーションへのDB共有、認証情報の設定、初期操作員登録、および画面の公開はまだ行っていません。これらを済ませた後に保存・再ログイン・権限・掲示板・希望時間・訂正依頼を新しい環境で試してください。

## 2026年9月28日：設定整理（公開前の作業ブランチ）

この変更は `feature/consulted-settings-20260928` にあります。公開サイトの `main` へ取り込む前に、このブランチの `gas/Code.gs` を**複製用GASプロジェクトだけ**に貼り替えて再デプロイしてください。GASのWebアプリURLは既存のデプロイを更新した場合そのまま使えます。あおい薬局の本番GASやDBには適用しません。

- 店舗マスタの営業曜日とカレンダー帯色を共有。初期設定は日曜日・祝日だけ赤帯。帯色は表示用で勤務を変えません。旧帯設定は初回のGAS読込時に複製用の初期値へ移行します。
- 掲示板の管理者通知は全員または指定従業員へ公開できます。閲覧対象の判定はGAS側で行います。
- 従業員マスタの役職とホームの最大2列レイアウトはGASのスクリプトプロパティで共有します。
- 古い備考欄は画面と出力から外します。既存の複製DBに残る備考の値は「設定 → その他設定 → 古い備考を確認して削除」で消します。実行時には複製用DB IDを3件とも確認し、勤務内容は残します。Notionの列自体の削除は行いません。
- 公開後は管理者・従業員で再ログインし、日曜日の営業変更と帯の有効切替、指定従業員のお知らせ、役職変更、CSV・Excel出力を実機で確認してください。
