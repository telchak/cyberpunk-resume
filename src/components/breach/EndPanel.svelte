<script lang="ts">
  interface Props {
    success: boolean;
    /** True when every daemon was uploaded: no point offering a retry. */
    complete: boolean;
    onretry: () => void;
  }

  let { success, complete, onretry }: Props = $props();

  // [text, trailing status]
  const SUCCESS_LOG: [string, string?][] = [
    ['//ROOT'],
    ['//ACCESS_REQUEST'],
    ['//ACCESS_REQUEST_SUCCESS'],
    ...[1, 2, 3, 4].map((n): [string, string] => [`//COLLECTING PACKET_${n}`, 'COMPLETE']),
    ['//LOGIN'],
    ['//LOGIN_SUCCESS'],
    ['//'],
    ['//UPLOAD_IN_PROGRESS'],
    ['//UPLOAD_COMPLETE!'],
  ];
  const FAILURE_LOG: [string, string?][] = [
    ['//ROOT'],
    ['//ACCESS_REQUEST'],
    ['//ACCESS_REQUEST_FAILED'],
    ['//ICE_COUNTERMEASURES_ENGAGED'],
    ['//CONNECTION_TERMINATED'],
  ];

  const log = $derived(success ? SUCCESS_LOG : FAILURE_LOG);
</script>

<section class="panel" class:failed={!success} aria-live="polite">
  <header>
    <svg class="glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 2h4l6 8V2h2v12h-3L4 6v8H2zM14 22h-4l-6-8v8H2V10h3l7 8v-8h2z" />
    </svg>
    <p class="micro" aria-hidden="true">MODEL LINE&nbsp;&nbsp;&nbsp;12.12AA</p>
  </header>

  <div class="log" aria-hidden="true">
    {#each log as [text, status], n (n)}
      <p class:dots={status} style:--n={n}>
        <span>{text}</span>{#if status}<span>{status}</span>{/if}
      </p>
    {/each}
  </div>

  <div class="result">
    <h2>{success ? 'DAEMONS UPLOADED' : 'BREACH FAILED'}</h2>
  </div>

  <nav class="actions">
    {#if success}
      <a class="button" href="/dossier">ACCESS DOSSIER</a>
    {/if}
    {#if !complete}
      <button class="button" class:secondary={success} type="button" onclick={onretry}>
        {success ? 'BREACH AGAIN' : 'RETRY BREACH'}
      </button>
    {/if}
  </nav>
</section>

<style>
  .panel {
    --tone: var(--green);
    --deep: var(--green-dark);
    --ink: #0b2a18;
    position: absolute;
    left: 10.8rem;
    top: 18.25rem;
    width: 39.6rem;
    height: 30.5rem;
    display: flex;
    flex-direction: column;
    color: var(--tone);
    animation: flash 400ms steps(4) both;
  }

  .panel.failed {
    --tone: var(--red);
    --deep: #231314;
    --ink: #3a0d0b;
  }

  header {
    display: flex;
    align-items: center;
    height: 2.4rem;
    padding: 0 1rem;
    background: var(--tone);
    color: var(--ink);
  }

  .glyph {
    width: 1.5rem;
    height: 1.5rem;
    fill: currentColor;
  }

  .micro {
    margin: 0 0 0 auto;
    font-size: 0.4rem;
  }

  .log {
    flex: 1;
    padding: 0.8rem 1rem;
    background: var(--deep);
    border: 0.0625rem solid var(--tone);
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.35;
  }

  .log p {
    margin: 0;
    animation: type 1ms both;
    animation-delay: calc(var(--n) * 90ms);
  }

  .dots {
    display: flex;
    width: 24rem;
  }

  .dots span:first-child {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
  }

  .dots span:first-child::after {
    content: ' ........................................................................';
  }

  .result {
    height: 8.5rem;
    display: grid;
    place-items: end center;
    padding-bottom: 1rem;
    background: var(--tone);
    color: var(--ink);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 0.8rem), calc(100% - 0.8rem) 100%, 0 100%);
  }

  h2 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .actions {
    position: absolute;
    top: calc(100% + 1.1rem);
    left: 25.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .button {
    display: block;
    width: 15.5rem;
    padding: 0.55rem 1rem;
    border: 0;
    background: color-mix(in srgb, var(--tone) 60%, black);
    color: color-mix(in srgb, var(--tone) 70%, white);
    font: 500 1.6rem var(--font);
    text-align: left;
    text-decoration: none;
    letter-spacing: 0.03em;
    cursor: pointer;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 0.6rem), calc(100% - 0.6rem) 100%, 0 100%);
  }

  .button.secondary {
    background: transparent;
    outline: 0.0625rem solid var(--tone);
    outline-offset: -0.0625rem;
    font-size: 1.2rem;
  }

  .button:hover,
  .button:focus-visible {
    background: var(--tone);
    color: var(--ink);
  }

  @keyframes flash {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    75% {
      opacity: 0.4;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes type {
    from {
      visibility: hidden;
    }
  }
</style>
