# Working on this repo

Guide for contributors, human or AI. Start with the [README](README.md) for what the site is, and
[LEARN.md](LEARN.md) for a beginner-friendly tour of the whole repository.

## Commands

- `npm run dev`: dev server. `npm test`: unit tests. `npm run build`: type-check and build.
- `npm run format`: format everything (Prettier, with the Svelte and Astro plugins).
- Before committing: `npm run format:check && npm test && npm run build` must all pass.
- `dagger check`: the same checks in containers, exactly as CI runs them (`dagger.toml`).

## Where things live

| To change…                               | Edit                                                       |
| ---------------------------------------- | ---------------------------------------------------------- |
| CV content (jobs, skills, links, bio)    | `src/data/resume.ts`                                       |
| The downloadable PDF CV                  | `public/sami-chibani-cv.pdf` (exported by hand)            |
| Skill tree: perks, locked skills, icons  | `src/data/skilltree.ts`                                    |
| Dossier sections and the daemons per one | `src/lib/daemons.ts`                                       |
| Breach rules / puzzle generation         | `src/lib/breach/` (pure TypeScript, tested)                |
| Terminal commands / virtual files        | `src/lib/terminal/shell.ts`, `src/lib/terminal/dossier.ts` |
| Look and behavior of a screen            | `src/components/<breach,terminal,skilltree>/`              |
| CI checks                                | `dagger.toml` (toolchains), `.github/workflows/ci.yml`     |
| Production image, its web server         | `Dockerfile`, `nginx.conf`, `.github/workflows/cd.yml`     |
| Beginner documentation                   | `LEARN.md`: keep it in sync when the architecture changes  |

Logic lives in `src/lib/` as pure functions with tests; Svelte components render state and handle
input. Keep it that way: if a component grows logic worth testing, move it to `src/lib/`.

## Invariants (tests enforce them)

- **Fan content notice**: CD PROJEKT RED requires it wherever their content is used. It is
  rendered by `src/layouts/Base.astro` on every page and by the skill tree overlay. Every page must
  use `Base`. Never remove it.
- **No CD PROJEKT RED files in git**: the skill tree artwork is downloaded by
  `npm run assets:skilltree` into `public/skilltree/`, which is git-ignored.
- **Skill tree and CV agree**: every CV skill appears once in the tree as acquired; skills marked
  `owned: false` (via `next(...)`) must not be on the CV.
- **Daemon id = section id**: an installed daemon unlocks the dossier directory with the same id.
- **Private extensions**: `src/extensions/` is git-ignored. Add-ons kept in their own repositories
  are copied there and loaded by `src/lib/breach/extension.ts`; the site must work without them.
  CI never sees them; CD adds one when its `EXTENSION_REPO` and `EXTENSION_TOKEN` secrets are set.

## Conventions

- TypeScript strict; Svelte 5 runes (`$state`, `$derived`, `$props`).
- Discriminated unions use `t` for content (`Line`, `Block`, `Card`, `Effect`) and `kind` for
  structure (`Node`, skill tree `Selection`).
- Comments explain why, not what. Prefer deleting code to adding options nobody passes.
- Line endings are LF (`.gitattributes`).
