import type { Stats } from "../db/stats";
import { escapeHtml } from "./layout";

const TYPE_LABEL: Record<string, string> = {
  astrology: "星占い",
  tarot: "タロット",
  numerology: "数秘",
  sizhu: "四柱推命",
  iching: "易",
};

export function renderAdminDashboard(stats: Stats): string {
  const maxBar = Math.max(1, ...stats.sessionsLast14Days.map((d) => d.count));
  const bars = stats.sessionsLast14Days
    .map((d) => {
      const h = Math.round((d.count / maxBar) * 120);
      const label = d.date.slice(5);
      return `<div class="bar" title="${escapeHtml(d.date)}: ${d.count}件"><div class="bar-fill" style="height:${h}px"></div><span class="bar-label">${escapeHtml(label)}</span><span class="bar-count">${d.count}</span></div>`;
    })
    .join("");

  const typeRows = Object.entries(stats.sessionsByType30d)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${escapeHtml(TYPE_LABEL[k] ?? k)}</td><td>${v}</td></tr>`)
    .join("");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>セレネ 管理ダッシュボード</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif; background: #f6f8fa; color: #1f2937; }
  h1 { margin: 0 0 16px; font-size: 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .card .label { font-size: 0.85rem; color: #6b7280; margin-bottom: 6px; }
  .card .value { font-size: 1.75rem; font-weight: 700; }
  .card .sub { font-size: 0.85rem; color: #6b7280; margin-top: 4px; }
  .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .section h2 { margin: 0 0 16px; font-size: 1.1rem; }
  .chart { display: flex; gap: 4px; align-items: flex-end; height: 160px; padding: 0 4px; }
  .bar { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; }
  .bar-fill { width: 100%; background: linear-gradient(180deg, #818cf8, #4f46e5); border-radius: 4px 4px 0 0; min-height: 2px; }
  .bar-label { font-size: 0.7rem; color: #6b7280; }
  .bar-count { font-size: 0.7rem; color: #4f46e5; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; font-size: 0.85rem; color: #6b7280; font-weight: 600; }
  .plan-row { display: flex; gap: 16px; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .plan-row:last-child { border-bottom: none; }
  .plan-name { flex: 1; font-weight: 500; }
  .plan-count { color: #4f46e5; font-weight: 600; }
  .footer { text-align: center; color: #9ca3af; font-size: 0.8rem; margin-top: 32px; }
</style>
</head>
<body>
<h1>🌙 セレネ 管理ダッシュボード</h1>

<div class="grid">
  <div class="card"><div class="label">総ユーザー</div><div class="value">${stats.totalUsers}</div><div class="sub">生年月日登録: ${stats.usersWithBirthdate}</div></div>
  <div class="card"><div class="label">アクティブユーザー (30日)</div><div class="value">${stats.activeUsers30d}</div></div>
  <div class="card"><div class="label">有料会員</div><div class="value">${stats.payingUsers.light + stats.payingUsers.standard + stats.payingUsers.premium}</div></div>
  <div class="card"><div class="label">月次経常収益 (MRR)</div><div class="value">¥${stats.mrrJpy.toLocaleString()}</div></div>
</div>

<div class="section">
  <h2>過去14日間のセッション数</h2>
  <div class="chart">${bars}</div>
</div>

<div class="section">
  <h2>有料プラン内訳</h2>
  <div class="plan-row"><div class="plan-name">ライト (¥980)</div><div class="plan-count">${stats.payingUsers.light}名</div><div>¥${(stats.payingUsers.light * 980).toLocaleString()}</div></div>
  <div class="plan-row"><div class="plan-name">スタンダード (¥1,980)</div><div class="plan-count">${stats.payingUsers.standard}名</div><div>¥${(stats.payingUsers.standard * 1980).toLocaleString()}</div></div>
  <div class="plan-row"><div class="plan-name">プレミアム (¥4,980)</div><div class="plan-count">${stats.payingUsers.premium}名</div><div>¥${(stats.payingUsers.premium * 4980).toLocaleString()}</div></div>
</div>

<div class="section">
  <h2>占術別セッション (30日)</h2>
  <table><thead><tr><th>占術</th><th>回数</th></tr></thead><tbody>${typeRows || '<tr><td colspan="2" style="text-align:center;color:#9ca3af;">データなし</td></tr>'}</tbody></table>
</div>

<div class="footer">セレネ 管理ダッシュボード — 最終更新: ${new Date().toISOString()}</div>
</body>
</html>`;
}
