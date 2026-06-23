// lib/hooks/useGameTimer.ts
'use client';
import { useEffect, useRef, useState } from 'react';
interface UseGameTimerOptions {
  durationSeconds: number;
  onExpire?: () => void;
  autoStart?: boolean;
  paused?: boolean; // when true (e.g. event frozen), timer holds — no ticking, no expiry
}
export function useGameTimer({ durationSeconds, onExpire, autoStart = true, paused = false }: UseGameTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [running, setRunning] = useState(autoStart);
  const expiredRef = useRef(false);
  useEffect(() => {
    if (!running || paused) return; // frozen → do nothing, secondsLeft stays put
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running, paused, secondsLeft, onExpire]);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const isLow = secondsLeft <= 60 && secondsLeft > 0;
  return {
    secondsLeft,
    display,
    isLow,
    isExpired: secondsLeft <= 0,
    pause: () => setRunning(false),
    resume: () => setRunning(true),
    reset: (newDuration?: number) => {
      expiredRef.current = false;
      setSecondsLeft(newDuration ?? durationSeconds);
    },
  };
}