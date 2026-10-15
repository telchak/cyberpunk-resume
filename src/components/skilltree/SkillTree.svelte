<script lang="ts">
  import { onMount } from 'svelte';
  import { isComplete, perkLevel, trees, treeToolCount } from '../../data/skilltree';
  import { ARTWORK_CREDIT, FAN_NOTICE } from '../../lib/fanNotice';
  import { ICONS } from './icons';
  import { artOf, GLOW, labelOf, layoutTree, TILE, type PlacedNode, type Selection } from './layout';
  import { SPRITES } from './sprites';

  interface Props {
    onclose: () => void;
  }

  let { onclose }: Props = $props();

  /** Space between trees, in canvas units. */
  const GAP = 120;
  /** Screen space kept free for the rail on the left of the canvas. */
  const RAIL_SPACE = 150;

  const layouts = trees.reduce<
    (ReturnType<typeof layoutTree> & { tree: (typeof trees)[number]; left: number })[]
  >((acc, tree) => {
    const prev = acc[acc.length - 1];
    acc.push({ tree, ...layoutTree(tree), left: prev ? prev.left + prev.width + GAP : 0 });
    return acc;
  }, []);
  const canvasWidth = layouts[layouts.length - 1].left + layouts[layouts.length - 1].width;
  const canvasHeight = Math.max(...layouts.map((l) => l.height));
  const allTools = trees.flatMap((t) => t.perks.flatMap((p) => p.tools));
  const totalTools = allTools.filter((t) => t.owned).length;
  const lockedTools = allTools.length - totalTools;

  let viewport: HTMLElement;
  let viewportHeight = $state(900);
  /** Canvas scale: fit the tallest tree, capped at the planner's own zoom. */
  const scale = $derived(Math.min(0.54, Math.max(0.24, (viewportHeight - 24) / canvasHeight)));

  let selected = $state.raw<Selection | null>(null);
  let selectedKey = $state<string | null>(null);
  let anchor = $state<DOMRect | null>(null);
  let tipHeight = $state(0);
  let activeTree = $state(trees[0].id);
  let missingArt = $state(false);
  let backButton: HTMLButtonElement;

  const isLocked = (node: Selection) => node.kind === 'tool' && !node.tool.owned;

  /** The sprite fitted and centered in the tile's icon box. */
  function iconStyle(node: PlacedNode): string {
    const [x, y, w, h] = SPRITES[artOf(node)];
    const [bw, bh] = TILE[node.kind].icon;
    const k = Math.min(bw / w, bh / h);
    return `width:${w}px;height:${h}px;background-position:-${x}px -${y}px;transform:translate(-50%,-50%) scale(${k})`;
  }

  function select(node: PlacedNode, element: HTMLElement) {
    selected = node;
    selectedKey = node.key;
    anchor = element.getBoundingClientRect();
  }

  /** Tooltip beside the hovered tile, flipped and clamped to stay on screen. */
  const tipStyle = $derived.by(() => {
    if (!anchor) return '';
    const width = 256;
    const margin = 16;
    const right = anchor.right + margin;
    const left = right + width > innerWidth - margin ? anchor.left - margin - width : right;
    const top = Math.min(
      Math.max(anchor.top + anchor.height / 2 - tipHeight / 2, margin),
      innerHeight - tipHeight - margin,
    );
    return `left:${Math.max(margin, left)}px;top:${top}px`;
  });

  const centerOf = (l: (typeof layouts)[number]) => RAIL_SPACE + (l.left + l.width / 2) * scale;

  function jumpTo(treeId: string) {
    const layout = layouts.find((l) => l.tree.id === treeId)!;
    viewport.scrollTo({ left: centerOf(layout) - viewport.clientWidth / 2, behavior: 'smooth' });
    activeTree = treeId;
  }

  function onscroll() {
    anchor = null;
    const middle = viewport.scrollLeft + viewport.clientWidth / 2;
    activeTree = layouts.reduce((best, l) =>
      Math.abs(centerOf(l) - middle) < Math.abs(centerOf(best) - middle) ? l : best,
    ).tree.id;
  }

  // Drag to pan, like the planner.
  let drag: { x: number; y: number; left: number; top: number } | null = null;
  function onpointerdown(event: PointerEvent) {
    if ((event.target as HTMLElement).closest('button') || event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    viewport.setPointerCapture(event.pointerId);
  }
  function onpointermove(event: PointerEvent) {
    if (!drag) return;
    viewport.scrollLeft = drag.left - (event.clientX - drag.x);
    viewport.scrollTop = drag.top - (event.clientY - drag.y);
  }
  const onpointerup = () => (drag = null);

  /** Vertical wheel scrolls sideways when the canvas only overflows horizontally. */
  function onwheel(event: WheelEvent) {
    if (viewport.scrollHeight > viewport.clientHeight || event.shiftKey || Math.abs(event.deltaX) > 0) return;
    viewport.scrollLeft += event.deltaY;
    event.preventDefault();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onclose();
    }
  }

  onMount(() => {
    backButton.focus({ preventScroll: true });
    const observer = new ResizeObserver(() => (viewportHeight = viewport.clientHeight));
    observer.observe(viewport);
    // The planner artwork is downloaded separately (npm run assets:skilltree).
    fetch('/skilltree/perks.png', { method: 'HEAD' })
      .then((r) => (missingArt = !r.ok))
      .catch(() => (missingArt = true));
    return () => observer.disconnect();
  });
