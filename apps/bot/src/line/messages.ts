import type { LineMessage, QuickReplyItem } from "./client";
import { PLAN_LABEL, type Plan } from "../lib/env";

export function welcomeMessage(): LineMessage {
  return {
    type: "text",
    text:
      "ようこそ、星見の庵へ🌙\n" +
      "私はあなたの占いアシスタント「セレネ」です。\n\n" +
      "まずはあなたの生年月日を教えてください。\n" +
      "例：1992-04-15\n\n" +
      "いつでも以下のコマンドで占えます：\n" +
      "・「タロット 仕事の進め方は？」\n" +
      "・「星占い 今月の私のテーマ」\n" +
      "・「数秘 私の本質」\n\n" +
      "本サービスはエンタメ目的です。医療・法律・投資判断は専門家にご相談ください。",
  };
}

export function birthdateSavedMessage(birthdate: string): LineMessage {
  return {
    type: "text",
    text:
      `生年月日（${birthdate}）を登録しました🌙\n\n` +
      "さっそく占ってみましょう。以下のような言葉で話しかけてください：\n" +
      "・「タロット 〇〇について」\n" +
      "・「星占い 今月のテーマ」\n" +
      "・「数秘 私の役割」",
  };
}

export function birthdateInvalidMessage(): LineMessage {
  return {
    type: "text",
    text: "うまく読み取れませんでした。YYYY-MM-DD の形式で送ってください（例：1992-04-15）",
  };
}

export function quotaExceededMessage(plan: Plan, used: number, limit: number): LineMessage {
  return {
    type: "text",
    text:
      `今月の${PLAN_LABEL[plan]}の鑑定回数（${used}/${limit}回）を使いきりました🌙\n\n` +
      "プランをアップグレードすると、より深い鑑定を無制限で受けられます。\n" +
      "「プラン」と送ると、最新の料金プランをご案内します。",
  };
}

export function planInfoMessage(): LineMessage {
  const quickReply: { items: QuickReplyItem[] } = {
    items: [
      { type: "action", action: { type: "postback", label: "ライト ¥980", data: "plan=light", displayText: "ライトプランに加入" } },
      { type: "action", action: { type: "postback", label: "スタンダード ¥1,980", data: "plan=standard", displayText: "スタンダードに加入" } },
      { type: "action", action: { type: "postback", label: "プレミアム ¥4,980", data: "plan=premium", displayText: "プレミアムに加入" } },
    ],
  };
  return {
    type: "text",
    text:
      "🌙 プラン一覧\n\n" +
      "・無料：月3回のタロット鑑定\n" +
      "・ライト（¥980/月）：月10回 + 数秘\n" +
      "・スタンダード（¥1,980/月）：全占術無制限\n" +
      "・プレミアム（¥4,980/月）：全部 + 個別深掘り\n\n" +
      "下のボタンからプランを選んでください👇",
    quickReply,
  };
}

export function checkoutLinkMessage(plan: Exclude<Plan, "free">, url: string): LineMessage {
  return {
    type: "text",
    text:
      `${PLAN_LABEL[plan]}の決済ページを発行しました🌙\n\n` +
      `${url}\n\n` +
      "決済が完了すると自動でプランが有効化されます。\n" +
      "上限・解約はいつでもLINEまたは決済ページから可能です。",
  };
}

export function genericHelpMessage(): LineMessage {
  return {
    type: "text",
    text:
      "🌙 メニュー\n" +
      "・タロット 〇〇 … 3枚引きで鑑定\n" +
      "・星占い 〇〇 … 太陽星座から鑑定\n" +
      "・数秘 〇〇 … ライフパスから鑑定\n" +
      "・誕生日 1992-04-15 … 生年月日を登録/変更\n" +
      "・プラン … 料金プランを確認\n" +
      "・退会 … データを削除",
  };
}

export function farewellMessage(): LineMessage {
  return {
    type: "text",
    text:
      "ご登録情報をすべて削除しました🌙\n" +
      "またいつでもお越しください。あなたの星が穏やかでありますように。",
  };
}

export function divinationMessage(narration: string): LineMessage {
  return { type: "text", text: narration };
}

export function errorMessage(): LineMessage {
  return {
    type: "text",
    text: "申し訳ありません、少しの間つながりが乱れているようです🌙 少し時間をおいてもう一度お試しください。",
  };
}
