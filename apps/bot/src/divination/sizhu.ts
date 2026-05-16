// 四柱推命（年柱・月柱・日柱）— エンタメ目的の簡易実装
// - 年柱: 立春(2/4)を境界に切替
// - 月柱: 24節気のうち各月の節入り(節)を近似日付で適用
// - 日柱: 1949-10-01 を 甲子日 (cycle index 0) と仮定して干支60日サイクルで算出
// - 時柱はオプション（出生時刻が分からない場合は省略）
import type { DivinationContext } from "./types";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const STEM_ELEMENTS: Record<(typeof STEMS)[number], { element: string; polarity: "陽" | "陰" }> = {
  甲: { element: "木", polarity: "陽" },
  乙: { element: "木", polarity: "陰" },
  丙: { element: "火", polarity: "陽" },
  丁: { element: "火", polarity: "陰" },
  戊: { element: "土", polarity: "陽" },
  己: { element: "土", polarity: "陰" },
  庚: { element: "金", polarity: "陽" },
  辛: { element: "金", polarity: "陰" },
  壬: { element: "水", polarity: "陽" },
  癸: { element: "水", polarity: "陰" },
};

type Pillar = { stem: string; branch: string; element: string; polarity: "陽" | "陰" };

function pillarFromIndex(cycleIndex: number): Pillar {
  const idx = ((cycleIndex % 60) + 60) % 60;
  const stem = STEMS[idx % 10]!;
  const branch = BRANCHES[idx % 12]!;
  return { stem, branch, ...STEM_ELEMENTS[stem] };
}

// 年柱: 立春境界
function yearPillar(d: Date): Pillar {
  let y = d.getUTCFullYear();
  const lichun = new Date(Date.UTC(y, 1, 4)); // 立春 ≒ 2/4
  if (d < lichun) y -= 1;
  // 甲子 = 西暦4年。 (y - 4) % 60 = cycle index
  return pillarFromIndex(y - 4);
}

// 月柱: 寅月=立春開始。月の地支は固定、天干は年干から導出
// 五虎遁の法則: 甲己年→丙寅月から開始 / 乙庚→戊寅 / 丙辛→庚寅 / 丁壬→壬寅 / 戊癸→甲寅
const MONTH_STARTS: Array<{ monthIdx: number; dayInMonth: number; branchIndex: number }> = [
  // branchIndex: 子=0, 丑=1, 寅=2 ... 月の節入り近似日付
  { monthIdx: 1,  dayInMonth: 4,  branchIndex: 2 },  // 立春 寅
  { monthIdx: 2,  dayInMonth: 6,  branchIndex: 3 },  // 啓蟄 卯
  { monthIdx: 3,  dayInMonth: 5,  branchIndex: 4 },  // 清明 辰
  { monthIdx: 4,  dayInMonth: 6,  branchIndex: 5 },  // 立夏 巳
  { monthIdx: 5,  dayInMonth: 6,  branchIndex: 6 },  // 芒種 午
  { monthIdx: 6,  dayInMonth: 7,  branchIndex: 7 },  // 小暑 未
  { monthIdx: 7,  dayInMonth: 8,  branchIndex: 8 },  // 立秋 申
  { monthIdx: 8,  dayInMonth: 8,  branchIndex: 9 },  // 白露 酉
  { monthIdx: 9,  dayInMonth: 9,  branchIndex: 10 }, // 寒露 戌
  { monthIdx: 10, dayInMonth: 8,  branchIndex: 11 }, // 立冬 亥
  { monthIdx: 11, dayInMonth: 7,  branchIndex: 0 },  // 大雪 子
  { monthIdx: 0,  dayInMonth: 6,  branchIndex: 1 },  // 小寒 丑
];

function monthBranchIndex(d: Date): number {
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  // 同月内の節入り前は前月の節気が継続
  const current = MONTH_STARTS.find((b) => b.monthIdx === m)!;
  if (day >= current.dayInMonth) return current.branchIndex;
  // 前月の節気
  const prevIdx = (m + 11) % 12;
  return MONTH_STARTS.find((b) => b.monthIdx === prevIdx)!.branchIndex;
}

function monthPillar(d: Date, yearStem: string): Pillar {
  const branchIdx = monthBranchIndex(d);
  // 寅(=2)の天干オフセット (五虎遁)
  const yinStemForYear: Record<string, number> = {
    甲: 2, 己: 2, // 丙寅
    乙: 4, 庚: 4, // 戊寅
    丙: 6, 辛: 6, // 庚寅
    丁: 8, 壬: 8, // 壬寅
    戊: 0, 癸: 0, // 甲寅
  };
  const yinStemOffset = yinStemForYear[yearStem]!;
  // 寅月のstem = yinStemOffset, 卯月 = +1, 辰月 = +2, ...
  // branchIdx 2(寅) → 0番目, 3(卯) → 1番目, ..., 1(丑) → 11番目
  const order = (branchIdx + 10) % 12; // 寅を0に正規化
  const stemIdx = (yinStemOffset + order) % 10;
  const stem = STEMS[stemIdx]!;
  const branch = BRANCHES[branchIdx]!;
  return { stem, branch, ...STEM_ELEMENTS[stem] };
}

// 日柱: 1949-10-01 = 甲子日 (cycle 0)
const DAY_REFERENCE_UTC = Date.UTC(1949, 9, 1); // 1949-10-01
const DAY_MS = 86400000;

function dayPillar(d: Date): Pillar {
  const days = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - DAY_REFERENCE_UTC) / DAY_MS);
  return pillarFromIndex(days);
}

// 時柱（オプション）: 五鼠遁の法則で日干から時干を導出
const HOUR_BRANCH_BY_HOUR: number[] = [
  0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0,
];

function hourPillar(dayStem: string, hour: number): Pillar {
  const branchIdx = HOUR_BRANCH_BY_HOUR[hour]!;
  const baseStemForDay: Record<string, number> = {
    甲: 0, 己: 0,
    乙: 2, 庚: 2,
    丙: 4, 辛: 4,
    丁: 6, 壬: 6,
    戊: 8, 癸: 8,
  };
  const stemIdx = (baseStemForDay[dayStem]! + branchIdx) % 10;
  const stem = STEMS[stemIdx]!;
  const branch = BRANCHES[branchIdx]!;
  return { stem, branch, ...STEM_ELEMENTS[stem] };
}

export function computeSizhu(d: Date, hour?: number): {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  elementBalance: Record<string, number>;
} {
  const year = yearPillar(d);
  const month = monthPillar(d, year.stem);
  const day = dayPillar(d);
  const hourP = typeof hour === "number" ? hourPillar(day.stem, hour) : null;
  const balance: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of [year, month, day, hourP].filter((x): x is Pillar => x !== null)) {
    balance[p.element] = (balance[p.element] ?? 0) + 1;
  }
  return { year, month, day, hour: hourP, elementBalance: balance };
}

export function buildSizhuContext(birthdate: Date, question: string, hour?: number): DivinationContext {
  const result = computeSizhu(birthdate, hour);
  return {
    type: "sizhu",
    question,
    facts: {
      birthdate: birthdate.toISOString().slice(0, 10),
      year_pillar: `${result.year.stem}${result.year.branch}`,
      month_pillar: `${result.month.stem}${result.month.branch}`,
      day_pillar: `${result.day.stem}${result.day.branch}`,
      hour_pillar: result.hour ? `${result.hour.stem}${result.hour.branch}` : null,
      day_master: `${result.day.stem}（日主）`,
      day_master_element: result.day.element,
      day_master_polarity: result.day.polarity,
      element_balance: result.elementBalance,
    },
  };
}
