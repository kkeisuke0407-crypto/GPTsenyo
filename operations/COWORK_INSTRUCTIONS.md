# 【COWORK向け指示書】セレネ AI占いLINE Bot 立ち上げ作業

> このリポジトリの `apps/bot/` には、AI占いLINE Botサブスク事業のコードが既に完成しています。
> あなたのタスクは、**外部サービスのアカウント取得・設定・本番デプロイ・初動集客** を実行することです。
> 本指示書のチェックリストを上から順に実行し、各フェーズの末尾にある「完了時に依頼者へ報告すること」を必ず実施してください。

---

## 0. 全体像

| フェーズ | 内容 | 所要 | 必要スキル |
|---|---|---|---|
| 1 | アカウント取得 | 半日〜1日 | Web手続き |
| 2 | 各種設定とシークレット取得 | 半日 | API設定 |
| 3 | コードのデプロイ | 30分 | コマンド実行 |
| 4 | 動作確認 | 30分 | スマホ操作 |
| 5 | 法令・特商法対応 | 1〜2時間 | 書類確認 |
| 6 | Rich Menu / SNS素材 | 半日 | Canva操作 |
| 7 | 初動集客 | 1〜2週間 | SNS運用 |

**完了の定義**：LINE Botで占いができ、Stripe決済が通り、毎朝の運勢が自動配信される状態。

---

## 1. 事前に依頼者から受け取るもの

| 項目 | 形式 | 用途 |
|---|---|---|
| 屋号 / 運営者名 | テキスト | 特商法表記、各サービス登録名 |
| 連絡先メール | メアド | サービス登録・問い合わせ窓口 |
| 連絡先電話番号 | 電話番号 | Stripe審査・LINE認証で必要 |
| 銀行口座情報 | 銀行名・支店・口座種別・番号 | Stripe入金先 |
| 本人確認書類 | 写真 (運転免許/マイナンバー) | Stripe・LINE認証 |
| 開業届（あれば） | PDF | Stripe審査をスムーズにする |
| クレジットカード | 物理カード | Cloudflare / OpenAI の従量課金用 |
| 想定ドメイン | text | 例: `selene-uranai.com`（未取得ならこの作業で取得） |
| サービス名・ブランドカラー | テキスト | LP・Rich Menu用 |

**これらが揃わない場合は依頼者に確認してから先に進むこと。**

---

## 2. フェーズ1: アカウント取得

### 2-1. Cloudflare（最優先）
- [ ] https://dash.cloudflare.com/sign-up でアカウント作成
- [ ] メール認証完了
- [ ] Workers & Pages を有効化（無料プランでOK）
- [ ] **Workers Free プラン** で十分。Pro($5/月) は不要
- [ ] （任意）ドメインを Cloudflare で取得 or 移管

### 2-2. Supabase
- [ ] https://supabase.com/ でアカウント作成（GitHubログイン可）
- [ ] New Project: `selene` という名前で東京リージョン（`ap-northeast-1`）を選択
- [ ] DBパスワードはランダム生成して保管
- [ ] **Free プラン** でOK
- [ ] プロジェクト作成完了後、`Settings > API` から以下を控える：
  - `Project URL` （`SUPABASE_URL` に使う）
  - `service_role` キー（`SUPABASE_SERVICE_ROLE_KEY` に使う、**絶対に公開しないこと**）

### 2-3. LINE Developers
- [ ] https://developers.line.biz/ でアカウント作成（既存LINEアカウントでログイン）
- [ ] プロバイダー作成（運営者名でOK）
- [ ] **Messaging API チャネル** を作成
  - チャネル名: `セレネ AI占い`（または依頼者指定）
  - 業種: `その他`
- [ ] チャネル作成後、以下を控える：
  - `Channel secret`（Basic settings タブ）
  - `Channel access token`（Messaging API タブで「Issue」をクリックして発行）
- [ ] **応答設定**：
  - 「あいさつメッセージ」: **オフ**
  - 「応答メッセージ」: **オフ**
  - 「Webhook」: **オン**（URLはフェーズ3で設定）

### 2-4. LINE Official Account Manager
- [ ] https://manager.line.biz/ にログイン
- [ ] アカウント情報を設定（プロフィール画像、説明文、業種）
- [ ] **認証済みアカウント**の申請（任意、審査1〜2週間）
  - 認証されると検索で見つかりやすくなる
  - 占いカテゴリは追加審査あり、依頼者と相談

