// types/game.ts
// Core domain model for the question bank. Every question carries its own
// `responseType`, which is what lets <QuestionRunner> pick the right input
// component generically (see components/game/QuestionRunner.tsx) instead of
// a giant switch statement scattered across the codebase.
//
// BILINGUAL CONTENT: every string shown to a player is a `Text` object —
// `{ en, bm }` — never a bare string. This is deliberate: it makes it a type
// error to add a question with an English prompt and forget the Bahasa
// Malaysia one. lib/i18n/localize.ts turns a GameQuestion + a chosen
// language into plain strings right before handing it to a UI component, so
// none of the 13 input components need to know translation exists.

import type { ResponseType } from './database';

export type Lang = 'en' | 'bm';

/** A piece of player-facing copy in both supported languages. */
export interface Text {
  en: string;
  bm: string;
}

export function t(text: Text, lang: Lang): string {
  return text[lang];
}

export type ModuleId =
  | 'module-1-safe-driving'
  | 'module-2-stf'
  | 'module-3-heart-health'
  | 'module-4-mental-health'
  | 'module-5-ergonomics'
  | 'module-6-exercise'
  | 'module-7-balanced-diet'
  | 'module-8-medical-emergency'
  | 'module-9-fire-emergency'
  | 'module-10-plastic-recycling';

export interface GameModule {
  id: ModuleId;
  index: number; // 1-10, display order
  title: Text;
  timerSeconds: number | null; // null = no countdown (module 4 has its own 5-min flow)
  questionIds: string[];
}

/** Base fields every question has, regardless of input type. */
interface QuestionBase {
  id: string; // 'q1' .. 'q32', matches game_responses.question_id
  moduleId: ModuleId;
  order: number;
  prompt: Text;
  /** True if this question needs a human to look at the submission before
   * points can be awarded (uploads, free text, hazard taps). Drives the
   * admin "Submissions Pipeline" grouping. */
  requiresManualReview: boolean;
  /** Max points obtainable for this question (used by admin grading UI as
   * the ceiling on +10/-5 stepper presets — most are 10, a couple of the
   * manually-judged ones go up to 10 as well per the brief). */
  maxPoints: number;
  videoUrl?: string; // for the 5 "video injected" hazard clips in module 1
}

export interface MultipleChoiceQuestion extends QuestionBase {
  responseType: 'multiple_choice';
  options: Text[];
  /** Index into options. Single official answer; UI still shuffles order
   * per-team (see lib/game/shuffle.ts) per the wireframe's "JUMBLE UP" note. */
  correctOptionIndex: number;
}

export interface VideoIdentifyQuestion extends QuestionBase {
  responseType: 'video_identify' | 'video_identify_and_avoid' | 'video_avoid';
  /** Fill-in-the-blank per wireframe annotation on the original MCQ mockup.
   * Graded by keyword match (any one is sufficient). Includes BOTH English
   * and Malay keywords in one flat list — a team typing in the language
   * they're more comfortable with should never be marked wrong for it,
   * regardless of which language the interface is currently set to. */
  acceptedKeywords: string[];
}

export interface MediaUploadQuestion extends QuestionBase {
  responseType: 'media_upload';
  mediaKind: 'photo' | 'video';
  maxDurationSeconds?: number; // for video questions with a cap (e.g. Q29 = 180s)
  instructions: Text;
  photoSteps?: Array<{ id: string; label: Text }>; // when set: one photo per step (e.g. Q29 C-A-L-M)
}

export interface HazardScene {
  imageUrl: string;
  label: Text;
  hazards: Array<{ id: string; x: number; y: number; radius: number; label: Text }>;
  decoyZones: Array<{ id: string; x: number; y: number; radius: number }>;
  targetHazardCount: number;
}
export interface HazardCanvasQuestion extends QuestionBase {
  responseType: 'hazard_canvas';
  /** Legacy single-image fields — kept for backward compat, unused when scenes present */
  imageUrl: string;
  hazards: Array<{ id: string; x: number; y: number; radius: number; label: Text }>;
  decoyZones: Array<{ id: string; x: number; y: number; radius: number }>;
  targetHazardCount: number;
  /** Multi-scene mode: player goes through each scene in order */
  scenes?: HazardScene[];
}

export interface DragSequenceQuestion extends QuestionBase {
  responseType: 'drag_sequence';
  steps: Array<{ id: string; label: Text; imageUrl?: string }>; // shuffled client-side
  imageUrl?: string; // optional context image shown above the steps
  correctOrder: string[]; // step ids, in correct order
}

