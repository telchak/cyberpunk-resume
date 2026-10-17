import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { profile } from '../../data/resume';
import { buildDossier } from './dossier';
import { resolve } from './fs';
import { applyMode, complete, decodeBase64, encodeBase64, run, type Block, type Shell } from './shell';

const shellWith = (...unlocked: string[]): Shell => {
  const set = new Set(unlocked);
  return { root: buildDossier(set), cwd: [], unlocked: set, history: [] };
};

const listing = (blocks: Block[]) =>
  blocks.find((b) => b.t === 'listing') as Extract<Block, { t: 'listing' }>;
const error = (blocks: Block[]) =>
  (blocks.find((b) => b.t === 'error') as Extract<Block, { t: 'error' }>)?.text;

describe('resolve', () => {
  const root = buildDossier(new Set(['career']));
  const all = new Set(['identity', 'career', 'projects']);

  it('handles ~, /, . and ..', () => {
    expect(resolve(root, ['career', 'experience'], '..', all)).toMatchObject({ ok: true, path: ['career'] });
    expect(resolve(root, ['career'], '~/identity', all)).toMatchObject({ ok: true, path: ['identity'] });
    expect(resolve(root, ['career'], '/', all)).toMatchObject({ ok: true, path: [] });
    expect(resolve(root, [], '../..', all)).toMatchObject({ ok: true, path: [] });
    expect(resolve(root, [], './career/', all)).toMatchObject({ ok: true, path: ['career'] });
  });

  it('stops at locked directories', () => {
    expect(resolve(root, [], 'identity/contact.txt', new Set())).toEqual({
      ok: false,
      reason: 'locked',
      lock: 'identity',
      path: ['identity'],
    });
  });

  it('reports missing paths and files used as directories', () => {
    expect(resolve(root, [], 'nope', all)).toEqual({ ok: false, reason: 'missing' });
    expect(resolve(root, [], 'README.txt/x', all)).toEqual({ ok: false, reason: 'not-dir' });
  });
});

