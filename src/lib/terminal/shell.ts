// Commands of the dossier terminal. Pure functions: `run` turns an input line into output blocks,
// a new working directory and optional effects; the Svelte component renders them.
import { SECTIONS } from '../daemons';
import { formatPath, resolve, visibleChildren, type DirNode, type Line, type Node, type View } from './fs';

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
  | { t: 'tree'; rows: { depth: number; entry: Entry; last: boolean }[]; hidden: number }
  | { t: 'error'; text: string }
  /** Easter egg: Samurai logo in ASCII art, loaded on demand by the UI. */
  | { t: 'samurai' };

export type Effect = { t: 'clear' } | { t: 'navigate'; href: string } | { t: 'skilltree' };

export interface Shell {
  root: DirNode;
  cwd: string[];
  unlocked: ReadonlySet<string>;
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
    usage: 'ls [-a] [dir]',
    help: 'list decrypted entries (-a: hidden ones too)',
    run: (args, shell) => {
      const { flags, target = '.' } = parseArgs(args);
      const r = lookup('ls', target, shell);
      if (!('ok' in r)) return r;
      if (r.node.kind === 'file') {
        return { blocks: [{ t: 'listing', entries: [entry(r.node, r.path.slice(0, -1))], hidden: 0 }] };
      }
      const { entries, hidden } = visibleChildren(r.node, shell.unlocked, flags.has('a'));
      return { blocks: [{ t: 'listing', entries: entries.map((n) => entry(n, r.path)), hidden }] };
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
