// Optional private add-on to the breach: it can continue a perfect run with extra stages, then take
// over the screen with its own finale. Extensions live in src/extensions/<name>/breach.ts, which is
// git-ignored, and are only downloaded when a run ends with every daemon installed.
import type { Component } from 'svelte';
import type { BreachState, Puzzle } from './types';

/** A daemon row shown but not playable yet. */
export interface DaemonTeaser {
  name: string;
  description: string;
}

export interface BreachStage {
  /** The stage's matrix, buffer and daemons. Its timeLimit is ignored: the session clock keeps running. */
  puzzle: Puzzle;
  /** Seconds added to the running clock when the stage opens. */
  bonusSeconds: number;
  /** Message flashed while the matrix switches to this stage. */
  banner: string;
  teasers?: DaemonTeaser[];
}

export interface BreachExtension {
  /** The stage after `stage` (0 is the regular breach) ended with every daemon installed, or null. */
  next(stage: number, completed: BreachState): BreachStage | null;
  /** Shown full screen once the last extra stage is cleared. */
  finale: Component<{ onclose: () => void }>;
}

const modules = import.meta.glob<{ default: BreachExtension }>('/src/extensions/*/breach.ts');

// Extensions may also add seconds to every breach's clock, from src/extensions/<name>/bonus.ts
// (its default export gives the seconds). Loaded with the page, unlike the rest: keep it tiny.
const bonuses = import.meta.glob<{ default: () => number }>('/src/extensions/*/bonus.ts', { eager: true });

/** Seconds the installed extensions add to a breach's clock. */
export function bonusSeconds(): number {
  return Object.values(bonuses).reduce((sum, bonus) => sum + bonus.default(), 0);
}

/** The first installed extension, or null when there is none. */
export async function loadExtension(): Promise<BreachExtension | null> {
  const [load] = Object.values(modules);
  return load ? (await load()).default : null;
}