describe('run', () => {
  it('only lists decrypted directories and counts hidden ones', () => {
    const { blocks } = run('ls', shellWith('career'));
    expect(listing(blocks).entries.map((e) => e.name)).toEqual(['README.txt', 'career']);
    expect(listing(blocks).hidden).toBe(2);
  });

  it('lists everything once fully decrypted', () => {
    const { blocks } = run('ls', shellWith('identity', 'career', 'projects'));
    expect(listing(blocks).entries.map((e) => e.name)).toEqual([
      'README.txt',
      'identity',
      'career',
      'projects',
    ]);
    expect(listing(blocks).hidden).toBe(0);
  });

  it('refuses to enter a locked directory and names the daemon', () => {
    const result = run('cd projects', shellWith('career'));
    expect(result.cwd).toEqual([]);
    expect(error(result.blocks)).toContain('DATAMINE_V3');
  });

  it('changes directory and prints files', () => {
    const shell = shellWith('career');
    const { cwd } = run('cd career/experience', shell);
    expect(cwd).toEqual(['career', 'experience']);

    const { blocks } = run('ls', { ...shell, cwd });
    expect(listing(blocks).entries[0]).toEqual({
      name: '2023_openairlines.log',
      kind: 'file',
      path: 'career/experience/2023_openairlines.log',
    });

    const cat = run('cat 2023_openairlines.log', { ...shell, cwd });
    expect(cat.blocks[1]).toMatchObject({ t: 'lines' });
  });

  it('returns a card view when printing a file', () => {
    const { view } = run('cat career/experience/2023_openairlines.log', shellWith('career'));
    expect(view?.path).toBe('career/experience/2023_openairlines.log');
    expect(view?.card).toMatchObject({ t: 'job', job: { company: 'OpenAirlines' } });
    expect(run('ls', shellWith('career')).view).toBeUndefined();
  });

  it('echoes every command with the prompt path', () => {
    const shell = { ...shellWith('career'), cwd: ['career'] };
    expect(run('pwd', shell).blocks[0]).toEqual({ t: 'command', cwd: '~/career', input: 'pwd' });
  });

  it('reports errors for bad usage', () => {
    const shell = shellWith('identity');
    expect(error(run('cat identity', shell).blocks)).toContain('is a directory');
    expect(error(run('cd README.txt', shell).blocks)).toContain('not a directory');
    expect(error(run('cat', shell).blocks)).toContain('missing file operand');
    expect(error(run('hack', shell).blocks)).toContain('command not found');
  });

  it('hides locked branches from tree', () => {
    const { blocks } = run('tree', shellWith('identity'));
    const tree = blocks.find((b) => b.t === 'tree') as Extract<Block, { t: 'tree' }>;
    expect(tree.rows.map((r) => r.entry.path)).toEqual([
      'README.txt',
      'identity',
      'identity/profile.txt',
      'identity/contact.txt',
      'identity/fixers.txt',
      'identity/soft_skills.txt',
    ]);
    expect(tree.hidden).toBe(2);
  });

  it('emits navigation and clear effects', () => {
    expect(run('breach', shellWith()).effect).toEqual({ t: 'navigate', href: '/' });
    expect(run('cv', shellWith()).effect).toEqual({ t: 'navigate', href: '/cv' });
    expect(run('clear', shellWith()).effect).toEqual({ t: 'clear' });
  });

  it('copies the dossier to a shard: downloads the PDF CV, which must exist', () => {
    expect(run('shard', shellWith()).effect).toEqual({ t: 'download', href: profile.pdf });
    expect(run('exfiltrate', shellWith()).effect).toEqual({ t: 'download', href: profile.pdf });
    expect(existsSync(`public${profile.pdf}`), `public${profile.pdf}`).toBe(true);
  });

  it('opens the skill tree only once career is decrypted', () => {
    expect(run('skills', shellWith('career')).effect).toEqual({ t: 'skilltree' });
    expect(run('perks', shellWith('career')).effect).toEqual({ t: 'skilltree' });
    const locked = run('skills', shellWith('identity'));
    expect(locked.effect).toBeUndefined();
    expect(error(locked.blocks)).toContain('DATAMINE_V2');
  });

  it('hides the johnny easter egg from help and completion', () => {
    const { blocks } = run('johnny', shellWith());
    expect(blocks.some((b) => b.t === 'samurai')).toBe(true);
    expect(run('Johnny', shellWith()).blocks.some((b) => b.t === 'samurai')).toBe(true);
    expect(JSON.stringify(run('help', shellWith()).blocks)).not.toContain('johnny');
    expect(complete('joh', shellWith())).toBeNull();
  });

  it('lists dot entries only with -a, and completes them once the dot is typed', () => {
    const root = buildDossier(new Set());
    root.children.push({ kind: 'dir', name: '.config', children: [] });
    const shell = { root, cwd: [], unlocked: new Set<string>(), history: [] };
    const names = (input: string) => listing(run(input, shell).blocks).entries.map((e) => e.name);
    expect(names('ls')).not.toContain('.config');
    expect(names('ls -a')).toContain('.config');
    const long = run('ls -la ~', shell).blocks.find((b) => b.t === 'long');
    expect(long?.t === 'long' && long.rows.map((r) => r.entry.name)).toContain('.config');
    expect(listing(run('ls', shell).blocks).hidden).toBe(3);
    expect(complete('cd .c', shell)).toBe('cd .config/');
    expect(error(run('cd .config', shell).blocks)).toBeUndefined();
  });

  it('supports aliases', () => {
    expect(listing(run('ll', shellWith()).blocks)).toBeDefined();
  });
});

describe('complete', () => {
  const shell = shellWith('identity', 'career');

  it('completes commands', () => {
    expect(complete('tr', shell)).toBe('tree ');
    expect(complete('c', shell)).toBeNull();
  });

  it('completes visible paths only', () => {
    expect(complete('cd ca', shell)).toBe('cd career/');
    expect(complete('cat career/sk', shell)).toBe('cat career/skills.txt');
    expect(complete('cd pro', shell)).toBeNull();
  });
});

