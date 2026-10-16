import { describe, expect, it } from 'vitest';
import { dig, parseDig } from './dns';
import { run } from './shell';
import { buildDossier } from './dossier';

const answer = (body: object) => (async () => new Response(JSON.stringify(body))) as unknown as typeof fetch;

describe('parseDig', () => {
  it('takes a name, a type in either place or after -t, and +short', () => {
    expect(parseDig(['example.com'])).toEqual({ name: 'example.com', type: 'A', short: false });
    expect(parseDig(['txt', '_engram.example.com.'])).toEqual({
      name: '_engram.example.com',
      type: 'TXT',
      short: false,
    });
    expect(parseDig(['example.com', '-t', 'mx', '+short'])).toEqual({
      name: 'example.com',
      type: 'MX',
      short: true,
    });
    expect(parseDig(['example.com', '+noall', '+answer'])).toEqual({
      name: 'example.com',
      type: 'A',
      short: false,
    });
  });

  it('explains what is wrong', () => {
    expect(parseDig([])).toContain('missing name');
    expect(parseDig(['example.com', '-t', 'HINFO'])).toContain('unsupported type HINFO');
    expect(parseDig(['exa mple'])).toBeTypeOf('string');
    expect(parseDig(['<script>'])).toContain('invalid name');
  });
});

describe('dig', () => {
  it('prints the answer section like dig', async () => {
    const lines = await dig(
      { name: 'example.com', type: 'TXT', short: false },
      answer({ Status: 0, Answer: [{ name: 'example.com', type: 16, TTL: 300, data: '"hello"' }] }),
    );
    expect(lines.map((l) => ('text' in l ? l.text : ''))).toEqual([
      '; <<>> DiG <<>> example.com TXT',
      ';; status: NOERROR, answers: 1',
      '',
      ';; ANSWER SECTION:',
      'example.com.  300  IN  TXT  "hello"',
    ]);
  });

  it('prints only the data with +short, and the status when nothing answers', async () => {
    const short = await dig(
      { name: 'example.com', type: 'A', short: true },
      answer({ Status: 0, Answer: [{ name: 'example.com', type: 1, TTL: 60, data: '192.0.2.1' }] }),
    );
    expect(short).toEqual([{ t: 'text', text: '192.0.2.1' }]);
    const missing = await dig({ name: 'nope.example.com', type: 'A', short: false }, answer({ Status: 3 }));
    expect(missing.at(-1)).toEqual({ t: 'text', text: ';; status: NXDOMAIN, answers: 0' });
  });

  it('is a terminal command that hands the lookup to the terminal', () => {
    const set = new Set<string>();
    const shell = { root: buildDossier(set), cwd: [], unlocked: set, history: [] };
    expect(run('dig example.com TXT', shell).effect).toEqual({
      t: 'dig',
      query: { name: 'example.com', type: 'TXT', short: false },
    });
  });
});
