-- 0013_session_aware_create_team.sql
-- Updates create_team() to tag new teams with the active session_id.

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
  v_session_id uuid;
begin
  select get_active_session() into v_session_id;
  insert into teams (team_number, member_1_name, member_2_name, member_3_name, member_4_name, session_group, region, session_id)
  values (
    nextval('team_number_seq'),
    trim(p_member_1), trim(p_member_2), trim(p_member_3),
    nullif(trim(coalesce(p_member_4, '')), ''),
    p_session_group, p_region, v_session_id
  )
  returning * into v_team;
  return v_team;
end;
$$;
