import { renderLP } from "../src/pages/lp";
import { renderTokushoho, renderPrivacy, renderTerms } from "../src/pages/legal";
import { renderCheckoutSuccess, renderCheckoutCancel } from "../src/pages/checkout-result";
import type { Env } from "../src/lib/env";

const env: Env = {
  ENVIRONMENT: "test",
  LLM_MODEL: "gpt-4o-mini",
  FREE_MONTHLY_QUOTA: "3",
  LIGHT_MONTHLY_QUOTA: "10",
  LINE_CHANNEL_SECRET: "",
  LINE_CHANNEL_ACCESS_TOKEN: "",
  OPENAI_API_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: "",
  STRIPE_PRICE_LIGHT: "price_light",
  STRIPE_PRICE_STANDARD: "price_standard",
  STRIPE_PRICE_PREMIUM: "price_premium",
  PUBLIC_BASE_URL: "https://example.com",
  LINE_FRIEND_URL: "https://lin.ee/sample",
  CONTACT_EMAIL: "support@example.com",
  OPERATOR_NAME: "テスト運営者",
  OPERATOR_ADDRESS: "東京都",
};

const checks: Array<[string, () => string]> = [
  ["LP", () => renderLP(env)],
  ["特商法", () => renderTokushoho(env)],
  ["プライバシー", () => renderPrivacy(env)],
  ["利用規約", () => renderTerms(env)],
  ["成功", () => renderCheckoutSuccess()],
  ["失敗", () => renderCheckoutCancel()],
];

for (const [name, fn] of checks) {
  const html = fn();
  if (!html.includes("<!doctype html>")) throw new Error(`${name}: missing doctype`);
  if (!html.includes("</html>")) throw new Error(`${name}: missing closing html`);
  console.log(`OK ${name}: ${html.length} bytes`);
}
