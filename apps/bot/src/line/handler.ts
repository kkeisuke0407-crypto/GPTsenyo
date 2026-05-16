import { replyMessage, type LineMessage } from "./client";
import {
  birthdateInvalidMessage,
  birthdateSavedMessage,
  checkoutLinkMessage,
  divinationMessage,
  errorMessage,
  farewellMessage,
  genericHelpMessage,
  planInfoMessage,
  quotaExceededMessage,
  welcomeMessage,
} from "./messages";
import { createCheckoutSession } from "../stripe/checkout";
import type { Plan } from "../lib/env";
import {
  countMonthlySessions,
  getDb,
  getUser,
  insertSession,
  setUserBirthdate,
  upsertUser,
} from "../db/supabase";
import { buildAstrologyContext } from "../divination/astrology";
import { buildTarotContext } from "../divination/tarot";
import { buildNumerologyContext } from "../divination/numerology";
import { buildSizhuContext } from "../divination/sizhu";
import { buildIChingContext } from "../divination/iching";
import type { DivinationContext } from "../divination/types";
import { buildPromptMessages, postProcessNarration } from "../llm/prompts";
import { chatCompletion } from "../llm/client";
import { PLAN_QUOTA, type Env } from "../lib/env";

type LineMessageEvent = {
  type: "message";
  replyToken: string;
  source: { userId?: string };
  message: { type: string; text?: string };
};

type LineFollowEvent = {
  type: "follow";
  replyToken: string;
  source: { userId?: string };
};

type LineUnfollowEvent = {
  type: "unfollow";
  source: { userId?: string };
};

type LinePostbackEvent = {
  type: "postback";
  replyToken: string;
  source: { userId?: string };
  postback: { data: string };
};

type LineEvent = LineMessageEvent | LineFollowEvent | LineUnfollowEvent | LinePostbackEvent;

export async function handleLineEvents(env: Env, events: LineEvent[]): Promise<void> {
  await Promise.all(events.map((e) => handleOne(env, e).catch((err) => console.error("event error", err))));
}

async function handleOne(env: Env, event: LineEvent): Promise<void> {
  const userId = event.source.userId;
  if (!userId) return;

  if (event.type === "follow") {
    const db = getDb(env);
    await upsertUser(db, { lineUserId: userId });
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, event.replyToken, [welcomeMessage()]);
    return;
  }

  if (event.type === "unfollow") {
    const db = getDb(env);
    await db.rpc("purge_user", { p_line_user_id: userId });
    return;
  }

  if (event.type === "postback") {
    await handlePostback(env, event.replyToken, userId, event.postback.data);
    return;
  }

  if (event.type === "message" && event.message.type === "text") {
    const text = (event.message.text ?? "").trim();
    await routeTextMessage(env, event.replyToken, userId, text);
  }
}

async function handlePostback(
  env: Env,
  replyToken: string,
  userId: string,
  data: string
): Promise<void> {
  const params = new URLSearchParams(data);
  const plan = params.get("plan");
  if (plan === "light" || plan === "standard" || plan === "premium") {
    try {
      const url = await createCheckoutSession({ env, lineUserId: userId, plan });
      await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [
        checkoutLinkMessage(plan as Exclude<Plan, "free">, url),
      ]);
    } catch (err) {
      console.error("checkout error", err);
      await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [errorMessage()]);
    }
    return;
  }
  await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [genericHelpMessage()]);
}

