export type DivinationType = "astrology" | "tarot" | "numerology" | "sizhu" | "iching";

export type DivinationContext = {
  type: DivinationType;
  question: string;
  facts: Record<string, unknown>;
};

export type DivinationResult = {
  context: DivinationContext;
  narration: string;
};
