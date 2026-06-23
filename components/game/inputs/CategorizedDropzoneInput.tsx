// components/game/inputs/CategorizedDropzoneInput.tsx
//
// Drag each activity into Burn Fat / Build Muscle / Stretching, etc.
// Auto-graded with partial credit (see migration 0005).

'use client';

import type { CategorizedDropzoneQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { BoxSort } from './dragdrop';

export function CategorizedDropzoneInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'categorized_dropzone'> & { question: CategorizedDropzoneQuestion }) {
  return (
    <BoxSort
      categories={question.categories}
      items={question.items}
      disabled={disabled}
      onAnswer={(data) => onAnswer(data)}
    />
  );
}
