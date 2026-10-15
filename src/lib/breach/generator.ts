import { indexOfSequence } from './engine';
import { pickOne, randInt, shuffle, type Rng } from './random';
import type { Code, DaemonDef, Pos, Puzzle } from './types';

export interface DaemonTemplate {
  id: string;
  name: string;
  description: string;
  length: number;
}

export interface GenerateOptions {
  size: number;
  bufferSize: number;
  timeLimit: number;
  daemons: DaemonTemplate[];
  /** Codes used to fill the matrix and the sequences; defaults to the regular 5 of the 6. */
  codes?: readonly Code[];
}

export interface GeneratedPuzzle {
  puzzle: Puzzle;
  /** A pick order that uploads every daemon. */
  solution: Pos[];
}

/** Regular codes: like the game, 5 of the 6 hex codes. */
const MATRIX_CODES: readonly Code[] = ['1C', '55', '7A', 'BD', 'E9'];
/** Probability that a daemon's sequence starts with the tail of the previous one. */
const OVERLAP_CHANCE = 0.5;
const MAX_ATTEMPTS = 500;

/**
 * Builds a puzzle that is solvable by construction: daemon sequences are chained
 * into one code string, a valid path through the matrix is drawn, and the string
 * is written along that path before the remaining cells are filled at random.
 */
export function generatePuzzle(options: GenerateOptions, rng: Rng): GeneratedPuzzle {
  const { size, bufferSize, timeLimit, codes = MATRIX_CODES } = options;
  if (size < 2) throw new Error('Matrix size must be at least 2');

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const chained = chainDaemons(options, rng);
    if (!chained) continue;
    const path = randomPath(size, chained.codes.length, rng);
    if (!path) continue;

    const matrix: Code[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => pickOne(rng, codes)),
    );
    path.forEach(({ row, col }, i) => (matrix[row][col] = chained.codes[i]));

    return { puzzle: { matrix, bufferSize, timeLimit, daemons: chained.daemons }, solution: path };
  }
  throw new Error('Could not generate a puzzle with these options');
}

/** Daemon sequences chained into one code string (sometimes overlapping), or null if they do not fit. */
function chainDaemons(
  { daemons, bufferSize, codes = MATRIX_CODES }: GenerateOptions,
  rng: Rng,
): { codes: Code[]; daemons: DaemonDef[] } | null {
  const sequences = new Map<string, Code[]>();
  const chain: Code[] = [];

  for (const template of shuffle(rng, daemons)) {
    const maxOverlap = Math.min(template.length - 1, chain.length);
    const overlap = maxOverlap > 0 && rng() < OVERLAP_CHANCE ? randInt(rng, 1, maxOverlap) : 0;
    const sequence = chain.slice(chain.length - overlap);
    while (sequence.length < template.length) sequence.push(pickOne(rng, codes));
    chain.push(...sequence.slice(overlap));
    sequences.set(template.id, sequence);
  }
  if (chain.length > bufferSize) return null;

  const all = [...sequences.values()];
  const distinct = all.every((a, i) => all.every((b, j) => i === j || indexOfSequence(b, a) === -1));
  if (!distinct) return null;

  // Spare buffer slots become leading filler, so the solution does not always start the chain.
  const padding = randInt(rng, 0, bufferSize - chain.length);
  const filler = Array.from({ length: padding }, () => pickOne(rng, codes));

  return {
    codes: [...filler, ...chain],
    daemons: daemons.map(({ id, name, description }) => ({
      id,
      name,
      description,
      sequence: sequences.get(id)!,
    })),
  };
}

/** Random valid pick order: starts on row 0, then alternates column / row, never reusing a cell. */
export function randomPath(size: number, length: number, rng: Rng): Pos[] | null {
  const path: Pos[] = [];
  const used = new Set<number>();

  const walk = (axis: 'row' | 'col', line: number): boolean => {
    if (path.length === length) return true;
    for (const i of shuffle(rng, [...Array(size).keys()])) {
      const pos = axis === 'row' ? { row: line, col: i } : { row: i, col: line };
      const key = pos.row * size + pos.col;
      if (used.has(key)) continue;
      used.add(key);
      path.push(pos);
      if (walk(axis === 'row' ? 'col' : 'row', axis === 'row' ? pos.col : pos.row)) return true;
      path.pop();
      used.delete(key);
    }
    return false;
  };

  return walk('row', 0) ? path : null;
}
