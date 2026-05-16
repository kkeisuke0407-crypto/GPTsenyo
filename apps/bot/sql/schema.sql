-- Supabase schema for AI fortune-telling LINE Bot
-- 実行手順: Supabase Dashboard → SQL Editor にペーストして RUN

create extension if not exists pgcrypto;

create table if not exists public.users (
  line_user_id        text primary key,
  display_name        text,
  birthdate           date,
  plan                text not null default 'free' check (plan in ('free','light','standard','premium')),
  plan_until          timestamptz,
  stripe_customer_id  text,
  created_at          timestamptz not null default now()
);

create table if not exists public.sessions (
  id              uuid primary key default gen_random_uuid(),
  line_user_id    text not null references public.users(line_user_id) on delete cascade,
  type            text not null check (type in ('astrology','tarot','numerology','sizhu','iching')),
  question        text not null,
  facts           jsonb not null,
  narration       text not null,
  tokens_used     int  not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists sessions_user_created_idx on public.sessions(line_user_id, created_at desc);

create table if not exists public.stripe_events (
  id          text primary key,        -- Stripe event id (重複排除)
  type        text not null,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

-- 退会時の個人情報即時削除を行うストアド（Bot 側から呼び出し）
create or replace function public.purge_user(p_line_user_id text)
returns void
language sql
as $$
  delete from public.users where line_user_id = p_line_user_id;
$$;
