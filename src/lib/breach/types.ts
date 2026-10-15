export const CODES = ['1C', '55', '7A', 'BD', 'E9', 'FF'] as const;
export type Code = (typeof CODES)[number];

export interface Pos {
  row: number;
  col: number;
}

export interface DaemonDef {
  id: string;
  name: string;
  description: string;
  sequence: Code[];
}

export interface Puzzle {
  /** Square grid, indexed [row][col]. */
  matrix: Code[][];
  bufferSize: number;
  daemons: DaemonDef[];
  /** Seconds available once the first code is picked. */
  timeLimit: number;
}

export type Axis = 'row' | 'col';
export type DaemonStatus = 'pending' | 'installed' | 'failed';
export type Phase = 'ready' | 'running' | 'ended';
export type EndReason = 'resolved' | 'buffer-full' | 'dead-end' | 'timeout' | 'aborted';

export interface BreachState {
  puzzle: Puzzle;
  /** Cells picked so far, in order. Their codes form the buffer. */
  picks: Pos[];
  /** Axis along which the next code must be picked. */
  axis: Axis;
  /** Index of the active row (axis 'row') or column (axis 'col'). */
  line: number;
  statuses: DaemonStatus[];
  phase: Phase;
  endReason?: EndReason;
}

export interface DaemonProgress {
  status: DaemonStatus;
  /** Number of leading sequence codes already matched by the end of the buffer. */
  matched: number;
  /**
   * Buffer slot under which the sequence's first code is drawn. The game slides
   * each pending sequence so its next needed code lines up with the next free slot.
   */
  offset: number;
}
