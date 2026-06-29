-- 0006_add_region.sql
-- Adds region column to teams and updates create_team() to accept it.

alter table teams
  add column if not exists region text default null;

-- Replace create_team function to include p_region
create or replace function create_team(
  p_member_1 text,
  p_member_2 text,
  p_member_3 text,
  p_session_group text default 'morning',
  p_region text default null
) returns teams language plpgsql security definer as $$
declare
  v_team teams;
begin
  insert into teams (team_number, member_1_name, member_2_name, member_3_name, session_group, region)
  values (nextval('team_number_seq'), trim(p_member_1), trim(p_member_2), trim(p_member_3), p_session_group, p_region)
  returning * into v_team;
  return v_team;
end;
$$;
