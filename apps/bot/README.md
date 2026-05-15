# gptsenyo-bot

AI占い LINE Bot (Cloudflare Workers + Hono + TypeScript)

## 構成

```
src/
├── index.ts              # エントリ。ヘルスチェック / LINE webhook / Stripe webhook
├── lib/env.ts            # 環境変数・プラン定義
├── line/
│   ├── client.ts         # LINE API client + 署名検証
│   ├── handler.ts        # メッセージルーティング
│   └── messages.ts       # 返信メッセージテンプレ
├── divination/
│   ├── astrology.ts      # 太陽星座（生年月日から決定論的算出）
│   ├── tarot.ts          # 大アルカナ22枚3枚スプレッド (crypto.getRandomValues)
│   ├── numerology.ts     # ライフパスナンバー（マスター数 11/22/33 対応）
│   └── types.ts
├── llm/
│   ├── client.ts         # OpenAI Chat Completions
│   └── prompts.ts        # ペルソナ + 占術別ガイド + 後処理(禁止語・安全トリガ)
├── db/supabase.ts        # users / sessions / stripe_events 操作
└── stripe/webhook.ts     # 署名検証 + サブスク状態同期
sql/schema.sql            # Supabase 初期スキーマ
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
2. `src/stripe/webhook.ts` の `PRICE_TO_PLAN` に Price ID を追加
3. Webhook エンドポイントに `https://<your-worker>.workers.dev/stripe/webhook` を登録
4. 受信イベント：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Checkout 作成時に `metadata.line_user_id` と `metadata.price_id` を必ず付与

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

npm run typecheck
npm run deploy
```

## 動作確認

LINE 公式アカウントを友だち追加 →
1. 友だち追加直後にウェルカムメッセージ
2. `1992-04-15` 送信 → 誕生日登録
3. `タロット 仕事の進め方は？` → 3枚引き + LLM鑑定文
4. `星占い 今月のテーマ` → 太陽星座ベース
5. `数秘 私の本質` → ライフパス
6. `プラン` → 料金案内
7. `退会` → 全データ削除

## コスト目安

| 項目 | コスト |
|---|---|
| Cloudflare Workers | 無料枠 10万req/日 |
| Supabase | 無料枠 (DB 500MB / 5万MAU) |
| OpenAI GPT-4o-mini | 100ユーザー想定 月¥3,000〜¥8,000 |
| LINE Messaging API | 月200通まで無料 / 月50,000通 ¥5,000 |
| **合計（100ユーザー時）** | **約 ¥8,000〜¥13,000/月** |

## 注意点

- 占い結果はエンタメ目的。医療/法律/投資助言は LLM 側のガードレールで遮断
- `purge_user` RPC で退会時の物理削除（個人情報保護法対策）
- 「絶対」「必ず」「100%」「保証」は後処理で除去（景表法対策）
- `死にたい` 等のトリガで相談窓口を強制提示
- Stripe `metadata.line_user_id` を付与しないと課金がユーザーに紐付かないので必須
