-- 0009_autograde_q21_q31.sql
-- Adds answer keys for q21 and q31 so they can be auto-graded.

insert into question_answer_keys (question_id, response_type, answer_key) values
  ('q21', 'subjective_select', '{
    "groups": [
      ["stress test", "ujian tekanan"],
      ["ecg", "electrocardiogram"],
      ["ct scan", "ct coronary", "coronary angiography", "imbasan ct"],
      ["angiogram", "coronary angiogram"]
    ],
    "minCorrect": 4
  }'),
  ('q31', 'subjective_select', '{
    "groups": [
      ["pet", "pete"],
      ["hdpe"],
      ["pvc"],
      ["ldpe"],
      ["pp", "polypropylene"],
      ["ps", "polystyrene"],
      ["other", "lain-lain", "others"]
    ],
    "minCorrect": 7
  }')
on conflict (question_id) do update set response_type=excluded.response_type, answer_key=excluded.answer_key;
