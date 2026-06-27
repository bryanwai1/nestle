-- ============================================================================
-- 0005 — Fix drifted answer keys + partial (range) auto-grading
-- ============================================================================
-- (1) Repair keys whose payload no longer matches their response_type, collapse
--     the old q6–q15 keyword split into the current q6–q10, and re-seed q17's
--     hazard zones to the 7 current hazards.
-- (2) Upgrade grade_response() so keyword / multi-item / hazard questions award
--     a RANGE of points by how many parts match:
--       • any partial match -> positive points (scaled)
--       • nothing matches   -> -5 (wrong answer)
--       • full correct      -> 10 (or 20 for two-part clips q6–q10)
-- Manual-review questions (uploads, q28 budget) are NOT seeded — they stay in
-- the admin pipeline. Same (is_correct, points) signature as 0002, so
-- apply_autograde(), regrade_question() and the Answer Keys editor are unchanged.
-- ============================================================================

-- ---------------------------------------------------------------- (1a) fix broken keys
update question_answer_keys
   set answer_key = '{"correctChoiceIds": ["t_window","c_stop_rest","c_stretching"]}'
 where question_id = 'q3';   -- was {"correctOptionIndex":2}

update question_answer_keys
   set answer_key = '{"acceptedKeywords": ["3 second rule","3-second rule","three second rule","peraturan 3 saat","3 saat","tiga saat","3-saat","three-second"]}'
 where question_id = 'q4';   -- was {"correctOptionIndex":1}

update question_answer_keys
   set answer_key = '{"expectedValue": 3, "tolerance": 0}'
 where question_id = 'q5';   -- was {"correctOptionIndex":2}; correct answer is 3

-- ---------------------------------------------------------------- (1b) q6–q10 issue+fix groups
update question_answer_keys set response_type='video_identify',
  answer_key = jsonb_build_object('keyGroups', jsonb_build_array(
    jsonb_build_array('dozing off','dozing','sleeping','asleep','fatigue','drowsy','drowsiness','mengantuk','tidur','keletihan','penat'),
    jsonb_build_array('manage fatigue','sufficient rest','rest','well-rested','well rested','take breaks','fatigue management','urus keletihan','rehat secukupnya','berehat','cukup rehat')))
 where question_id='q6';

update question_answer_keys set response_type='video_identify',
  answer_key = jsonb_build_object('keyGroups', jsonb_build_array(
    jsonb_build_array('not wearing seatbelt','no seatbelt','seatbelt','seat belt','tidak pakai tali pinggang keledar','tiada tali pinggang keledar','tali pinggang keledar'),
    jsonb_build_array('fasten seatbelt','wear seatbelt','wear seat belt','buckle up','put on seatbelt','pakai tali pinggang keledar','ikat tali pinggang keledar')))
 where question_id='q7';

update question_answer_keys set response_type='video_identify',
  answer_key = jsonb_build_object('keyGroups', jsonb_build_array(
    jsonb_build_array('distracted','texting','handphone','mobile','phone','not paying attention','using phone','leka','bertelefon','guna telefon','tidak fokus'),
    jsonb_build_array('not using handphone','focus','pay attention','no handphone','not texting','put phone away','avoid phone','jangan guna telefon','fokus','beri perhatian','tumpukan perhatian')))
 where question_id='q8';

update question_answer_keys set response_type='video_identify',
  answer_key = jsonb_build_object('keyGroups', jsonb_build_array(
    jsonb_build_array('rushing','reckless driving','reckless','unsafe driving','dangerous','speeding','tergesa-gesa','memandu cuai','memandu merbahaya','laju'),
    jsonb_build_array('drive safely','avoid reckless driving','slow down','do not rush','dont rush','do not be in a hurry','memandu dengan selamat','elak memandu cuai','perlahankan')))
 where question_id='q9';

update question_answer_keys set response_type='video_identify',
  answer_key = jsonb_build_object('keyGroups', jsonb_build_array(
    jsonb_build_array('not checking mirror','side mirror','no signal','no indicator','blind spot','not signaling','tidak periksa cermin','cermin sisi','tiada isyarat','bintik buta'),
    jsonb_build_array('scan side mirror','give signal','give indicator','check mirrors','use indicator','use signal','periksa cermin sisi','beri isyarat','guna lampu isyarat')))
 where question_id='q10';

delete from question_answer_keys where question_id in ('q11','q12','q13','q14','q15');

-- ---------------------------------------------------------------- (1c) q17: 7 current hazard zones (% coords from questions.ts h1–h7)
insert into question_answer_keys (question_id, response_type, answer_key) values
  ('q17','hazard_canvas','{"zones":[{"x":32,"y":71,"r":9},{"x":48,"y":67,"r":7},{"x":66,"y":70,"r":6},{"x":70,"y":33,"r":8},{"x":14,"y":90,"r":8},{"x":59,"y":40,"r":8},{"x":88,"y":62,"r":11}]}')
on conflict (question_id) do update set response_type=excluded.response_type, answer_key=excluded.answer_key;

-- q21 / q31 stay subjective_select {groups, minCorrect} — now fraction-scored below.

-- ---------------------------------------------------------------- (2) grade_response: partial / range scoring
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
  v_points  integer := -5;
  v_total   int;
  v_hit     int;
  v_text    text;
  v_group   jsonb;
