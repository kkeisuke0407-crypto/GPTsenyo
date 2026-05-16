// 易（I-Ching）— 6本のコイン擲銭法シミュレーション
// - 各爻は old-yin(6), young-yang(7), young-yin(8), old-yang(9) の確率を擲銭法に準じて再現
// - old(6/9) は変爻 → 之卦（変化先の卦）を導出
import type { DivinationContext } from "./types";

const HEXAGRAMS: Array<{ num: number; name: string; meaning: string }> = [
  { num: 1,  name: "乾為天",       meaning: "創造・天の力。リーダーシップと活力の卦。" },
  { num: 2,  name: "坤為地",       meaning: "受容・大地の力。育み支える卦。" },
  { num: 3,  name: "水雷屯",       meaning: "産みの苦しみ。始まりの混沌を耐えるとき。" },
  { num: 4,  name: "山水蒙",       meaning: "若い愚かさ。学びの初心に戻るべき時。" },
  { num: 5,  name: "水天需",       meaning: "待つ・滋養。準備し時を待つ卦。" },
  { num: 6,  name: "天水訟",       meaning: "争い・対立。冷静さが鍵。" },
  { num: 7,  name: "地水師",       meaning: "軍隊・集団行動。秩序ある協力。" },
  { num: 8,  name: "水地比",       meaning: "親しみ・結束。協調が幸を呼ぶ。" },
  { num: 9,  name: "風天小畜",     meaning: "小さな蓄え。控えめな前進。" },
  { num: 10, name: "天澤履",       meaning: "踏みしめる・礼。慎重に道を歩む。" },
  { num: 11, name: "地天泰",       meaning: "泰平・調和。物事が通る吉卦。" },
  { num: 12, name: "天地否",       meaning: "閉塞・不通。流れが止まる時。" },
  { num: 13, name: "天火同人",     meaning: "同志・仲間。志を共にする幸運。" },
  { num: 14, name: "火天大有",     meaning: "大いなる所有。豊かさを得る時。" },
  { num: 15, name: "地山謙",       meaning: "謙虚さ。控えめが大きな実りを呼ぶ。" },
  { num: 16, name: "雷地豫",       meaning: "喜び・予兆。準備が報われる時。" },
  { num: 17, name: "澤雷随",       meaning: "従う・適応。流れに任せる賢さ。" },
  { num: 18, name: "山風蠱",       meaning: "腐敗を正す。古い問題に向き合う時。" },
  { num: 19, name: "地澤臨",       meaning: "臨む・接近。チャンスが近づく。" },
  { num: 20, name: "風地観",       meaning: "観察・反省。一歩引いて見る時。" },
  { num: 21, name: "火雷噬嗑",     meaning: "噛み砕く。障害を断ち切る決断。" },
  { num: 22, name: "山火賁",       meaning: "飾る・優雅。表現を磨く時。" },
  { num: 23, name: "山地剝",       meaning: "剝がれる・衰退。手放すべき時。" },
  { num: 24, name: "地雷復",       meaning: "回復・帰還。新たな始まり。" },
  { num: 25, name: "天雷無妄",     meaning: "純粋・無垢。私心なき行動。" },
  { num: 26, name: "山天大畜",     meaning: "大いなる蓄積。実力を蓄える時。" },
  { num: 27, name: "山雷頤",       meaning: "養う。言葉と食を慎む。" },
  { num: 28, name: "澤風大過",     meaning: "大きすぎる重荷。柔軟な対応が必要。" },
  { num: 29, name: "坎為水",       meaning: "重なる困難。誠実に乗り越える。" },
  { num: 30, name: "離為火",       meaning: "光・依存。明るさと結びつき。" },
  { num: 31, name: "澤山咸",       meaning: "感じ合う。心の交流が芽吹く時。" },
  { num: 32, name: "雷風恒",       meaning: "持続・恒常。一貫性が報われる。" },
  { num: 33, name: "天山遯",       meaning: "退く・引く。距離を取る勇気。" },
  { num: 34, name: "雷天大壮",     meaning: "大きな力。エネルギーの解放と節度。" },
  { num: 35, name: "火地晋",       meaning: "進む・昇進。光が広がる時。" },
  { num: 36, name: "地火明夷",     meaning: "光を隠す。内に守る賢明さ。" },
  { num: 37, name: "風火家人",     meaning: "家族・内的秩序。身近を整える。" },
  { num: 38, name: "火澤睽",       meaning: "背き合う。違いを認める時。" },
  { num: 39, name: "水山蹇",       meaning: "行き悩み。回り道の知恵。" },
  { num: 40, name: "雷水解",       meaning: "解放・解決。重荷が解ける時。" },
  { num: 41, name: "山澤損",       meaning: "減らす・引く。本質に絞る。" },
  { num: 42, name: "風雷益",       meaning: "増す・利す。与えることで増える。" },
  { num: 43, name: "澤天夬",       meaning: "決断・突破。決意を貫く時。" },
  { num: 44, name: "天風姤",       meaning: "出会い。注意を要する縁。" },
  { num: 45, name: "澤地萃",       meaning: "集まる・結集。仲間と力を合わす。" },
  { num: 46, name: "地風升",       meaning: "昇る・上がる。地道な前進。" },
  { num: 47, name: "澤水困",       meaning: "苦しむ。試練の中で言葉少なく。" },
  { num: 48, name: "水風井",       meaning: "井戸・根源。基盤を整える時。" },
  { num: 49, name: "澤火革",       meaning: "革命・刷新。古い殻を破る。" },
  { num: 50, name: "火風鼎",       meaning: "鼎・成し遂げる。基盤の上で実る。" },
  { num: 51, name: "震為雷",       meaning: "震動・覚醒。驚きと目覚め。" },
  { num: 52, name: "艮為山",       meaning: "止まる・静止。動かぬ強さ。" },
  { num: 53, name: "風山漸",       meaning: "ゆるやかな前進。段階を踏む。" },
  { num: 54, name: "雷澤帰妹",     meaning: "嫁ぐ。立場を弁える時。" },
  { num: 55, name: "雷火豊",       meaning: "豊か。今を慎ましく味わう。" },
  { num: 56, name: "火山旅",       meaning: "旅・移動。柔軟さと礼節。" },
  { num: 57, name: "巽為風",       meaning: "従う・浸透。柔らかな影響力。" },
  { num: 58, name: "兌為澤",       meaning: "悦び。喜びを分かち合う。" },
  { num: 59, name: "風水渙",       meaning: "散らす・解く。固執を手放す。" },
  { num: 60, name: "水澤節",       meaning: "節・限度。区切りを設ける時。" },
  { num: 61, name: "風澤中孚",     meaning: "誠・真心。誠実が伝わる時。" },
  { num: 62, name: "雷山小過",     meaning: "やや過ぎる。慎ましく振る舞う。" },
  { num: 63, name: "水火既済",     meaning: "既に成就。油断せず維持する。" },
  { num: 64, name: "火水未済",     meaning: "未だならず。最後まで丁寧に。" },
];

