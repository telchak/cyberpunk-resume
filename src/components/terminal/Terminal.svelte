<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { SECTIONS } from '../../lib/daemons';
  import type { View } from '../../lib/terminal/fs';
  import { buildDossier } from '../../lib/terminal/dossier';
  import { formatPath } from '../../lib/terminal/fs';
  import { complete, run, type Block, type Entry, type Shell } from '../../lib/terminal/shell';
  import { loadUnlocks } from '../../lib/unlocks';
  import SkillTree from '../skilltree/SkillTree.svelte';
  import CardView from './CardView.svelte';
  import Lines from './Lines.svelte';
  import SamuraiArt from './SamuraiArt.svelte';

  const unlocked = loadUnlocks();
  const root = buildDossier(unlocked);
  const level = SECTIONS.filter((s) => unlocked.has(s.id)).length;

  let cwd = $state<string[]>([]);
  let blocks = $state<Block[]>([]);
  let input = $state('');
  let booting = $state(true);
  let view = $state.raw<View | null>(null);
  let skillTree = $state(false);
  let history: string[] = [];
  let cursor = 0;
  let field: HTMLInputElement;
  let screen: HTMLElement;

  const shell = (): Shell => ({ root, cwd, unlocked });

  function exec(command: string) {
    const result = run(command, shell());
    if (result.effect?.t === 'clear') blocks = [];
    else blocks.push(...result.blocks);
    cwd = result.cwd;
    if (result.view) view = result.view;
    if (result.effect?.t === 'skilltree') skillTree = true;
    if (command.trim()) history = [...history.filter((h) => h !== command), command];
    cursor = history.length;
    if (result.effect?.t === 'navigate') {
      const { href } = result.effect;
      setTimeout(() => (location.href = href), 350);
    }
    scrollDown();
  }

  async function scrollDown() {
    await tick();
    screen?.scrollTo({ top: screen.scrollHeight });
  }

  /** Path to type for an entry: bare name when it sits in the current directory. */
  function target(entry: Entry): string {
    const parent = entry.path.split('/').slice(0, -1).join('/');
    return parent === cwd.join('/') ? entry.name : `~/${entry.path}`;
  }

  function openEntry(entry: Entry) {
    if (entry.kind === 'dir') {
      exec(`cd ${target(entry)}`);
      exec('ls');
    } else {
      exec(`cat ${target(entry)}`);
    }
    field?.focus({ preventScroll: true });
  }

  function onkeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
        exec(input);
        input = '';
        break;
      case 'Tab':
        input = complete(input, shell()) ?? input;
        break;
      case 'ArrowUp':
        cursor = Math.max(0, cursor - 1);
        input = history[cursor] ?? input;
        break;
      case 'ArrowDown':
        cursor = Math.min(history.length, cursor + 1);
        input = history[cursor] ?? '';
        break;
      case 'l':
        if (!event.ctrlKey) return;
        blocks = [];
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function focusInput() {
    if (window.getSelection()?.toString()) return;
    field?.focus({ preventScroll: true });
  }

  /** Box-drawing prefixes for `tree` rows, from each row's depth and "last child" flag. */
  function treePrefixes(rows: Extract<Block, { t: 'tree' }>['rows']): string[] {
    const lastAt: boolean[] = [];
    return rows.map(({ depth, last }) => {
      lastAt[depth] = last;
      const indent = lastAt
        .slice(0, depth)
        .map((l) => (l ? '    ' : '│   '))
        .join('');
      return indent + (last ? '└── ' : '├── ');
    });
  }

  const BOOT = [
    '//CONNECTING TO SC-DOSSIER ...',
    '//HANDSHAKE ............................ OK',
    `//DECRYPTING SHARDS: ${SECTIONS.map((s) => `${s.id} [${unlocked.has(s.id) ? 'OK' : 'ICE'}]`).join('  ')}`,
    `//ACCESS LEVEL ${level}/${SECTIONS.length}`,
  ];

  onMount(() => {
    const instant = matchMedia('(prefers-reduced-motion: reduce)').matches;
    blocks.push({ t: 'lines', lines: [] });
    const boot = blocks[0] as Extract<Block, { t: 'lines' }>;
    let i = 0;
    const next = () => {
      if (i < BOOT.length) {
        boot.lines.push({ t: 'text', text: BOOT[i++] });
        setTimeout(next, instant ? 0 : 180);
        return;
      }
      boot.lines.push({ t: 'blank' });
      exec('cat README.txt');
      exec('ls');
      history = [];
      cursor = 0;
      booting = false;
      field?.focus({ preventScroll: true });
    };
    next();
  });

  const QUICK = [
    'help',
    'ls',
    'cd ..',
    'tree',
    ...(unlocked.has('career') ? ['skills'] : []),
    'whoami',
    'breach',
    'cv',
  ];

  function closeSkillTree() {
    skillTree = false;
    field?.focus({ preventScroll: true });
  }
