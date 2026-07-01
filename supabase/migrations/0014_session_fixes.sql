-- 0014_session_fixes.sql
-- Fixes session management issues:
-- 1. Tags game_responses with session_id on insert
-- 2. Tags team_module_progress with session_id on insert  
-- 3. Tags session_speed_bonus with session_id on insert
-- 4. Updates auto_award_speed_bonus to tag with session_id

-- Function to auto-tag session_id on game_responses
create or replace function tag_response_session()
returns trigger language plpgsql security definer as $$
begin
  if NEW.session_id is null then
    NEW.session_id := get_active_session();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_tag_response_session on game_responses;
create trigger trg_tag_response_session
  before insert on game_responses
  for each row execute function tag_response_session();

-- Function to auto-tag session_id on team_module_progress
create or replace function tag_progress_session()
returns trigger language plpgsql security definer as $$
begin
  if NEW.session_id is null then
    NEW.session_id := get_active_session();
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_tag_progress_session on team_module_progress;
create trigger trg_tag_progress_session
  before insert on team_module_progress
  for each row execute function tag_progress_session();

-- Update auto_award_speed_bonus to include session_id
create or replace function auto_award_speed_bonus()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'completed' and (OLD.status is null or OLD.status <> 'completed') then
    if not exists (
      select 1 from session_speed_bonus 
      where module_id = NEW.module_id 
      and session_id = get_active_session()
    ) then
      insert into session_speed_bonus (team_id, module_id, points, awarded_by, session_id)
      values (NEW.team_id, NEW.module_id, 10, null, get_active_session());
    end if;
  end if;
  return NEW;
end;
$$;
