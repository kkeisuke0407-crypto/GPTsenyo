// 毎週月曜 7:00 JST に有料会員へ「今週のテーマ」をプッシュ
import { getDb } from "../db/supabase";
import { sunSignFromBirthdate } from "../divination/astrology";
import { chatCompletion } from "../llm/client";
import { multicastMessage } from "../line/client";
import type { Env } from "../lib/env";

const SIGNS = [
  "牡羊座", "牡牛座", "双子座", "蟹座", "獅子座", "乙女座",
  "天秤座", "蠍座", "射手座", "山羊座", "水瓶座", "魚座",
] as const;

type Sign = (typeof SIGNS)[number];

async function generateWeeklyMessage(env: Env, sign: Sign, weekLabel: string): Promise<string> {
  const { content } = await chatCompletion({
    apiKey: env.OPENAI_API_KEY,
    model: env.LLM_MODEL,
    maxTokens: 380,
    temperature: 0.85,
    messages: [
      {
        role: "system",
        content:
          "あなたは『セレネ』という名前の優しい占い師アシスタントです。" +
          "断定的予言・医療助言・投資助言は禁止。「絶対」「必ず」「100%」「保証」も使いません。" +
          "出力は280〜380字、見出しは使わず、絵文字は控えめ。" +
          "希望と次の一歩を必ず含めてください。",
      },
      {
        role: "user",
        content:
          `${weekLabel}の${sign}の週運勢を、占星術らしいやわらかい語り口で生成してください。\n` +
          "「今週のテーマ」「人間関係・仕事のヒント」「自分を整える小さな儀式（1つ）」の3つの要素を物語的に含めてください。",
      },
    ],
  });
  return content.trim();
}

export async function runWeeklyDigest(env: Env): Promise<{ recipients: number }> {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const month = jstNow.getUTCMonth() + 1;
  const day = jstNow.getUTCDate();
  const weekLabel = `${month}月${day}日から始まる週`;

  const messagesBySign = new Map<Sign, string>();
  await Promise.all(
    SIGNS.map(async (sign) => {
      try {
        const msg = await generateWeeklyMessage(env, sign, weekLabel);
        messagesBySign.set(sign, msg);
      } catch (err) {
        console.error(`weekly message gen failed for ${sign}`, err);
      }
    })
  );

  const db = getDb(env);
  const { data, error } = await db
    .from("users")
    .select("line_user_id, birthdate, plan")
    .not("birthdate", "is", null)
    .in("plan", ["light", "standard", "premium"]);
  if (error) throw new Error(`load paying users failed: ${error.message}`);

  type Row = { line_user_id: string; birthdate: string; plan: string };
  const recipientsBySign = new Map<Sign, string[]>();
  for (const row of (data ?? []) as Row[]) {
    const sign = sunSignFromBirthdate(new Date(row.birthdate)).name as Sign;
    const list = recipientsBySign.get(sign) ?? [];
    list.push(row.line_user_id);
    recipientsBySign.set(sign, list);
  }

  let total = 0;
  for (const sign of SIGNS) {
    const recipients = recipientsBySign.get(sign);
    const body = messagesBySign.get(sign);
    if (!recipients || recipients.length === 0 || !body) continue;
    const text = `🌙 ${weekLabel}・${sign}の週運勢\n\n${body}\n\n———\n今週も、あなたらしくお過ごしください。`;
    try {
      await multicastMessage(env.LINE_CHANNEL_ACCESS_TOKEN, recipients, [{ type: "text", text }]);
      total += recipients.length;
    } catch (err) {
      console.error(`weekly multicast failed for ${sign}`, err);
    }
  }
  return { recipients: total };
}
