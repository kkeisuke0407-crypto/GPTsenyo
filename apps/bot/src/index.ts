import { Hono } from "hono";
import type { Env } from "./lib/env";
import { handleLineEvents } from "./line/handler";
import { verifyLineSignature } from "./line/client";
import { handleStripeEvent, verifyStripeSignature } from "./stripe/webhook";
import { runDailyHoroscope } from "./cron/daily-horoscope";
import { renderLP } from "./pages/lp";
import { renderPrivacy, renderTerms, renderTokushoho } from "./pages/legal";
import { renderCheckoutCancel, renderCheckoutSuccess } from "./pages/checkout-result";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.html(renderLP(c.env)));
app.get("/legal/tokushoho", (c) => c.html(renderTokushoho(c.env)));
app.get("/legal/privacy", (c) => c.html(renderPrivacy(c.env)));
app.get("/legal/terms", (c) => c.html(renderTerms(c.env)));
app.get("/checkout/success", (c) => c.html(renderCheckoutSuccess()));
app.get("/checkout/cancel", (c) => c.html(renderCheckoutCancel()));

app.get("/healthz", (c) =>
  c.json({ ok: true, env: c.env.ENVIRONMENT, model: c.env.LLM_MODEL })
);

app.post("/line/webhook", async (c) => {
  const raw = await c.req.text();
  const signature = c.req.header("x-line-signature") ?? null;
  const valid = await verifyLineSignature(c.env.LINE_CHANNEL_SECRET, raw, signature);
  if (!valid) return c.text("invalid signature", 401);

  const body = JSON.parse(raw) as { events?: unknown[] };
  const events = (body.events ?? []) as Parameters<typeof handleLineEvents>[1];
  c.executionCtx.waitUntil(handleLineEvents(c.env, events));
  return c.text("ok");
});

app.post("/stripe/webhook", async (c) => {
  const raw = await c.req.text();
  const signature = c.req.header("stripe-signature") ?? null;
  const valid = await verifyStripeSignature(c.env.STRIPE_WEBHOOK_SECRET, raw, signature);
  if (!valid) return c.text("invalid signature", 401);

  const event = JSON.parse(raw) as Parameters<typeof handleStripeEvent>[1];
  c.executionCtx.waitUntil(handleStripeEvent(c.env, event));
  return c.text("ok");
});

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runDailyHoroscope(env)
        .then((res) => console.log(`daily horoscope sent: ${res.recipients} recipients`))
        .catch((err) => console.error("daily horoscope failed", err))
    );
  },
};
