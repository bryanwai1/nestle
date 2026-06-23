// components/game/QuestionInputSwitch.tsx
//
// One switch statement, one place to add a new interaction pattern. Every
// case below hands off to a focused component in components/game/inputs/ —
// none of them know about Supabase, grading, or the silence rule; they just
// collect an answer shape and call onAnswer() once.

import type { GameQuestion, ResponseDataByType } from '@/types/game';
import { MultipleChoiceInput } from './inputs/MultipleChoiceInput';
import { VideoFillBlankInput } from './inputs/VideoFillBlankInput';
import { MediaUploadInput } from './inputs/MediaUploadInput';
import { HazardCanvasInput } from './inputs/HazardCanvasInput';
import { DragSequenceInput } from './inputs/DragSequenceInput';
import { DragMatrixInput } from './inputs/DragMatrixInput';
import { VisualSortInput } from './inputs/VisualSortInput';
import { SubjectiveSelectInput } from './inputs/SubjectiveSelectInput';
import { CategorizedDropzoneInput } from './inputs/CategorizedDropzoneInput';
import { MathInputInput } from './inputs/MathInputInput';
import { BudgetCanvasInput } from './inputs/BudgetCanvasInput';
import { ExactSequenceInput } from './inputs/ExactSequenceInput';
import { ClassificationMatrixInput } from './inputs/ClassificationMatrixInput';

export interface QuestionInputProps<T extends keyof ResponseDataByType> {
  teamId: string;
  disabled: boolean;
  onAnswer: (data: ResponseDataByType[T], mediaUrl?: string) => void;
}

export function QuestionInputSwitch({
  question,
  teamId,
  disabled,
  onAnswer,
}: {
  question: GameQuestion;
  teamId: string;
  disabled: boolean;
  onAnswer: (data: ResponseDataByType[GameQuestion['responseType']], mediaUrl?: string) => void;
}) {
  switch (question.responseType) {
    case 'multiple_choice':
      return <MultipleChoiceInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'video_identify':
    case 'video_identify_and_avoid':
    case 'video_avoid':
      return <VideoFillBlankInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'media_upload':
      return <MediaUploadInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'hazard_canvas':
      return <HazardCanvasInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'drag_sequence':
      return <DragSequenceInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'drag_matrix':
      return <DragMatrixInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'visual_sort':
      return <VisualSortInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'subjective_select':
      return <SubjectiveSelectInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'categorized_dropzone':
      return <CategorizedDropzoneInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'math_input':
      return <MathInputInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'budget_canvas':
      return <BudgetCanvasInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'exact_sequence':
      return <ExactSequenceInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    case 'classification_matrix':
      return <ClassificationMatrixInput question={question} teamId={teamId} disabled={disabled} onAnswer={onAnswer} />;
    default:
      return null;
  }
}
