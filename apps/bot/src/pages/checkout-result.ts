import { layout } from "./layout";

export function renderCheckoutSuccess(): string {
  return layout({
    title: "決済完了 | セレネ",
    body: `
<section class="hero">
  <h1>ご加入ありがとうございます🌙</h1>
  <p class="tagline">プランが有効化されました。LINEへ戻ってさっそく占いを始めてみてください。</p>
  <a class="cta" href="https://line.me/" rel="noopener">LINEに戻る</a>
</section>
`,
  });
}

export function renderCheckoutCancel(): string {
  return layout({
    title: "決済キャンセル | セレネ",
    body: `
<section class="hero">
  <h1>決済がキャンセルされました</h1>
  <p class="tagline">いつでも気が向いた時に、もう一度お試しください。無料プランでも毎朝の運勢はお届けします🌙</p>
  <a class="cta" href="/" rel="noopener">トップに戻る</a>
</section>
`,
  });
}
