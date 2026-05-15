import type { DivinationContext } from "./types";

type TarotCard = {
  number: number;
  name: string;
  upright: string;
  reversed: string;
};

const MAJOR_ARCANA: TarotCard[] = [
  { number: 0,  name: "愚者",       upright: "始まり・自由・冒険",       reversed: "無計画・軽率・停滞" },
  { number: 1,  name: "魔術師",     upright: "創造・主体性・才能の開花", reversed: "優柔不断・才能の未活用" },
  { number: 2,  name: "女教皇",     upright: "直感・内省・知恵",         reversed: "感情の抑圧・秘密" },
  { number: 3,  name: "女帝",       upright: "豊かさ・愛・母性",         reversed: "過保護・依存・浪費" },
  { number: 4,  name: "皇帝",       upright: "安定・支配・実行力",       reversed: "頑固・横暴・停滞" },
  { number: 5,  name: "法王",       upright: "伝統・導き・信頼",         reversed: "形式主義・束縛" },
  { number: 6,  name: "恋人",       upright: "愛・選択・調和",           reversed: "誘惑・優柔不断・別れ" },
  { number: 7,  name: "戦車",       upright: "前進・勝利・意志",         reversed: "暴走・挫折・焦り" },
  { number: 8,  name: "力",         upright: "勇気・自制・内的な強さ",   reversed: "弱気・自信喪失" },
  { number: 9,  name: "隠者",       upright: "内省・探求・知恵",         reversed: "孤立・閉鎖・頑固" },
  { number: 10, name: "運命の輪",   upright: "転機・好機・変化",         reversed: "停滞・逆転・タイミングのずれ" },
  { number: 11, name: "正義",       upright: "公正・決断・バランス",     reversed: "不公平・偏見・誤解" },
  { number: 12, name: "吊るされた男", upright: "受容・忍耐・献身",       reversed: "無駄な犠牲・停滞" },
  { number: 13, name: "死神",       upright: "終わり・再生・転換",       reversed: "停滞・執着・恐れ" },
  { number: 14, name: "節制",       upright: "調和・節度・統合",         reversed: "アンバランス・過剰" },
  { number: 15, name: "悪魔",       upright: "誘惑・執着・束縛",         reversed: "解放・覚醒・自由" },
  { number: 16, name: "塔",         upright: "崩壊・衝撃・刷新",         reversed: "回避・遅延・恐れ" },
  { number: 17, name: "星",         upright: "希望・癒し・インスピレーション", reversed: "失望・自信喪失" },
  { number: 18, name: "月",         upright: "不安・潜在意識・幻想",     reversed: "誤解の解消・真実の発見" },
  { number: 19, name: "太陽",       upright: "成功・喜び・活力",         reversed: "見栄・過信・空回り" },
  { number: 20, name: "審判",       upright: "復活・決断・覚醒",         reversed: "後悔・優柔不断" },
  { number: 21, name: "世界",       upright: "完成・達成・統合",         reversed: "未完・停滞" },
];

const POSITIONS = ["過去", "現在", "未来"] as const;

export type TarotDraw = {
  position: (typeof POSITIONS)[number];
  card: string;
  orientation: "正位置" | "逆位置";
  meaning: string;
};

// crypto.getRandomValues ベースの公平な乱数（Workers ランタイム標準）
function secureInt(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

export function drawThreeCards(): TarotDraw[] {
  const deck = [...MAJOR_ARCANA];
  const result: TarotDraw[] = [];
  for (const position of POSITIONS) {
    const idx = secureInt(deck.length);
    const card = deck.splice(idx, 1)[0]!;
    const isReversed = secureInt(2) === 1;
    result.push({
      position,
      card: card.name,
      orientation: isReversed ? "逆位置" : "正位置",
      meaning: isReversed ? card.reversed : card.upright,
    });
  }
  return result;
}

export function buildTarotContext(question: string): DivinationContext {
  const draws = drawThreeCards();
  return {
    type: "tarot",
    question,
    facts: { spread: "three_card_past_present_future", draws },
  };
}
