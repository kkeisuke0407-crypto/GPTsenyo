export function layout(args: { title: string; body: string; description?: string }): string {
  const desc = args.description ?? "AI占いセレネ — 毎日の運勢とタロット鑑定をLINEでお届け";
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="description" content="${escapeHtml(desc)}" />
<meta name="robots" content="index,follow" />
<title>${escapeHtml(args.title)}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif;
    background: linear-gradient(180deg, #0d1117 0%, #1a1f3a 100%);
    color: #e6e6f0; line-height: 1.75;
  }
  a { color: #b8b3ff; }
  header { padding: 24px 16px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
  header .brand { font-weight: 700; letter-spacing: 0.05em; }
  main { max-width: 720px; margin: 0 auto; padding: 32px 20px 80px; }
  h1 { font-size: 1.8rem; line-height: 1.4; margin-top: 0; }
  h2 { font-size: 1.25rem; margin-top: 2.5rem; border-left: 3px solid #b8b3ff; padding-left: 10px; }
  .hero { text-align: center; padding: 40px 16px 16px; }
  .hero .tagline { font-size: 1.1rem; opacity: 0.85; margin-bottom: 32px; }
  .cta { display: inline-block; background: #06c755; color: white; padding: 14px 32px; border-radius: 999px; font-weight: 700; text-decoration: none; }
  .cta:hover { opacity: 0.9; }
  .plans { display: grid; gap: 16px; margin: 24px 0; }
  .plan { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }
  .plan .price { font-size: 1.5rem; font-weight: 700; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); vertical-align: top; }
  th { width: 28%; color: #b8b3ff; font-weight: 600; }
  footer { text-align: center; padding: 32px 16px; font-size: 0.85rem; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.08); }
  footer a { color: inherit; margin: 0 8px; }
  .disclaimer { font-size: 0.85rem; opacity: 0.7; margin-top: 24px; }
</style>
</head>
<body>
<header><span class="brand">🌙 セレネ — AI占いLINE</span></header>
<main>${args.body}</main>
<footer>
  <div>
    <a href="/legal/tokushoho">特定商取引法に基づく表記</a>
    <a href="/legal/privacy">プライバシーポリシー</a>
    <a href="/legal/terms">利用規約</a>
  </div>
  <div style="margin-top:12px;">© Selene</div>
</footer>
</body>
</html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
