import type { DivinationContext } from "./types";

type ZodiacSign = {
  key: string;
  name: string;
  element: "火" | "地" | "風" | "水";
  modality: "活動" | "不動" | "柔軟";
  ruler: string;
  themes: string[];
};

const SIGNS: ZodiacSign[] = [
  { key: "aries",       name: "牡羊座",  element: "火", modality: "活動", ruler: "火星",   themes: ["先駆", "情熱", "直感"] },
  { key: "taurus",      name: "牡牛座",  element: "地", modality: "不動", ruler: "金星",   themes: ["安定", "感性", "豊かさ"] },
  { key: "gemini",      name: "双子座",  element: "風", modality: "柔軟", ruler: "水星",   themes: ["好奇心", "対話", "機敏"] },
  { key: "cancer",      name: "蟹座",    element: "水", modality: "活動", ruler: "月",     themes: ["共感", "家庭", "守護"] },
  { key: "leo",         name: "獅子座",  element: "火", modality: "不動", ruler: "太陽",   themes: ["表現", "誇り", "創造"] },
  { key: "virgo",       name: "乙女座",  element: "地", modality: "柔軟", ruler: "水星",   themes: ["奉仕", "分析", "実務"] },
  { key: "libra",       name: "天秤座",  element: "風", modality: "活動", ruler: "金星",   themes: ["調和", "美", "関係性"] },
  { key: "scorpio",     name: "蠍座",    element: "水", modality: "不動", ruler: "冥王星", themes: ["深層", "変容", "集中"] },
  { key: "sagittarius", name: "射手座",  element: "火", modality: "柔軟", ruler: "木星",   themes: ["冒険", "哲学", "拡張"] },
  { key: "capricorn",   name: "山羊座",  element: "地", modality: "活動", ruler: "土星",   themes: ["責任", "達成", "構造"] },
  { key: "aquarius",    name: "水瓶座",  element: "風", modality: "不動", ruler: "天王星", themes: ["革新", "理想", "独立"] },
  { key: "pisces",      name: "魚座",    element: "水", modality: "柔軟", ruler: "海王星", themes: ["共感", "夢", "境界の溶解"] },
];

const BOUNDARIES: Array<{ month: number; day: number; signIndex: number }> = [
  { month: 1,  day: 20, signIndex: 9 },   // 〜1/19 山羊
  { month: 2,  day: 19, signIndex: 10 },  // 1/20〜2/18 水瓶
  { month: 3,  day: 21, signIndex: 11 },  // 2/19〜3/20 魚
  { month: 4,  day: 20, signIndex: 0 },   // 3/21〜4/19 牡羊
  { month: 5,  day: 21, signIndex: 1 },   // 4/20〜5/20 牡牛
  { month: 6,  day: 22, signIndex: 2 },   // 5/21〜6/21 双子
  { month: 7,  day: 23, signIndex: 3 },   // 6/22〜7/22 蟹
  { month: 8,  day: 23, signIndex: 4 },   // 7/23〜8/22 獅子
  { month: 9,  day: 23, signIndex: 5 },   // 8/23〜9/22 乙女
  { month: 10, day: 24, signIndex: 6 },   // 9/23〜10/23 天秤
  { month: 11, day: 23, signIndex: 7 },   // 10/24〜11/22 蠍
  { month: 12, day: 22, signIndex: 8 },   // 11/23〜12/21 射手
];

export function sunSignFromBirthdate(birthdate: Date): ZodiacSign {
  const m = birthdate.getUTCMonth() + 1;
  const d = birthdate.getUTCDate();
  for (const b of BOUNDARIES) {
    if (m < b.month || (m === b.month && d < b.day)) {
      return SIGNS[b.signIndex]!;
    }
  }
  return SIGNS[9]!; // 12/22以降は山羊座
}

export function buildAstrologyContext(birthdate: Date, question: string): DivinationContext {
  const sign = sunSignFromBirthdate(birthdate);
  return {
    type: "astrology",
    question,
    facts: {
      sun_sign: sign.name,
      element: sign.element,
      modality: sign.modality,
      ruler: sign.ruler,
      themes: sign.themes,
      birthdate: birthdate.toISOString().slice(0, 10),
    },
  };
}
