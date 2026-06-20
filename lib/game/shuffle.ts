// lib/game/shuffle.ts
//
// The wireframe annotated Q3 "JUMBLE UP" — the intent is that two teams
// sitting next to each other shouldn't see options in the same order (makes
// shoulder-surfing useless). But the SAME team reloading the page mid-answer
// shouldn't see the options jump around, or they'd lose their place. So this
// is a deterministic shuffle seeded from teamId+questionId, not Math.random().

function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Returns a shuffled copy of `items`, stable for a given (teamId, questionId). */
export function stableShuffle<T>(items: T[], teamId: string, questionId: string): T[] {
  const rand = seededRandom(`${teamId}:${questionId}`);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffle with an index map, so you can shuffle options but still know which
 * shuffled index corresponds to which original index (needed to grade MCQs). */
export function stableShuffleWithIndex<T>(
  items: T[],
  teamId: string,
  questionId: string
): Array<{ item: T; originalIndex: number }> {
  const withIndex = items.map((item, originalIndex) => ({ item, originalIndex }));
  return stableShuffle(withIndex, teamId, questionId);
}
