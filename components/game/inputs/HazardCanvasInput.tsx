// components/game/inputs/HazardCanvasInput.tsx
'use client';
import { useRef, useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { HazardCanvasQuestion } from '@/types/game';
import type { QuestionInputProps } from '../QuestionInputSwitch';
import { SubmitButton } from './shared';

export function HazardCanvasInput({
  question,
  disabled,
  onAnswer,
}: QuestionInputProps<'hazard_canvas'> & { question: HazardCanvasQuestion }) {
  const scenes = question.scenes;
  const isMultiScene = scenes && scenes.length > 0;

  const [sceneIndex, setSceneIndex] = useState(0);
  const [sceneTaps, setSceneTaps] = useState<Array<Array<{ x: number; y: number }>>>(
    isMultiScene ? scenes.map(() => []) : [[]]
  );
  const [submitted, setSubmitted] = useState<boolean[]>(
    isMultiScene ? scenes.map(() => false) : [false]
  );
  const imgRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const currentTaps = sceneTaps[sceneIndex] ?? [];
  const currentImage = isMultiScene ? scenes[sceneIndex].imageUrl : question.imageUrl;
  const currentLabel = isMultiScene ? scenes[sceneIndex].label : null;
  const totalScenes = isMultiScene ? scenes.length : 1;
  const allSubmitted = submitted.every(Boolean);

  function handleTap(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled || !imgRef.current || submitted[sceneIndex]) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSceneTaps(prev => prev.map((t, i) => i === sceneIndex ? [...t, { x, y }] : t));
  }

  function undoLast() {
    setSceneTaps(prev => prev.map((t, i) => i === sceneIndex ? t.slice(0, -1) : t));
  }

  function clearAll() {
    setSceneTaps(prev => prev.map((t, i) => i === sceneIndex ? [] : t));
  }

  function handleSceneSubmit() {
    const newSubmitted = submitted.map((s, i) => i === sceneIndex ? true : s);
    setSubmitted(newSubmitted);
    if (sceneIndex < totalScenes - 1) {
      setTimeout(() => setSceneIndex(sceneIndex + 1), 400);
    } else {
      if (isMultiScene) {
        onAnswer({ scenes: sceneTaps.map((taps, i) => ({ sceneIndex: i, taps })) });
      } else {
        onAnswer({ taps: sceneTaps[0] });
      }
    }
  }

  return (
    <div>
      {isMultiScene && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {scenes.map((s, i) => (
              <div key={i} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                i === sceneIndex ? 'bg-[#E4002B] text-white' :
                submitted[i] ? 'bg-green-100 text-green-700' :
                'bg-slate-100 text-slate-400'
              }`}>
                {submitted[i] ? '✓ ' : ''}{typeof s.label === 'object' ? s.label.en : s.label}
              </div>
            ))}
          </div>
          <span className="text-xs text-slate-400">{sceneIndex + 1} / {totalScenes}</span>
        </div>
      )}

      <div
        ref={imgRef}
        onClick={handleTap}
        className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${submitted[sceneIndex] ? 'cursor-default' : 'cursor-crosshair'}`}
        style={{ aspectRatio: '4 / 3' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentImage} alt="Spot the hazards" className="h-full w-full object-cover" draggable={false} />
        {submitted[sceneIndex] && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-900/30">
            <div className="rounded-xl bg-white px-5 py-3 text-center shadow-lg">
              <div className="text-2xl">✓</div>
              <div className="text-sm font-semibold text-green-700">{currentTaps.length} hazard{currentTaps.length !== 1 ? 's' : ''} marked</div>
              {sceneIndex < totalScenes - 1 && <div className="mt-1 text-xs text-slate-500">Loading next scene...</div>}
            </div>
          </div>
        )}
        {currentTaps.map((tap, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#E4002B] text-center text-[10px] font-bold leading-5 text-white shadow"
            style={{ left: `${tap.x}%`, top: `${tap.y}%`, width: 20, height: 20 }}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {!submitted[sceneIndex] && (
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={undoLast} disabled={currentTaps.length === 0 || disabled}
            className="text-xs font-medium text-slate-500 underline disabled:opacity-40">
            {t('input.undoLastTap')}
          </button>
          <button type="button" onClick={clearAll} disabled={currentTaps.length === 0 || disabled}
            className="text-xs font-medium text-slate-500 underline disabled:opacity-40">
            {t('input.clearAll')}
          </button>
        </div>
      )}

      {!allSubmitted && (
        <SubmitButton
          disabled={currentTaps.length === 0 || disabled || submitted[sceneIndex]}
          onClick={handleSceneSubmit}
          label={sceneIndex < totalScenes - 1 ? 'Submit & Next Scene' : 'Submit Final Scene'}
        />
      )}
    </div>
  );
}
