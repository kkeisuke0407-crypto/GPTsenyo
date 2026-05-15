import type { Env } from "../lib/env";
import { escapeHtml, layout } from "./layout";

export function renderLP(env: Env): string {
  const friendUrl = env.LINE_FRIEND_URL;
  const body = `
<section class="hero">
  <h1>あなただけの星と数を、毎朝LINEに🌙</h1>
  <p class="tagline">AI占い師セレネが、生まれた時の星と数字から、毎日のテーマをお届けします。</p>
  <a class="cta" href="${escapeHtml(friendUrl)}" rel="noopener">LINEで友達追加して無料で始める</a>
  <p class="disclaimer">本サービスはエンタメ目的です。医療・法律・投資判断は専門家にご相談ください。</p>
</section>

<h2>できること</h2>
<ul>
  <li>毎朝7時、あなたの星座の運勢を自動で配信</li>
  <li>「タロット 〇〇」で3枚引き鑑定（過去・現在・未来）</li>
  <li>「数秘 〇〇」でライフパスナンバー鑑定</li>
  <li>「星占い 〇〇」で太陽星座ベースの深掘り</li>
</ul>

<h2>料金プラン</h2>
<div class="plans">
  <div class="plan">
    <div>無料プラン</div>
    <div class="price">¥0</div>
    <div>月3回の鑑定 ＋ 毎朝の星座運勢</div>
  </div>
  <div class="plan">
    <div>ライト</div>
    <div class="price">¥980 <span style="font-size:0.8rem; opacity:0.7;">/ 月</span></div>
    <div>月10回の鑑定 + 数秘術解放</div>
  </div>
  <div class="plan">
    <div>スタンダード</div>
    <div class="price">¥1,980 <span style="font-size:0.8rem; opacity:0.7;">/ 月</span></div>
    <div>全占術 無制限 + 週次PDF鑑定書</div>
  </div>
  <div class="plan">
    <div>プレミアム</div>
    <div class="price">¥4,980 <span style="font-size:0.8rem; opacity:0.7;">/ 月</span></div>
    <div>全占術 + 個別深掘り + 手相・風水（画像対応）</div>
  </div>
</div>

<div style="text-align:center; margin-top: 32px;">
  <a class="cta" href="${escapeHtml(friendUrl)}" rel="noopener">まずは無料で試してみる</a>
</div>

<h2>よくあるご質問</h2>
<p><b>Q. 解約はいつでもできますか？</b><br/>はい、LINEまたは決済ページからいつでも解約できます。日割り返金はありません。</p>
<p><b>Q. 個人情報の扱いは？</b><br/>生年月日のみ保存します。退会時はすべてのデータを即時削除します。詳しくは<a href="/legal/privacy">プライバシーポリシー</a>をご覧ください。</p>
<p><b>Q. 占いの結果は本当に当たりますか？</b><br/>本サービスはエンタメ目的です。鑑定結果に基づく行動の判断はご自身でお願いします。</p>
`;
  return layout({
    title: "AI占いセレネ — 毎朝の運勢をLINEで",
    description: "AI占いセレネ：星占い・タロット・数秘術をLINEで毎日。月¥980から。",
    body,
  });
}
