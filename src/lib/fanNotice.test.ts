import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FAN_NOTICE } from './fanNotice';

// CD PROJEKT RED's fan content guidelines require this notice wherever their content is used.
const read = (path: string) => readFileSync(path, 'utf-8');

describe('fan content notice', () => {
  it('uses the wording required by the guidelines', () => {
    expect(FAN_NOTICE).toBe('This is an unofficial fan work and is not approved/endorsed by CD PROJEKT RED.');
  });

  it('is rendered unconditionally by the base layout', () => {
    const layout = read('src/layouts/Base.astro');
    expect(layout).toMatch(/\n    <p [^>]*data-fan-notice>\{FAN_NOTICE\}<\/p>\n  <\/body>/);
  });

  it('is shown on every page, through the base layout', () => {
    for (const file of readdirSync('src/pages').filter((f) => f.endsWith('.astro'))) {
      const page = read(`src/pages/${file}`);
      expect(page, file).toContain("import Base from '../layouts/Base.astro'");
      expect(page, file).toMatch(/<Base[\s>]/);
    }
  });

  it('is shown on the skill tree overlay, which covers the page', () => {
    expect(read('src/components/skilltree/SkillTree.svelte')).toMatch(/data-fan-notice>\{FAN_NOTICE\}/);
  });
});

describe('CD PROJEKT RED artwork', () => {
  it('is kept out of git', () => {
    expect(read('.gitignore').split(/\r?\n/)).toContain('/public/skilltree/');
  });
});
