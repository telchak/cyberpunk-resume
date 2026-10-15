# samichibani.pro

[![Continuous Integration](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Personal resume site. The home page is a recreation of Cyberpunk 2077's Breach Protocol: visitors
"hack" the terminal, and each uploaded daemon decrypts a directory of the dossier, a
fake shell (`/dossier`) where visitors browse only what they managed to hack. A plain CV stays
one click away (`/cv`).

This is an unofficial fan work and is not approved/endorsed by CD PROJEKT RED. The breach UI is
rebuilt in CSS/SVG and set in Rajdhani. The skill tree reuses artwork from the official Cyberpunk 2077
build planner (© CD PROJEKT RED, used as non-commercial fan content under their
[fan content guidelines](https://www.cdprojektred.com/en/fan-content)); it is not stored in this
repository: run `npm run assets:skilltree` to download it into `public/skilltree/`.

New to web development? [LEARN.md](LEARN.md) walks through this whole repository step by step.

## Stack

- [Astro](https://astro.build) for static pages, with the terminal as a [Svelte](https://svelte.dev) island
- Logic in plain TypeScript under `src/lib/`, tested with [Vitest](https://vitest.dev)
- CI/CD with [Dagger](https://dagger.io); in production, the static files are served by nginx

## Commands

| Command                    | Action                                                   |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Dev server on `http://localhost:4321`                    |
| `npm test`                 | Unit tests                                               |
| `npm run build`            | Type-check and build the static site to `dist/`          |
| `npm run preview`          | Serve the built site                                     |
| `npm run assets:skilltree` | Download the skill tree artwork into `public/skilltree/` |
| `npm run format`           | Format the code (Prettier)                               |
| `dagger check`             | Run every CI check in containers, exactly as CI does     |

Append `?seed=<number>` to the home URL to replay a specific puzzle.

## CI/CD

Two GitHub Actions workflows, both running [Dagger](https://dagger.io):

- **Continuous Integration** (`.github/workflows/ci.yml`), on every push and pull request: `dagger check`
  runs the two toolchains listed in `dagger.toml`, [dagger/prettier](https://github.com/dagger/prettier)
  (formatting) and [dagger/vitest](https://github.com/dagger/vitest) (type-check, build, unit tests).
- **Continuous Delivery** (`.github/workflows/cd.yml`), once CI has passed on `main`: builds the
  `Dockerfile` (the site, served by nginx with `nginx.conf`) and pushes it to
  `ghcr.io/<owner>/<repo>:main-<run>-<commit>`. Whatever runs the site pulls new tags from there.

To try the production image locally:

```sh
docker build -t samichibani-pro . && docker run --rm -p 8080:8080 samichibani-pro
```

## Layout

```
src/data/              resume.ts (CV content), skilltree.ts (skill tree content)
src/lib/breach/        breach rules (engine), solvable puzzle generator, seeded RNG
src/lib/terminal/      dossier terminal: virtual filesystem, its files, shell commands, ASCII art
src/lib/daemons.ts     dossier sections and the daemon that unlocks each one
src/components/        Svelte UI: breach/, terminal/, skilltree/
src/layouts/Base.astro page shell, renders the fan content notice
src/pages/             index (breach), dossier, cv, 404
scripts/               fetch-planner-assets.mjs (skill tree artwork download)
dagger.toml            CI checks (Dagger toolchains), pinned in dagger.lock
.github/workflows/     ci.yml, cd.yml
Dockerfile, nginx.conf production image
```

Contributing (humans and agents): see [AGENTS.md](AGENTS.md).

## Credits

This site stands on the shoulders of a lot of generous people. Thank you, all of you.

**The game.** [CD PROJEKT RED](https://www.cdprojektred.com), for Cyberpunk 2077 and the Breach
Protocol minigame this site recreates, for the [build planner](https://www.cyberpunk.net/en/build-planner)
whose artwork brings the skill tree to life, for the Samurai logo, and for
[fan content guidelines](https://www.cdprojektred.com/en/fan-content) generous
enough to make projects like this one possible.

**The projects that showed the way.** Before writing a line, we studied how others had taken the
Breach Protocol apart:

- [yet3/cyberpunk2077-breach-protocol](https://github.com/yet3/cyberpunk2077-breach-protocol), a fan
  recreation of the minigame in the browser: the proof that the idea works on the web.
- [marcincichocki/breach-protocol-autosolver](https://github.com/marcincichocki/breach-protocol-autosolver),
  which solves breaches in seconds: its precise take on the rules (rows and columns, buffer,
  overlapping daemon sequences) shaped our engine.
- [Chiplis/cyberpwned](https://github.com/Chiplis/cyberpwned), the solver app that taught a whole
  community how the puzzle really works.
- [Every hand is solvable](https://dev.to/bbeycanov/every-hand-is-solvable-engineering-a-block-puzzle-that-never-cheats-38jp),
  by Beycan Beycanov, for the idea behind our generator: build the solution first, then hide it,
  so every puzzle can be won.
- The [Cyberpunk Wiki](https://cyberpunk.fandom.com/wiki/Breach_Protocol) and
  [Fextralife](https://cyberpunk2077.wiki.fextralife.com/Breach) communities, for documenting
  every detail of the minigame.
- [akveo/nebular](https://github.com/akveo/nebular), the Angular UI library that powered the
  previous version of this site for years.

**The tools.** [Astro](https://github.com/withastro/astro), [Svelte](https://github.com/sveltejs/svelte),
[Vitest](https://github.com/vitest-dev/vitest), [Prettier](https://github.com/prettier/prettier),
[TypeScript](https://github.com/microsoft/TypeScript), [Dagger](https://github.com/dagger/dagger) and
its [vitest](https://github.com/dagger/vitest) and [prettier](https://github.com/dagger/prettier)
toolchains, and [nginx](https://nginx.org). The fonts are
[Rajdhani](https://fonts.google.com/specimen/Rajdhani) by the Indian Type Foundry and
[Share Tech Mono](https://fonts.google.com/specimen/Share+Tech+Mono) by Carrois Apostrophe, both
under the SIL Open Font License, packaged by [Fontsource](https://github.com/fontsource/fontsource).

## License

The code is under the [MIT license](LICENSE): reuse it freely for your own site. Not covered by it:

- The CV content (`src/data/resume.ts`): it describes a real person. Make the site yours with your
  own story.
- Cyberpunk 2077, its names, logos and artwork: © CD PROJEKT RED, used as fan content, as described
  above.
