-- ============================================================================
-- 0002 — Server-side answer keys + trustworthy auto-grading
-- ============================================================================
-- Why this exists: the question bank (lib/game/questions.ts) lives in the
-- Next.js codebase, which is fine for rendering, but it means a browser
-- console could otherwise claim "I got this right" and there'd be nothing
-- in Postgres to check that against. This migration mirrors just the ANSWER
-- KEYS (not the full question content — no prompts, no media, no decoys)
-- into the database, and apply_autograde() recomputes correctness itself
-- from the already-submitted response_data. The client never gets to assert
-- its own grade.
--
-- Keep this in sync with lib/game/questions.ts by hand for now. If the
-- question bank grows or changes often, promote this to a small generation
-- script (read QUESTIONS, emit this file) — noted in README as a follow-up.
-- ============================================================================

create table if not exists question_answer_keys (
  question_id   text primary key,
  response_type response_type not null,
  answer_key    jsonb not null
);

insert into question_answer_keys (question_id, response_type, answer_key) values
  ('q1',  'multiple_choice', '{"correctOptionIndex": 0}'),
  ('q2',  'multiple_choice', '{"correctOptionIndex": 1}'),
  ('q3',  'multiple_choice', '{"correctOptionIndex": 2}'),
  ('q4',  'multiple_choice', '{"correctOptionIndex": 1}'),
  ('q5',  'multiple_choice', '{"correctOptionIndex": 2}'),
  ('q6',  'video_identify',  '{"acceptedKeywords": ["dozing off","dozing","sleeping","asleep","fatigue","drowsy","drowsiness","mengantuk","tidur","keletihan","penat"]}'),
  ('q7',  'video_avoid',     '{"acceptedKeywords": ["manage fatigue","sufficient rest","rest","well-rested","well rested","take breaks","fatigue management","urus keletihan","rehat secukupnya","berehat","cukup rehat"]}'),
  ('q8',  'video_identify',  '{"acceptedKeywords": ["not wearing seatbelt","no seatbelt","seatbelt","seat belt","tidak pakai tali pinggang keledar","tiada tali pinggang keledar","tali pinggang keledar"]}'),
  ('q9',  'video_avoid',     '{"acceptedKeywords": ["fasten seatbelt","wear seatbelt","wear seat belt","buckle up","put on seatbelt","pakai tali pinggang keledar","ikat tali pinggang keledar"]}'),
  ('q10', 'video_identify',  '{"acceptedKeywords": ["distracted","texting","handphone","mobile","phone","not paying attention","using phone","leka","bertelefon","guna telefon","tidak fokus"]}'),
  ('q11', 'video_avoid',     '{"acceptedKeywords": ["not using handphone","focus","pay attention","no handphone","not texting","put phone away","avoid phone","jangan guna telefon","fokus","beri perhatian","tumpukan perhatian"]}'),
  ('q12', 'video_identify',  '{"acceptedKeywords": ["rushing","reckless driving","reckless","unsafe driving","dangerous","speeding","tergesa-gesa","memandu cuai","memandu merbahaya","laju"]}'),
  ('q13', 'video_avoid',     '{"acceptedKeywords": ["drive safely","avoid reckless driving","slow down","do not rush","dont rush","memandu dengan selamat","elak memandu cuai","perlahankan"]}'),
  ('q14', 'video_identify',  '{"acceptedKeywords": ["not checking mirror","side mirror","no signal","no indicator","blind spot","not signaling","tidak periksa cermin","cermin sisi","tiada isyarat","bintik buta"]}'),
  ('q15', 'video_avoid',     '{"acceptedKeywords": ["scan side mirror","give signal","give indicator","check mirrors","use indicator","use signal","periksa cermin sisi","beri isyarat","guna lampu isyarat"]}'),
  ('q18', 'drag_sequence',   '{"correctOrder": ["clear_aisles","inspect_ladder","hold_ladder","confirm_floor"]}'),
  ('q19', 'drag_matrix',     '{"pairIds": ["p1","p2","p3","p4","p5"]}'),
  ('q20', 'visual_sort',     '{"correctChoiceIds": ["c1","c2","c3","c4","c5","c6","c7","c8","c9","c10"]}'),
  ('q26', 'categorized_dropzone', '{"itemCategories": {
                                "i1": "burn_fat", "i2": "burn_fat", "i3": "burn_fat", "i4": "burn_fat",
                                "i5": "build_muscle", "i6": "build_muscle", "i7": "build_muscle",
                                "i8": "stretching", "i9": "stretching", "i10": "stretching"
                              }}'),
  ('q27', 'math_input',      '{"expectedValue": 170, "tolerance": 0}'),
  ('q30', 'exact_sequence',  '{"correctValues": ["Pull","Aim","Squeeze","Sweep"]}'),
  ('q32', 'classification_matrix', '{"itemCategories": {
                                "pet": "recyclable", "hdpe": "recyclable", "ldpe": "recyclable", "pp": "recyclable",
                                "pvc": "non_recyclable", "ps": "non_recyclable", "others": "non_recyclable"
                              }}')
