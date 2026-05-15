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

async function generateDailyMessage(env: Env, sign: Sign, dateLabel: string): Promise<string> {
  const { content } = await chatCompletion({
    apiKey: env.OPENAI_API_KEY,
    model: env.LLM_MODEL,
    maxTokens: 220,
    temperature: 0.85,
    messages: [
      {
        role: "system",
        content:
          "あなたは『セレネ』という名前の優しい占い師アシスタントです。" +
          "断定的予言・医療助言・投資助言は禁止。「絶対」「必ず」「100%」「保証」も使いません。" +
          "出力は150〜220字、絵文字は控えめ、希望と次の一歩を必ず含めてください。",
      },
      {
        role: "user",
        content:
          `${dateLabel}の${sign}の運勢を、占星術らしいやわらかい語り口で生成してください。\n` +
          "「今日のテーマ」「人間関係のヒント」「セルフケア」を含めてください。",
      },
    ],
  });
  return content.trim();
}

/**
 * 毎朝の星座別運勢を全ユーザーにマルチキャスト。
 * - 12星座分まとめてLLM生成（並列）
 * - 生年月日登録済みユーザーを星座でグルーピング → multicast
 */
export async function runDailyHoroscope(env: Env): Promise<{ recipients: number }> {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateLabel = `${jstNow.getUTCMonth() + 1}月${jstNow.getUTCDate()}日`;

  const messagesBySign = new Map<Sign, string>();
  await Promise.all(
    SIGNS.map(async (sign) => {
      try {
        const msg = await generateDailyMessage(env, sign, dateLabel);
        messagesBySign.set(sign, msg);
      } catch (err) {
        console.error(`daily message gen failed for ${sign}`, err);
      }
    })
  );

  const db = getDb(env);
  const { data, error } = await db
    .from("users")
    .select("line_user_id, birthdate, plan")
    .not("birthdate", "is", null);
  if (error) throw new Error(`load users failed: ${error.message}`);

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
    const text = `🌙 ${dateLabel}の${sign}の運勢\n\n${body}\n\n———\nお話を聞いてほしい時は、いつでも話しかけてくださいね。`;
    try {
      await multicastMessage(env.LINE_CHANNEL_ACCESS_TOKEN, recipients, [{ type: "text", text }]);
      total += recipients.length;
    } catch (err) {
      console.error(`multicast failed for ${sign}`, err);
    }
  }
  return { recipients: total };
}
