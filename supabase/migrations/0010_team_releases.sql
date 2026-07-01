-- 0010_team_releases.sql
-- Tracks which teams have been released by admin to continue after
-- a module containing manual-review questions (media_upload).
-- When a team completes such a module, they are paused until admin
-- releases them — this table records those releases.

create table if not exists team_releases (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  module_id text not null,
  released_at timestamptz default now(),
  released_by text default 'admin',
  unique(team_id, module_id)
);

-- Allow all reads (players need to poll this to know if they are released)
alter table team_releases enable row level security;
create policy "anyone can read releases" on team_releases for select using (true);
create policy "service role can insert" on team_releases for insert with check (true);
create policy "service role can delete" on team_releases for delete using (true);