### 2-5. OpenAI
- [ ] https://platform.openai.com/ でアカウント作成
- [ ] クレジットカードを登録、**$10 ほどクレジットチャージ**
- [ ] `API keys` から新規APIキーを発行、控える（`OPENAI_API_KEY`）
- [ ] **Usage limits** で月$50 のソフトリミットを設定（事故防止）

### 2-6. Stripe
- [ ] https://dashboard.stripe.com/register でアカウント作成
- [ ] ビジネス情報を入力（事業形態・所在地・業種「占い・エンタメ」など）
- [ ] 銀行口座を登録
- [ ] 本人確認書類をアップロード
- [ ] 審査通過待ち（数時間〜数日）
- [ ] **テストモード**で先に進められる項目はテストで作業し、本番審査が通ったら本番モードへ移行
- [ ] `Developers > API keys` から `Secret key` を控える（`STRIPE_SECRET_KEY`）
- [ ] **Products > Add Product** で3つの商品を作成：
  - `セレネ ライト` 月額 ¥980（recurring monthly, JPY）
  - `セレネ スタンダード` 月額 ¥1,980（recurring monthly, JPY）
  - `セレネ プレミアム` 月額 ¥4,980（recurring monthly, JPY）
- [ ] 各 Price ID（`price_xxx`）を控える（`STRIPE_PRICE_LIGHT/STANDARD/PREMIUM`）

### 2-7. SNS アカウント
- [ ] X (Twitter) : `@selene_uranai` 等を作成
- [ ] Threads : 同名で作成
- [ ] Instagram : 同名で作成
- [ ] TikTok : 同名で作成
- [ ] プロフィール画像・bio・LINE友達追加URLを統一
- [ ] **X API**は必要時のみ申請（n8n自動投稿に使用、Basic $100/月）

### ✅ フェーズ1完了時に依頼者へ報告
- 全アカウントの登録完了スクショ
- ドメインの状況
- Stripe 審査状況（保留中 / 通過済み）
- LINE 認証申請の状況

---

## 3. フェーズ2: シークレット投入と設定

### 3-1. ローカル環境の準備（作業用PC）
```bash
git clone https://github.com/kkeisuke0407-crypto/GPTsenyo.git
cd GPTsenyo/apps/bot
npm install
```

### 3-2. Supabase スキーマ適用
- [ ] Supabase Dashboard > SQL Editor を開く
- [ ] `apps/bot/sql/schema.sql` の中身をコピペ
- [ ] `Run` をクリック
- [ ] エラーがなく `Success` 表示を確認

### 3-3. Wrangler ログイン
```bash
npx wrangler login
```
ブラウザでCloudflareにログイン許可。

### 3-4. シークレット投入（合計13個）
以下を**1つずつ**実行。プロンプトで値を入力：

```bash
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET   # フェーズ3で取得後に再投入
npx wrangler secret put STRIPE_PRICE_LIGHT
npx wrangler secret put STRIPE_PRICE_STANDARD
npx wrangler secret put STRIPE_PRICE_PREMIUM
npx wrangler secret put ADMIN_TOKEN              # 32文字以上のランダム文字列を生成
```

**`ADMIN_TOKEN` の生成例**:
```bash
openssl rand -hex 32
```

### 3-5. wrangler.toml の編集
- [ ] `apps/bot/wrangler.toml` を開く
- [ ] `[vars]` セクションを依頼者情報で更新：
  - `PUBLIC_BASE_URL` = `"https://<your-worker>.workers.dev"` または独自ドメイン
  - `LINE_FRIEND_URL` = LINE Official Account Manager の「友達追加URL」
  - `CONTACT_EMAIL` = 依頼者の連絡先メール
  - `OPERATOR_NAME` = 屋号 / 運営者名
  - `OPERATOR_ADDRESS` = 文言は変更不要（請求時開示の運用）

### ✅ フェーズ2完了時に依頼者へ報告
- 投入したシークレットのリスト（値は伝えない、名前のみ）
- wrangler.toml の編集箇所

---

## 4. フェーズ3: デプロイ

### 4-1. 初回デプロイ
```bash
cd apps/bot
npm run typecheck   # エラーなく通ること
npm run deploy
```

デプロイ完了時に表示されるURL（例: `https://gptsenyo-bot.<your-subdomain>.workers.dev`）を**控える**。

