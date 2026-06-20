-- ============================================================================
-- 0003 — Storage bucket for Q16/22/23/24/25/29 photo & video submissions
-- ============================================================================
-- Run this once. If you'd rather create the bucket via the Supabase
-- dashboard (Storage → New bucket → "submissions", public), skip the insert
-- below and keep only the policies.

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

-- Anyone can upload (teams aren't authenticated users — see the RLS note in
-- 0001_init.sql). Path convention enforced client-side is
-- `${teamId}/${questionId}/${timestamp}.${ext}` — not enforced here at the
-- policy level, since storage RLS can't easily validate that teamId is a
-- real row without a slower lookup, and the upload itself is harmless
-- (a stray object costs storage, not trust — grading still requires a
-- matching game_responses row to ever surface in the admin queue).
create policy "submissions_insert_anyone"
  on storage.objects for insert
  with check (bucket_id = 'submissions');

create policy "submissions_select_anyone"
  on storage.objects for select
  using (bucket_id = 'submissions');

-- Only admins can delete (cleanup after the event, removing a bad upload).
create policy "submissions_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'submissions' and auth.role() = 'authenticated');
