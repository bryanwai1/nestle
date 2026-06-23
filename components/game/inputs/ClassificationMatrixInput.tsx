// components/game/inputs/ClassificationMatrixInput.tsx
//
// Drag each item into the correct box. Auto-graded with partial credit
// (each item placed in the right box scores; see migration 0005).

'use client';

import type { ClassificationMatrixQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { BoxSort } from './dragdrop';

export function ClassificationMatrixInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'classification_matrix'> & { question: ClassificationMatrixQuestion }) {
  return (
    <BoxSort
      categories={question.categories}
      items={question.items}
      disabled={disabled}
      onAnswer={(data) => onAnswer(data)}
    />
  );
}
