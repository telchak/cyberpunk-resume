<script lang="ts">
  import { canPick, isUsed } from '../../lib/breach/engine';
  import type { BreachState, Code, Pos } from '../../lib/breach/types';

  interface Props {
    breach: BreachState;
    cursor: Pos | null;
    /** Code hovered in the daemon list: matching cells get outlined. */
    highlight: Code | null;
    onhover: (pos: Pos | null) => void;
    onpick: (pos: Pos) => void;
  }

  let { breach, cursor, highlight, onhover, onpick }: Props = $props();

  const matrix = $derived(breach.puzzle.matrix);
  const ended = $derived(breach.phase === 'ended');
</script>

<section class="panel" aria-label="Code matrix">
  <header>
    <svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2 2h4l6 8V2h2v12h-3L4 6v8H2zM14 22h-4l-6-8v8H2V10h3l7 8v-8h2zM16 2h6v2h-6zM16 6h6v2h-6zM16 16h6v2h-6zM16 20h6v2h-6z"
      />
    </svg>
    <h2>CODE MATRIX</h2>
    <p class="micro" aria-hidden="true">MODEL LINE 12.12AA<br />SYS: BREACH//PROTOCOL<br />DAEMON.UPLOAD</p>
  </header>

  <div class="body" style:--size={matrix.length}>
    {#if !ended}
      {#if breach.axis === 'row'}
        <div class="band row" style:--i={breach.line}></div>
      {:else}
        <div class="band col" style:--i={breach.line}></div>
      {/if}
    {/if}

    <div class="grid" role="grid" aria-label="Pick codes along the highlighted line">
      {#each matrix as cells, row (row)}
        <div class="line" role="row">
          {#each cells as code, col (col)}
            {@const pos = { row, col }}
            {@const used = isUsed(breach, pos)}
            {@const selectable = canPick(breach, pos)}
            <button
              type="button"
              role="gridcell"
              class="cell"
              class:used
              class:selectable
              class:cursor={selectable && cursor?.row === row && cursor?.col === col}
              class:highlight={!used && !ended && highlight === code}
              aria-disabled={!selectable}
              aria-label={used
                ? `Used cell, row ${row + 1} column ${col + 1}`
                : `${code}, row ${row + 1} column ${col + 1}`}
              tabindex="-1"
              onpointerenter={() => onhover(pos)}
              onpointerleave={() => onhover(null)}
              onclick={() => selectable && onpick(pos)}
            >
              {used ? '[ ]' : code}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .panel {
    --cell: 4rem;
    position: absolute;
    left: 10.8rem;
    top: 18.25rem;
    width: 39.6rem;
    height: 28rem;
    display: flex;
    flex-direction: column;
    border: 0.0625rem solid var(--yellow);
    background: rgb(18 15 25 / 0.92);
  }

  header {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    height: 2.75rem;
    padding: 0 1rem;
    background: var(--yellow);
    color: var(--bg);
    clip-path: polygon(0.75rem 0, 100% 0, 100% 100%, 0 100%, 0 0.75rem);
  }

  .glyph {
    width: 1.6rem;
    height: 1.6rem;
    fill: currentColor;
  }

  h2 {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    opacity: 0.8;
  }

  .micro {
    margin: 0 0 0 auto;
    font-size: 0.35rem;
    line-height: 1.3;
    opacity: 0.5;
  }

  .body {
    position: relative;
    flex: 1;
    padding-top: 0.6rem;
  }

  .band {
    position: absolute;
    pointer-events: none;
    transition:
      top 120ms ease-out,
      left 120ms ease-out;
  }

  .band.row {
    left: 0;
    right: 0;
    top: calc(0.6rem + var(--i) * var(--cell));
    height: var(--cell);
    background: var(--row-active);
  }

  .band.col {
    top: 0;
    bottom: 0;
    left: calc(50% - var(--size) * var(--cell) / 2 + var(--i) * var(--cell));
    width: var(--cell);
    background: var(--col-active);
  }

  .grid {
    position: relative;
    width: calc(var(--size) * var(--cell));
    margin: 0 auto;
  }

  .line {
    display: flex;
  }

  .cell {
    position: relative;
    width: var(--cell);
    height: var(--cell);
    padding: 0;
    border: 0;
    background: none;
    color: var(--yellow);
    font: 500 1.9rem var(--font);
    cursor: default;
  }

  .cell.selectable {
    cursor: pointer;
  }

  .cell.used {
    color: var(--used);
    font-weight: 400;
  }

  .cell::after {
    content: '';
    position: absolute;
    inset: 0.55rem;
    pointer-events: none;
  }

  .cell.highlight::after {
    border: 0.125rem solid var(--yellow);
  }

  .cell.cursor {
    color: var(--cyan);
    text-shadow: 0 0 0.6rem var(--cyan-dim);
  }

  .cell.cursor::after {
    inset: 0.15rem;
    border: 0.125rem solid var(--cyan);
    outline: 0.0625rem solid var(--cyan);
    outline-offset: -0.4rem;
    box-shadow:
      0 0 0.8rem var(--cyan-dim),
      inset 0 0 0.8rem var(--cyan-dim);
  }
</style>