</script>

<svelte:window {onkeydown} />

<div
  class="planner"
  class:missing-art={missingArt}
  role="dialog"
  aria-modal="true"
  aria-labelledby="skilltree-title"
>
  <header class="brand">
    <p class="name"><span>SAMI</span><b aria-hidden="true"></b><span>CHIBANI</span></p>
    <h2 id="skilltree-title">SKILL TREE</h2>
  </header>

  <nav class="actions">
    <button type="button" class="primary" bind:this={backButton} onclick={onclose}>BACK TO TERMINAL</button>
    <a class="secondary" href="/cv">PLAIN CV</a>
  </nav>

  <i class="ruler" aria-hidden="true"></i>

  <nav class="rail" aria-label="Attributes">
    {#each trees as tree (tree.id)}
      <button
        type="button"
        class:active={activeTree === tree.id}
        onclick={() => jumpTo(tree.id)}
        title={tree.name}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICONS[tree.icon]} /></svg>
        <span>{treeToolCount(tree)}</span>
        <span class="sr-only">{tree.name}</span>
      </button>
    {/each}
  </nav>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="viewport"
    bind:this={viewport}
    {onscroll}
    {onpointerdown}
    {onpointermove}
    {onpointerup}
    onpointercancel={onpointerup}
    {onwheel}
  >
    <div
      class="canvas"
      style:width="{canvasWidth * scale + RAIL_SPACE * 2}px"
      style:height="{canvasHeight * scale}px"
    >
      <div
        class="scaled"
        style:width="{canvasWidth}px"
        style:height="{canvasHeight}px"
        style:left="{RAIL_SPACE}px"
        style:transform="scale({scale})"
      >
        {#each layouts as { tree, left, width, height, nodes, cables } (tree.id)}
          <section
            class="tree"
            data-tree={tree.id}
            aria-label={tree.name}
            style:left="{left}px"
            style:width="{width}px"
            style:height="{height}px"
          >
            <p class="tree-name">{tree.name.toUpperCase()}</p>
            {#each cables as cable, i (i)}
              <i
                class="cable"
                class:locked={cable.locked}
                style:left="{cable.x}px"
                style:top="{cable.y}px"
                style:width="{cable.w}px"
                style:height="{cable.h}px"
                style:background-position="-{cable.sx}px -{cable.sy}px"
                style:--d="{i * 30 + 150}ms"
              ></i>
            {/each}
            {#each nodes as node (node.key)}
              {@const tile = TILE[node.kind]}
              {@const choose = (event: Event) => select(node, event.currentTarget as HTMLElement)}
              <button
                type="button"
                class="node {node.kind}"
                class:selected={node.key === selectedKey}
                class:locked={isLocked(node)}
                class:invested={node.kind === 'perk' && !isComplete(node.perk)}
                style:left="{node.x - tile.w / 2}px"
                style:top="{node.y - tile.h / 2}px"
                style:width="{tile.w}px"
                style:height="{tile.h}px"
                style:--d="{node.order * 30}ms"
                aria-label={labelOf(node)}
                onpointerenter={choose}
                onpointerleave={() => (anchor = null)}
                onfocus={choose}
                onclick={choose}
              >
                {#if node.kind === 'attribute' || (node.kind === 'perk' && isComplete(node.perk))}
                  <span class="glow" style:--glow="{GLOW[node.kind]}px" aria-hidden="true"></span>
                {/if}
                <span
                  class="icon"
                  style:width="{tile.icon[0]}px"
                  style:height="{tile.icon[1]}px"
                  aria-hidden="true"
                >
                  <span class="sprite" style={iconStyle(node)}></span>
                </span>
                {#if node.kind === 'perk'}
                  <span class="points">{perkLevel(node.perk)}</span>
                {/if}
              </button>
            {/each}
          </section>
        {/each}
      </div>
    </div>
  </div>

  {#if selected && anchor}
    <aside
      class="tooltip"
      class:locked={isLocked(selected)}
      style={tipStyle}
      bind:clientHeight={tipHeight}
      aria-live="polite"
    >
      <h3>{labelOf(selected)}</h3>
      {#if selected.kind === 'attribute'}
        <p>{selected.tree.description}</p>
        <ul>
          {#each selected.tree.perks as perk (perk.id)}<li>{perk.name}</li>{/each}
        </ul>
        <p class="status">
          {selected.tree.perks.length} PERKS · {treeToolCount(selected.tree)} MODULES INSTALLED
        </p>
      {:else if selected.kind === 'perk'}
        <p>{selected.perk.description}</p>
        {#if selected.perk.tools.length}
          <ul>
            {#each selected.perk.tools as tool (tool.code)}
              <li class:locked={!tool.owned}>
                {tool.name}{#if !tool.owned}<small> (locked)</small>{/if}
              </li>
            {/each}
          </ul>
        {/if}
        <p class="status">LEVEL {perkLevel(selected.perk)} · {selected.tree.name.toUpperCase()}</p>
      {:else if selected.tool.owned}
        <p>Module of the {selected.perk.name} perk.</p>
        <p class="status">INSTALLED · {selected.tree.name.toUpperCase()}</p>
      {:else}
        <p>Not acquired yet: a module the {selected.perk.name} perk is still missing.</p>
        <p class="status">LOCKED · {selected.tree.name.toUpperCase()}</p>
      {/if}
    </aside>
  {/if}

  <footer class="bar">
    <p class="attributes"><b>{trees.length}</b><i aria-hidden="true">+</i>ATTRIBUTES</p>
    <p class="hint">
      {#if missingArt}
        Planner artwork missing: run <code>npm run assets:skilltree</code>
      {:else}
        Hover a perk to see its details · drag to pan
      {/if}
    </p>
    <p class="modules">
      <span class="locked-count">{lockedTools} LOCKED</span><b>{totalTools}</b><i aria-hidden="true"
      ></i>MODULES
    </p>
    <p class="notice" data-fan-notice>{FAN_NOTICE} {ARTWORK_CREDIT}</p>
  </footer>
</div>

<style>
  .planner {
    --yellow: #ffd83f;
    --red: #ff5c53;
    --cyan: #5ef6ff;
    position: fixed;
    inset: 0;
    z-index: 10;
    overflow: hidden;
    background:
      url('/skilltree/bg.webp') center / cover no-repeat,
      linear-gradient(170deg, #2c1117 0%, #1a0f17 35%, #0d1420 75%, #0a1119 100%);
    color: #e6e1d6;
    font-family: var(--font);
    animation: open 250ms ease-out both;
  }

  .brand {
    position: absolute;
    top: 1.3rem;
    left: 2.6rem;
    z-index: 3;
    pointer-events: none;
  }

  .name {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    color: #f3e600;
    font-size: 2.1rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1;
    text-shadow: 0 0 0.6rem rgb(243 230 0 / 0.25);
  }

  .name b {
    width: 3rem;
    height: 0.7rem;
    background: repeating-linear-gradient(#f3e600 0 2px, transparent 2px 4px);
  }

  h2 {
    margin: 0.35rem 0 0 1.6rem;
    color: var(--red);
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .actions {
    position: absolute;
    top: 1.5rem;
    right: 2.6rem;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.9rem;
  }

  .primary {
    padding: 0.5rem 1.6rem;
    border: 0;
    background: #f3e600;
    color: #000;
    font: 700 1.05rem var(--font);
    letter-spacing: 0.04em;
    cursor: pointer;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 0.75rem), calc(100% - 0.75rem) 100%, 0 100%);
  }

  .secondary {
    padding: 0.35rem 1rem;
    border: 1px solid rgb(255 92 83 / 0.7);
    background: rgb(7 8 13 / 0.6);
    color: var(--cyan);
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-decoration: none;
  }

  .primary:hover,
  .primary:focus-visible {
    background: var(--cyan);
    outline: none;
  }

  .secondary:hover,
  .secondary:focus-visible {
    background: rgb(94 246 255 / 0.15);
    outline: none;
  }

  /* Dotted measuring rule along the left edge, as on the planner. */
  .ruler {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0.9rem;
    z-index: 2;
    width: 0.4rem;
    background:
      repeating-linear-gradient(transparent 0 3px, rgb(255 92 83 / 0.35) 3px 4px) left / 2px 100% no-repeat,
      repeating-linear-gradient(transparent 0 23px, rgb(255 92 83 / 0.45) 23px 24px) right / 0.3rem 100%
        no-repeat;
    pointer-events: none;
  }

  /* Keeps the rail readable when tiles pan underneath it. */
  .planner::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 2;
    width: 11rem;
    background: linear-gradient(90deg, rgb(10 10 16 / 0.85), transparent);
    pointer-events: none;
  }

  .rail {
    position: absolute;
    top: 50%;
    left: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    translate: 0 -50%;
  }

  .rail button {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    width: 7.5rem;
    padding: 0.7rem 0 0.7rem 2.6rem;
    border: 0;
    background: none;
    color: var(--cyan);
    font: 500 1.15rem var(--font);
    cursor: pointer;
  }

  .rail button.active,
  .rail button:hover,
  .rail button:focus-visible {
    background: linear-gradient(90deg, rgb(94 246 255 / 0.28), rgb(94 246 255 / 0.04));
    outline: none;
  }

  .rail svg {
    width: 1.7rem;
    height: 1.7rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .viewport {
    position: absolute;
    inset: 6.5rem 0 4.8rem 0;
    overflow: auto;
    cursor: grab;
    scrollbar-width: none;
    touch-action: pan-x pan-y;
  }

  .viewport:active {
    cursor: grabbing;
  }

  .viewport::-webkit-scrollbar {
    display: none;
  }

  .canvas {
    position: relative;
    min-width: 100%;
    margin-top: 0.75rem;
  }

  .scaled {
    position: absolute;
    top: 0;
    transform-origin: 0 0;
  }

  .tree {
    position: absolute;
    top: 0;
  }

  .tree-name {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: 0;
    color: var(--cyan);
    font-size: 34px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-align: center;
    opacity: 0.75;
  }

  .cable {
    position: absolute;
    background-image: url('/skilltree/cables.png');
    background-size: 1172px 972px;
    background-repeat: no-repeat;
    animation: open 400ms ease-out var(--d) backwards;
  }

  /* Tiles: the planner's maxed-state frames, icons from its sprite sheet. */
  .node {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: center / cover no-repeat;
    cursor: pointer;
    animation: power 500ms ease-out var(--d) backwards;
  }

  .node.attribute {
    background-image: url('/skilltree/tile-master.png');
  }

  .node.perk {
    background-image: url('/skilltree/tile-milestone.png');
  }

  .node.tool {
    background-image: url('/skilltree/tile-perk.png');
  }

  .glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--glow);
    height: var(--glow);
    translate: -50% -50%;
    background: center / cover no-repeat;
    pointer-events: none;
  }

  /* Skills not acquired yet: the planner's locked tile, cables and dimmed red art. */
  .cable.locked {
    background-image: url('/skilltree/cables-locked.png');
  }

  .node.tool.locked {
    background-image: url('/skilltree/tile-perk-locked.png');
  }

  .node.locked .sprite {
    background-image: url('/skilltree/perks-locked.png');
    filter: brightness(0.5);
  }

  .node.perk.invested {
    background-image: url('/skilltree/tile-milestone-invested.png');
  }

  .attribute .glow {
    background-image: url('/skilltree/tile-master-glow.png');
  }

  .perk .glow {
    background-image: url('/skilltree/tile-milestone-glow.png');
  }

  .icon {
    position: relative;
    overflow: hidden;
  }

  .sprite {
    position: absolute;
    top: 50%;
    left: 50%;
    background-image: url('/skilltree/perks.png');
    background-size: 2250px 2028px;
    background-repeat: no-repeat;
    transform-origin: center;
  }

  .points {
    position: absolute;
    bottom: 6px;
    left: 50%;
    translate: -50% 0;
    padding: 2px 8px;
    border: 2px solid #07080d;
    border-radius: 6px;
    background: var(--yellow);
    color: #07080d;
    font: 700 36px/1 var(--font);
  }

  /* Hover/selection target, as on the planner. */
  .node::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--target);
    height: var(--target);
    translate: -50% -50%;
    background: url('/skilltree/target.svg') center / cover no-repeat;
    opacity: 0;
    pointer-events: none;
    transition: all 160ms ease-in-out;
  }

  .attribute {
    --target: 180px;
    --target-on: 320px;
  }

  .perk {
    --target: 100px;
    --target-on: 192px;
  }

  .tool {
    --target: 100px;
    --target-on: 176px;
  }

  .node:hover::after,
  .node:focus-visible::after,
  .node.selected::after {
    width: var(--target-on);
    height: var(--target-on);
    opacity: 1;
  }

  .node:focus-visible {
    outline: none;
  }

  /* Without the downloaded artwork, keep the tree readable. */
  .missing-art .node {
    outline: 3px solid rgb(255 216 63 / 0.5);
    outline-offset: -3px;
    background-color: rgb(58 42 16 / 0.6);
  }

  .missing-art .node.locked {
    outline: 3px dashed rgb(255 92 83 / 0.5);
    background-color: rgb(7 8 13 / 0.6);
  }

  .missing-art .node.locked::before {
    color: rgb(255 92 83 / 0.7);
  }

  .missing-art .node::before {
    content: attr(aria-label);
    position: absolute;
    inset: 12%;
    display: grid;
    place-items: center;
    color: var(--yellow);
    font-size: 22px;
    font-weight: 700;
    text-align: center;
    text-transform: uppercase;
  }

  .tooltip {
    position: fixed;
    z-index: 4;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 256px;
    padding: 16px 16px 20px;
    border: 1px solid rgb(255 216 63 / 0.4);
    background: #000;
    color: #fff;
    font-size: 0.92rem;
    font-weight: 500;
    line-height: 1.35;
    pointer-events: none;
  }

  .tooltip.locked {
    border-color: rgb(255 92 83 / 0.4);
  }

  .tooltip.locked .status,
  .tooltip li.locked {
    color: var(--red);
  }

  .tooltip li.locked::before {
    content: '- ';
    color: var(--red);
  }

  .tooltip small {
    font-size: 0.8em;
    opacity: 0.8;
  }

  .tooltip h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .tooltip p,
  .tooltip ul {
    margin: 0;
  }

  .tooltip ul {
    padding: 0;
    list-style: none;
  }

  .tooltip li::before {
    content: '+ ';
    color: var(--yellow);
  }

  .status {
    padding-top: 8px;
    border-top: 1px solid #2c2a20;
    color: var(--yellow);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
  }

  .bar {
    position: absolute;
    left: 2.6rem;
    right: 2.6rem;
    bottom: 0;
    z-index: 3;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding: 0.8rem 0 0.4rem;
    border-top: 1px solid rgb(255 92 83 / 0.35);
    font-size: 1.15rem;
  }

  .bar p {
    margin: 0;
  }

  .attributes,
  .modules {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: 500;
    letter-spacing: 0.03em;
  }

  .attributes {
    color: var(--cyan);
  }

  .attributes i {
    display: grid;
    place-items: center;
    width: 1.9rem;
    height: 1.5rem;
    background: var(--cyan);
    color: #07080d;
    font-style: normal;
    font-weight: 700;
    clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
  }

  .modules {
    justify-self: end;
    color: var(--yellow);
  }

  .locked-count {
    margin-right: 1.2rem;
    color: var(--red);
    font-size: 0.9em;
  }

  .modules i {
    width: 1.4rem;
    height: 1.6rem;
    border: 2px solid var(--yellow);
    background: radial-gradient(circle, var(--yellow) 1.3px, transparent 1.6px) 0 0 / 0.42rem 0.42rem;
  }

  .hint {
    color: var(--red);
    font-size: 0.95rem;
  }

  .hint code {
    color: var(--yellow);
  }

  .notice {
    grid-column: 1 / -1;
    padding-top: 0.3rem;
    color: rgb(230 225 214 / 0.7);
    font-size: 13px;
    text-align: center;
  }

  @media (max-width: 48rem) {
    .brand {
      left: 1.6rem;
    }

    .name {
      font-size: 1.4rem;
    }

    h2 {
      font-size: 1rem;
    }

    .actions {
      right: 1rem;
      gap: 0.5rem;
    }

    .primary {
      padding: 0.4rem 0.9rem;
      font-size: 0.85rem;
    }

    .rail,
    .hint {
      display: none;
    }

    .bar {
      left: 1rem;
      right: 1rem;
      font-size: 0.95rem;
    }

    .tooltip {
      left: 0.75rem !important;
      right: 0.75rem;
      top: auto !important;
      bottom: 5.5rem;
      width: auto;
    }
  }

  @keyframes open {
    from {
      opacity: 0;
    }
  }

  @keyframes power {
    from {
      opacity: 0;
      filter: brightness(2);
    }
  }
</style>
