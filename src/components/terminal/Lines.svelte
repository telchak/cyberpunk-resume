<script lang="ts">
  import type { Line } from '../../lib/terminal/fs';

  interface Props {
    lines: Line[];
  }

  let { lines }: Props = $props();

  const external = (href: string) => href.startsWith('http');
</script>

<div class="lines">
  {#each lines as line, i (i)}
    {#if line.t === 'heading'}
      <p class="heading">{line.text}</p>
    {:else if line.t === 'text'}
      <p>{line.text}</p>
    {:else if line.t === 'item'}
      <p class="item">{line.text}</p>
    {:else if line.t === 'field'}
      <p class="field">
        <span class="key">{line.key}</span>
        {#if line.href}
          <a href={line.href} target={external(line.href) ? '_blank' : undefined} rel="noopener me"
            >{line.value}</a
          >
        {:else}
          <span>{line.value}</span>
        {/if}
      </p>
    {:else if line.t === 'link'}
      <p class="item">
        <a href={line.href} target="_blank" rel="noopener">{line.label}</a>
        {#if line.note}<span class="note">{line.note}</span>{/if}
      </p>
    {:else}
      <p class="blank" aria-hidden="true">&nbsp;</p>
    {/if}
  {/each}
</div>

<style>
  p {
    margin: 0;
    max-width: 52rem;
  }

  .heading {
    color: var(--yellow);
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .item {
    padding-left: 1.4em;
    text-indent: -1.4em;
  }

  .item::before {
    content: '▸ ';
    color: var(--yellow);
    display: inline-block;
    width: 1.4em;
    text-indent: 0;
  }

  .field {
    display: grid;
    grid-template-columns: minmax(8rem, max-content) 1fr;
    column-gap: 1.2rem;
  }

  .key {
    color: rgb(208 237 87 / 0.7);
  }

  a {
    color: var(--cyan);
  }

  a:hover,
  a:focus-visible {
    color: var(--bg);
    background: var(--cyan);
    outline: none;
  }

  .note {
    margin-left: 0.8em;
    opacity: 0.5;
  }

  @media (max-width: 40rem) {
    .field {
      grid-template-columns: 1fr;
    }
  }
</style>