</script>

<div class="dossier">
  <header class="top">
    <a class="brand" href="/" aria-label="Back to the breach terminal">
      <span>SAMI</span><b aria-hidden="true"></b><span>CHIBANI</span>
    </a>
    <div class="topbar" aria-hidden="true">
      <span>CLEARANCE: PUBLIC // DECRYPTION BY BREACH ONLY</span>
      <span>SUBJECT DOSSIER</span>
    </div>
    <ul class="daemons" aria-label="Uploaded daemons">
      {#each SECTIONS as s (s.id)}
        <li class:on={unlocked.has(s.id)} title={`${s.daemon} → ~/${s.id}`}>
          {s.daemon.replace('DATAMINE_', '')}
          <span class="sr-only">{unlocked.has(s.id) ? 'uploaded' : 'missing'}</span>
        </li>
      {/each}
    </ul>
  </header>

  <div class="workspace">
    <section class="window" aria-label="Dossier terminal">
      <header class="bar">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5l7 7-7 7M12 19h9" /></svg>
        <h1>TERMINAL // SC-DOSSIER</h1>
        <span class="level">ACCESS {level}/{SECTIONS.length}</span>
      </header>

      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="screen" bind:this={screen} onclick={focusInput} aria-live="polite">
        {#each blocks as block, b (b)}
          {#if block.t === 'command'}
            <p class="cmd"><span class="prompt">visitor@sc-dossier:{block.cwd}$</span> {block.input}</p>
          {:else if block.t === 'lines'}
            <Lines lines={block.lines} />
          {:else if block.t === 'samurai'}
            <SamuraiArt onupdate={scrollDown} />
          {:else if block.t === 'error'}
            <p class="error">{block.text}</p>
          {:else if block.t === 'listing'}
            <ul class="listing">
              {#each block.entries as entry (entry.path)}
                <li>
                  <button type="button" class={entry.kind} onclick={() => openEntry(entry)}>
                    {entry.name}{entry.kind === 'dir' ? '/' : ''}
                  </button>
                </li>
              {/each}
            </ul>
            {#if block.hidden}
              <p class="hidden-note">
                [{block.hidden} encrypted {block.hidden > 1 ? 'entries' : 'entry'} hidden —
                <button type="button" onclick={() => exec('breach')}>breach</button> to decrypt]
              </p>
            {/if}
          {:else if block.t === 'tree'}
            {@const prefixes = treePrefixes(block.rows)}
            <ul class="tree">
              <li>.</li>
              {#each block.rows as row, r (row.entry.path)}
                <li>
                  <span class="branch">{prefixes[r]}</span><button
                    type="button"
                    class={row.entry.kind}
                    onclick={() => openEntry(row.entry)}
                    >{row.entry.name}{row.entry.kind === 'dir' ? '/' : ''}</button
                  >
                </li>
              {/each}
            </ul>
            {#if block.hidden}
              <p class="hidden-note">
                [{block.hidden} encrypted {block.hidden > 1 ? 'entries' : 'entry'} hidden]
              </p>
            {/if}
          {/if}
        {/each}

        <label class="input" class:booting>
          <span class="prompt">visitor@sc-dossier:{formatPath(cwd)}$</span>
          <input
            bind:this={field}
            bind:value={input}
            {onkeydown}
            disabled={booting}
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            enterkeyhint="go"
            aria-label="Command"
          />
        </label>
      </div>

      <nav class="quick" aria-label="Quick commands">
        {#each QUICK as command (command)}
          <button type="button" disabled={booting} onclick={() => exec(command)}>{command}</button>
        {/each}
      </nav>
    </section>

    <CardView {view} {unlocked} onskills={() => exec('skills')} />
  </div>
</div>

{#if skillTree}
  <SkillTree onclose={closeSkillTree} />
{/if}

<style>
  .dossier {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100dvh;
    max-width: 100rem;
    margin: 0 auto;
    padding: 1.6rem 2rem 2rem;
  }

  .top {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1.4rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-decoration: none;
    white-space: nowrap;
  }

  .brand b {
    width: 2.4rem;
    height: 0.6rem;
    background: repeating-linear-gradient(var(--yellow) 0 1px, transparent 1px 3px);
  }

  .topbar {
    flex: 1;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
    padding: 0.35rem 0.6rem;
    background: var(--yellow-bright);
    box-shadow: 0 0 1.2rem rgb(223 253 88 / 0.3);
    color: rgb(18 15 23 / 0.6);
    font-size: 0.6rem;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
  }

  .daemons {
    display: flex;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .daemons li {
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--red);
    color: var(--red);
    font-size: 0.85rem;
    font-weight: 700;
  }

  .daemons li.on {
    border-color: var(--green);
    background: var(--green);
    color: var(--green-dark);
  }

  /* Terminal on the left, card viewer on the right when there is room for both. */
  .workspace {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(24rem, 34rem);
    gap: 1.5rem;
  }

  .workspace > :global(.viewer) {
    min-height: 0;
  }

  @media (max-width: 64rem) {
    .workspace {
      grid-template-columns: minmax(0, 1fr);
    }

    .workspace > :global(.viewer) {
      display: none;
    }
  }

  .window {
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--yellow);
    background: rgb(18 15 25 / 0.9);
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    height: 2.4rem;
    padding: 0 1rem;
    background: var(--yellow);
    color: var(--bg);
    clip-path: polygon(0.7rem 0, 100% 0, 100% 100%, 0 100%, 0 0.7rem);
  }

  .bar svg {
    width: 1.2rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.5;
  }

  h1 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .level {
    margin-left: auto;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .screen {
    --mono: 'Share Tech Mono', ui-monospace, monospace;
    position: relative;
    container-type: inline-size;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 1rem 1.2rem 1.4rem;
    color: #e6efd0;
    font: 1rem/1.55 var(--mono);
    text-shadow: 0 0 0.35rem rgb(208 237 87 / 0.18);
    cursor: text;
    background-image: repeating-linear-gradient(transparent 0 2px, rgb(0 0 0 / 0.16) 2px 3px);
    scrollbar-color: var(--yellow-line) transparent;
  }

  .screen p {
    margin: 0;
  }

  .prompt {
    color: var(--yellow);
  }

  .cmd {
    margin-top: 0.7rem !important;
  }

  .error {
    color: var(--red);
  }

  .listing {
    display: flex;
    flex-wrap: wrap;
    gap: 0.1rem 2rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .tree {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Share Tech Mono has no box-drawing glyphs: use a system mono so the guides line up. */
  .branch {
    color: var(--yellow-line);
    font-family: ui-monospace, Consolas, 'Courier New', monospace;
    white-space: pre;
  }

  .screen button {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-shadow: inherit;
    cursor: pointer;
  }

  .screen button.dir {
    color: var(--cyan);
  }

  .screen button:hover,
  .screen button:focus-visible {
    color: var(--bg);
    background: var(--cyan);
    outline: none;
  }

  .hidden-note {
    color: rgb(254 86 79 / 0.85);
  }

  .hidden-note button {
    color: var(--red) !important;
    text-decoration: underline;
  }

  .input {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.7rem;
  }

  .input.booting {
    visibility: hidden;
  }

  .input input {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    color: #fff;
    font: inherit;
    caret-color: var(--cyan);
    outline: none;
  }

  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    border-top: 1px solid var(--yellow-line);
  }

  .quick button {
    padding: 0.2rem 0.7rem;
    border: 1px solid var(--yellow-line);
    background: none;
    color: var(--yellow);
    font: 600 0.95rem var(--font);
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .quick button:hover,
  .quick button:focus-visible {
    border-color: var(--cyan);
    color: var(--cyan);
  }

  @media (max-width: 40rem) {
    .dossier {
      gap: 1rem;
      /* Room for the pinned fan content notice. */
      padding: 1rem 0.6rem 3rem;
    }

    .top {
      gap: 0.8rem;
    }

    .topbar,
    .level {
      display: none;
    }

    h1 {
      font-size: 1rem;
    }

    .daemons {
      margin-left: auto;
    }

    .screen {
      padding: 0.8rem;
      font-size: 0.9rem;
    }

    /* 16px keeps iOS from zooming into the field. */
    .input input {
      font-size: 16px;
    }
  }
</style>
