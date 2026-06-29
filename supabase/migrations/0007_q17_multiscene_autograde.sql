-- 0007_q17_multiscene_autograde.sql
-- Updates q17 answer key to 3 scenes and upgrades hazard_canvas grading
-- to support multi-scene payload {scenes:[{sceneIndex,taps}]} worth 10pts each.

-- Update q17 answer key: 3 scenes with hazard zones
insert into question_answer_keys (question_id, response_type, answer_key) values
  ('q17','hazard_canvas','{
    "scenes": [
      {"zones":[{"x":50,"y":78,"r":10},{"x":10,"y":55,"r":10},{"x":22,"y":52,"r":8},{"x":48,"y":45,"r":9},{"x":88,"y":72,"r":9},{"x":78,"y":62,"r":8},{"x":82,"y":50,"r":9}]},
      {"zones":[{"x":32,"y":71,"r":9},{"x":48,"y":67,"r":7},{"x":66,"y":70,"r":6},{"x":70,"y":33,"r":8},{"x":14,"y":90,"r":8},{"x":59,"y":40,"r":8},{"x":88,"y":62,"r":11}]},
      {"zones":[{"x":62,"y":52,"r":10},{"x":45,"y":82,"r":10},{"x":35,"y":88,"r":8},{"x":72,"y":55,"r":8},{"x":82,"y":18,"r":8},{"x":18,"y":38,"r":9},{"x":50,"y":22,"r":9}]}
    ]
  }')
on conflict (question_id) do update set response_type=excluded.response_type, answer_key=excluded.answer_key;

-- Upgrade grade_response() to handle multi-scene hazard_canvas
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
  v_scene   jsonb;
  v_scene_zones jsonb;
  v_scene_taps  jsonb;
  v_scene_hit   int;
  v_scene_total int;
  v_scene_pts   int;
  v_total_pts   int;
  v_scene_idx   int;
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
        v_points  := case when v_hit = 0 then -5 else v_hit * 10 end;
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
      -- Multi-scene payload: {scenes:[{sceneIndex,taps}]}
      if p_answer_key ? 'scenes' and p_response_data ? 'scenes' then
        v_total_pts := 0;
        v_hit := 0;
        v_total := jsonb_array_length(p_answer_key->'scenes');
        for v_scene_idx in 0..v_total-1 loop
          v_scene_zones := p_answer_key->'scenes'->v_scene_idx->'zones';
          -- find matching scene taps by sceneIndex
          select s->'taps' into v_scene_taps
          from jsonb_array_elements(p_response_data->'scenes') s
          where (s->>'sceneIndex')::int = v_scene_idx
          limit 1;
          if v_scene_taps is null then
            v_total_pts := v_total_pts + 0;
            continue;
          end if;
          v_scene_total := jsonb_array_length(v_scene_zones);
          select count(*) into v_scene_hit
          from jsonb_array_elements(v_scene_zones) z
          where exists (
            select 1 from jsonb_array_elements(v_scene_taps) t
            where sqrt(power((t->>'x')::numeric-(z->>'x')::numeric,2)+power((t->>'y')::numeric-(z->>'y')::numeric,2))
                  <= (z->>'r')::numeric);
          if v_scene_hit = 0 then
            v_scene_pts := 0;
          else
            v_scene_pts := round(10.0 * least(v_scene_hit, v_scene_total) / v_scene_total);
          end if;
          v_total_pts := v_total_pts + v_scene_pts;
          if v_scene_hit >= v_scene_total then v_hit := v_hit + 1; end if;
        end loop;
        v_points  := case when v_total_pts = 0 then -5 else v_total_pts end;
        v_correct := (v_hit = v_total);
      else
        -- Legacy single-scene fallback
        v_total := jsonb_array_length(p_answer_key->'zones');
        select count(*) into v_hit from jsonb_array_elements(p_answer_key->'zones') z
        where exists (
          select 1 from jsonb_array_elements(p_response_data->'taps') t
          where sqrt(power((t->>'x')::numeric-(z->>'x')::numeric,2)+power((t->>'y')::numeric-(z->>'y')::numeric,2))
                <= (z->>'r')::numeric);
        if coalesce(v_total,0) = 0 then return; end if;
        if v_hit = 0 then v_points := -5; v_correct := false;
        else v_points := round(10.0 * least(v_hit, v_total) / v_total); v_correct := v_hit >= v_total; end if;
      end if;

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

    else
      return;
  end case;

  return query select v_correct, v_points;
end;
$$;