// 6本の爻からKing Wen番号への変換テーブル（下から上に積む）
// 上卦 / 下卦の三爻組み合わせ（八卦: 乾☰, 兌☱, 離☲, 震☳, 巽☴, 坎☵, 艮☶, 坤☷）
// 八卦のbinary（上→中→下）: 乾=111, 兌=110, 離=101, 震=100, 巽=011, 坎=010, 艮=001, 坤=000
const TRIGRAM_INDEX: Record<string, number> = {
  "111": 0, "110": 1, "101": 2, "100": 3, "011": 4, "010": 5, "001": 6, "000": 7,
};

// King Wen lookup: [upper_trigram_index][lower_trigram_index] → hexagram number (1-64)
// 参照: 周易 / Wilhelm-Baynes table
const KING_WEN_TABLE: number[][] = [
  [1, 43, 14, 34, 9, 5, 26, 11],
  [10, 58, 38, 54, 61, 60, 41, 19],
  [13, 49, 30, 55, 37, 63, 22, 36],
  [25, 17, 21, 51, 42, 3, 27, 24],
  [44, 28, 50, 32, 57, 48, 18, 46],
  [6, 47, 64, 40, 59, 29, 4, 7],
  [33, 31, 56, 62, 53, 39, 52, 15],
  [12, 45, 35, 16, 20, 8, 23, 2],
];

