-- 0011_auto_speed_bonus.sql
-- Auto-awards 10 speed bonus points to the first team to complete each module.
-- Fires on team_module_progress update (status -> 'completed').
-- Replaces the old manual admin +50 award with automatic +10.

-- Update the bonus amount check: change from 50 to 10 in any existing rows
update session_speed_bonus set points = 10 where points = 50;

-- Function: award speed bonus to first completer of each module
create or replace function auto_award_speed_bonus()
returns trigger language plpgsql security definer as $$
begin
  -- Only fire when status transitions to 'completed'
  if NEW.status = 'completed' and (OLD.status is null or OLD.status <> 'completed') then
    -- Check if anyone already has the bonus for this module
    if not exists (
      select 1 from session_speed_bonus where module_id = NEW.module_id
    ) then
      -- First team to complete this module — award 10 points
      insert into session_speed_bonus (team_id, module_id, points, awarded_by)
      values (NEW.team_id, NEW.module_id, 10, 'auto');
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_auto_speed_bonus on team_module_progress;
create trigger trg_auto_speed_bonus
  after insert or update on team_module_progress
  for each row execute function auto_award_speed_bonus();
