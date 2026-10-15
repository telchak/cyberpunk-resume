<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /** Called as lines appear, so the terminal can keep the art in view. */
    onupdate: () => void;
  }

  let { onupdate }: Props = $props();

  type Run = { color: string; text: string };

  let rows = $state.raw<Run[][]>([]);
  let shown = $state(0);

  /** Groups consecutive characters of the same color into one span. */
  function toRuns(line: string, colors: string): Run[] {
    const runs: Run[] = [];
    for (let i = 0; i < line.length; i++) {
      const color = colors[i] ?? ' ';
      const last = runs[runs.length - 1];
      if (last && last.color === color) last.text += line[i];
      else runs.push({ color, text: line[i] });
    }
    return runs;
  }

  onMount(() => {
    let timer = 0;
    import('../../lib/terminal/samurai').then(({ LINES, COLORS }) => {
      rows = LINES.map((line, i) => toRuns(line, COLORS[i]));
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        shown = rows.length;
        onupdate();
        return;
      }
      timer = window.setInterval(() => {
        shown = Math.min(rows.length, shown + 2);
        onupdate();
        if (shown === rows.length) clearInterval(timer);
      }, 16);
    });
    return () => clearInterval(timer);
  });
</script>

<!-- Whitespace between tags inside <pre> is printed: keep the template packed. -->
<pre
  class="samurai"
  class:done={rows.length > 0 && shown === rows.length}
  aria-label="Samurai logo">{#each rows.slice(0, shown) as runs, i (i)}{#each runs as run, k (k)}<span
        class={run.color === ' ' ? undefined : run.color}>{run.text}</span
      >{/each}{'\n'}{/each}</pre>

<style>
  .samurai {
    /* Consolas-like fonts are ~0.55em wide: 120 columns fit 66em, scaled to the terminal width. */
    margin: 0.6rem 0 0;
    font:
      min(10px, calc(100cqw / 67)) / 1 ui-monospace,
      Consolas,
      'Courier New',
      monospace;
    letter-spacing: 0;
    white-space: pre;
    overflow: hidden;
    text-shadow: none;
    animation: glitch 900ms steps(6) both;
  }

  .r {
    color: #ff2a3c;
    text-shadow: 0 0 4px rgb(255 42 60 / 0.55);
  }

  .g {
    color: #8b929c;
  }

  .w {
    color: #f4f4f4;
    text-shadow: 0 0 4px rgb(255 255 255 / 0.35);
  }

  .done {
    animation: flicker 4s infinite;
  }

  @keyframes glitch {
    0% {
      transform: translateX(-6px);
      filter: hue-rotate(90deg);
      opacity: 0.6;
    }
    20% {
      transform: translateX(4px);
    }
    40% {
      transform: translateX(-2px);
      filter: none;
    }
    100% {
      transform: none;
      opacity: 1;
    }
  }

  @keyframes flicker {
    0%,
    92%,
    100% {
      opacity: 1;
    }
    93% {
      opacity: 0.55;
    }
    95% {
      opacity: 0.9;
      transform: translateX(2px);
    }
    96% {
      transform: none;
    }
  }
</style>
