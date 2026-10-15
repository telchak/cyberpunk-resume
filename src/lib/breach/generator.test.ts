import { describe, expect, it } from 'vitest';
import { createBreach, indexOfSequence, pick } from './engine';
import { generatePuzzle, randomPath, type GenerateOptions } from './generator';
import { createRng } from './random';

const OPTIONS: GenerateOptions = {
  size: 6,
  bufferSize: 7,
  timeLimit: 30,
  daemons: [
    { id: 'v1', name: 'DATAMINE_V1', description: '', length: 2 },
    { id: 'v2', name: 'DATAMINE_V2', description: '', length: 3 },
    { id: 'v3', name: 'DATAMINE_V3', description: '', length: 4 },
  ],
};

describe('randomPath', () => {
  it('follows the selection rules', () => {
    const rng = createRng(1);
    for (let n = 0; n < 50; n++) {
      const path = randomPath(5, 8, rng)!;
      expect(path).toHaveLength(8);
      expect(path[0].row).toBe(0);
      const keys = new Set(path.map((p) => `${p.row},${p.col}`));
      expect(keys.size).toBe(8);
      for (let i = 1; i < path.length; i++) {
        const sameLine = i % 2 === 1 ? path[i].col === path[i - 1].col : path[i].row === path[i - 1].row;
        expect(sameLine).toBe(true);
      }
    }
  });
});

describe('generatePuzzle', () => {
  it('is deterministic for a given seed', () => {
    expect(generatePuzzle(OPTIONS, createRng(42))).toEqual(generatePuzzle(OPTIONS, createRng(42)));
  });

  it('always produces a puzzle whose stored solution uploads every daemon', () => {
    for (let seed = 0; seed < 300; seed++) {
      const { puzzle, solution } = generatePuzzle(OPTIONS, createRng(seed));
      expect(puzzle.matrix).toHaveLength(6);
      expect(solution.length).toBeLessThanOrEqual(OPTIONS.bufferSize);
      expect(puzzle.daemons.map((d) => d.sequence.length)).toEqual([2, 3, 4]);

      const end = solution.reduce(pick, createBreach(puzzle));
      expect(end.statuses, `seed ${seed}`).toEqual(['installed', 'installed', 'installed']);
    }
  });

  it('never nests one daemon sequence inside another', () => {
    for (let seed = 0; seed < 300; seed++) {
      const { daemons } = generatePuzzle(OPTIONS, createRng(seed)).puzzle;
      for (const a of daemons) {
        for (const b of daemons) {
          if (a !== b) expect(indexOfSequence(b.sequence, a.sequence)).toBe(-1);
        }
      }
    }
  });

  it('only uses the codes it is given', () => {
    const codes = ['FF', '1C'] as const;
    const { puzzle } = generatePuzzle({ ...OPTIONS, codes }, createRng(3));
    const used = new Set([...puzzle.matrix.flat(), ...puzzle.daemons.flatMap((d) => d.sequence)]);
    expect([...used].sort()).toEqual(['1C', 'FF']);
  });

  it('throws when the daemons cannot fit the buffer', () => {
    expect(() => generatePuzzle({ ...OPTIONS, bufferSize: 3 }, createRng(1))).toThrow();
  });
});
