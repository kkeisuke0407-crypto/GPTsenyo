# gptsenyo-bot

AI占い LINE Bot (Cloudflare Workers + Hono + TypeScript)

## 構成

```
src/
├── index.ts              # ルーティング + scheduled (cron 分岐)
├── lib/env.ts            # 環境変数・プラン定義・価格表
├── line/
│   ├── client.ts         # LINE API (reply / push / multicast) + 署名検証
│   ├── handler.ts        # message / follow / unfollow / postback
│   └── messages.ts       # 返信テンプレ (Quick Reply 含む)
├── divination/
│   ├── astrology.ts      # 太陽星座（立春境界対応）
│   ├── tarot.ts          # 大アルカナ22枚3枚スプレッド
│   ├── numerology.ts     # ライフパスナンバー (マスター数 11/22/33)
│   ├── sizhu.ts          # 四柱推命 (年柱・月柱・日柱・時柱オプション)
│   ├── iching.ts         # 易 (擲銭法 + 64卦 + 変爻 + 之卦)
│   └── types.ts
├── llm/
│   ├── client.ts         # OpenAI Chat Completions
│   └── prompts.ts        # ペルソナ + 5占術別ガイド + 安全後処理
├── db/
│   ├── supabase.ts       # users / sessions / stripe_events 操作
│   └── stats.ts          # MAU/MRR/セッション統計
├── stripe/
│   ├── checkout.ts       # Checkout Session 作成
│   └── webhook.ts        # 署名検証 + サブスク状態同期 + 冪等化
├── cron/
│   ├── daily-horoscope.ts  # 毎朝の星座別運勢 multicast
│   └── weekly-digest.ts    # 毎週月曜 有料会員向け週次ダイジェスト
└── pages/
    ├── layout.ts             # 共通HTMLレイアウト
    ├── lp.ts                 # ランディングページ
    ├── legal.ts              # 特商法 / プライバシー / 利用規約
    ├── checkout-result.ts    # 決済完了 / キャンセル
    └── admin.ts              # 管理ダッシュボード (MAU/MRR/グラフ)
sql/schema.sql            # Supabase 初期スキーマ
scripts/                  # 動作確認 (smoke/render-check/admin-check)
                          # + Rich Menu セットアップ (setup-rich-menu.ts)
```

## セットアップ

### 1. 依存インストール

```bash
cd apps/bot
npm install
```

### 2. Supabase

1. Supabase プロジェクト作成
2. `sql/schema.sql` を SQL Editor で実行
3. `Settings → API` から URL / service_role キーを控える

### 3. LINE Developers

1. Messaging API チャネル作成
2. Channel secret と Long-lived channel access token を控える
3. Webhook URL に `https://<your-worker>.workers.dev/line/webhook` を設定
4. 「Webhook を利用」「あいさつメッセージOFF」「応答メッセージOFF」

### 4. OpenAI

API key を控える（Cloudflare Workers の月10〜30万通想定なら GPT-4o-mini で月¥3,000〜¥8,000）

### 5. Stripe

1. ライト / スタンダード / プレミアムの 3 Recurring Price を作成
2. Price ID を `STRIPE_PRICE_LIGHT` / `STRIPE_PRICE_STANDARD` / `STRIPE_PRICE_PREMIUM` として投入
3. Webhook エンドポイントに `https://<your-worker>.workers.dev/stripe/webhook` を登録
4. 受信イベント：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Checkout Session は Bot が自動生成し `metadata.line_user_id` を付与（手動設定不要）

### 6. Cloudflare Workers

```bash
npx wrangler login

npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PRICE_LIGHT
npx wrangler secret put STRIPE_PRICE_STANDARD
npx wrangler secret put STRIPE_PRICE_PREMIUM
npx wrangler secret put ADMIN_TOKEN

npm run typecheck
npm run deploy
```

## 動作確認

### LINE Bot
1. 友だち追加直後にウェルカムメッセージ
2. `1992-04-15` 送信 → 誕生日登録
3. `タロット 仕事の進め方は？` → 3枚引き + LLM鑑定文（無料〜）
4. `星占い 今月のテーマ` → 太陽星座ベース（無料〜）
5. `数秘 私の本質` → ライフパス（無料〜）
6. `四柱推命 今の流れ` → 命式ベース（ライト〜）
7. `易 人間関係について` → 周易64卦（ライト〜）
8. `プラン` → Quick Reply で3プラン提示
9. 各プランをタップ → Stripe Checkout URL 発行（自動）
10. `退会` → 全データ削除（purge_user RPC）

### Web
- `GET /` … ランディングページ（LINE友達追加CTA）
- `GET /legal/tokushoho` … 特定商取引法に基づく表記
- `GET /legal/privacy` … プライバシーポリシー
- `GET /legal/terms` … 利用規約
- `GET /checkout/success` / `GET /checkout/cancel` … 決済結果ページ
- `GET /admin?token=<ADMIN_TOKEN>` … 管理ダッシュボード（MAU/MRR/14日チャート/占術別内訳）
- `GET /healthz` … ヘルスチェック

### Cron
- `0 22 * * *` (毎朝7:00 JST) … `daily-horoscope` で生年月日登録済みユーザーに星座運勢 multicast
- `0 22 * * 0` (毎週月曜7:00 JST) … `weekly-digest` で有料会員向けに週次ダイジェスト multicast

ローカルテスト: `npx wrangler dev --test-scheduled` → `curl http://localhost:8787/__scheduled?cron=0+22+*+*+*`

### 管理者用スクリプト
- `LINE_CHANNEL_ACCESS_TOKEN=xxx npx tsx scripts/setup-rich-menu.ts ./menu.png`
  - LINE Rich Menu を一括設定（既存メニューは自動削除）
  - 画像サイズ: 2500×1686 (3列2行)

### 検証スクリプト
- `npx tsx scripts/smoke.ts` … 占術エンジン5種の動作確認
- `npx tsx scripts/render-check.ts` … LP/法令/チェックアウト HTML 検証
- `npx tsx scripts/admin-check.ts` … 管理ダッシュボード モック描画
- `npm run typecheck` … TypeScript 厳格型チェック

## コスト目安

| 項目 | コスト |
|---|---|
| Cloudflare Workers | 無料枠 10万req/日（Cron含む） |
| Supabase | 無料枠 (DB 500MB / 5万MAU) |
| OpenAI GPT-4o-mini | 100ユーザー想定 月¥3,000〜¥8,000 |
| LINE Messaging API | 月200通まで無料 / 月50,000通 ¥5,000 |
| **合計（100ユーザー時）** | **約 ¥8,000〜¥13,000/月** |

100名想定のLINE月間メッセージ数試算:
- 個別鑑定返信: 100名 × 平均月15回 = 1,500通
- 毎朝の運勢: 100名 × 30日 = 3,000通
- 週次ダイジェスト（有料50名想定）: 50名 × 4週 = 200通
- 合計: 約 **4,700通/月** → 月50,000通プラン（¥5,000）で十分余裕あり

## 注意点

- 占い結果はエンタメ目的。医療/法律/投資助言は LLM 側のガードレールで遮断
- `purge_user` RPC で退会時の物理削除（個人情報保護法対策）
- 「絶対」「必ず」「100%」「保証」は後処理で除去（景表法対策）
- `死にたい` 等のトリガで相談窓口を強制提示
- Stripe `metadata.line_user_id` を付与しないと課金がユーザーに紐付かないので必須
