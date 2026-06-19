-- ═══════════════════════════════════════════════════════════
-- Nestlé SHE Day 2025 — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Teams ───────────────────────────────────────────────────
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default '#1B3A6B',
  initials    text not null,
  created_at  timestamptz not null default now()
);

-- ── Scores ──────────────────────────────────────────────────
create table if not exists public.scores (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  module_id     int  not null check (module_id between 1 and 10),
  game_id       int  not null check (game_id  between 1 and 4),
  points        int  not null default 0 check (points >= 0),
  time_seconds  int  not null default 0 check (time_seconds >= 0),
  game_cards    int  not null default 0 check (game_cards between 0 and 1),
  created_at    timestamptz not null default now(),
  unique (team_id, module_id, game_id)
);

-- ── Module Progress ──────────────────────────────────────────
create table if not exists public.module_progress (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  module_id     int  not null check (module_id between 1 and 10),
  completed     boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (team_id, module_id)
);

-- ── Quiz Responses ───────────────────────────────────────────
create table if not exists public.quiz_responses (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.teams(id) on delete cascade,
  module_id      int  not null check (module_id between 1 and 10),
  game_id        int  not null check (game_id  between 1 and 4),
  response_data  jsonb not null default '{}',
  score          int  not null default 0,
  created_at     timestamptz not null default now()
);

-- ── Photo Submissions ────────────────────────────────────────
create table if not exists public.photo_submissions (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references public.teams(id) on delete cascade,
  module_id     int  not null check (module_id between 1 and 10),
  game_id       int  not null check (game_id  between 1 and 4),
  storage_path  text not null,
  caption       text not null default '',
  created_at    timestamptz not null default now()
);

-- ── Leaderboard View ─────────────────────────────────────────
create or replace view public.team_leaderboard as
select
  t.id                                        as team_id,
  t.name                                      as team_name,
  t.color                                     as team_color,
  t.initials                                  as team_initials,
  coalesce(sum(s.points), 0)::int             as total_points,
  coalesce(sum(s.game_cards), 0)::int         as total_game_cards,
  coalesce(count(distinct mp.module_id) filter (where mp.completed), 0)::int
                                              as modules_completed
from public.teams t
left join public.scores          s  on s.team_id  = t.id
left join public.module_progress mp on mp.team_id = t.id
group by t.id, t.name, t.color, t.initials
order by total_points desc;

-- ── Seed: Example teams (edit as needed) ────────────────────
insert into public.teams (name, color, initials) values
  ('Team Alpha', '#E2001A', 'TA'),
  ('Team Beta',  '#8B5CF6', 'TB'),
  ('Team Delta', '#2B5BA8', 'TD'),
  ('Team Omega', '#F5A623', 'TO'),
  ('Team Sigma', '#00853F', 'TS')
on conflict (name) do nothing;

-- ── Row-Level Security ───────────────────────────────────────
alter table public.teams            enable row level security;
alter table public.scores           enable row level security;
alter table public.module_progress  enable row level security;
alter table public.quiz_responses   enable row level security;
alter table public.photo_submissions enable row level security;

-- Allow public read on teams and leaderboard view
create policy "Public read teams"
  on public.teams for select using (true);

-- Allow anyone to insert/update scores (teams self-report)
create policy "Teams insert scores"
  on public.scores for insert with check (true);

create policy "Teams read all scores"
  on public.scores for select using (true);

-- Allow anyone to upsert module progress
create policy "Teams upsert progress"
  on public.module_progress for all using (true) with check (true);

-- Allow insert of quiz responses
create policy "Teams insert responses"
  on public.quiz_responses for insert with check (true);

create policy "Teams read responses"
  on public.quiz_responses for select using (true);

-- Allow insert of photos
create policy "Teams insert photos"
  on public.photo_submissions for insert with check (true);

create policy "Teams read photos"
  on public.photo_submissions for select using (true);
