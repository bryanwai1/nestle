// lib/game/scoring.ts
//
// Scoring rule from the brief ("Snake Game Method"):
//   correct  = +10
//   wrong    = -5
//   fastest team in a session module = +50 (handled separately, see
//   session_speed_bonus table + components/admin/SpeedBonusToggle.tsx)
//
// IMPORTANT: this file is NOT what writes points to the database anymore.
// The authoritative grade comes from the apply_autograde() Postgres function
// (supabase/migrations/0002_answer_keys_and_autograde.sql), which re-derives
// correctness server-side from question_answer_keys so a browser console can
// never assert its own score. This file mirrors that same logic in
// TypeScript purely so the ADMIN dashboard can show a "suggested grade" next
// to manual-review submissions (e.g. is the typed answer in the ballpark)
// without round-tripping to Postgres for a preview. Keep the two in sync if
// you change either — see the comment at the top of migration 0002.

import type { GameQuestion, ResponseDataByType } from '@/types/game';

export interface AutoGradeResult {
  isCorrect: boolean;
  points: number; // +10 or -5, per the brief's fixed scoring
}

const CORRECT_POINTS = 10;
const WRONG_POINTS = -5;

export function autoGrade<T extends GameQuestion>(
  question: T,
  data: ResponseDataByType[T['responseType']]
): AutoGradeResult | null {
  switch (question.responseType) {
    case 'multiple_choice': {
      const d = data as ResponseDataByType['multiple_choice'];
      const correct = d.selectedIndex === question.correctOptionIndex;
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'drag_sequence': {
      const d = data as ResponseDataByType['drag_sequence'];
      const correct = JSON.stringify(d.order) === JSON.stringify(question.correctOrder);
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'drag_matrix': {
      const d = data as ResponseDataByType['drag_matrix'];
      const correct = question.pairs.every((p) => d.matches[p.id] === p.id);
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'visual_sort': {
      const d = data as ResponseDataByType['visual_sort'];
      const selectedSet = new Set(d.selected);
      const correctSet = new Set(question.correctChoices.map((c) => c.id));
      const correct =
        selectedSet.size === correctSet.size &&
        [...selectedSet].every((s) => correctSet.has(s));
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'categorized_dropzone': {
      const d = data as ResponseDataByType['categorized_dropzone'];
      const correct = question.items.every((item) => d.placements[item.id] === item.correctCategory);
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'classification_matrix': {
      const d = data as ResponseDataByType['classification_matrix'];
      const correct = question.items.every((item) => d.placements[item.id] === item.correctCategory);
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'math_input': {
      const d = data as ResponseDataByType['math_input'];
      const tol = question.tolerance ?? 0;
      const correct = Math.abs(d.value - question.expectedValue) <= tol;
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'exact_sequence': {
      const d = data as ResponseDataByType['exact_sequence'];
      const correct =
        d.values.length === question.correctValues.length &&
        d.values.every((v, i) => v.trim().toLowerCase() === question.correctValues[i].toLowerCase());
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    case 'video_identify':
    case 'video_avoid': {
      // Keyword-matched, not exact — still objective enough to auto-grade,
      // but flagged with isCorrect possibly wrong on close phrasing, so we
      // surface it as a SUGGESTION the admin can flip rather than skipping
      // straight to "manual only" (keeps the queue small while staying fair).
      const d = data as ResponseDataByType['video_identify'];
      const text = d.text.toLowerCase();
      const correct = question.acceptedKeywords.some((kw) => text.includes(kw.toLowerCase()));
      return { isCorrect: correct, points: correct ? CORRECT_POINTS : WRONG_POINTS };
    }

    // Manual-only — admin grades these in the Submissions Pipeline.
    case 'media_upload':
    case 'hazard_canvas':
    case 'subjective_select':
    case 'budget_canvas':
      return null;

    default:
      return null;
  }
}

/** Used by the admin Budget Canvas review card to show a computed summary
 * alongside the raw submission — saves a grader from doing the arithmetic
 * by hand, while still leaving the correctness call to them. */
export function summarizeBudgetCanvas(
  question: Extract<GameQuestion, { responseType: 'budget_canvas' }>,
  data: ResponseDataByType['budget_canvas']
) {
  const byQuadrant: Record<string, { costRM: number; calories: number }> = {};
  for (const q of question.quadrants) byQuadrant[q.id] = { costRM: 0, calories: 0 };

  for (const placement of data.placements) {
    const card = question.foodCards.find((f) => f.id === placement.foodId);
    if (!card) continue;
    byQuadrant[placement.quadrant].costRM += card.costRM;
    byQuadrant[placement.quadrant].calories += card.calories;
  }

  const totalCost = Object.values(byQuadrant).reduce((s, v) => s + v.costRM, 0);
  const withinBudget = totalCost <= question.budgetLimitRM;

  return { byQuadrant, totalCost, withinBudget };
}