### 4-2. LINE Webhook URL を設定
- [ ] LINE Developers Console > 該当チャネル > Messaging API タブ
- [ ] `Webhook URL` に `<デプロイURL>/line/webhook` を設定
- [ ] `Verify` ボタンで疎通確認 → `Success` 表示を確認
- [ ] `Use webhook` を ON

### 4-3. Stripe Webhook URL を設定
- [ ] Stripe Dashboard > Developers > Webhooks > `Add endpoint`
- [ ] URL: `<デプロイURL>/stripe/webhook`
- [ ] 受信イベント（以下4つを選択）:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] 作成後、`Signing secret`（`whsec_xxx`）を控える
- [ ] ローカルで再投入：
  ```bash
  npx wrangler secret put STRIPE_WEBHOOK_SECRET
  ```
- [ ] 再デプロイ：`npm run deploy`

### 4-4. ヘルスチェック
- [ ] ブラウザで `<デプロイURL>/healthz` にアクセス → JSONが返ることを確認
- [ ] ブラウザで `<デプロイURL>/` にアクセス → LPが表示されることを確認
- [ ] ブラウザで `<デプロイURL>/legal/tokushoho` 確認
- [ ] ブラウザで `<デプロイURL>/admin?token=<ADMIN_TOKEN>` 確認（初期はデータ0）

### ✅ フェーズ3完了時に依頼者へ報告
- デプロイURL
- LINE / Stripe Webhook 設定完了スクショ
- /healthz と / の表示スクショ

---

## 5. フェーズ4: 動作確認（スマホで）

### 5-1. LINE Bot 動作確認
- [ ] LINE Official Account Manager から友達追加URLを取得
- [ ] スマホLINEで友達追加 → **ウェルカムメッセージが届く** ことを確認
- [ ] `1992-04-15` を送信 → **「生年月日を登録しました」** 返信
- [ ] `タロット 今の私に必要なメッセージ` → **3枚引きの鑑定文** が返る（10秒以内）
- [ ] `星占い 今月のテーマ` → **太陽星座ベースの鑑定文** が返る
- [ ] `数秘 私の本質` → **ライフパス鑑定文** が返る
- [ ] `四柱推命 今の流れ` → **「ライト以上のプラン」案内** が返る（無料制限が効く）
- [ ] `易 人間関係について` → 同上
- [ ] `プラン` → **Quick Reply で3プラン提示** が返る
- [ ] ライトプラン Quick Reply タップ → **Stripe Checkout URL** が返る
- [ ] **テストカード `4242 4242 4242 4242` で決済テスト**
- [ ] 決済完了後、再度 `四柱推命 今の流れ` → 今度は鑑定文が返る（プランUP確認）
- [ ] `退会` → 「データを削除しました」返信、Supabaseのusersテーブルから消えていることを確認

### 5-2. Cron 動作確認
- [ ] Cloudflare Dashboard > Workers > 該当Worker > Cron Triggers
- [ ] Cron式 `0 22 * * *` と `0 22 * * 0` が登録されていることを確認
- [ ] ローカルで手動トリガ：
  ```bash
  cd apps/bot
  npx wrangler dev --test-scheduled
  # 別ターミナルで
  curl http://localhost:8787/__scheduled?cron=0+22+*+*+*
  ```

### ✅ フェーズ4完了時に依頼者へ報告
- 動作確認スクショ（LINE画面）
- Stripe テスト決済の Dashboard スクショ
- Supabase users / sessions テーブルにデータが入っているスクショ

---

## 6. フェーズ5: 法令・特商法対応

### 6-1. 特商法表記の確認
- [ ] `<デプロイURL>/legal/tokushoho` を開き、運営者名・連絡先が正しいか
- [ ] **本名・住所は請求があった時に開示する** 運用でOK（コードに反映済み）
- [ ] 「絶対」「必ず」「100%」「保証」がページにないか目視確認

### 6-2. プライバシーポリシー
- [ ] `<デプロイURL>/legal/privacy` を確認
- [ ] 連絡先メールが正しいか

### 6-3. 利用規約
- [ ] `<デプロイURL>/legal/terms` を確認
- [ ] エンタメ目的の旨が明記されているか確認

### 6-4. LINE Bot 内でも案内
- [ ] LINEのウェルカムメッセージに「エンタメ目的」の旨が含まれていることを確認

