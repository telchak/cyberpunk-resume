import { describe, expect, it } from 'vitest';
import {
  abort,
  bufferOf,
  canPick,
  createBreach,
  daemonProgress,
  isSuccess,
  matchedPrefix,
  pick,
  selectableCells,
  timeout,
} from './engine';
import type { BreachState, Code, Pos, Puzzle } from './types';

// Matrix and daemons from the "Breaching Basics" reference video.
const MATRIX: Code[][] = [
  ['BD', 'BD', '1C', '55', 'E9', 'BD'],
  ['55', '55', '1C', '55', '1C', '1C'],
  ['7A', '7A', '7A', '1C', '1C', 'BD'],
  ['BD', '7A', '1C', '1C', '7A', 'E9'],
  ['7A', '55', '7A', '55', '1C', '1C'],
  ['E9', '1C', '1C', 'BD', '1C', '55'],
];

const PUZZLE: Puzzle = {
  matrix: MATRIX,
  bufferSize: 6,
  timeLimit: 30,
  daemons: [
    { id: 'basic', name: 'BASIC DATAMINE', description: '', sequence: ['7A', '1C'] },
    { id: 'advanced', name: 'ADVANCED DATAMINE', description: '', sequence: ['7A', 'BD'] },
    { id: 'expert', name: 'EXPERT DATAMINE', description: '', sequence: ['1C', '1C', '55'] },
  ],
};

const play = (state: BreachState, ...cells: [number, number][]) =>
  cells.reduce((s, [row, col]) => pick(s, { row, col }), state);

describe('selection rules', () => {
  it('starts on the top row', () => {
    const state = createBreach(PUZZLE);
    expect(state.phase).toBe('ready');
    expect(selectableCells(state)).toEqual(MATRIX[0].map((_, col) => ({ row: 0, col })));
    expect(canPick(state, { row: 1, col: 0 })).toBe(false);
  });

  it('alternates between the column and the row of the last pick', () => {
    let state = play(createBreach(PUZZLE), [0, 2]);
    expect(state.axis).toBe('col');
    expect(state.line).toBe(2);
    expect(canPick(state, { row: 3, col: 2 })).toBe(true);
    expect(canPick(state, { row: 0, col: 3 })).toBe(false);

    state = play(state, [1, 2]);
    expect(state.axis).toBe('row');
    expect(state.line).toBe(1);
  });

  it('never reuses a cell and ignores invalid picks', () => {
    const state = play(createBreach(PUZZLE), [0, 2]);
    expect(canPick(state, { row: 0, col: 2 })).toBe(false);
    expect(pick(state, { row: 0, col: 2 })).toBe(state);
    expect(pick(state, { row: 9, col: 2 })).toBe(state);
    expect(selectableCells(state)).toHaveLength(5);
  });

  it('starts running on the first pick', () => {
    expect(play(createBreach(PUZZLE), [0, 2]).phase).toBe('running');
  });
});

describe('daemons', () => {
  it('installs a daemon once its sequence appears contiguously', () => {
    // 1C (0,2) -> 1C (1,2) -> 55 (1,0)
    const state = play(createBreach(PUZZLE), [0, 2], [1, 2], [1, 0]);
    expect(bufferOf(state)).toEqual(['1C', '1C', '55']);
    expect(state.statuses).toEqual(['pending', 'pending', 'installed']);
  });

  it('replays the reference video: two installed, basic failed', () => {
    // 1C 1C 55 then 7A BD: (0,2) (1,2) (1,0) (2,0) (2,5)
    const state = play(createBreach(PUZZLE), [0, 2], [1, 2], [1, 0], [2, 0], [2, 5]);
    expect(bufferOf(state)).toEqual(['1C', '1C', '55', '7A', 'BD']);
    // One slot left cannot fit "7A 1C": the breach resolves like in the video.
    expect(state.statuses).toEqual(['failed', 'installed', 'installed']);
    expect(state.phase).toBe('ended');
    expect(state.endReason).toBe('resolved');
    expect(isSuccess(state)).toBe(true);
  });

  it('fails a daemon as soon as it cannot fit in the remaining slots', () => {
    const tight: Puzzle = { ...PUZZLE, bufferSize: 3 };
    // BD then 55: "1C 1C 55" now needs 3 slots with 1 left.
    const state = play(createBreach(tight), [0, 0], [1, 0]);
    expect(state.statuses[2]).toBe('failed');
  });

  it('slides pending sequences to line up with the next free slot', () => {
    const state = play(createBreach(PUZZLE), [0, 2], [1, 2]);
    const [basic, , expert] = daemonProgress(state);
    expect(basic).toEqual({ status: 'pending', matched: 0, offset: 2 });
    expect(expert).toEqual({ status: 'pending', matched: 2, offset: 0 });
  });

  it('computes the matched prefix from the end of the buffer', () => {
    expect(matchedPrefix(['7A', '1C', '1C'], ['1C', '1C', '55'])).toBe(2);
    expect(matchedPrefix(['1C', '1C', '7A'], ['1C', '1C', '55'])).toBe(0);
    expect(matchedPrefix([], ['1C'])).toBe(0);
  });
});

describe('ending', () => {
  it('ends when the buffer is full', () => {
    const tiny: Puzzle = { ...PUZZLE, bufferSize: 3 };
    const state = play(createBreach(tiny), [0, 2], [1, 2], [1, 0]);
    expect(state.phase).toBe('ended');
    expect(state.endReason).toBe('buffer-full');
    expect(state.statuses).toEqual(['failed', 'failed', 'installed']);
  });

  it('resolves early once every daemon is impossible', () => {
    const tiny: Puzzle = { ...PUZZLE, bufferSize: 2 };
    const state = play(createBreach(tiny), [0, 0]);
    expect(state.endReason).toBe('resolved');
    expect(isSuccess(state)).toBe(false);
  });

  it('ends on a dead end', () => {
    const small: Puzzle = {
      matrix: [
        ['1C', '55'],
        ['7A', 'BD'],
      ],
      bufferSize: 8,
      timeLimit: 30,
      daemons: [{ id: 'x', name: 'X', description: '', sequence: ['E9', 'E9', 'E9', 'E9'] }],
    };
    // (0,0) -> (1,0) -> (1,1) -> (0,1) uses the whole grid while the daemon could still fit.
    const state = play(createBreach(small), [0, 0], [1, 0], [1, 1], [0, 1]);
    expect(state.phase).toBe('ended');
    expect(state.endReason).toBe('dead-end');
    expect(state.statuses).toEqual(['failed']);
  });

  it('times out only while running', () => {
    const ready = createBreach(PUZZLE);
    expect(timeout(ready)).toBe(ready);
    const ended = timeout(play(ready, [0, 2]));
    expect(ended.endReason).toBe('timeout');
    expect(ended.statuses).toEqual(['failed', 'failed', 'failed']);
  });

  it('can be aborted at any time before the end', () => {
    expect(abort(createBreach(PUZZLE)).endReason).toBe('aborted');
  });

  it('rejects picks once ended', () => {
    const ended = abort(createBreach(PUZZLE));
    const pos: Pos = { row: 0, col: 0 };
    expect(canPick(ended, pos)).toBe(false);
    expect(selectableCells(ended)).toEqual([]);
  });
});