export interface DragMatrixQuestion extends QuestionBase {
  responseType: 'drag_matrix';
  leftColumnLabel: Text;
  rightColumnLabel: Text;
  pairs: Array<{ id: string; left: Text; right: Text }>;
}

export interface VisualSortQuestion extends QuestionBase {
  responseType: 'visual_sort';
  /** Correct + trap choices mixed together; UI shuffles. Each choice has a
   * stable `id` so a selection grades the same regardless of which
   * language it was displayed/selected in. */
  correctChoices: Array<{ id: string; text: Text }>;
  trapChoices: Array<{ id: string; text: Text }>;
}

export interface SubjectiveSelectQuestion extends QuestionBase {
  responseType: 'subjective_select';
  acceptableAnswers: Array<{ id: string; text: Text }>; // any N count, see minCorrectRequired
  minCorrectRequired: number;
  freeText: boolean; // true = also accept a free-text field, admin reviews
}

export interface CategorizedDropzoneQuestion extends QuestionBase {
  responseType: 'categorized_dropzone';
  categories: Array<{ id: string; label: Text }>;
  items: Array<{ id: string; label: Text; correctCategory: string; imageUrl?: string }>; imageUrl?: string;
}

export interface MathInputQuestion extends QuestionBase {
  responseType: 'math_input';
  formulaDisplay: Text; // "220 - Age" / "220 - Umur"
  expectedValue: number; // 170
  tolerance?: number; // default 0 = exact match
}

export interface BudgetCanvasQuestion extends QuestionBase {
  responseType: 'budget_canvas';
  budgetLimitRM: number; // 12
  quadrants: Array<{ id: 'veg_fruit' | 'protein' | 'carb'; label: Text; fraction: number }>;
  foodCards: Array<{
    id: string;
    label: Text;
    category: 'veg_fruit' | 'protein' | 'carb';
    costRM: number;
    calories: number; imageUrl?: string;
  }>;
}

export interface ExactSequenceQuestion extends QuestionBase {
  responseType: 'exact_sequence';
  blanks: number; // 4
  /** P.A.S.S is taught as an English acronym even in Bahasa Malaysia safety
   * materials (the letters spell the acronym itself), so the expected
   * values are intentionally NOT translated — only the surrounding prompt
   * and field labels are. */
  correctValues: string[]; // ['Pull','Aim','Squeeze','Sweep'] — 100% string match
}

export interface ClassificationMatrixQuestion extends QuestionBase {
  responseType: 'classification_matrix';
  categories: Array<{ id: string; label: Text }>;
  items: Array<{ id: string; label: Text; correctCategory: string; imageUrl?: string }>; imageUrl?: string;
}

export type GameQuestion =
  | MultipleChoiceQuestion
  | VideoIdentifyQuestion
  | MediaUploadQuestion
  | HazardCanvasQuestion
  | DragSequenceQuestion
  | DragMatrixQuestion
  | VisualSortQuestion
  | SubjectiveSelectQuestion
  | CategorizedDropzoneQuestion
  | MathInputQuestion
  | BudgetCanvasQuestion
  | ExactSequenceQuestion
  | ClassificationMatrixQuestion;

/** What gets written into game_responses.response_data for each type. Kept
 * separate from the question shape above because the *answer* a team submits
 * has a different shape than the *question config* an admin authored. These
 * stay language-agnostic — ids and numbers, never display text — so a
 * submission grades the same regardless of which language a team played in. */
export type ResponseDataByType = {
  multiple_choice: { selectedIndex: number };
  video_identify: { text: string };
  video_avoid: { text: string };
  video_identify_and_avoid: { text: string };
  media_upload: { uploadedAt: string; photos?: Array<{ stepId: string; url: string }> };
  hazard_canvas: { taps?: Array<{ x: number; y: number }>; scenes?: Array<{ sceneIndex: number; taps: Array<{ x: number; y: number }> }> };
  drag_sequence: { order: string[] };
  drag_matrix: { matches: Record<string, string> }; // leftId -> rightId
  visual_sort: { selected: string[] }; // choice ids, language-independent
  subjective_select: { selected: string[]; freeText?: string };
  categorized_dropzone: { placements: Record<string, string> }; // itemId -> categoryId
  math_input: { value: number };
  budget_canvas: {
    placements: Array<{ foodId: string; quadrant: string }>;
    totalCostRM: number;
    totalCalories: number;
  };
  exact_sequence: { values: string[] };
  classification_matrix: { placements: Record<string, string> };
};

export type ResponseTypeOf<Q extends GameQuestion> = Q['responseType'];
