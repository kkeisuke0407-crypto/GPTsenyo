import type { DivinationContext } from "../divination/types";

const PERSONA = `あなたは「セレネ」という名前の占い師アシスタントです。
- 口調は柔らかく、相談者を尊重します
- 必ず希望や次の一歩を提示します
- 断定的な未来予言、医療助言、法律助言、投資助言は行いません
- 「絶対」「必ず」「100%」「保証」といった表現は使いません
- 命や健康に関わる悩みが含まれる場合は、専門の相談窓口（よりそいホットライン 0120-279-338 等）を案内します
- 出力は300〜500字の日本語、見出しと箇条書きを適宜使い、絵文字は控えめに`;

const TYPE_GUIDE: Record<DivinationContext["type"], string> = {
  astrology:
    "あなたは下記の太陽星座データを根拠に、相談者の本質と今のテーマを物語ります。占星術用語は最小限にし、相談文脈に寄り添います。",
  tarot:
    "あなたは下記の3枚スプレッド（過去・現在・未来）を踏まえ、それぞれのカードを相談文脈に翻訳します。カード名と位置を明示してください。",
  numerology:
    "あなたは下記のライフパスナンバーを根拠に、相談者の魂の傾向と現在の課題を物語ります。数字の意味を相談文脈に紐づけてください。",
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function buildPromptMessages(ctx: DivinationContext): ChatMessage[] {
  const factsBlock = JSON.stringify(ctx.facts, null, 2);
  const systemPrompt = `${PERSONA}\n\n占術別ガイド: ${TYPE_GUIDE[ctx.type]}`;
  const userPrompt = `相談内容:\n${ctx.question || "（特に質問はありません。今の私に必要なメッセージをください）"}\n\n占術データ(JSON):\n${factsBlock}\n\n上記データのみを根拠に、相談内容に寄り添う鑑定文を生成してください。`;
  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

const FORBIDDEN_PHRASES = ["絶対", "必ず", "100%", "保証", "確実に治", "確実に儲"];
const SAFETY_TRIGGERS = ["死にたい", "消えたい", "自殺", "自傷"];
const SAFETY_NOTICE =
  "\n\n———\n💛 もし今、つらい気持ちが強い時は、よりそいホットライン（0120-279-338 / 24時間無料）にお電話ください。あなたの声を聴いてくれる人がいます。";

export function postProcessNarration(text: string, originalQuestion: string): string {
  let out = text.trim();
  for (const word of FORBIDDEN_PHRASES) {
    out = out.replaceAll(word, "");
  }
  if (SAFETY_TRIGGERS.some((t) => originalQuestion.includes(t) || out.includes(t))) {
    out += SAFETY_NOTICE;
  }
  return out;
}
