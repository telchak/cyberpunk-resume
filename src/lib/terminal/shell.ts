// Commands of the dossier terminal. Pure functions: `run` turns an input line into output blocks,
// a new working directory and optional effects; the Svelte component renders them.
import { profile } from '../../data/resume';
import { SECTIONS } from '../daemons';
import {
  formatMode,
  formatPath,
  isReadable,
  modeOf,
  ownerOf,
  plainText,
  resolve,
  visibleChildren,
  type DirNode,
  type Line,
  type Node,
  type View,
} from './fs';

export interface Entry {
  name: string;
  kind: Node['kind'];
  /** Path relative to the root, used to make the entry clickable. */
  path: string;
}

export type Block =
  | { t: 'command'; cwd: string; input: string }
  | { t: 'lines'; lines: Line[] }
  | { t: 'listing'; entries: Entry[]; hidden: number }
  /** `ls -l`: one row per entry, with its permissions and owner. */
  | { t: 'long'; rows: { mode: string; owner: string; entry: Entry }[]; hidden: number }
  | { t: 'tree'; rows: { depth: number; entry: Entry; last: boolean }[]; hidden: number }
  | { t: 'error'; text: string }
  /** Easter egg: Samurai logo in ASCII art, loaded on demand by the UI. */
  | { t: 'samurai' };

export type Effect =
  { t: 'clear' } | { t: 'navigate'; href: string } | { t: 'download'; href: string } | { t: 'skilltree' };

export interface Shell {
  root: DirNode;
  cwd: string[];
  unlocked: ReadonlySet<string>;
  /** Commands typed in this shell before the current one, oldest first. */
  history: readonly string[];
}

export interface Result {
  blocks: Block[];
  cwd: string[];
  effect?: Effect;
  /** Card to show in the viewer, set when a file with one is printed. */
  view?: View;
}

/** What a command returns; `cwd` is only set when it changes. */
type Output = Omit<Result, 'cwd'> & { cwd?: string[] };

interface Command {
  usage: string;
  help: string;
  run: (args: string[], shell: Shell) => Output;
}

const error = (text: string): Output => ({ blocks: [{ t: 'error', text }] });
const say = (text: string): Output => ({ blocks: [{ t: 'lines', lines: [{ t: 'text', text }] }] });

function lockedMessage(command: string, path: string[], lock: string): string {
  const daemon = SECTIONS.find((s) => s.id === lock)?.daemon ?? 'a daemon';
  return `${command}: ${formatPath(path)}: permission denied — ICE active. Upload ${daemon} to decrypt (run \`breach\`).`;
}

/**
 * A file's permissions after `chmod`: octal (644) or symbolic ([ugoa]* then +, - or = then r, w,
 * x), applied to `mode`. Null for anything else.
 */
export function applyMode(mode: number, spec: string): number | null {
  if (/^[0-7]{3}$/.test(spec)) return parseInt(spec, 8);
  const match = /^([ugoa]*)([+=-])([rwx]+)$/.exec(spec);
  if (!match) return null;
  const [, who, op, perms] = match;
  const shifts = [...(who.replace('a', 'ugo') || 'ugo')].map(
    (w) => ({ u: 6, g: 3, o: 0 })[w as 'u' | 'g' | 'o'],
  );
  const value = [...perms].reduce((sum, p) => sum | { r: 4, w: 2, x: 1 }[p as 'r' | 'w' | 'x'], 0);
  const bits = shifts.reduce((sum, shift) => sum | (value << shift), 0);
  const mask = shifts.reduce((sum, shift) => sum | (7 << shift), 0);
  if (op === '+') return mode | bits;
  if (op === '-') return mode & ~bits;
  return (mode & ~mask) | bits;
}

/** UTF-8 text as base64, wrapped at 76 characters like coreutils' base64. */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const encoded = btoa(String.fromCharCode(...bytes));
  return encoded.match(/.{1,76}/g)?.join('\n') ?? '';
}

