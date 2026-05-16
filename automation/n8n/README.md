# n8n ワークフロー集

セレネ運営の自動化フロー。各ファイルは n8n のインポート機能でそのまま読み込めます。

## sns-daily-post.json

X (Twitter) と Threads に **毎日3投稿（朝7時／昼12時／夜21時 JST）** を自動投稿するワークフロー。

### 構成
```
Cron Trigger 3本（朝/昼/夜）
  → Set: スロット別プロンプト
  → OpenAI Chat Completion (GPT-4o-mini)
  → Extract Text
  ├→ Post to X (Twitter API v2)
  └→ Post to Threads (Meta Graph API)
```

### セットアップ手順

1. n8n（セルフホスト推奨：Hetzner CX22 月¥1,500 や Railway 等）に **ワークフローをインポート**
2. 認証情報を3つ登録：
   - **OpenAI Bearer**：`Authorization: Bearer sk-...` の HTTP Header Auth
   - **X OAuth1**：開発者ポータルで取得した API Key/Secret/Access Token/Secret
   - **Threads Access Token**：Meta Graph API の long-lived access token
3. Threads ノードの URL 内 `{{ $credentials.threadsBusinessAccount }}` を **Threads Business Account ID** に書き換え
4. ワークフローを **Activate**

### 投稿頻度を変えたい時
各 `Cron Trigger` ノードの cron 式（`0 22 * * *` 等）を編集。`*/30 * * * *` なら30分おき。

### プロンプトをカスタマイズしたい時
`Set: Morning/Noon/Night Slot` ノードの `prompt` フィールドを編集。

### 投稿先を増やしたい時
`Extract Text` ノードから新しい HTTP Request ノード（Instagram/TikTok等）を追加。

---

## 注意事項

- **X API**：無料プランは月1,500投稿まで。3投稿/日 × 30日 = 90投稿で余裕あり
- **Threads API**：1日250投稿まで（2026年5月時点）
- **OpenAI コスト**：GPT-4o-mini で1投稿あたり約0.02円。月90投稿で約2円
- 同じプロンプトでも毎回少しずつ違う文章が生成されるが、多様性を出したい場合は temperature を 0.9 まで上げる
