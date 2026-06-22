-- ============================================================================
-- 0004 — Question type changes from the June 20 screenshot review
-- ============================================================================
-- Q3  : MCQ → visual_sort  (multi-select multiple correct answers)
-- Q4  : MCQ → video_avoid  (free-text, keyword-graded, no video)
-- Q5  : MCQ → math_input   (player types "3", checked server-side)
-- Q19 : drag_matrix → classification_matrix (two-box drag)
-- All other auto-gradeable questions are unchanged.
-- ============================================================================

insert into question_answer_keys (question_id, response_type, answer_key)
values
  ('q3', 'visual_sort',
    '{"correctChoiceIds": ["c_stop_rest","c_short_nap","c_stretching"]}'),
  ('q4', 'video_avoid',
    '{"acceptedKeywords": ["3 second rule","3-second rule","three second rule","peraturan 3 saat","3 saat","tiga saat","3-saat"]}'),
  ('q5', 'math_input',
    '{"expectedValue": 3, "tolerance": 0}'),
  ('q19', 'classification_matrix',
    '{"itemCategories": {
        "blood_flow_blocked": "heart_attack",
        "circulation_problem": "heart_attack",
        "conscious":          "heart_attack",
        "develops_slowly":    "heart_attack",
        "fast_medical":       "heart_attack",
        "heart_stops":        "cardiac_arrest",
        "electrical":         "cardiac_arrest",
        "unconscious":        "cardiac_arrest",
        "happens_suddenly":   "cardiac_arrest",
        "needs_cpr":          "cardiac_arrest"
      }
    }')
on conflict (question_id) do update set
  response_type = excluded.response_type,
  answer_key    = excluded.answer_key;