/** Decoded base64 as UTF-8 text, ignoring line breaks; null when it is not base64. */
export function decodeBase64(text: string): string | null {
  const clean = text.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) return null;
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(clean), (c) => c.charCodeAt(0)));
  } catch {
    return null;
  }
}

/** Splits arguments into flags (e.g. `-la` gives l and a) and the first path, if any. */
function parseArgs(args: string[]): { flags: Set<string>; target?: string } {
  const flags = new Set(args.filter((a) => a.startsWith('-')).flatMap((a) => [...a.slice(1)]));
  return { flags, target: args.find((a) => !a.startsWith('-')) };
}

/** Resolves a command's path argument, or returns the error that command prints. */
function lookup(command: string, target: string, { root, cwd, unlocked }: Shell) {
  const r = resolve(root, cwd, target, unlocked);
  if (r.ok) return r;
  return error(
    r.reason === 'locked'
      ? lockedMessage(command, r.path, r.lock)
      : `${command}: ${target}: no such file or directory`,
  );
}

function entry(node: Node, parent: string[]): Entry {
  return { name: node.name, kind: node.kind, path: [...parent, node.name].join('/') };
}

const COMMANDS: Record<string, Command> = {
  help: {
    usage: 'help',
    help: 'list available commands',
    run: () => ({
      blocks: [
        {
          t: 'lines',
          lines: [
            { t: 'heading', text: 'AVAILABLE COMMANDS' },
            ...Object.values(COMMANDS).map((c): Line => ({ t: 'field', key: c.usage, value: c.help })),
            { t: 'blank' },
            { t: 'text', text: 'Tab completes names, ↑/↓ browse history. Entries are clickable.' },
          ],
        },
      ],
    }),
  },

  ls: {
    usage: 'ls [-a] [-l] [dir]',
    help: 'list decrypted entries (-a: hidden ones too, -l: permissions)',
    run: (args, shell) => {
      const { flags, target = '.' } = parseArgs(args);
      const r = lookup('ls', target, shell);
      if (!('ok' in r)) return r;
      const listed =
        r.node.kind === 'file'
          ? { entries: [r.node], hidden: 0, parent: r.path.slice(0, -1) }
          : { ...visibleChildren(r.node, shell.unlocked, flags.has('a')), parent: r.path };
      if (flags.has('l')) {
        const rows = listed.entries.map((n) => ({
          mode: formatMode(n),
          owner: ownerOf(n),
          entry: entry(n, listed.parent),
        }));
        return { blocks: [{ t: 'long', rows, hidden: listed.hidden }] };
      }
      const entries = listed.entries.map((n) => entry(n, listed.parent));
      return { blocks: [{ t: 'listing', entries, hidden: listed.hidden }] };
    },
  },

  cd: {
    usage: 'cd [dir]',
    help: 'change directory (`cd ..` to go up)',
    run: ([target = '~'], shell) => {
      const r = lookup('cd', target, shell);
      if (!('ok' in r)) return r;
      if (r.node.kind !== 'dir') return error(`cd: ${target}: not a directory`);
      return { blocks: [], cwd: r.path };
    },
  },

  cat: {
    usage: 'cat <file>',
    help: 'print a file',
    run: ([target], shell) => {
      if (!target) return error('cat: missing file operand');
      const r = lookup('cat', target, shell);
      if (!('ok' in r)) return r;
      if (r.node.kind === 'dir') return error(`cat: ${target}: is a directory`);
      if (!isReadable(r.node)) return error(`cat: ${target}: Permission denied`);
      const view = r.node.card && { path: r.path.join('/'), card: r.node.card };
      return { blocks: [{ t: 'lines', lines: r.node.lines }], view };
    },
  },

  tree: {
    usage: 'tree [-a] [dir]',
    help: 'show decrypted directories as a tree',
    run: (args, shell) => {
      const { flags, target = '.' } = parseArgs(args);
      const r = lookup('tree', target, shell);
      if (!('ok' in r)) return r;
      if (r.node.kind === 'file') return error(`tree: ${target}: not a directory`);
      const rows: Extract<Block, { t: 'tree' }>['rows'] = [];
      let hidden = 0;
      const walk = (dir: DirNode, path: string[], depth: number) => {
        const visible = visibleChildren(dir, shell.unlocked, flags.has('a'));
        hidden += visible.hidden;
        visible.entries.forEach((child, i) => {
          rows.push({ depth, entry: entry(child, path), last: i === visible.entries.length - 1 });
          if (child.kind === 'dir') walk(child, [...path, child.name], depth + 1);
        });
      };
      walk(r.node, r.path, 0);
      return { blocks: [{ t: 'tree', rows, hidden }] };
    },
  },

  chmod: {
    usage: 'chmod <mode> <file>',
    help: "change a file's permissions (e.g. +r, 644)",
    run: ([mode, target], shell) => {
      if (!mode || !target) return error('chmod: missing operand');
      const r = lookup('chmod', target, shell);
      if (!('ok' in r)) return r;
      const next = applyMode(modeOf(r.node), mode);
      if (next === null) return error(`chmod: invalid mode: '${mode}'`);
      // Permissions live on this session's tree: a new visit starts from the defaults.
      r.node.mode = next;
      return { blocks: [] };
    },
  },

  base64: {
    usage: 'base64 [-d] <file>',
    help: 'encode a file in base64, or decode it (-d)',
    run: (args, shell) => {
      const { flags, target } = parseArgs(args);
      if (!target) return error('base64: missing file operand');
      const r = lookup('base64', target, shell);
      if (!('ok' in r)) return r;
      if (r.node.kind === 'dir') return error(`base64: ${target}: is a directory`);
      if (!isReadable(r.node)) return error(`base64: ${target}: Permission denied`);
      const text = plainText(r.node.lines);
      const output = flags.has('d') ? decodeBase64(text) : encodeBase64(text);
      if (output === null) return error('base64: invalid input');
      const lines = output
        .split('\n')
        .map((line): Line => (line ? { t: 'text', text: line } : { t: 'blank' }));
      return { blocks: [{ t: 'lines', lines }] };
    },
  },

  skills: {
    usage: 'skills',
    help: 'open the skill tree (needs ~/career)',
    run: (_, { unlocked }) => {
      if (!unlocked.has('career')) return error(lockedMessage('skills', ['career'], 'career'));
      return { ...say('//LOADING SKILL TREE...'), effect: { t: 'skilltree' } };
    },
  },

  pwd: {
    usage: 'pwd',
    help: 'print the current directory',
    run: (_, { cwd }) => say(formatPath(cwd)),
  },

  history: {
    usage: 'history',
    help: 'show the commands typed in this shell',
    run: (_, { history }) => ({
      blocks: [
        {
          t: 'lines',
          lines: history.map((command, i): Line => ({ t: 'field', key: String(i + 1), value: command })),
        },
      ],
    }),
  },

  whoami: {
    usage: 'whoami',
    help: 'show your access level',
    run: (_, { unlocked }) => ({
      blocks: [
        {
          t: 'lines',
          lines: [
            { t: 'field', key: 'USER', value: 'visitor (netrunner, unverified)' },
            {
              t: 'field',
              key: 'ACCESS',
              value: `${SECTIONS.filter((s) => unlocked.has(s.id)).length}/${SECTIONS.length}`,
            },
            ...SECTIONS.map((s): Line => ({
              t: 'field',
              key: s.daemon,
              value: unlocked.has(s.id) ? `UPLOADED  → ~/${s.id}` : 'MISSING',
            })),
          ],
        },
      ],
    }),
  },

  clear: {
    usage: 'clear',
    help: 'clear the screen',
    run: () => ({ blocks: [], effect: { t: 'clear' } }),
  },

  breach: {
    usage: 'breach',
    help: 'jack back into the breach protocol to decrypt more',
    run: () => ({ ...say('//JACKING IN...'), effect: { t: 'navigate', href: '/' } }),
  },

  cv: {
    usage: 'cv',
    help: 'open the plain, non-hacky CV',
    run: () => ({ ...say('//OPENING PLAIN CV...'), effect: { t: 'navigate', href: '/cv' } }),
  },

  shard: {
    usage: 'shard',
    help: 'copy the dossier to a data shard (download the CV as a PDF)',
    run: () => ({
      blocks: [
        {
          t: 'lines',
          lines: [
            { t: 'text', text: '//COPYING DOSSIER TO DATA SHARD ...' },
            { t: 'text', text: `//SHARD WRITTEN: ${profile.pdf.slice(1)}` },
          ],
        },
      ],
      effect: { t: 'download', href: profile.pdf },
    }),
  },

  exit: {
    usage: 'exit',
    help: 'disconnect',
    run: () => ({ ...say('//CONNECTION CLOSED'), effect: { t: 'navigate', href: '/' } }),
  },
};

