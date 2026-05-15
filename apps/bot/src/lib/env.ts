export type Env = {
  ENVIRONMENT: string;
  LLM_MODEL: string;
  FREE_MONTHLY_QUOTA: string;
  LIGHT_MONTHLY_QUOTA: string;

  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_LIGHT: string;
  STRIPE_PRICE_STANDARD: string;
  STRIPE_PRICE_PREMIUM: string;
  PUBLIC_BASE_URL: string;
  LINE_FRIEND_URL: string;
  CONTACT_EMAIL: string;
  OPERATOR_NAME: string;
  OPERATOR_ADDRESS: string;
};

export type Plan = "free" | "light" | "standard" | "premium";

export const PLAN_QUOTA: Record<Plan, number> = {
  free: 3,
  light: 10,
  standard: Number.POSITIVE_INFINITY,
  premium: Number.POSITIVE_INFINITY,
};

export const PLAN_LABEL: Record<Plan, string> = {
  free: "無料プラン",
  light: "ライトプラン",
  standard: "スタンダードプラン",
  premium: "プレミアムプラン",
};
