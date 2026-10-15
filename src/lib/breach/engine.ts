import type { BreachState, Code, DaemonProgress, DaemonStatus, EndReason, Pos, Puzzle } from './types';

export function createBreach(puzzle: Puzzle): BreachState {
  return {
    puzzle,
    picks: [],
    axis: 'row',
    line: 0,
    statuses: puzzle.daemons.map(() => 'pending'),
    phase: 'ready',
  };
}

export function bufferOf(state: BreachState): Code[] {
  return state.picks.map(({ row, col }) => state.puzzle.matrix[row][col]);
}

export function isUsed(state: BreachState, pos: Pos): boolean {
  return state.picks.some((p) => p.row === pos.row && p.col === pos.col);
}

export function isOnActiveLine(state: BreachState, pos: Pos): boolean {
  return state.axis === 'row' ? pos.row === state.line : pos.col === state.line;
}

export function canPick(state: BreachState, pos: Pos): boolean {
  if (state.phase === 'ended') return false;
  const size = state.puzzle.matrix.length;
  if (pos.row < 0 || pos.col < 0 || pos.row >= size || pos.col >= size) return false;
  return isOnActiveLine(state, pos) && !isUsed(state, pos);
}

/** Cells that can be picked next, in reading order. */
export function selectableCells(state: BreachState): Pos[] {
  if (state.phase === 'ended') return [];
  const size = state.puzzle.matrix.length;
  const cells: Pos[] = [];
  for (let i = 0; i < size; i++) {
    const pos = state.axis === 'row' ? { row: state.line, col: i } : { row: i, col: state.line };
    if (!isUsed(state, pos)) cells.push(pos);
  }
  return cells;
}

/** Index where `seq` first appears contiguously in `buffer`, or -1. */
export function indexOfSequence(buffer: readonly Code[], seq: readonly Code[]): number {
  outer: for (let start = 0; start + seq.length <= buffer.length; start++) {
    for (let i = 0; i < seq.length; i++) {
      if (buffer[start + i] !== seq[i]) continue outer;
    }
    return start;
  }
  return -1;
}

/** Longest k < seq.length such that the buffer ends with the first k codes of `seq`. */
export function matchedPrefix(buffer: readonly Code[], seq: readonly Code[]): number {
  for (let k = Math.min(seq.length - 1, buffer.length); k > 0; k--) {
    let ok = true;
    for (let i = 0; i < k; i++) {
      if (buffer[buffer.length - k + i] !== seq[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return k;
  }
  return 0;
}

function evaluate(
  buffer: readonly Code[],
  puzzle: Puzzle,
  previous: readonly DaemonStatus[],
): DaemonStatus[] {
  const remaining = puzzle.bufferSize - buffer.length;
  return puzzle.daemons.map(({ sequence }, i) => {
    if (previous[i] !== 'pending') return previous[i];
    if (indexOfSequence(buffer, sequence) !== -1) return 'installed';
    if (sequence.length - matchedPrefix(buffer, sequence) > remaining) return 'failed';
    return 'pending';
  });
}

function end(state: BreachState, reason: EndReason): BreachState {
  return {
    ...state,
    phase: 'ended',
    endReason: reason,
    statuses: state.statuses.map((s) => (s === 'pending' ? 'failed' : s)),
  };
}

/** Returns the next state, or the same state if the pick is not allowed. */
export function pick(state: BreachState, pos: Pos): BreachState {
  if (!canPick(state, pos)) return state;

  const picks = [...state.picks, { row: pos.row, col: pos.col }];
  const buffer = picks.map(({ row, col }) => state.puzzle.matrix[row][col]);
  const next: BreachState = {
    ...state,
    picks,
    axis: state.axis === 'row' ? 'col' : 'row',
    line: state.axis === 'row' ? pos.col : pos.row,
    statuses: evaluate(buffer, state.puzzle, state.statuses),
    phase: 'running',
  };

  if (picks.length >= state.puzzle.bufferSize) return end(next, 'buffer-full');
  if (next.statuses.every((s) => s !== 'pending')) return end(next, 'resolved');
  if (selectableCells(next).length === 0) return end(next, 'dead-end');
  return next;
}

export function timeout(state: BreachState): BreachState {
  return state.phase === 'running' ? end(state, 'timeout') : state;
}

export function abort(state: BreachState): BreachState {
  return state.phase === 'ended' ? state : end(state, 'aborted');
}

export function daemonProgress(state: BreachState): DaemonProgress[] {
  const buffer = bufferOf(state);
  return state.puzzle.daemons.map(({ sequence }, i) => {
    const status = state.statuses[i];
    if (status === 'installed') {
      return { status, matched: sequence.length, offset: indexOfSequence(buffer, sequence) };
    }
    const matched = status === 'pending' ? matchedPrefix(buffer, sequence) : 0;
    return { status, matched, offset: buffer.length - matched };
  });
}

/** True when at least one daemon was uploaded. */
export function isSuccess(state: BreachState): boolean {
  return state.statuses.includes('installed');
}