describe('permissions, base64 and history', () => {
  const text = (blocks: Block[]) =>
    blocks.flatMap((b) => (b.t === 'lines' ? b.lines.map((l) => ('text' in l ? l.text : '')) : []));

  it('applies octal and symbolic modes', () => {
    expect(applyMode(0o644, '600')).toBe(0o600);
    expect(applyMode(0o000, '+r')).toBe(0o444);
    expect(applyMode(0o000, 'u+rw')).toBe(0o600);
    expect(applyMode(0o644, 'go-r')).toBe(0o600);
    expect(applyMode(0o777, 'o=r')).toBe(0o774);
    expect(applyMode(0o644, 'nope')).toBeNull();
    expect(applyMode(0o644, '999')).toBeNull();
  });

  it('shows permissions with ls -l, and refuses to read what is not readable until chmod', () => {
    const shell = shellWith('identity');
    const identity = shell.root.children.find((n) => n.name === 'identity');
    if (identity?.kind !== 'dir') throw new Error('identity is a directory');
    identity.children.push({
      kind: 'file',
      name: 'locked.txt',
      lines: [{ t: 'text', text: 'hi' }],
      mode: 0,
      owner: 'ghost',
    });

    const long = run('ls -l identity', shell).blocks.find((b) => b.t === 'long');
    expect(long?.t === 'long' && long.rows.find((r) => r.entry.name === 'locked.txt')).toMatchObject({
      mode: '----------',
      owner: 'ghost',
    });
    expect(long?.t === 'long' && long.rows[0]).toMatchObject({ mode: '-rw-r--r--', owner: 'sami' });

    expect(error(run('cat identity/locked.txt', shell).blocks)).toBe(
      'cat: identity/locked.txt: Permission denied',
    );
    expect(error(run('base64 identity/locked.txt', shell).blocks)).toContain('Permission denied');
    expect(error(run('chmod +r identity/locked.txt', shell).blocks)).toBeUndefined();
    expect(text(run('cat identity/locked.txt', shell).blocks)).toEqual(['hi']);
    expect(error(run('chmod what identity/locked.txt', shell).blocks)).toBe("chmod: invalid mode: 'what'");
  });

  it('plays an executable animation, and runs nothing else', () => {
    const shell = shellWith('identity');
    const identity = shell.root.children.find((n) => n.name === 'identity');
    if (identity?.kind !== 'dir') throw new Error('identity is a directory');
    identity.children.push({
      kind: 'file',
      name: 'bird',
      lines: [],
      frames: { fps: 4, frames: ['>', ' >'] },
      mode: 0o644,
    });

    expect(error(run('./identity/bird', shell).blocks)).toBe('bash: ./identity/bird: Permission denied');
    run('chmod +x identity/bird', shell);
    expect(run('./identity/bird', shell).effect).toEqual({ t: 'play', fps: 4, frames: ['>', ' >'] });
    expect(error(run('./README.txt', shell).blocks)).toBe('bash: ./README.txt: Permission denied');
    expect(error(run('./identity', shell).blocks)).toBe('bash: ./identity: Is a directory');
    expect(error(run('./nope', shell).blocks)).toBe('bash: ./nope: no such file or directory');
  });

  it('round-trips base64, UTF-8 included, and rejects what is not base64', () => {
    const encoded = encodeBase64('Kabuki — nine seconds');
    expect(decodeBase64(encoded)).toBe('Kabuki — nine seconds');
    expect(
      encodeBase64('x'.repeat(100))
        .split('\n')
        .map((l) => l.length),
    ).toEqual([76, 60]);
    expect(decodeBase64('not base64!')).toBeNull();
  });

  it('lists the commands typed in this shell, numbered', () => {
    const shell = { ...shellWith(), history: ['cd ~/.ghost', 'ls -a'] };
    const lines = run('history', shell).blocks.find((b) => b.t === 'lines');
    expect(lines?.t === 'lines' && lines.lines).toEqual([
      { t: 'field', key: '1', value: 'cd ~/.ghost' },
      { t: 'field', key: '2', value: 'ls -a' },
    ]);
  });
});