async function routeTextMessage(
  env: Env,
  replyToken: string,
  userId: string,
  text: string
): Promise<void> {
  const db = getDb(env);
  await upsertUser(db, { lineUserId: userId });

  // 退会
  if (text === "退会" || text === "削除") {
    await db.rpc("purge_user", { p_line_user_id: userId });
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [farewellMessage()]);
    return;
  }

  // プラン照会
  if (text === "プラン" || text === "料金" || text === "料金プラン") {
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [planInfoMessage()]);
    return;
  }

  // 誕生日登録（"YYYY-MM-DD" 単独、または「誕生日 YYYY-MM-DD」）
  const birthdateMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (birthdateMatch && (text.length <= 12 || text.startsWith("誕生日"))) {
    const iso = normalizeBirthdate(birthdateMatch[1]!, birthdateMatch[2]!, birthdateMatch[3]!);
    if (!iso) {
      await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [birthdateInvalidMessage()]);
      return;
    }
    await setUserBirthdate(db, userId, iso);
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [birthdateSavedMessage(iso)]);
    return;
  }

  // 占術ルーティング
  const divinationKind = detectDivinationKind(text);
  if (!divinationKind) {
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [genericHelpMessage()]);
    return;
  }

  const user = await getUser(db, userId);
  const question = stripCommand(text);
  const plan = user?.plan ?? "free";

  // 生年月日が必要な占術での未登録時案内
  const needsBirthdate =
    divinationKind === "astrology" ||
    divinationKind === "numerology" ||
    divinationKind === "sizhu";
  if (needsBirthdate && !user?.birthdate) {
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [
      {
        type: "text",
        text: "この占術には生年月日が必要です🌙\nまず「1992-04-15」のように送って登録してください。",
      },
    ]);
    return;
  }

  // プレミアム限定占術（四柱推命・易）
  if ((divinationKind === "sizhu" || divinationKind === "iching") && plan === "free") {
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [
      {
        type: "text",
        text:
          "この占術はライト以上のプランでお楽しみいただけます🌙\n" +
          "「プラン」と送ると料金プランをご案内します。",
      },
    ]);
    return;
  }

  // クォータチェック
  const limit = PLAN_QUOTA[plan];
  const used = await countMonthlySessions(db, userId);
  if (used >= limit) {
    await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [
      quotaExceededMessage(plan, used, limit),
    ]);
    return;
  }

  // 占術コンテキスト構築
  let ctx: DivinationContext;
  switch (divinationKind) {
    case "tarot":
      ctx = buildTarotContext(question);
      break;
    case "astrology":
      ctx = buildAstrologyContext(new Date(user!.birthdate!), question);
      break;
    case "numerology":
      ctx = buildNumerologyContext(new Date(user!.birthdate!), question);
      break;
    case "sizhu":
      ctx = buildSizhuContext(new Date(user!.birthdate!), question);
      break;
    case "iching":
      ctx = buildIChingContext(question);
      break;
  }

  let replyMsg: LineMessage;
  let tokensUsed = 0;
  let narration = "";
  try {
    const llm = await chatCompletion({
      apiKey: env.OPENAI_API_KEY,
      model: env.LLM_MODEL,
      messages: buildPromptMessages(ctx),
    });
    narration = postProcessNarration(llm.content, question);
    tokensUsed = llm.tokensUsed;
    replyMsg = divinationMessage(narration);
  } catch (err) {
    console.error("LLM error", err);
    replyMsg = errorMessage();
  }

  await replyMessage(env.LINE_CHANNEL_ACCESS_TOKEN, replyToken, [replyMsg]);

  if (narration) {
    await insertSession(db, {
      line_user_id: userId,
      type: ctx.type,
      question,
      facts: ctx.facts,
      narration,
      tokens_used: tokensUsed,
    });
  }
}

function detectDivinationKind(text: string): DivinationContext["type"] | null {
  if (text.startsWith("タロット")) return "tarot";
  if (text.startsWith("星占い") || text.startsWith("占星術")) return "astrology";
  if (text.startsWith("数秘")) return "numerology";
  if (text.startsWith("四柱推命") || text.startsWith("命式")) return "sizhu";
  if (text.startsWith("易") || text.startsWith("周易") || text.startsWith("イーチン")) return "iching";
  return null;
}

function stripCommand(text: string): string {
  return text
    .replace(/^(タロット|星占い|占星術|数秘|四柱推命|命式|周易|易|イーチン|占い)[:：\s]*/, "")
    .trim();
}

function normalizeBirthdate(y: string, m: string, d: string): string | null {
  const year = Number.parseInt(y, 10);
  const month = Number.parseInt(m, 10);
  const day = Number.parseInt(d, 10);
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}
