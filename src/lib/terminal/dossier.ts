import {
  education,
  experience,
  fixers,
  formatMonth,
  links,
  profile,
  publications,
  sideOps,
  skillGroups,
} from '../../data/resume';
import { SECTIONS } from '../daemons';
import type { Card, DirNode, FileNode, Line, Node } from './fs';

const text = (t: string): Line => ({ t: 'text', text: t });
const heading = (t: string): Line => ({ t: 'heading', text: t });
const item = (t: string): Line => ({ t: 'item', text: t });
const field = (key: string, value: string, href?: string): Line => ({ t: 'field', key, value, href });
const blank: Line = { t: 'blank' };

const file = (name: string, lines: Line[], card?: Card): FileNode => ({ kind: 'file', name, lines, card });
const dir = (name: string, children: DirNode['children'], lock?: string): DirNode => ({
  kind: 'dir',
  name,
  children,
  lock,
});

const period = (start: string, end: string | null) => `${formatMonth(start)} — ${formatMonth(end)}`;

function readme(unlocked: ReadonlySet<string>): FileNode {
  const open = SECTIONS.filter((s) => unlocked.has(s.id));
  const locked = SECTIONS.filter((s) => !unlocked.has(s.id));
  return file(
    'README.txt',
    [
      heading(`SUBJECT DOSSIER // ${profile.name.toUpperCase()}`),
      field('ACCESS LEVEL', `${open.length}/${SECTIONS.length}`),
      field('DECRYPTED', open.length ? open.map((s) => `${s.id}/`).join('  ') : 'none'),
      blank,
      text('Navigate like a shell: ls, cd <dir>, cat <file>, tree. Click any entry to open it.'),
      text('Type `help` for every command.'),
      ...(unlocked.has('career') ? [text('Run `skills` to open the skill tree.')] : []),
      ...(locked.length
        ? [
            blank,
            text(
              `${locked.length} encrypted ${locked.length > 1 ? 'directories stay' : 'directory stays'} hidden. ` +
                `Upload ${locked.map((s) => s.daemon).join(', ')} to decrypt: run \`breach\`.`,
            ),
          ]
        : []),
      blank,
      text('No time to hack? Run `cv` for the plain version.'),
    ],
    { t: 'readme' },
  );
}

// Private extensions (git-ignored), in src/extensions/<name>/dossier.ts: extra root entries (the
// default export), and optionally earlier lines of the shell's history (`history`).
const extensions = import.meta.glob<{
  default: (unlocked: ReadonlySet<string>) => Node[];
  history?: () => string[];
}>('/src/extensions/*/dossier.ts', { eager: true });

/** History lines the extensions planted, typed before the visitor's own (oldest first). */
export function plantedHistory(): string[] {
  return Object.values(extensions).flatMap((extension) => extension.history?.() ?? []);
}

export function buildDossier(unlocked: ReadonlySet<string>): DirNode {
  return dir('~', [
    readme(unlocked),
    ...Object.values(extensions).flatMap((extension) => extension.default(unlocked)),

    dir(
      'identity',
      [
        file(
          'profile.txt',
          [
            heading(profile.name.toUpperCase()),
            text(profile.title),
            blank,
            field('LOCATION', profile.location),
            field('LANGUAGES', profile.languages.join(', ')),
            field('ALIASES', profile.aliases.join(' / ')),
            field('INTERESTS', profile.hobbies.join(' / ')),
            blank,
            text(profile.summary),
            blank,
            ...profile.bio.flatMap((p) => [text(p), blank]),
          ],
          { t: 'profile' },
        ),
        file(
          'contact.txt',
          [
            heading('CONTACT CHANNELS'),
            field('EMAIL', profile.email, `mailto:${profile.email}`),
            ...links.map((l) => field(l.label.toUpperCase(), l.handle, l.href)),
          ],
          { t: 'contact' },
        ),
        file(
          'fixers.txt',
          [
            heading('FIXERS'),
            text('Jobs and freelance gigs go through these fixers.'),
            blank,
            ...fixers.map((l) => field(l.label.toUpperCase(), l.handle, l.href)),
          ],
          { t: 'fixers' },
        ),
        file('soft_skills.txt', [heading('SOFT SKILLS'), ...profile.softSkills.map(item)], {
          t: 'soft-skills',
        }),
      ],
      'identity',
    ),

    dir(
      'career',
      [
        dir(
          'experience',
          experience.map((job) =>
            file(
              `${job.start.slice(0, 4)}_${job.slug}.log`,
              [
                heading(`${job.company.toUpperCase()} // ${job.role}`),
                field('PERIOD', period(job.start, job.end)),
                blank,
                ...job.missions.map(item),
              ],
              { t: 'job', job },
            ),
          ),
        ),
        dir(
          'education',
          education.map((e) =>
            file(
              `${e.start.slice(0, 4)}_${e.slug}.txt`,
              [
                heading(`${e.school.toUpperCase()} // ${e.title}`),
                field('PERIOD', period(e.start, e.end)),
                blank,
                ...e.details.map(item),
              ],
              { t: 'education', education: e },
            ),
          ),
        ),
        file(
          'skills.txt',
          [
            heading('HARD SKILLS'),
            ...skillGroups.map((g) => field(g.name.toUpperCase(), g.skills.join(', '))),
          ],
          { t: 'skills' },
        ),
      ],
      'career',
    ),

    dir(
      'projects',
      [
        dir(
          'publications',
          publications.map((s) =>
            file(
              `${s.slug}.md`,
              [
                heading(s.title.toUpperCase()),
                field('PLATFORM', `${s.platform} (${s.language})`),
                blank,
                ...s.articles.map((a): Line => ({ t: 'link', label: a.title, href: a.href, note: a.date })),
              ],
              { t: 'publication', series: s },
            ),
          ),
        ),
        dir(
          'community',
          sideOps.map((op) =>
            file(
              `${op.slug}.txt`,
              [
                heading(op.name.toUpperCase()),
                field('ROLE', `${op.role} since ${op.since}`),
                blank,
                text(op.description),
              ],
              { t: 'community', op },
            ),
          ),
        ),
      ],
      'projects',
    ),
  ]);
}
