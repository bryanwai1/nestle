-- ============================================================================
-- Nestlé Sales Region SHE Day 2026 — Initial schema
-- ============================================================================
-- Design notes (read before you change anything):
--
-- 1. TEAM NUMBERING IS RACE-CONDITION SAFE.
--    The brief asked for "next available integer based on what's in the DB"
--    (i.e. MAX(team_number)+1). Doing that as a client-side SELECT-then-INSERT
--    breaks the moment two teams hit "Create Team" in the same second, which
--    is exactly what happens at a live event. Instead we use a Postgres
--    SEQUENCE + a SECURITY DEFINER RPC (create_team). nextval() is atomic,
--    so two simultaneous requests always get two different numbers.
--
-- 2. SCORE IS NEVER WRITTEN DIRECTLY BY THE CLIENT.
--    current_total_score is derived — a trigger recomputes it from
--    game_responses.points_awarded + session_speed_bonus rows any time either
--    table changes. This means the leaderboard can never drift out of sync
--    with the underlying grading data, and a grader can re-mark an answer
--    and trust the total updates itself.
--
-- 3. GRADING FIELDS ARE LOCKED DOWN AT THE DATABASE LAYER, NOT JUST THE UI.
--    A team's browser can INSERT a game_response (their answer), but cannot
--    set is_correct / points_awarded. Only an authenticated admin (or the
--    service role) can grade. This is enforced with RLS, not convention.
--
-- 4. MENTAL HEALTH DATA HAS NO TEAM_ID / NO NAME COLUMN AT ALL.
--    This isn't an access-control choice, it's a schema choice — the
--    identifying link simply does not exist in this table, so there's
--    nothing to leak even if a policy were misconfigured later. The
--    dashboard only ever reads the aggregate view below.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. TEAMS
-- ----------------------------------------------------------------------------
create sequence if not exists team_number_seq start 1;

