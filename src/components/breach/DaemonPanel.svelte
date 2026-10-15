<script lang="ts">
  import type { DaemonTeaser } from '../../lib/breach/extension';
  import type { BreachState, Code, DaemonDef, DaemonProgress } from '../../lib/breach/types';
  import DaemonIcon from './DaemonIcon.svelte';

  interface Props {
    breach: BreachState;
    progress: DaemonProgress[];
    /** Code under the matrix cursor, previewed at the next free slot. */
    preview: Code | null;
    onhighlight: (code: Code | null) => void;
    /** Daemons installed in earlier stages of the session. */
    cleared: DaemonDef[];
    /** Daemons announced but not playable yet. */
    teasers: DaemonTeaser[];
  }

  let { breach, progress, preview, onhighlight, cleared, teasers }: Props = $props();

  /** Icon tier by row: one more circuit bar per row, up to three. */
  const tier = (row: number) => Math.min(row + 1, 3);

  const nextSlot = $derived(breach.picks.length);
</script>

<section class="panel" aria-label="Sequences required to upload daemons">
  <header>
    <span class="tag" aria-hidden="true"><b>A551</b><i></i><i></i></span>
    <h2>SEQUENCE REQUIRED TO UPLOAD DAEMON</h2>
    <p class="micro" aria-hidden="true">MODEL LINE&nbsp;&nbsp;&nbsp;12.12AA</p>
  </header>

  <ol class="body">
    {#if breach.phase !== 'ended'}
      <li class="stripe" style:--x={nextSlot} aria-hidden="true"></li>
    {/if}
    {#each cleared as daemon, i (daemon.id)}
      <li class="daemon installed">
        <div class="codes"><span class="status">INSTALLED</span></div>
        <span class="icon"><DaemonIcon tier={tier(i)} /></span>
        <div class="info">
          <h3>{daemon.name}</h3>
          <p>{daemon.description}</p>
        </div>
      </li>
    {/each}
    {#each breach.puzzle.daemons as daemon, i (daemon.id)}
      {@const p = progress[i]}
      <li class="daemon {p.status}">
        <div class="codes" aria-label="Sequence {daemon.sequence.join(' ')}">
          {#if p.status === 'pending'}
            {#each daemon.sequence as code, j (j)}
              <span
                class="code"
                class:matched={j < p.matched}
                class:next={j === p.matched && preview === code}
                style:--x={p.offset + j}
                role="presentation"
                onpointerenter={() => onhighlight(code)}
                onpointerleave={() => onhighlight(null)}
              >
                {code}
              </span>
            {/each}
          {:else}
            <span class="status">{p.status === 'installed' ? 'INSTALLED' : 'FAILED'}</span>
          {/if}
        </div>
        <span class="icon"><DaemonIcon tier={tier(cleared.length + i)} /></span>
        <div class="info">
          <h3>{daemon.name}</h3>
          <p>{daemon.description}</p>
        </div>
      </li>
    {/each}
    {#each teasers as teaser, i (i)}
      <li class="daemon teaser">
        <div class="codes"><span class="status">LOCKED</span></div>
        <span class="icon"><DaemonIcon tier={3} /></span>
        <div class="info">
          <h3>{teaser.name}</h3>
          <p>{teaser.description}</p>
        </div>
      </li>
    {/each}
  </ol>
</section>

<style>
  .panel {
    --slot: 2.625rem;
    min-height: 17.5rem;
    border: 0.0625rem solid var(--yellow-line);
  }

  header {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    height: 2.6rem;
    padding: 0 1.1rem;
    border-bottom: 0.0625rem solid var(--yellow-line);
  }

  .tag {
    display: grid;
    grid-template-columns: auto auto;
    gap: 0.1rem;
    font-size: 0.5rem;
    line-height: 1;
  }

  .tag b {
    grid-column: 1 / -1;
    font-weight: 500;
  }

  .tag i {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--yellow);
  }

  h2 {
    margin: 0;
    font-size: 1.45rem;
    font-weight: 500;
    letter-spacing: 0.03em;
  }

  .micro {
    margin: 0 0 0 auto;
    font-size: 0.4rem;
    opacity: 0.6;
  }

  .body {
    position: relative;
    margin: 0;
    padding: 0.7rem 1rem 1.2rem;
    list-style: none;
  }

  .stripe {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(1rem + var(--x) * var(--slot));
    width: var(--slot);
    background: rgb(94 80 140 / 0.12);
    transition: left 150ms ease-out;
  }

  .daemon {
    position: relative;
    display: grid;
    grid-template-columns: 26.6rem 3.2rem 1fr;
    align-items: center;
    height: 4.25rem;
    padding-left: 0;
    transition:
      background 200ms,
      color 200ms;
  }

  .codes {
    position: relative;
    height: 100%;
  }

  .code {
    position: absolute;
    top: 50%;
    left: calc(var(--x) * var(--slot));
    width: 2.3rem;
    height: 2.3rem;
    display: grid;
    place-items: center;
    translate: 0 -50%;
    font-size: 1.5rem;
    font-weight: 500;
    color: #e6efd0;
    transition: left 150ms ease-out;
  }

  .code.matched {
    color: var(--yellow);
    outline: 0.0625rem solid var(--yellow);
  }

  .code.next {
    color: var(--cyan);
    outline: 0.125rem solid var(--cyan);
    box-shadow: 0 0 0.7rem var(--cyan-dim);
  }

  .status {
    position: absolute;
    top: 50%;
    left: 1.6rem;
    translate: 0 -50%;
    font-size: 1.35rem;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .icon {
    display: grid;
    place-items: center;
  }

  .info {
    min-width: 0;
    padding: 0 1rem 0 0.6rem;
    overflow: hidden;
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .info p {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 500;
    color: #e6efd0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
  }

  .daemon.installed,
  .daemon.failed {
    margin-left: -0.25rem;
    margin-right: -0.25rem;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 0.6rem), calc(100% - 0.6rem) 100%, 0 100%);
  }

  .daemon.installed {
    background: var(--green);
    color: var(--green-dark);
  }

  .daemon.failed {
    background: var(--red);
    color: #3a0d0b;
  }

  .daemon.teaser {
    color: rgb(208 237 87 / 0.35);
  }

  .daemon.teaser .info p {
    color: inherit;
  }

  .daemon.installed .info p,
  .daemon.failed .info p {
    color: inherit;
    opacity: 0.75;
  }
</style>