const ALIASES: Record<string, string> = {
  ll: 'ls',
  dir: 'ls',
  more: 'cat',
  less: 'cat',
  logout: 'exit',
  '?': 'help',
  perks: 'skills',
  build: 'skills',
  download: 'shard',
  extract: 'shard',
  exfiltrate: 'shard',
  dump: 'shard',
};

/** Easter eggs: matched case-insensitively, deliberately left out of `help` and tab completion. */
const HIDDEN: Record<string, () => Output> = {
  johnny: () => ({
    blocks: [
      { t: 'samurai' },
      {
        t: 'lines',
        lines: [
          { t: 'blank' },
          { t: 'heading', text: 'Wake up, Samurai. We have a city to burn.' },
          { t: 'text', text: '// relic malfunction detected. engram signature: SILVERHAND, J.' },
        ],
      },
    ],
  }),
  sudo: () => error('sudo: nice try. ICE does not negotiate with root.'),
};

export function run(input: string, shell: Shell): Result {
  const [name = '', ...args] = input.trim().split(/\s+/).filter(Boolean);
  const echo: Block = { t: 'command', cwd: formatPath(shell.cwd), input };
  if (!name) return { blocks: [echo], cwd: shell.cwd };

  const command = COMMANDS[ALIASES[name] ?? name];
  const hidden = HIDDEN[name.toLowerCase()];
  let output: Output;
  if (command) output = command.run(args, shell);
  else if (hidden) output = hidden();
  else output = error(`${name}: command not found. Type \`help\`.`);

  return {
    blocks: [echo, ...output.blocks],
    cwd: output.cwd ?? shell.cwd,
    effect: output.effect,
    view: output.view,
  };
}

/** Completes the last word of `input`, or returns null when there is no unique completion. */
export function complete(input: string, shell: Shell): string | null {
  const words = input.split(' ');
  const last = words[words.length - 1];

  if (words.length === 1) {
    const matches = Object.keys(COMMANDS).filter((c) => c.startsWith(last));
    return matches.length === 1 ? `${matches[0]} ` : null;
  }

  const slash = last.lastIndexOf('/');
  const base = slash === -1 ? '.' : last.slice(0, slash + 1) || '/';
  const prefix = last.slice(slash + 1);
  const r = resolve(shell.root, shell.cwd, base, shell.unlocked);
  if (!r.ok || r.node.kind !== 'dir') return null;

  // Hidden entries only complete once their leading dot is typed, like a real shell.
  const all = prefix.startsWith('.');
  const matches = visibleChildren(r.node, shell.unlocked, all).entries.filter((n) =>
    n.name.startsWith(prefix),
  );
  if (matches.length !== 1) return null;
  const match = matches[0];
  words[words.length - 1] = last.slice(0, slash + 1) + match.name + (match.kind === 'dir' ? '/' : '');
  return words.join(' ');
}
