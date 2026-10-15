<script lang="ts">
  import { fixers, formatMonth, links, profile, skillGroups, type Link } from '../../data/resume';
  import { SECTIONS } from '../../lib/daemons';
  import type { View } from '../../lib/terminal/fs';

  interface Props {
    view: View | null;
    unlocked: ReadonlySet<string>;
    /** Opens the skill tree overlay. */
    onskills: () => void;
  }

  let { view, unlocked, onskills }: Props = $props();

  const sectionIndex = $derived(view ? SECTIONS.findIndex((s) => s.id === view.path.split('/')[0]) : -1);
  const section = $derived(sectionIndex === -1 ? null : SECTIONS[sectionIndex]);
  const period = (start: string, end: string | null) =>
    `${formatMonth(start).toUpperCase()} — ${formatMonth(end).toUpperCase()}`;
</script>

{#snippet channels(list: Link[])}
  {#each list as l (l.href)}
    <li>
      <a href={l.href} target="_blank" rel="noopener me">
        <span class="channel">{l.label.toUpperCase()}</span><span class="handle">{l.handle}</span>
      </a>
    </li>
  {/each}
{/snippet}

<aside class="viewer" aria-label="Card viewer" aria-live="polite">
  {#if view}
    {#key view.path}
      <article class="card">
        <header>
          <span class="num">{section ? `0${sectionIndex + 1}` : '00'}</span>
          <h2>{section?.title ?? 'ROOT'}</h2>
          {#if section}<span class="daemon">{section.daemon}</span>{/if}
          <span class="state">DECRYPTED</span>
        </header>
        <p class="path">~/{view.path}</p>

        <div class="body">
          {#if view.card.t === 'readme'}
            <p class="kicker">SUBJECT DOSSIER</p>
            <p class="big">{profile.name}</p>
            <p class="access">
              ACCESS LEVEL <b>{SECTIONS.filter((s) => unlocked.has(s.id)).length}/{SECTIONS.length}</b>
            </p>
            <ul class="shards">
              {#each SECTIONS as s, i (s.id)}
                <li class:on={unlocked.has(s.id)}>
                  <span class="num">0{i + 1}</span>
                  <span class="name">{s.title}<small>~/{s.id}/ · {s.daemon}</small></span>
                  <span class="chip">{unlocked.has(s.id) ? 'DECRYPTED' : 'ENCRYPTED'}</span>
                </li>
              {/each}
            </ul>
            <p class="actions">
              {#if SECTIONS.some((s) => !unlocked.has(s.id))}
                <a class="button" href="/">BREACH TO DECRYPT</a>
              {/if}
              <a class="button shard" href={profile.pdf} download>COPY TO SHARD</a>
            </p>
          {:else if view.card.t === 'profile'}
            <p class="kicker">SUBJECT</p>
            <p class="big">{profile.name}</p>
            <p class="sub">{profile.title}</p>
            <p class="tags">
              {#each profile.aliases as alias (alias)}<span>{alias}</span>{/each}
            </p>
            <dl class="facts">
              <dt>LOCATION</dt>
              <dd>{profile.location}</dd>
              <dt>LANGUAGES</dt>
              <dd>{profile.languages.join(' / ')}</dd>
              <dt>INTERESTS</dt>
              <dd>{profile.hobbies.join(' / ')}</dd>
            </dl>
            <p class="lead">{profile.summary}</p>
            {#each profile.bio as paragraph, i (i)}<p>{paragraph}</p>{/each}
          {:else if view.card.t === 'contact'}
            <p class="kicker">CONTACT CHANNELS</p>
            <ul class="channels">
              <li>
                <a href={`mailto:${profile.email}`}>
                  <span class="channel">EMAIL</span><span class="handle">{profile.email}</span>
                </a>
              </li>
              {@render channels(links)}
            </ul>
          {:else if view.card.t === 'fixers'}
            <p class="kicker">FIXERS</p>
            <p>Jobs and freelance gigs go through these fixers.</p>
            <ul class="channels">
              {@render channels(fixers)}
            </ul>
          {:else if view.card.t === 'soft-skills'}
            <p class="kicker">SOFT SKILLS</p>
            <p class="tags large">
              {#each profile.softSkills as skill (skill)}<span>{skill}</span>{/each}
            </p>
          {:else if view.card.t === 'job'}
            {@const job = view.card.job}
            <p class="kicker">{period(job.start, job.end)}</p>
            <p class="big">{job.company}</p>
            <p class="sub">{job.role}</p>
            <ul class="items">
              {#each job.missions as mission (mission)}<li>{mission}</li>{/each}
            </ul>
          {:else if view.card.t === 'education'}
            {@const e = view.card.education}
            <p class="kicker">{period(e.start, e.end)}</p>
            <p class="big">{e.school}</p>
            <p class="sub">{e.title}</p>
            <ul class="items">
              {#each e.details as detail (detail)}<li>{detail}</li>{/each}
            </ul>
          {:else if view.card.t === 'skills'}
            <button type="button" class="button tree" onclick={onskills}>OPEN SKILL TREE</button>
            <p class="kicker">HARD SKILLS</p>
            <dl class="skills">
              {#each skillGroups as group (group.name)}
                <dt>{group.name.toUpperCase()}</dt>
                <dd class="tags">
                  {#each group.skills as skill (skill)}<span>{skill}</span>{/each}
                </dd>
              {/each}
            </dl>
          {:else if view.card.t === 'publication'}
            {@const series = view.card.series}
            <p class="kicker">{series.platform.toUpperCase()} // {series.language.toUpperCase()}</p>
            <p class="title">{series.title}</p>
            <ol class="articles">
              {#each series.articles as article (article.href)}
                <li>
                  <a href={article.href} target="_blank" rel="noopener">
                    <span>{article.title}</span>
                    <time datetime={article.date}>{article.date}</time>
                  </a>
                </li>
              {/each}
            </ol>
          {:else if view.card.t === 'community'}
            {@const op = view.card.op}
            <p class="kicker">SIDE OPERATION</p>
            <p class="big">{op.name}</p>
            <p class="sub">{op.role} since {op.since}</p>
            <p class="lead">{op.description}</p>
          {/if}
        </div>
      </article>
    {/key}
  {:else}
    <div class="idle">
      <p class="kicker">CARD VIEWER</p>
      <p>No shard loaded.</p>
      <p class="hint">Open a file with <code>cat</code> or click it in the terminal.</p>
    </div>
  {/if}
</aside>

<style>
  .viewer {
    min-height: 0;
    overflow-y: auto;
    color: #e6efd0;
    scrollbar-color: var(--yellow-line) transparent;
  }

  .card {
    animation: decrypt 600ms steps(12) both;
  }

  header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    height: 2.4rem;
    padding: 0 1rem;
    background: var(--yellow);
    color: var(--bg);
    clip-path: polygon(0.7rem 0, 100% 0, 100% 100%, 0 100%, 0 0.7rem);
  }

  header .num {
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0.6;
  }

  h2 {
    flex: 1;
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .daemon {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.7;
  }

  .state {
    padding: 0.05rem 0.45rem;
    border: 1px solid currentColor;
    font-size: 0.7rem;
    font-weight: 700;
  }

  .path {
    margin: 0;
    padding: 0.35rem 1rem;
    border-inline: 1px solid var(--yellow);
    background: var(--row-active);
    color: var(--cyan);
    font:
      0.85rem 'Share Tech Mono',
      ui-monospace,
      monospace;
  }

  .body {
    padding: 1.2rem 1.3rem 1.5rem;
    border: 1px solid var(--yellow);
    border-top: 0;
    background: rgb(18 15 25 / 0.9);
    font-size: 1.05rem;
    font-weight: 500;
    line-height: 1.45;
  }

  .body p {
    margin: 0 0 0.8rem;
  }

  .kicker {
    margin-bottom: 0.2rem !important;
    color: var(--cyan);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.14em;
  }

  .big {
    margin-bottom: 0.1rem !important;
    color: var(--yellow);
    font-size: 2.1rem;
    font-weight: 700;
    line-height: 1.05;
    text-transform: uppercase;
  }

  .title {
    color: var(--yellow);
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .sub {
    font-size: 1.2rem;
  }

  .lead {
    font-size: 1.1rem;
    color: #fff;
  }

  .access b {
    color: var(--cyan);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .tags span {
    padding: 0 0.4rem;
    border: 1px solid var(--yellow-line);
    color: var(--yellow);
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .tags.large span {
    padding: 0.2rem 0.6rem;
    font-size: 1rem;
  }

  .facts,
  .skills {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.4rem 1rem;
    margin: 0 0 1rem;
  }

  dt {
    color: var(--yellow);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1.7;
  }

  dd {
    margin: 0;
  }

  .skills .tags {
    margin: 0;
  }

  .items {
    margin: 0.4rem 0 0;
    padding-left: 1.1rem;
  }

  .items li::marker {
    content: '▸ ';
    color: var(--yellow);
  }

  .shards {
    margin: 1rem 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--yellow-line);
  }

  .shards li {
    --tone: var(--red);
    display: grid;
    grid-template-columns: 2rem 1fr auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.2rem;
    border-bottom: 1px solid var(--yellow-line);
  }

  .shards li.on {
    --tone: var(--green);
  }

  .shards .num {
    opacity: 0.5;
    font-weight: 700;
  }

  .shards .name {
    display: flex;
    flex-direction: column;
    font-weight: 700;
  }

  .shards small {
    font-size: 0.75rem;
    font-weight: 500;
    opacity: 0.6;
  }

  .chip {
    padding: 0 0.4rem;
    border: 1px solid var(--tone);
    color: var(--tone);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .button {
    display: inline-block;
    padding: 0.45rem 1.2rem;
    background: var(--red);
    color: var(--bg);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-decoration: none;
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 0.5rem), calc(100% - 0.5rem) 100%, 0 100%);
  }

  .button:hover,
  .button:focus-visible {
    background: var(--cyan);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin: 0;
  }

  .button.shard {
    background: var(--yellow);
  }

  .button.shard:hover,
  .button.shard:focus-visible {
    background: var(--cyan);
  }

  .button.tree {
    margin-bottom: 1.2rem;
    border: 0;
    background: #f2b927;
    font: 700 1rem var(--font);
    cursor: pointer;
  }

  .channels,
  .articles {
    display: grid;
    gap: 0.5rem;
    margin: 0.6rem 0 0;
    padding: 0;
    list-style: none;
  }

  .channels a,
  .articles a {
    display: flex;
    flex-direction: column;
    padding: 0.55rem 0.9rem;
    border: 1px solid var(--yellow-line);
    text-decoration: none;
    transition:
      border-color 150ms,
      box-shadow 150ms;
  }

  .channels a:hover,
  .channels a:focus-visible,
  .articles a:hover,
  .articles a:focus-visible {
    border-color: var(--cyan);
    box-shadow: 0 0 0.8rem var(--cyan-dim);
    outline: none;
  }

  .channel {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    opacity: 0.7;
  }

  .handle {
    color: var(--cyan);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .articles span {
    color: #fff;
    font-weight: 600;
  }

  .articles time {
    color: var(--cyan);
    font-size: 0.8rem;
  }

  .idle {
    display: grid;
    place-content: center;
    gap: 0.3rem;
    height: 100%;
    min-height: 16rem;
    padding: 2rem;
    border: 1px dashed var(--yellow-line);
    text-align: center;
    font-size: 1.15rem;
    font-weight: 500;
  }

  .idle p {
    margin: 0;
  }

  .hint {
    opacity: 0.6;
  }

  code {
    color: var(--cyan);
    font-family: 'Share Tech Mono', ui-monospace, monospace;
  }

  @keyframes decrypt {
    from {
      clip-path: inset(0 0 100% 0);
    }
    to {
      clip-path: inset(0 0 0 0);
    }
  }
</style>
