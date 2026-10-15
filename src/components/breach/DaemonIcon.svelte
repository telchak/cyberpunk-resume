<script lang="ts">
  interface Props {
    /** 1-3: more circuit bars above the arrow for higher tiers. */
    tier: number;
  }

  let { tier }: Props = $props();
</script>

<svg viewBox="0 0 40 44" aria-hidden="true">
  {#each { length: tier } as _, i (i)}
    <rect x={18 - i * 5} y={2 + i * 2} width="4" height={12 - i * 2} />
    {#if i > 0}<rect x={18 + i * 5} y={2 + i * 2} width="4" height={12 - i * 2} />{/if}
  {/each}
  <path d="M13 16h14v8h9L20 40 4 24h9z" fill="none" stroke="currentColor" stroke-width="3" />
  <path d="M16 19h8v8h5L20 36l-9-9h5z" />
</svg>

<style>
  svg {
    width: 2.6rem;
    height: 2.9rem;
    fill: currentColor;
  }
</style>