create table if not exists teams (
  id                   uuid primary key default gen_random_uuid(),
  team_number          integer not null unique, -- "Team 4" etc — assigned by create_team()
  member_1_name        text not null,
  member_2_name        text not null,
  member_3_name        text not null,
  session_group        text check (session_group in ('morning', 'afternoon')) default 'morning',
  current_total_score  integer not null default 0, -- derived, see recalc_team_score()
  registration_time    timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_teams_score on teams (current_total_score desc);

-- ----------------------------------------------------------------------------
-- 2. GAME RESPONSES
-- one row per (team, question). response_data is a JSONB bag whose shape
-- depends on response_type — see types/game.ts ResponseDataByType for the
-- exact discriminated-union contract the frontend and admin panel share.
-- ----------------------------------------------------------------------------
create type response_type as enum (
  'multiple_choice',     -- Q1-5
  'video_identify',      -- Q6,8,10,12,14 (fill-in-blank, keyword-graded)
  'video_avoid',         -- Q7,9,11,13,15 (fill-in-blank, keyword-graded)
  'media_upload',        -- Q16,22,23,24,25,29 (photo/video)
  'hazard_canvas',       -- Q17 (tap-to-flag coordinates)
  'drag_sequence',       -- Q18 (ordered steps)
  'drag_matrix',         -- Q19 (mix & match two columns)
  'visual_sort',         -- Q20 (pick correct boxes from trap choices)
  'subjective_select',   -- Q21 (free choice from known-good set)
  'categorized_dropzone',-- Q26 (3-column sort)
  'math_input',          -- Q27 (numeric formula answer)
  'budget_canvas',       -- Q28 (RM12 plate-builder)
  'exact_sequence',      -- Q30 (P.A.S.S, 4 strict text inputs)
  'classification_matrix'-- Q31/32 (recyclable vs not)
);

create table if not exists game_responses (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references teams(id) on delete cascade,
  module_id         text not null,            -- e.g. 'module-1-safe-driving'
  question_id       text not null,            -- e.g. 'q1'
  response_type     response_type not null,
  response_data     jsonb not null default '{}'::jsonb,
  media_url         text,                     -- Supabase Storage path, nullable
  text_response     text,                     -- free text, nullable
  is_correct        boolean,                  -- null = ungraded
  points_awarded    integer not null default 0,
  auto_graded       boolean not null default false, -- true = graded by apply_autograde(), not a human
  evaluated_by      uuid references auth.users(id),
  evaluated_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (team_id, module_id, question_id)
);

create index if not exists idx_responses_team on game_responses (team_id);
create index if not exists idx_responses_module on game_responses (module_id);
create index if not exists idx_responses_ungraded
  on game_responses (created_at)
  where is_correct is null and response_type in (
    'media_upload','hazard_canvas','subjective_select','exact_sequence'
  );

-- ----------------------------------------------------------------------------
-- 3. SESSION SPEED BONUS
-- One row per (module_id), enforced by the unique index — "only for 1 group"
-- per module, exactly as the brief specifies. +50 points, separate from the
-- per-question scoring so it's auditable independently (who awarded it, when).
-- ----------------------------------------------------------------------------
create table if not exists session_speed_bonus (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  module_id   text not null unique,
  points      integer not null default 50,
  awarded_by  uuid references auth.users(id),
  awarded_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. MODULE PROGRESS
-- Tracks per-team, per-module state so the frontend can enforce "absolute
-- silence" — no score is ever shown to a player until their module is
-- status = 'completed'. Also backs the admin's live "who's stuck where" view.
-- ----------------------------------------------------------------------------
create table if not exists team_module_progress (
  team_id      uuid not null references teams(id) on delete cascade,
  module_id    text not null,
  status       text not null check (status in ('not_started','in_progress','completed')) default 'not_started',
  started_at   timestamptz,
  completed_at timestamptz,
  primary key (team_id, module_id)
);

-- ----------------------------------------------------------------------------
-- 5. ANONYMOUS MENTAL HEALTH METRICS
-- Deliberately has no team_id / member name column — see header note.
-- batch_session_id groups by event session (e.g. '2026-04-29-morning') only.
-- ----------------------------------------------------------------------------
create table if not exists anonymous_mental_health_metrics (
  id                     uuid primary key default gen_random_uuid(),
  batch_session_id       text not null,
  raw_calculated_score   integer not null check (raw_calculated_score between 0 and 30),
  interpretation_bracket text not null check (
    interpretation_bracket in ('low','moderate','high','very_high')
  ),
  created_at             timestamptz not null default now()
);

-- Aggregate-only view — this is the ONLY thing the admin dashboard ever
-- queries for module 4. No individual row is ever exposed to a client.
create or replace view anonymous_mental_health_aggregate as
select
  batch_session_id,
  count(*)                                                  as submissions,
  round(avg(raw_calculated_score), 1)                        as avg_score,
  count(*) filter (where interpretation_bracket = 'low')      as low_count,
  count(*) filter (where interpretation_bracket = 'moderate')  as moderate_count,
  count(*) filter (where interpretation_bracket = 'high')      as high_count,
  count(*) filter (where interpretation_bracket = 'very_high') as very_high_count
from anonymous_mental_health_metrics
group by batch_session_id;

-- ----------------------------------------------------------------------------
-- 6. ATOMIC TEAM CREATION RPC  (call this from the client — never INSERT
--    into teams directly)
-- ----------------------------------------------------------------------------
create or replace function create_team(
  p_member_1 text,
  p_member_2 text,
  p_member_3 text,
  p_session_group text default 'morning'
)
returns teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams;
begin
  if length(trim(p_member_1)) = 0 or length(trim(p_member_2)) = 0 or length(trim(p_member_3)) = 0 then
    raise exception 'All three member names are required';
  end if;

  insert into teams (team_number, member_1_name, member_2_name, member_3_name, session_group)
  values (nextval('team_number_seq'), trim(p_member_1), trim(p_member_2), trim(p_member_3), p_session_group)
  returning * into v_team;

  return v_team;
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. SCORE RECALCULATION TRIGGER
-- ----------------------------------------------------------------------------
create or replace function recalc_team_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  v_team_id := coalesce(new.team_id, old.team_id);

  update teams
  set current_total_score = (
        select coalesce(sum(points_awarded), 0) from game_responses where team_id = v_team_id
      ) + (
        select coalesce(sum(points), 0) from session_speed_bonus where team_id = v_team_id
      ),
      updated_at = now()
  where id = v_team_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalc_score_responses on game_responses;
create trigger trg_recalc_score_responses
  after insert or update of points_awarded or delete on game_responses
  for each row execute function recalc_team_score();

drop trigger if exists trg_recalc_score_bonus on session_speed_bonus;
create trigger trg_recalc_score_bonus
  after insert or delete on session_speed_bonus
  for each row execute function recalc_team_score();

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table teams enable row level security;
alter table game_responses enable row level security;
alter table session_speed_bonus enable row level security;
alter table team_module_progress enable row level security;
alter table anonymous_mental_health_metrics enable row level security;

-- teams: public read (leaderboard), no direct public write (use create_team RPC)
create policy "teams_select_all" on teams for select using (true);
create policy "teams_admin_update" on teams for update using (auth.role() = 'authenticated');

-- game_responses: a team can insert ITS OWN ungraded answer, and read its own
-- rows. Admins (authenticated) can read/update everything (grading).
-- NOTE: "its own" is enforced at the application layer via the team_id the
-- client holds locally (see lib/hooks/useTeam.ts). For a tighter guarantee
-- you can add Supabase Auth anonymous sign-in per team and check auth.uid()
-- here instead — flagged in README as a hardening step for repeat events.
create policy "responses_insert_own" on game_responses
  for insert
  with check (
    is_correct is null
    and points_awarded = 0
    and evaluated_by is null
  );

create policy "responses_select_all" on game_responses for select using (true);

create policy "responses_admin_grade" on game_responses
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- session_speed_bonus: admin-only write, public read (leaderboard ticker)
create policy "bonus_select_all" on session_speed_bonus for select using (true);
create policy "bonus_admin_insert" on session_speed_bonus
  for insert with check (auth.role() = 'authenticated');
create policy "bonus_admin_delete" on session_speed_bonus
  for delete using (auth.role() = 'authenticated');

-- team_module_progress: team can upsert its own progress, everyone can read
-- (admin "who's stuck where" view)
create policy "progress_select_all" on team_module_progress for select using (true);
create policy "progress_upsert_own" on team_module_progress
  for insert with check (true);
create policy "progress_update_own" on team_module_progress
  for update using (true);

-- anonymous_mental_health_metrics: insert-only from clients, NO select policy
-- at all for anon/authenticated on the raw table — only the aggregate view
-- (owned by a role with table access) is queryable.
create policy "mh_insert_anyone" on anonymous_mental_health_metrics
  for insert with check (true);
-- Intentionally no select policy here. Grant select on the aggregate VIEW
-- instead so even an authenticated admin can't pull a raw row:
grant select on anonymous_mental_health_aggregate to authenticated, anon;

-- ----------------------------------------------------------------------------
-- 9. REALTIME
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table game_responses;
alter publication supabase_realtime add table session_speed_bonus;
alter publication supabase_realtime add table team_module_progress;