function secureInt(maxExclusive: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % maxExclusive;
}

function castLine(): { value: 6 | 7 | 8 | 9; isYang: boolean; isChanging: boolean } {
  // 3枚硬貨擲銭法: 各硬貨 表(=3) 裏(=2)、合計値
  // 6 (old yin) = 1/16, 7 (young yang) = 5/16, 8 (young yin) = 7/16, 9 (old yang) = 3/16
  // でも単純化のため擲銭法を真面目にシミュレートする
  const toss = (): number => (secureInt(2) === 0 ? 2 : 3);
  const sum = toss() + toss() + toss();
  const isYang = sum === 7 || sum === 9;
  const isChanging = sum === 6 || sum === 9;
  return { value: sum as 6 | 7 | 8 | 9, isYang, isChanging };
}

function hexagramNumberFromLines(yangFlags: boolean[]): number {
  // lines[0] = 初爻(下), lines[5] = 上爻(上)
  // 下卦: lines[0..2], 上卦: lines[3..5]
  const lowerBinary =
    (yangFlags[5] ? "1" : "0") + (yangFlags[4] ? "1" : "0") + (yangFlags[3] ? "1" : "0");
  // 修正: 三爻は上→中→下の順で表記する慣習に合わせる
  const upperKey =
    (yangFlags[5] ? "1" : "0") + (yangFlags[4] ? "1" : "0") + (yangFlags[3] ? "1" : "0");
  const lowerKey =
    (yangFlags[2] ? "1" : "0") + (yangFlags[1] ? "1" : "0") + (yangFlags[0] ? "1" : "0");
  void lowerBinary;
  const upperIdx = TRIGRAM_INDEX[upperKey]!;
  const lowerIdx = TRIGRAM_INDEX[lowerKey]!;
  return KING_WEN_TABLE[upperIdx]![lowerIdx]!;
}

export function castIChing(): {
  primaryHexagram: { num: number; name: string; meaning: string };
  changingLines: number[]; // 1=初爻, ..., 6=上爻
  resultingHexagram: { num: number; name: string; meaning: string } | null;
  lines: Array<{ position: number; value: 6 | 7 | 8 | 9; isYang: boolean; isChanging: boolean }>;
} {
  const lines: Array<ReturnType<typeof castLine> & { position: number }> = [];
  for (let i = 0; i < 6; i++) {
    lines.push({ position: i + 1, ...castLine() });
  }
  const primaryFlags = lines.map((l) => l.isYang);
  const primaryNum = hexagramNumberFromLines(primaryFlags);
  const primary = HEXAGRAMS[primaryNum - 1]!;

  const changing = lines.filter((l) => l.isChanging).map((l) => l.position);
  let resulting: typeof primary | null = null;
  if (changing.length > 0) {
    const resultFlags = primaryFlags.map((isYang, i) =>
      lines[i]!.isChanging ? !isYang : isYang
    );
    resulting = HEXAGRAMS[hexagramNumberFromLines(resultFlags) - 1]!;
  }
  return { primaryHexagram: primary, changingLines: changing, resultingHexagram: resulting, lines };
}

export function buildIChingContext(question: string): DivinationContext {
  const cast = castIChing();
  return {
    type: "iching",
    question,
    facts: {
      primary: cast.primaryHexagram,
      changing_lines: cast.changingLines,
      resulting: cast.resultingHexagram,
      lines: cast.lines.map((l) => ({
        position: l.position,
        type: l.isChanging ? (l.isYang ? "老陽（変爻）" : "老陰（変爻）") : l.isYang ? "少陽" : "少陰",
      })),
    },
  };
}
