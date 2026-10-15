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
}

export interface DirNode {
  kind: 'dir';
  name: string;
  children: Node[];
  /** Section that must be unlocked to see or enter this directory. */
  lock?: string;
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

export function formatPath(path: readonly string[]): string {
  return path.length === 0 ? '~' : `~/${path.join('/')}`;
}
