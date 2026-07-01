-- 0012_session_management.sql
-- Adds session management so each event session is isolated.
-- Old data is preserved, new sessions start fresh.

create table if not exists event_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  is_active boolean default false
);

create unique index if not exists one_active_session 
  on event_sessions (is_active) where (is_active = true);

alter table teams add column if not exists session_id uuid references event_sessions(id);
alter table game_responses add column if not exists session_id uuid references event_sessions(id);
alter table team_module_progress add column if not exists session_id uuid references event_sessions(id);
alter table session_speed_bonus add column if not exists session_id uuid references event_sessions(id);
alter table team_releases add column if not exists session_id uuid references event_sessions(id);

insert into event_sessions (name, is_active) 
values ('ECR 1 - 1 Jul 2026 (9am-12.30pm)', true);

create or replace function get_active_session()
returns uuid language sql stable as $$
  select id from event_sessions where is_active = true limit 1;
$$;

create or replace function start_new_session(p_name text)
returns uuid language plpgsql security definer as $$
declare
  v_id uuid;
begin
  update event_sessions set is_active = false where is_active = true;
  insert into event_sessions (name, is_active) values (p_name, true) returning id into v_id;
  perform setval('team_number_seq', 1, false);
  return v_id;
end;
$$;

alter publication supabase_realtime add table event_sessions;
