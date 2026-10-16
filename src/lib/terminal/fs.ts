// Virtual filesystem of the dossier terminal: directories gated by dossier sections, and files
// printed as lines, optionally with a card shown in the card viewer.
import type { Education, Job, Series, SideOp } from '../../data/resume';

export type Line =
  | { t: 'text'; text: string }
  | { t: 'heading'; text: string }
  | { t: 'item'; text: string }
  | { t: 'field'; key: string; value: string; href?: string }
  | { t: 'link'; label: string; href: string; note?: string }
  | { t: 'blank' };

/** Rich view of a file, shown in the dossier's card viewer when the file is opened. */
export type Card =
  | { t: 'readme' }
  | { t: 'profile' }
  | { t: 'contact' }
  | { t: 'fixers' }
  | { t: 'soft-skills' }
  | { t: 'job'; job: Job }
  | { t: 'education'; education: Education }
  | { t: 'skills' }
  | { t: 'publication'; series: Series }
  | { t: 'community'; op: SideOp };

/** A card, with the path of the file it belongs to (relative to the root, e.g. 'career/skills.txt'). */
export interface View {
  path: string;
  card: Card;
}

export interface FileNode {
  kind: 'file';
  name: string;
  lines: Line[];
  card?: Card;
  /** Unix permission bits, e.g. 0o644 (the default); `chmod` changes them for the session. */
  mode?: number;
  /** Shown by `ls -l`; `sami` by default. */
  owner?: string;
}

export interface DirNode {
  kind: 'dir';
  name: string;
  children: Node[];
  /** Section that must be unlocked to see or enter this directory. */
  lock?: string;
  mode?: number;
  owner?: string;
}

export type Node = FileNode | DirNode;

export type Resolved =
  | { ok: true; node: Node; path: string[] }
  | { ok: false; reason: 'missing' | 'not-dir' }
  | { ok: false; reason: 'locked'; lock: string; path: string[] };

/**
 * Resolves `input` against `cwd` (both relative to the dossier root, which the
 * shell shows as `~`). Walking into a locked directory stops with its lock.
 */
export function resolve(
  root: DirNode,
  cwd: readonly string[],
  input: string,
  unlocked: ReadonlySet<string>,
): Resolved {
  const parts = input.trim() === '' ? [] : input.trim().split('/');
  let path: string[] = parts[0] === '' || parts[0] === '~' ? [] : [...cwd];
  if (parts[0] === '' || parts[0] === '~') parts.shift();

  for (const part of parts) {
    if (part === '' || part === '.') continue;
    if (part === '..') path = path.slice(0, -1);
    else path = [...path, part];
  }

  let node: Node = root;
  for (let i = 0; i < path.length; i++) {
    if (node.kind !== 'dir') return { ok: false, reason: 'not-dir' };
    const child: Node | undefined = node.children.find((c) => c.name === path[i]);
    if (!child) return { ok: false, reason: 'missing' };
    if (child.kind === 'dir' && child.lock && !unlocked.has(child.lock)) {
      return { ok: false, reason: 'locked', lock: child.lock, path: path.slice(0, i + 1) };
    }
    node = child;
  }
  return { ok: true, node, path };
}

/**
 * Children the visitor can see, and how many stay encrypted. Like a real shell, names starting
 * with a dot are only listed with `all` (`ls -a`); they are not counted as encrypted.
 */
export function visibleChildren(
  dir: DirNode,
  unlocked: ReadonlySet<string>,
  all = false,
): { entries: Node[]; hidden: number } {
  const listed = dir.children.filter((c) => all || !c.name.startsWith('.'));
  const entries = listed.filter((c) => c.kind === 'file' || !c.lock || unlocked.has(c.lock));
  return { entries, hidden: listed.length - entries.length };
}

const DEFAULT_MODE = { file: 0o644, dir: 0o755 };

export const modeOf = (node: Node): number => node.mode ?? DEFAULT_MODE[node.kind];
export const ownerOf = (node: Node): string => node.owner ?? 'sami';

/** Whether the visitor, as the owner, may read the node (its owner read bit). */
export const isReadable = (node: Node): boolean => (modeOf(node) & 0o400) !== 0;

/** Permissions as `ls -l` prints them, e.g. `-rw-r--r--` or `drwxr-xr-x`. */
export function formatMode(node: Node): string {
  const mode = modeOf(node);
  const bits = [...'rwxrwxrwx'].map((letter, i) => (mode & (0o400 >> i) ? letter : '-')).join('');
  return (node.kind === 'dir' ? 'd' : '-') + bits;
}

/** A file's lines as plain text, as `base64` reads them. */
export function plainText(lines: readonly Line[]): string {
  return lines
    .map((line) => {
      switch (line.t) {
        case 'field':
          return `${line.key} ${line.value}`;
        case 'link':
          return `${line.label} ${line.href}`;
        case 'blank':
          return '';
        default:
          return line.text;
      }
    })
    .join('\n');
}

export function formatPath(path: readonly string[]): string {
  return path.length === 0 ? '~' : `~/${path.join('/')}`;
}
