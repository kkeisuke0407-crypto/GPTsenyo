import type { DivinationContext } from "./types";

const MEANINGS: Record<number, { keyword: string; description: string }> = {
  1:  { keyword: "創始",   description: "リーダーシップ・開拓・自立。新しい道を切り開く力。" },
  2:  { keyword: "協調",   description: "繊細さ・調和・関係性。人と結ぶ才能。" },
  3:  { keyword: "表現",   description: "創造性・社交性・楽観。場を明るくする力。" },
  4:  { keyword: "安定",   description: "実直さ・忍耐・基盤づくり。コツコツ積み上げる力。" },
  5:  { keyword: "自由",   description: "冒険・変化・多才。変化を楽しむ力。" },
  6:  { keyword: "愛",     description: "責任・奉仕・調和。守り育てる力。" },
  7:  { keyword: "探求",   description: "内省・神秘・専門性。深く掘り下げる力。" },
  8:  { keyword: "達成",   description: "実行力・現実化・影響力。形にする力。" },
  9:  { keyword: "完成",   description: "包容・理想・手放し。大きな循環を生む力。" },
  11: { keyword: "霊感",   description: "直感・啓示・繊細さ。光を運ぶ役割。" },
  22: { keyword: "建設",   description: "壮大な構想を地に降ろす力。マスタービルダー。" },
  33: { keyword: "慈愛",   description: "無条件の愛と奉仕。マスターティーチャー。" },
};

function reduceToLifePath(birthdate: Date): number {
  const digits = `${birthdate.getUTCFullYear()}${birthdate.getUTCMonth() + 1}${birthdate.getUTCDate()}`
    .split("")
    .map((c) => Number.parseInt(c, 10));
  let sum = digits.reduce((acc, n) => acc + n, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split("")
      .reduce((acc, c) => acc + Number.parseInt(c, 10), 0);
  }
  return sum;
}

export function buildNumerologyContext(birthdate: Date, question: string): DivinationContext {
  const lifePath = reduceToLifePath(birthdate);
  const meaning = MEANINGS[lifePath]!;
  return {
    type: "numerology",
    question,
    facts: {
      birthdate: birthdate.toISOString().slice(0, 10),
      life_path_number: lifePath,
      keyword: meaning.keyword,
      description: meaning.description,
    },
  };
}