on conflict (question_id) do update set answer_key = excluded.answer_key;

-- Note: q16, q17, q21, q22, q23, q24, q25, q28, q29, q31 are intentionally
-- absent — they're manual-review types (uploads, hazard taps, free text,
-- the diet budget canvas) and always go to the admin Submissions Pipeline.

-- ----------------------------------------------------------------------------
-- grade_response: pure function, response_type-specific comparison logic.
-- ----------------------------------------------------------------------------
create or replace function grade_response(
  p_response_type response_type,
  p_answer_key jsonb,
  p_response_data jsonb
)
returns table (is_correct boolean, points integer)
language plpgsql
immutable
as $$
declare
  v_correct boolean := false;
begin
  case p_response_type
    when 'multiple_choice' then
      v_correct := (p_response_data->>'selectedIndex')::int = (p_answer_key->>'correctOptionIndex')::int;

    when 'video_identify', 'video_avoid' then
      select exists (
        select 1 from jsonb_array_elements_text(p_answer_key->'acceptedKeywords') kw
        where lower(p_response_data->>'text') like '%' || lower(kw) || '%'
      ) into v_correct;

    when 'drag_sequence' then
      v_correct := (p_response_data->'order') = (p_answer_key->'correctOrder');

    when 'drag_matrix' then
      select bool_and((p_response_data->'matches'->>pid) = pid)
      into v_correct
      from jsonb_array_elements_text(p_answer_key->'pairIds') pid;

    when 'visual_sort' then
      v_correct := (
        select coalesce(array_agg(x order by x), array[]::text[])
        from jsonb_array_elements_text(p_response_data->'selected') x
      ) = (
        select coalesce(array_agg(x order by x), array[]::text[])
        from jsonb_array_elements_text(p_answer_key->'correctChoiceIds') x
      );

    when 'categorized_dropzone', 'classification_matrix' then
      v_correct := (p_response_data->'placements') = (p_answer_key->'itemCategories');

    when 'math_input' then
      v_correct := abs((p_response_data->>'value')::numeric - (p_answer_key->>'expectedValue')::numeric)
                   <= coalesce((p_answer_key->>'tolerance')::numeric, 0);

    when 'exact_sequence' then
      select bool_and(lower(trim(a.val)) = lower(trim(b.val)))
      into v_correct
      from jsonb_array_elements_text(p_response_data->'values') with ordinality a(val, idx)
      join jsonb_array_elements_text(p_answer_key->'correctValues') with ordinality b(val, idx)
        on a.idx = b.idx;

    else
      return; -- no rows = "not auto-gradable", caller leaves is_correct null
  end case;

  is_correct := v_correct;
  points := case when v_correct then 10 else -5 end;
  return next;
end;
$$;

-- ----------------------------------------------------------------------------
-- apply_autograde: the ONLY thing the client calls. It re-reads whatever was
-- already inserted into game_responses (by the team's own insert, which
-- happened a moment earlier and cannot itself set grading columns — see RLS
-- policy responses_insert_own) and grades it from question_answer_keys.
-- If there's no answer key for this question, it's a manual-review type and
-- this is a no-op — the row stays is_correct = null for the admin queue.
-- ----------------------------------------------------------------------------
create or replace function apply_autograde(
  p_team_id uuid,
  p_module_id text,
  p_question_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key question_answer_keys;
  v_response game_responses;
  v_grade record;
begin
  select * into v_key from question_answer_keys where question_id = p_question_id;
  if not found then
    return; -- manual-review question, nothing to do
  end if;

  select * into v_response
  from game_responses
  where team_id = p_team_id and module_id = p_module_id and question_id = p_question_id;
  if not found then
    raise exception 'No response found to grade for team % / %', p_team_id, p_question_id;
  end if;

  select * into v_grade from grade_response(v_key.response_type, v_key.answer_key, v_response.response_data);
  if v_grade is null then
    return;
  end if;

  update game_responses
  set is_correct = v_grade.is_correct,
      points_awarded = v_grade.points,
      auto_graded = true,
      evaluated_at = now()
  where id = v_response.id;
end;
$$;

grant execute on function apply_autograde(uuid, text, text) to anon, authenticated;
