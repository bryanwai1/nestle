-- 0008_member4_and_sessions.sql
-- Adds optional 4th team member and updates create_team() to accept it.
-- region column (from 0006) is repurposed to store the new session slot
-- string (e.g. "ECR 1 - 1 Jul 2026 (9am-12.30pm)") instead of a state name —
-- no schema change needed there, just different values from the UI.

alter table teams
  add column if not exists member_4_name text default null;

create or replace function create_team(
  p_member_1 text,
  p_member_2 text,
  p_member_3 text,
  p_session_group text default 'morning',
  p_region text default null,
  p_member_4 text default null
) returns teams language plpgsql security definer as $$
declare
  v_team teams;
begin
  insert into teams (team_number, member_1_name, member_2_name, member_3_name, member_4_name, session_group, region)
  values (
    nextval('team_number_seq'),
    trim(p_member_1), trim(p_member_2), trim(p_member_3),
    nullif(trim(coalesce(p_member_4, '')), ''),
    p_session_group, p_region
  )
  returning * into v_team;
  return v_team;
end;
$$;