### ⚠ 重要な禁止事項
- 「絶対に当たる」「必ず幸運になる」等の表現を**運営側からは絶対に発信しない**（景表法・特商法違反）
- 占い結果を根拠にした医療・法律・投資のアドバイスは**絶対にしない**
- 高額な開運グッズを売る等の派生ビジネスは**事前に依頼者と相談**

### ✅ フェーズ5完了時に依頼者へ報告
- 各法令ページのスクショ
- 禁止事項チェック結果

---

## 7. フェーズ6: Rich Menu と SNS素材

### 7-1. Rich Menu 画像作成
- [ ] Canva（または Figma）で **2500 × 1686 ピクセル** のキャンバスを作成
- [ ] 3列×2行のグリッドで以下のボタンをデザイン：

```
┌─────────────┬─────────────┬─────────────┐
│ 🎴 タロット │ ⭐ 星占い   │ 🔢 数秘     │
├─────────────┼─────────────┼─────────────┤
│ 🀄 四柱推命 │ ☯ 易        │ 💎 プラン   │
└─────────────┴─────────────┴─────────────┘
```

- [ ] PNG/JPEGで書き出し（**1MB以下**に圧縮）
- [ ] ファイル名 `rich-menu.png`

### 7-2. Rich Menu 適用
```bash
cd apps/bot
LINE_CHANNEL_ACCESS_TOKEN=<your-token> npx tsx scripts/setup-rich-menu.ts ./rich-menu.png
```
- [ ] 「✓ Rich Menu セットアップ完了」表示を確認
- [ ] スマホLINEで友達追加し直し、画面下部にRich Menuが表示されることを確認

### 7-3. SNS 素材作成（最低限）
- [ ] X / Threads / Instagram / TikTok のプロフィール画像（512×512、月のロゴ等）
- [ ] X / Instagram のヘッダー画像（X: 1500×500、Instagram: なし）
- [ ] bio に「LINEで毎日の運勢を無料配信中 → <友達追加URL>」を明記

### 7-4. LP の OGP 画像
- [ ] 1200×630 ピクセルのOGP画像を作成
- [ ] （任意）apps/bot/src/pages/layout.ts に `<meta property="og:image">` を追加して再デプロイ

### ✅ フェーズ6完了時に依頼者へ報告
- Rich Menu スクショ
- 4つのSNSプロフィール画面スクショ

---

## 8. フェーズ7: 初動集客（1〜2週間）

> **目標**: 開設30日で LINE友達 200名 / 有料会員 5〜10名

### 8-1. 自己発信（Day 1）
- [ ] 依頼者の既存SNSアカウントから「AI占いLINE Botを作りました」と告知
- [ ] **依頼者にも投稿協力を依頼**（自分のXで紹介）

### 8-2. 無料モニター募集（Day 1-7）
- [ ] X / Threads で「無料で占うので感想ください」と募集投稿
- [ ] **20〜30名のフィードバック**を得て、プロンプト調整に活用
- [ ] 良い感想は許可を得てSNSに転載

### 8-3. SNS自動投稿の起動（Day 7-）
- [ ] n8n を起動（Hetzner CX22 ¥1,500/月 推奨、または Railway / Render の無料枠）
  - n8nセルフホスト手順: https://docs.n8n.io/hosting/
- [ ] `automation/n8n/sns-daily-post.json` を n8n にインポート
- [ ] OpenAI / X / Threads の認証情報を n8n クレデンシャルに登録
- [ ] ワークフローを Activate
- [ ] **最初の1週間は毎日投稿内容を目視チェック**し、品質に問題ないか確認

### 8-4. 集客チャネル別アクション
| チャネル | アクション | 頻度 |
|---|---|---|
| X | 自動投稿 + 朝の運勢を手動で固定ツイート | 毎日 |
| Threads | 自動投稿（同上） | 毎日 |
| Instagram | AI生成の神秘的ビジュアル + 12星座運勢 | 週3 |
| TikTok | 30秒のショート（タロット引き動画等） | 週2 |
| note | 「占術解説」シリーズ記事 | 週1 |

### 8-5. インフルエンサー / コミュニティ
- [ ] スピ系・占い系のXアカウント10名にDMで紹介依頼（無料招待 + 紹介料）
- [ ] Threads / Reddit / 5ch等の占いコミュニティに**適切にマナーを守って**投稿

