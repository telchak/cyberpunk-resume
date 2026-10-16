<script lang="ts">
  import { onDestroy } from 'svelte';
  import {
    abort,
    bufferOf,
    canPick,
    createBreach,
    daemonProgress,
    isOnActiveLine,
    isSuccess,
    pick,
    selectableCells,
    timeout,
  } from '../../lib/breach/engine';
  import { loadExtension, type BreachExtension, type DaemonTeaser } from '../../lib/breach/extension';
  import { generatePuzzle } from '../../lib/breach/generator';
  import { createRng, randomSeed } from '../../lib/breach/random';
  import type { BreachState, Code, DaemonDef, Pos } from '../../lib/breach/types';
  import { BREACH_OPTIONS, SECTIONS } from '../../lib/daemons';
  import { saveUnlocks } from '../../lib/unlocks';
  import CodeMatrix from './CodeMatrix.svelte';
  import DaemonPanel from './DaemonPanel.svelte';
  import EndPanel from './EndPanel.svelte';

  /** How long the matrix takes to switch to an extra stage; the clock is paused meanwhile. */
  const REROUTE_MS = 1600;

  const newBreach = (seed = randomSeed()) =>
    createBreach(generatePuzzle(BREACH_OPTIONS, createRng(seed)).puzzle);

  // `?seed=123` replays a specific puzzle.
  const params = new URLSearchParams(location.search);
  const urlSeed = params.get('seed');

  let breach = $state.raw(newBreach(urlSeed ? Number(urlSeed) >>> 0 : undefined));
  let cursor = $state<Pos | null>(null);
  let highlight = $state<Code | null>(null);
  let remaining = $state(breach.puzzle.timeLimit);
  /** Full length of the time bar: the starting time plus stage bonuses. */
  let budget = $state(breach.puzzle.timeLimit);
  let deadline = 0;
  let frame = 0;
  let clockRunning = false;

  // Extra stages from an optional extension, after a perfect run (see lib/breach/extension.ts).
  let extension: BreachExtension | null = null;
  let stage = 0;
  /** Daemons installed in earlier stages, still listed in the panel. */
  let cleared = $state.raw<DaemonDef[]>([]);
  let teasers = $state.raw<DaemonTeaser[]>([]);
  /** Set while switching stages: empty while deciding, then the stage's banner. */
  let banner = $state<string | null>(null);
  let finale = $state(false);

  const buffer = $derived(bufferOf(breach));
  const progress = $derived(daemonProgress(breach));
  const preview = $derived(
    cursor && canPick(breach, cursor) ? breach.puzzle.matrix[cursor.row][cursor.col] : null,
  );
  const ended = $derived(breach.phase === 'ended' && banner === null);

  function tick() {
    remaining = Math.max(0, (deadline - performance.now()) / 1000);
    if (remaining === 0) update(timeout(breach));
    else frame = requestAnimationFrame(tick);
  }

  function stopClock() {
    cancelAnimationFrame(frame);
    clockRunning = false;
  }

  function update(next: BreachState) {
    breach = next;
    if (!clockRunning && next.phase === 'running') {
      // Like the game, the clock only starts with the first pick.
      deadline = performance.now() + next.puzzle.timeLimit * 1000;
      clockRunning = true;
      frame = requestAnimationFrame(tick);
    }
    if (next.phase !== 'ended') return;

    cursor = null;
    highlight = null;
    const installed = next.puzzle.daemons.filter((_, i) => next.statuses[i] === 'installed');
    // A daemon's id is the dossier section it decrypts.
    saveUnlocks(installed.map((d) => d.id).filter((id) => SECTIONS.some((s) => s.id === id)));
    // A perfect run installs every daemon, even when the last one fills the buffer.
    if (installed.length === next.puzzle.daemons.length) advance(next);
    else stopClock();
  }

  /** After a perfect stage: continue with the extension's next stage, its finale, or the end screen. */
  async function advance(completed: BreachState) {
    banner = '';
    extension ??= await loadExtension();
    const nextStage = extension?.next(stage, completed) ?? null;
    if (!nextStage) {
      stopClock();
      banner = null;
      finale = stage > 0;
      return;
    }

    deadline += REROUTE_MS + nextStage.bonusSeconds * 1000;
    budget += nextStage.bonusSeconds;
    banner = nextStage.banner;
    await new Promise((resolve) => setTimeout(resolve, REROUTE_MS));
    // Switched together, so the completed daemons are never listed twice.
    cleared = [...cleared, ...completed.puzzle.daemons];
    stage += 1;
    teasers = nextStage.teasers ?? [];
    breach = createBreach(nextStage.puzzle);
    banner = null;
  }

  function restart() {
    stopClock();
    breach = newBreach();
    remaining = budget = breach.puzzle.timeLimit;
    cursor = null;
    stage = 0;
    cleared = [];
    teasers = [];
    finale = false;
  }

  /** Moves the keyboard cursor along the active line, wrapping around. */
  function move(dir: 1 | -1) {
    const cells = selectableCells(breach);
    if (cells.length === 0) return;
    const key = (p: Pos) => (breach.axis === 'row' ? p.col : p.row);
    const from = cursor && isOnActiveLine(breach, cursor) ? key(cursor) : dir > 0 ? -1 : Infinity;
    const ahead = dir > 0 ? cells.filter((c) => key(c) > from) : cells.filter((c) => key(c) < from).reverse();
    cursor = ahead[0] ?? (dir > 0 ? cells[0] : cells[cells.length - 1]);
  }

  function onkeydown(event: KeyboardEvent) {
    if (ended || banner !== null || event.metaKey || event.ctrlKey || event.altKey) return;
    // Keys typed into a text field (an overlay's input, for example) are not breach controls.
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        move(-1);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        move(1);
        break;
      case 'Enter':
      case 'f':
      case 'F':
        if (cursor) update(pick(breach, cursor));
        break;
      case 'Escape':
        update(abort(breach));
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /**
   * Development only, to playtest an extension: `?stage=1` opens its first extra stage directly, as
   * if the earlier ones were just cleared; `&time=20` sets the seconds on the clock (default 30).
   * A stage past the last one shows the finale. Stripped from production builds.
   */
  async function openStage(target: number, seconds: number) {
    extension = await loadExtension();
    if (!extension) return;
    let opened = null;
    for (let i = 0; i < target; i++) {
      const next = extension.next(i, breach);
      if (!next) {
        finale = true;
        return;
      }
      cleared = [...cleared, ...breach.puzzle.daemons];
      opened = next;
      breach = createBreach(next.puzzle);
    }
    if (!opened) return;
    stage = target;
    teasers = opened.teasers ?? [];
    breach = createBreach({ ...opened.puzzle, timeLimit: seconds });
    remaining = budget = seconds;
  }

  if (import.meta.env.DEV && params.has('stage')) {
    openStage(Number(params.get('stage')), Number(params.get('time') ?? BREACH_OPTIONS.timeLimit));
  }

  onDestroy(() => cancelAnimationFrame(frame));
</script>

<svelte:window {onkeydown} />

<div class="breach" class:ended>
  <div class="band" aria-hidden="true"></div>

  <div class="brand" aria-hidden="true">
    <span>SAMI</span><b></b><span>CHIBANI</span>
  </div>
  <svg class="globe" viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="21" />
    <ellipse cx="24" cy="24" rx="9" ry="21" />
    <path d="M3 24h42M7 13h34M7 35h34M24 3v42" />
  </svg>
  <div class="dots" aria-hidden="true"></div>
  <div class="topbar" aria-hidden="true">
    <span>ONLY CC3S CERTIFIED AND DHSF 5TH CLASS OPERATORS ARE ALLOWED TO MANIPULATE THIS DEVICE</span>
    <span>BREACH PROTOCOL INTERFACE</span>
    <span>SC-2077-PFL-0SYS-E327</span>
  </div>
  <div class="frame" aria-hidden="true"></div>

  <section class="timer" aria-label="Breach time remaining">
    <h2>BREACH TIME REMAINING</h2>
    <output class="clock" aria-live="off">{remaining.toFixed(2)}</output>
    <div class="track">
      <div class="bar" style:--t={remaining / budget}></div>
    </div>
  </section>

  <section class="buffer" aria-label="Buffer">
    <h2>BUFFER</h2>
    <ol class="slots" style:--n={breach.puzzle.bufferSize}>
      {#each { length: breach.puzzle.bufferSize } as _, i (i)}
        {@const code = buffer[i] ?? (i === buffer.length ? preview : null)}
        <li class:filled={i < buffer.length} class:preview={i === buffer.length && preview}>
          {code ?? ''}
        </li>
      {/each}
    </ol>
  </section>

  {#if banner}
    <div class="reroute" role="status">
      <p>{banner}</p>
    </div>
  {:else if banner === ''}
    <!-- Deciding whether an extra stage follows: show nothing, so regular runs give no hint. -->
  {:else if ended}
    <EndPanel
      success={cleared.length > 0 || isSuccess(breach)}
      complete={breach.statuses.every((s) => s === 'installed')}
      onretry={restart}
    />
  {:else}
    <CodeMatrix
      {breach}
      {cursor}
      {highlight}
      onhover={(pos) => (cursor = pos)}
      onpick={(pos) => update(pick(breach, pos))}
    />
  {/if}

  <div class="side">
    <DaemonPanel
      {breach}
      {progress}
      {preview}
      {cleared}
      {teasers}
      onhighlight={(code) => (highlight = code)}
    />

    <p class="glitch-note" aria-hidden="true">
      CUSTOM GLITCHES ON UI MAY APPEAR, BASED ON THIS ANALYSIS.<br />
      DOCUMENT/D/1IUJTZLABKETSJOHXCOQOTCIIHWMIZBZZ7VBTDES0900<br />
      TYPE: CYBERSPACE
    </p>
  </div>

  {#if finale && extension}
    {@const Finale = extension.finale}
    <Finale onclose={() => (finale = false)} />
  {/if}

  <a class="skip" href="/cv">&gt; SKIP_BREACH <span>// plain CV</span></a>

  <ul class="hints" aria-label="Controls">
    <li><kbd>←</kbd><kbd>→</kbd> NAVIGATION</li>
    <li><kbd>↵</kbd><kbd>F</kbd> SELECT CODE</li>
    <li><kbd>ESC</kbd> CLOSE</li>
  </ul>
</div>

<style>
  .breach {
    position: relative;
    width: 120rem;
    height: 67.5rem;
    user-select: none;
  }

  /* Translucent strip behind the timer row, running past the frame edges. */
  .band {
    position: absolute;
    left: -100vw;
    right: -100vw;
    top: 10.5rem;
    height: 5.25rem;
    background: rgb(208 237 87 / 0.05);
    pointer-events: none;
  }

  .brand {
    position: absolute;
    left: 2.4rem;
    top: 2.9rem;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1.45rem;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .brand b {
    width: 2.6rem;
    height: 0.6rem;
    background: repeating-linear-gradient(var(--yellow) 0 0.0625rem, transparent 0.0625rem 0.19rem);
  }

  .globe {
    position: absolute;
    left: 2.5rem;
    top: 6.1rem;
    width: 3rem;
    fill: none;
    stroke: var(--yellow);
    stroke-width: 1.2;
    opacity: 0.6;
  }

  .dots {
    position: absolute;
    left: 32rem;
    top: 2.2rem;
    width: 19rem;
    height: 3.6rem;
    background: radial-gradient(circle, var(--yellow-line) 0.08rem, transparent 0.1rem) 0 0 / 1.7rem 1.4rem;
  }

  .topbar {
    position: absolute;
    left: 51.9rem;
    top: 2.4rem;
    width: 50rem;
    height: 1.9rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.4rem;
    background: var(--yellow-bright);
    box-shadow: 0 0 1.2rem rgb(223 253 88 / 0.3);
    color: rgb(18 15 23 / 0.55);
    font-size: 0.32rem;
    font-weight: 600;
  }

  .frame {
    position: absolute;
    left: 7.8rem;
    top: 7.06rem;
    width: 104.4rem;
    height: 53.9rem;
    border: 0.0625rem solid var(--yellow-line);
    pointer-events: none;
  }

  .frame::before {
    content: '';
    position: absolute;
    inset: 0.6rem;
    border: 0.0625rem solid var(--yellow-faint);
  }

  h2 {
    margin: 0;
    font-weight: 500;
    letter-spacing: 0.03em;
  }

  .timer {
    position: absolute;
    left: 10.8rem;
    top: 11.75rem;
    width: 35.8rem;
    transition: opacity 300ms;
  }

  .timer h2 {
    position: absolute;
    top: 0.3rem;
    font-size: 1.75rem;
  }

  .clock {
    position: absolute;
    right: 0;
    top: 0;
    width: 6.75rem;
    height: 2.75rem;
    display: grid;
    place-items: center;
    border: 0.0625rem solid var(--yellow);
    font-size: 1.6rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .track {
    position: absolute;
    top: 3.25rem;
    width: 100%;
    height: 0.5rem;
  }

  .bar {
    width: calc(var(--t) * 100%);
    height: 100%;
    background: var(--yellow-bright);
    box-shadow: 0 0 0.6rem rgb(223 253 88 / 0.35);
  }

  .buffer {
    position: absolute;
    left: 53.25rem;
    top: 8.3rem;
    transition: opacity 300ms;
  }

  .buffer h2 {
    font-size: 1.75rem;
    margin-bottom: 0.45rem;
  }

  .slots {
    display: flex;
    gap: 0.5rem;
    margin: 0;
    padding: 1.05rem 1.1rem;
    border: 0.0625rem solid var(--yellow);
    list-style: none;
  }

  .slots li {
    width: 2.125rem;
    height: 2.125rem;
    display: grid;
    place-items: center;
    outline: 0.0625rem dashed var(--yellow-line);
    font-size: 1.4rem;
    font-weight: 500;
  }

  .slots li.filled {
    outline: 0.0625rem solid var(--yellow);
  }

  .slots li.preview {
    color: var(--cyan);
    outline: 0.125rem solid var(--cyan);
    box-shadow: 0 0 0.6rem var(--cyan-dim);
  }

  .ended .timer,
  .ended .buffer {
    opacity: 0.45;
  }

  /* Daemon panel and the note under it; the panel grows when an extension adds stages. */
  .side {
    position: absolute;
    left: 53.3rem;
    top: 18rem;
    width: 57.8rem;
  }

  .glitch-note {
    margin: 0.6rem 0 0;
    font-size: 0.32rem;
    font-weight: 600;
    line-height: 1.5;
    opacity: 0.7;
  }

  /* Shown in place of the matrix while it switches to an extra stage. */
  .reroute {
    position: absolute;
    left: 10.8rem;
    top: 18.25rem;
    width: 39.6rem;
    height: 28rem;
    display: grid;
    place-items: center;
    border: 0.0625rem solid var(--red);
    background: repeating-linear-gradient(transparent 0 0.2rem, rgb(254 86 79 / 0.08) 0.2rem 0.25rem);
    animation: reroute 1.6s steps(16) both;
  }

  .reroute p {
    margin: 0;
    color: var(--red);
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-align: center;
    text-shadow:
      0.12rem 0 rgb(94 246 255 / 0.7),
      -0.12rem 0 rgb(254 86 79 / 0.7);
    animation: jitter 0.2s steps(2) infinite;
  }

  @keyframes reroute {
    0%,
    20%,
    40% {
      opacity: 1;
    }
    10%,
    30% {
      opacity: 0.3;
    }
  }

  @keyframes jitter {
    50% {
      translate: 0.2rem 0;
    }
  }

  .skip {
    position: absolute;
    left: 7.8rem;
    top: 62.4rem;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-decoration: none;
    opacity: 0.75;
  }

  .skip span {
    opacity: 0.6;
    font-weight: 500;
  }

  .skip:hover,
  .skip:focus-visible {
    opacity: 1;
    color: var(--cyan);
  }

  .hints {
    position: absolute;
    right: 7.8rem;
    top: 62.4rem;
    display: flex;
    gap: 2.2rem;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--cyan);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .hints li {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  kbd {
    min-width: 1.6rem;
    height: 1.6rem;
    display: inline-grid;
    place-items: center;
    padding: 0 0.25rem;
    border: 0.0625rem solid var(--cyan);
    border-radius: 0.2rem;
    font: inherit;
    font-size: 0.8rem;
  }
</style>