begin
  case p_response_type

    when 'multiple_choice' then
      v_correct := (p_response_data->>'selectedIndex')::int = (p_answer_key->>'correctOptionIndex')::int;
      v_points  := case when v_correct then 10 else -5 end;

    when 'video_identify', 'video_avoid' then
      v_text := lower(coalesce(p_response_data->>'text',''));
      if p_answer_key ? 'keyGroups' then
        v_hit := 0; v_total := jsonb_array_length(p_answer_key->'keyGroups');
        for v_group in select * from jsonb_array_elements(p_answer_key->'keyGroups') loop
          if exists (select 1 from jsonb_array_elements_text(v_group) kw where v_text like '%'||lower(kw)||'%')
          then v_hit := v_hit + 1; end if;
        end loop;
        v_correct := (v_total > 0 and v_hit = v_total);
        v_points  := case when v_hit = 0 then -5 else v_hit * 10 end;   -- 10 per group; full = 20
      else
        v_correct := exists (select 1 from jsonb_array_elements_text(p_answer_key->'acceptedKeywords') kw
                             where v_text like '%'||lower(kw)||'%');
        v_points := case when v_correct then 10 else -5 end;
      end if;

    when 'subjective_select' then
      v_text := lower(coalesce(p_response_data->>'text',''));
      v_hit := 0;
      for v_group in select * from jsonb_array_elements(p_answer_key->'groups') loop
        if exists (select 1 from jsonb_array_elements_text(v_group) kw where v_text like '%'||lower(kw)||'%')
        then v_hit := v_hit + 1; end if;
      end loop;
      v_total := coalesce((p_answer_key->>'minCorrect')::int, jsonb_array_length(p_answer_key->'groups'));
      if v_hit = 0 then v_points := -5; v_correct := false;
      else v_points := round(10.0 * least(v_hit, v_total) / v_total); v_correct := v_hit >= v_total; end if;

    when 'hazard_canvas' then
      v_total := jsonb_array_length(p_answer_key->'zones');
      select count(*) into v_hit from jsonb_array_elements(p_answer_key->'zones') z
      where exists (
        select 1 from jsonb_array_elements(p_response_data->'taps') t
        where sqrt(power((t->>'x')::numeric-(z->>'x')::numeric,2) + power((t->>'y')::numeric-(z->>'y')::numeric,2))
              <= (z->>'r')::numeric);
      if coalesce(v_total,0) = 0 then return; end if;
      if v_hit = 0 then v_points := -5; v_correct := false;
      else v_points := round(10.0 * least(v_hit, v_total) / v_total); v_correct := v_hit >= v_total; end if;

    when 'drag_sequence' then
      v_correct := (p_response_data->'order') = (p_answer_key->'correctOrder');
      v_points  := case when v_correct then 10 else -5 end;

    when 'drag_matrix' then
      select bool_and((p_response_data->'matches'->>pid) = pid) into v_correct
      from jsonb_array_elements_text(p_answer_key->'pairIds') pid;
      v_points := case when v_correct then 10 else -5 end;

    when 'visual_sort' then
      v_correct := (select coalesce(array_agg(x order by x), array[]::text[]) from jsonb_array_elements_text(p_response_data->'selected') x)
                 = (select coalesce(array_agg(x order by x), array[]::text[]) from jsonb_array_elements_text(p_answer_key->'correctChoiceIds') x);
      v_points := case when v_correct then 10 else -5 end;

    when 'categorized_dropzone', 'classification_matrix' then
      v_correct := (p_response_data->'placements') = (p_answer_key->'itemCategories');
      v_points  := case when v_correct then 10 else -5 end;

    when 'math_input' then
      v_correct := abs((p_response_data->>'value')::numeric - (p_answer_key->>'expectedValue')::numeric)
                   <= coalesce((p_answer_key->>'tolerance')::numeric, 0);
      v_points := case when v_correct then 10 else -5 end;

    when 'exact_sequence' then
      select bool_and(lower(trim(a.val)) = lower(trim(b.val))) into v_correct
      from jsonb_array_elements_text(p_response_data->'values') with ordinality a(val, idx)
      join jsonb_array_elements_text(p_answer_key->'correctValues') with ordinality b(val, idx) on a.idx = b.idx;
      v_points := case when v_correct then 10 else -5 end;

    else
      return; -- not auto-gradable
  end case;

  is_correct := coalesce(v_correct, false);
  points := v_points;
  return next;
end;
$$;

-- ---------------------------------------------------------------- (3) one-time re-grade of existing answers
-- Re-scores every already-submitted answer for keyed (auto) questions using the
-- new grade_response (so the q3/q4/q5 fixes + partial scoring apply retroactively).
-- Guard: only rows that were auto-graded or are still ungraded; a facilitator's
-- manual override (auto_graded=false, is_correct set) is left untouched.
with regraded as (
  select gr.id, g.is_correct, g.points
    from game_responses gr
    join question_answer_keys k on k.question_id = gr.question_id
    cross join lateral grade_response(k.response_type, k.answer_key, gr.response_data) g
   where gr.auto_graded is true or gr.is_correct is null
)
update game_responses gr
   set is_correct     = r.is_correct,
       points_awarded = r.points,
       auto_graded    = true,
       evaluated_at   = now()
  from regraded r
 where r.id = gr.id;