### ✅ フェーズ7完了時に依頼者へ報告
- 30日経過時点の以下数値：
  - LINE友達数
  - 有料会員数（プラン別）
  - MRR（管理ダッシュボードのスクショ）
  - SNS各種のフォロワー数

---

## 9. エスカレーション基準（依頼者に確認すべきこと）

以下に該当したら**作業を止めて依頼者に確認**してください：

| 状況 | 対応 |
|---|---|
| Stripe 審査で追加書類を求められた | 依頼者に確認、原本送付要求は要相談 |
| LINE Bot で個人情報の取扱いに関するクレームが来た | 即時返信＋ログを残し、依頼者に転送 |
| 「占いが当たらない」「返金してほしい」等のクレーム | 返金対応は依頼者判断、CSテンプレ策定要相談 |
| 高額AIスクールや派生ビジネスへの提携依頼 | 必ず依頼者確認、安易に応じない |
| 月のOpenAIコストが¥10,000を超えた | 依頼者に確認、ソフトリミット調整 |
| LINE 認証申請が却下された | 認証なしで進行可能、依頼者に状況共有 |
| 30日経過してLINE友達が50名未満 | 集客戦略を依頼者と再検討 |
| 規約違反通報・チャージバック・凍結リスク | **即時報告**。自己判断で対応せず |

---

## 10. 進捗報告フォーマット

週次で依頼者に以下を報告：

```
【週次報告 - YYYY/MM/DD】

■ 数値
- LINE友達: XX名 (前週比 +XX)
- 有料会員: ライトXX / スタンダードXX / プレミアムXX
- MRR: ¥XXX,XXX
- 30日アクティブユーザー: XX名

■ 完了したタスク
- ...

■ 今週の課題
- ...

■ エスカレーション事項
- ...
```

---

## 11. 緊急時連絡

| 事象 | 連絡先 |
|---|---|
| サービス停止 | 依頼者へSMS / 電話 |
| 法令違反疑い | 依頼者へ即時連絡＋全SNS投稿停止 |
| 個人情報漏洩 | 依頼者へ即時連絡＋ログ保全＋専門家相談 |

---

## 12. 最終チェックリスト

サービス本番運用開始の判断基準：

- [ ] 全シークレット投入完了
- [ ] LINE Bot 全コマンドで正常応答
- [ ] Stripe テスト決済成功
- [ ] /admin ダッシュボード閲覧可能
- [ ] 特商法・プライバシー・規約ページ表示OK
- [ ] Cron Trigger 登録確認
- [ ] Rich Menu 設定完了
- [ ] SNSアカウント4種開設・bio設定完了
- [ ] 無料モニター10名以上から肯定的フィードバック
- [ ] 依頼者最終承認

**全項目チェック完了後、本番リリース宣言**。

---

## 付録A: トラブルシューティング

| エラー | 原因 | 対処 |
|---|---|---|
| `wrangler deploy` で `Authentication error` | wrangler login していない | `npx wrangler login` 実行 |
| LINE Webhook で `signature invalid` | LINE_CHANNEL_SECRET が古い | 再発行して再投入 |
| Stripe Webhook で `signature invalid` | STRIPE_WEBHOOK_SECRET が間違い | Dashboardで確認、再投入 |
| OpenAI で `insufficient_quota` | クレジット切れ | OpenAI Platformで追加チャージ |
| Supabase `relation users does not exist` | schema.sqlを実行していない | SQL Editorで再実行 |
| LINE で鑑定文が返らない | OpenAI APIキー誤り or 上限超 | wrangler tail でログ確認 |
| Cron が動かない | wrangler.toml の triggers 設定漏れ | 再デプロイ |

## 付録B: 各サービスの料金目安

| サービス | 想定月額（100ユーザー時） |
|---|---|
| Cloudflare Workers | ¥0（無料枠内） |
| Supabase | ¥0（無料枠内） |
| OpenAI API | ¥3,000〜¥8,000 |
| LINE Messaging API | ¥5,000（50,000通プラン） |
| Stripe 決済手数料 | 売上の3.6%（売上¥100,000なら¥3,600） |
| ドメイン | ¥150/月 |
| n8n (Hetzner CX22) | ¥1,500 |
| **合計** | **¥10,000〜¥20,000** |

---

*作成日: 2026-05-15 / 最終更新: 同*
*このドキュメントは `operations/COWORK_INSTRUCTIONS.md` として管理。改訂時は git commit で履歴を残すこと。*
