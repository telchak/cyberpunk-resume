<script lang="ts">
  // Private extensions (git-ignored) can lay their own screen over the home page and the dossier,
  // from src/extensions/<name>/overlay.svelte. Without any, this renders nothing.
  import type { Component } from 'svelte';

  const overlays = Object.values(
    import.meta.glob<{ default: Component }>('/src/extensions/*/overlay.svelte', { eager: true }),
  ).map((module) => module.default);
</script>

{#each overlays as Overlay, i (i)}
  <Overlay />
{/each}
