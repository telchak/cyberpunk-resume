# Learn this repository, step by step

This guide is for students who are just starting with web development. It explains how this
website is built, from "what is a web page?" up to "how does a new version go online?". You don't
need to know anything about the tools used here: each one is introduced when it first shows up.

Read it in order the first time. Each chapter builds on the previous ones. Words in **bold** are
explained in the [glossary](#22-glossary) at the end.

**Contents**

1. [What this website does](#1-what-this-website-does)
2. [Run it on your computer](#2-run-it-on-your-computer)
3. [The big picture: from source code to your browser](#3-the-big-picture-from-source-code-to-your-browser)
4. [A tour of the folders](#4-a-tour-of-the-folders)
5. [The languages: HTML, CSS, JavaScript and TypeScript](#5-the-languages-html-css-javascript-and-typescript)
6. [Node.js, npm and package.json](#6-nodejs-npm-and-packagejson)
7. [Astro: the pages](#7-astro-the-pages)
8. [Svelte: the interactive parts](#8-svelte-the-interactive-parts)
9. [The golden rule: logic in `src/lib/`, display in `src/components/`](#9-the-golden-rule-logic-in-srclib-display-in-srccomponents)
10. [The breach game, step by step](#10-the-breach-game-step-by-step)
11. [The dossier terminal](#11-the-dossier-terminal)
12. [The skill tree](#12-the-skill-tree)
13. [The plain CV](#13-the-plain-cv)
14. [Tests with Vitest](#14-tests-with-vitest)
15. [Keeping the code tidy: Prettier, EditorConfig, Git settings](#15-keeping-the-code-tidy-prettier-editorconfig-git-settings)
16. [Containers and Docker](#16-containers-and-docker)
17. [nginx: the web server](#17-nginx-the-web-server)
18. [CI/CD: checking and shipping automatically](#18-cicd-checking-and-shipping-automatically)
19. [Dagger: CI that also runs on your computer](#19-dagger-ci-that-also-runs-on-your-computer)
20. [Going online: from the image to samichibani.pro](#20-going-online-from-the-image-to-samichibanipro)
21. [Your first changes](#21-your-first-changes)
22. [Glossary](#22-glossary)

---

## 1. What this website does

The website is an online CV (a resume) disguised as a video game. It has three pages:

- **`/` (home): the breach.** A copy of the "Breach Protocol" hacking minigame from the video game
  Cyberpunk 2077. You see a grid of codes (like `1C`, `55`, `BD`). You pick codes one by one to
  build sequences called **daemons**. Each daemon you complete "decrypts" a part of the CV.
- **`/dossier`: the terminal.** A fake command line, like the ones developers use. You type
  commands such as `ls` (list files) or `cat profile.txt` (show a file) to read the CV. Only the
  parts you decrypted in the breach are visible. A card on the right shows the open file nicely.
  The `skills` command opens a skill tree, drawn like the game's own.
- **`/cv`: the plain CV.** The same information, as a normal page you can read or print, for
  people who don't want to play.

Try them on the live site, [samichibani.pro](https://samichibani.pro), before reading on: everything
below will make more sense.

## 2. Run it on your computer

You need three things installed:

- [Git](https://git-scm.com), to download the code.
- [Node.js](https://nodejs.org) version 24, which runs JavaScript outside a browser. It comes with
  **npm**, which installs the libraries the project uses.
- A code editor. [VS Code](https://code.visualstudio.com) is a good free choice.

Then, in a terminal:

```sh
git clone <the address of this repository>
cd <the folder git just created>
npm install              # downloads the libraries listed in package.json
npm run assets:skilltree # optional: downloads the skill tree pictures
npm run dev              # starts a local web server
```

Open `http://localhost:4321` in your browser. Leave `npm run dev` running: when you save a file, the
page updates by itself. Press `Ctrl+C` in the terminal to stop it.

> **Tip:** add `?seed=42` to the address (`http://localhost:4321/?seed=42`) to always get the same
> puzzle. Handy when you change something and want to compare.

## 3. The big picture: from source code to your browser

When you open a website, your browser downloads files from a computer somewhere (a **server**) and
displays them. There are three kinds of files:

| File               | Role                               | Comparison with a house |
| ------------------ | ---------------------------------- | ----------------------- |
| HTML (`.html`)     | the content and its structure      | the walls and the rooms |
| CSS (`.css`)       | the look: colors, sizes, positions | the paint and furniture |
| JavaScript (`.js`) | the behavior: reacting to clicks   | the electricity         |

We don't write those files directly. We write **source code** in more comfortable formats (`.astro`,
`.svelte`, `.ts`), and a **build** step turns it into plain HTML, CSS and JavaScript:

```
 what we write                 build                 what the browser gets
 src/  (.astro .svelte .ts) ── npm run build ──▶ dist/  (.html .css .js)
                                                     │
                                                     ▼
                                     nginx (a web server) sends these files
                                                     │
                                                     ▼
                                              your browser
```

This site is **static**: the build produces finished files once, and the server only sends them,
without computing anything per visitor. Everything that moves (the game, the terminal) runs as
JavaScript inside the visitor's browser. Static sites are simple, fast and cheap to host.

## 4. A tour of the folders

```
.
├── src/                    the source code of the site
│   ├── pages/              one file per page: index (/), dossier, cv, 404
│   ├── layouts/Base.astro  the frame shared by every page (<head>, fonts, the fan notice)
│   ├── components/         the interactive parts, in Svelte
│   │   ├── breach/         the hacking minigame
│   │   ├── terminal/       the dossier terminal and its cards
│   │   └── skilltree/      the skill tree overlay
│   ├── lib/                the logic, in plain TypeScript, with its tests
│   │   ├── breach/         the game rules and the puzzle generator
│   │   ├── terminal/       the fake file system and the shell commands
│   │   ├── daemons.ts      which daemon unlocks which part of the CV
│   │   └── unlocks.ts      remembers what you decrypted
│   ├── data/               the content: resume.ts (the CV), skilltree.ts
│   └── styles/global.css   colors and fonts used everywhere
├── public/                 files copied as they are (favicon, downloaded artwork)
├── scripts/                small helper programs (downloading the artwork)
├── package.json            the project's identity card: libraries and commands
├── astro.config.mjs        settings of Astro (the site builder)
├── vitest.config.ts        settings of Vitest (the test runner)
├── dagger.toml             the checks CI runs (chapter 19)
├── .github/workflows/      the CI/CD workflows (chapter 18)
├── Dockerfile, nginx.conf  how the production server is packaged (chapters 16 and 17)
├── README.md               what the project is, in short
├── AGENTS.md               rules for contributors, humans and AI assistants
└── LEARN.md                this guide
```

Files starting with a dot (`.gitignore`, `.prettierrc.json`...) are settings for tools. Many
editors hide them; they are explained in chapter 15.

## 5. The languages: HTML, CSS, JavaScript and TypeScript

**HTML** describes content with tags: `<h1>Sami Chibani</h1>` is a title, `<a href="/cv">` a link.

**CSS** describes the look: `color: red;` or `font-size: 2rem;`. In this project, each component
keeps its CSS next to its HTML (in a `<style>` block), and `src/styles/global.css` holds the shared
colors, as **CSS variables** like `--yellow`.

**JavaScript** is the programming language of browsers: it reacts to clicks and keys, and changes
the page.

**TypeScript** is JavaScript plus **types**. A type describes the shape of a value. Look at
`src/lib/breach/types.ts`:

```ts
export interface Pos {
  row: number;
  col: number;
}
```

This says "a `Pos` is an object with a `row` and a `col`, both numbers". If you write
`{ row: 'two' }` somewhere a `Pos` is expected, your editor underlines it in red **before** you run
anything. Types catch mistakes early and document the code. The browser never sees them: the build
removes them, leaving plain JavaScript.

Two TypeScript tricks used a lot here:

- **Union types**: `type Phase = 'ready' | 'running' | 'ended'` means "one of these three strings,
  nothing else".
- **Discriminated unions**: several shapes, told apart by one field. In
  `src/lib/terminal/fs.ts`, a `Line` is either `{ t: 'text', text }`, `{ t: 'heading', text }`, and
  so on. Code that receives a line checks `line.t` to know which one it has. In this project, the
  field is called `t` for content and `kind` for structure (for example a file system `Node` is
  `kind: 'file'` or `kind: 'dir'`).

## 6. Node.js, npm and package.json

**Node.js** runs JavaScript on your computer instead of in a browser. All the tools of this project
(the builder, the tests, the formatter) are JavaScript programs, so they need Node.

**npm** (Node Package Manager) downloads **packages**: code written by other people that we reuse.
Open `package.json`:

- `dependencies` and `devDependencies` list the packages we use, with their versions.
  `devDependencies` are only needed while developing (tests, formatter), not to run the site.
- `scripts` are shortcuts: `npm run build` runs `astro check && astro build`.

`npm install` downloads the packages into `node_modules/` (huge, never committed to Git).
`package-lock.json` records the exact version of every package, including the packages our packages
use, so everyone gets exactly the same ones. Commit it, never edit it by hand.

The packages, in plain words:

| Package                                               | What it does for us                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `astro`                                               | builds the pages (chapter 7)                                          |
| `svelte`, `@astrojs/svelte`                           | the interactive components, and their connection to Astro (chapter 8) |
| `typescript`, `@astrojs/check`                        | checks the types of every file                                        |
| `@fontsource/rajdhani`, `@fontsource/share-tech-mono` | the two fonts, stored with the site instead of loaded from Google     |
| `vitest`                                              | runs the tests (chapter 14)                                           |
| `prettier` and its plugins                            | formats the code (chapter 15)                                         |
| `@types/node`                                         | the types of Node.js itself, for scripts and tests                    |

## 7. Astro: the pages

[Astro](https://astro.build) is a **static site builder**: it turns `.astro` files into HTML pages.
Each file in `src/pages/` becomes a page, named after the file: `cv.astro` becomes `/cv`,
`index.astro` becomes `/`.

An `.astro` file has two parts. Look at `src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import BreachProtocol from '../components/breach/BreachProtocol.svelte';
---

<Base title="Sami Chibani — Breach Protocol" notice="pinned">
  <main>
    <BreachProtocol client:only="svelte" />
  </main>
</Base>
```

- Between the `---` fences: code that runs **during the build**, on your computer, never in the
  browser. Here it only imports other files.
- Below: HTML, with components used like tags.

**Layouts.** `src/layouts/Base.astro` is the frame around every page: the `<head>` with the title
and description, the fonts, and the fan content notice at the bottom (CD PROJEKT RED requires it on
fan works). Every page wraps its content in `<Base>`; a test checks that none forgets it.

**Islands.** Most of a page is fixed HTML. Only the interactive parts ship JavaScript, as
**islands** in a sea of static HTML. `client:only="svelte"` tells Astro: "this component is
interactive, run it in the browser". The CV page has no island at all: it is pure HTML, which is why
it loads instantly and prints well.

## 8. Svelte: the interactive parts

[Svelte](https://svelte.dev) is a tool for building **components**: reusable pieces of interface,
each in its own `.svelte` file, holding its logic (`<script>`), its HTML and its CSS (`<style>`).

What makes a component interactive is **state**: values that, when they change, update the screen
by themselves. Svelte 5 marks them with **runes**, special words starting with `$`:

```svelte
<script lang="ts">
  let count = $state(0); // state: changing it updates the page
  const double = $derived(count * 2); // derived: recomputed when count changes
</script>

<button onclick={() => count++}>Clicked {count} times ({double})</button>
```

- `$state(...)`: a value that changes over time.
- `$derived(...)`: a value computed from others, always up to date.
- `$props()`: the inputs a component receives from its parent, like the attributes of an HTML tag.

You will find all three in `src/components/breach/BreachProtocol.svelte`: the game state is a
`$state`, and the buffer shown at the top is `$derived` from it. When the player clicks a code, the
state changes, and Svelte redraws exactly the parts that depend on it.

Components are assembled like Lego: `BreachProtocol.svelte` uses `CodeMatrix.svelte` (the grid),
`DaemonPanel.svelte` (the list of daemons) and `EndPanel.svelte` (the end screen), passing each one
the data it needs through props, and receiving events back (`onpick`, `onretry`...).

## 9. The golden rule: logic in `src/lib/`, display in `src/components/`

This is the most important idea of the repository's architecture:

- **`src/lib/`** holds the **logic**: the rules of the game, the commands of the terminal. It is
  written as **pure functions**: they receive values and return new values, without touching the
  screen, the clock or anything else. Same input, same output, every time.
- **`src/components/`** holds the **display**: it shows the current state and turns clicks and
  keys into calls to the logic.

Why? Because pure functions are easy to understand and easy to **test**: you call a function and
check its result, no browser needed (chapter 14). If the game had its rules mixed into the code that
draws it, checking the rules would mean clicking through the game by hand.

When you add a feature, ask yourself: "is this a rule or a picture?" Rules go to `src/lib/` with a
test; pictures go to `src/components/`.

## 10. The breach game, step by step

Let's follow a game, file by file.

**1. What to play for: `src/lib/daemons.ts`.** It lists the three CV sections (`identity`,
`career`, `projects`) and, for each, the daemon that unlocks it (`DATAMINE_V1`, `V2`, `V3`) and its
length in codes. It also sets the game's options: a 6×6 grid, a buffer of 8 codes, 30 seconds.

**2. Making a puzzle: `src/lib/breach/generator.ts`.** A random grid could be impossible to solve.
So the generator works backwards, **solvable by construction**:

1. invent the daemon sequences and chain them into one string of codes (sometimes overlapping, the
   end of one being the start of the next);
2. draw a valid path through the grid (first in the top row, then alternately down a column and
   across a row, never twice on the same cell);
3. write the chained codes along that path;
4. fill the other cells at random.

The solution exists because we put it there before hiding it among random codes.

**3. Randomness you can replay: `src/lib/breach/random.ts`.** Computers make "random" numbers with
formulas. Starting from the same **seed** number, the formula gives the same series every time.
That's why `?seed=42` always shows the same puzzle: perfect for testing and for sharing a puzzle.

**4. The rules: `src/lib/breach/engine.ts`.** The game is a **state**: an object saying which cells
were picked, which row or column is active, how each daemon is doing, and whether the game is
ready, running or ended (see `BreachState` in `types.ts`). The engine's functions take a state and
return a **new** state, without modifying the old one:

```ts
const start = createBreach(puzzle); // a fresh game
const next = pick(start, { row: 0, col: 2 }); // the game after picking a cell
```

`pick` checks that the move is allowed, adds the code to the buffer, switches between rows and
columns, marks daemons as installed or failed, and ends the game when the buffer is full, every
daemon is decided, or no cell is left. Never changing a state in place (**immutability**) makes the
code easy to follow: each state is a snapshot, like a frame of a film.

**5. Drawing and clicking: `src/components/breach/`.** `BreachProtocol.svelte` keeps the current
state in a `$state`. A click on a cell calls `pick`, stores the new state, and the screen follows.
It also runs the clock with `requestAnimationFrame` (a browser function that calls your code before
each screen refresh) and starts it on the first pick, like the game does.

**6. Remembering: `src/lib/unlocks.ts`.** At the end of a game, the sections of the installed
daemons are saved in the browser's **localStorage**, a small storage space each website gets in
your browser, which survives closing the tab. The terminal reads it to know what you decrypted.

> **About `src/extensions/`:** the breach can load optional add-ons kept in other repositories
> (`src/lib/breach/extension.ts`). That folder is ignored by Git and empty in this repository, and
> the site works the same without it. You can ignore it while learning.

## 11. The dossier terminal

**A fake file system: `src/lib/terminal/fs.ts` and `dossier.ts`.** The terminal shows folders and
files, but none of them exist on a disk: they are a **tree** of JavaScript objects, built from
`src/data/resume.ts`. A folder (`kind: 'dir'`) has children; a file (`kind: 'file'`) has lines of
text, and sometimes a **card**, the nicer view shown on the right. Locked folders carry the id of
the section that unlocks them; `resolve` walks the tree to find what a path like
`~/career/skills.txt` points to, and refuses to enter locked folders.

**The commands: `src/lib/terminal/shell.ts`.** Each command (`ls`, `cd`, `cat`, `tree`, `help`...)
is an entry in a table, `COMMANDS`, with a short description and a `run` function. The main function,
`run(input, shell)`, splits what you typed into a command name and arguments, finds the command, and
returns what to show (**blocks** of output), the new current folder, and maybe an **effect**
(clear the screen, go to another page, open the skill tree). It never draws anything: it only
describes the result. Adding a command means adding an entry to `COMMANDS`, plus a test.

`complete` does the Tab key: it finds the only name that starts with what you typed.

**The screen: `src/components/terminal/Terminal.svelte`.** It keeps the history of blocks in a
`$state`, sends what you type to `run`, and draws each block according to its `t`: lines, listings,
trees, errors. `CardView.svelte` draws the card of the last opened file.

## 12. The skill tree

The `skills` command opens an overlay that imitates the official Cyberpunk 2077 build planner.

- **The content: `src/data/skilltree.ts`.** Attributes (like "Infrastructure") hold perks (like
  "Orchestration"), which hold tools (like "Kubernetes"). Tools come from the CV's skill list; tools marked with `next(...)`
  are not acquired yet and appear locked. A test checks that the skill tree and the CV agree.
- **The geometry: `src/components/skilltree/layout.ts`.** Pure functions that compute where each
  tile and cable goes, in the planner's own coordinates. Tested like any other logic.
- **The pictures: `sprites.ts`.** The planner stores all its icons in a few big images called
  **sprite sheets**. `sprites.ts` lists where each icon sits in them; CSS shows only that part.

The pictures belong to CD PROJEKT RED, so they are **not** stored in this repository:
`npm run assets:skilltree` (`scripts/fetch-planner-assets.mjs`) downloads them into
`public/skilltree/`, which Git ignores. Without them, the skill tree still works, with plain tiles.

## 13. The plain CV

`src/pages/cv.astro` reads the same `src/data/resume.ts` as the terminal and turns it into a classic
page, with no JavaScript at all. Two details worth knowing:

- **One source of truth.** The CV, the terminal and the skill tree all read `resume.ts`. Change your
  job title there, and every page follows.
- **Structured data.** The page includes a hidden block of **JSON-LD** (`schema.org/Person`) that
  describes the person to search engines in a format they understand.

## 14. Tests with Vitest

A **unit test** is a small program that checks that a piece of code does what it should. Tests sit
next to the code they check, in files ending with `.test.ts`. From
`src/lib/breach/engine.test.ts`:

```ts
it('starts on the top row', () => {
  const state = createBreach(PUZZLE);
  expect(state.phase).toBe('ready');
  expect(canPick(state, { row: 1, col: 0 })).toBe(false);
});
```

`it` names one expectation; `expect(value).toBe(other)` fails the test if they differ. Run them all
with `npm test`. When you change the rules, a failing test tells you right away what you broke.

Some tests guard the project's rules rather than its code: `src/lib/fanNotice.test.ts` checks that
every page shows the fan content notice and that the downloaded artwork stays out of Git. Rules a
machine checks are rules nobody forgets.

`vitest.config.ts` reuses Astro's settings, so tests understand the same files as the site.

## 15. Keeping the code tidy: Prettier, EditorConfig, Git settings

- **Prettier** formats the code: spaces, line breaks, quotes. Nobody argues about style, and diffs
  only show real changes. `npm run format` formats everything; `npm run format:check` only checks.
  Settings: `.prettierrc.json` (with plugins for `.astro` and `.svelte` files), and
  `.prettierignore` for the files it should skip.
- **EditorConfig** (`.editorconfig`) tells your editor the basics (2 spaces, UTF-8, a final newline)
  before Prettier even runs.
- **`.gitignore`** lists what Git must never record: `node_modules/` (downloaded again by
  `npm install`), `dist/` (rebuilt by `npm run build`), secrets (`.env`), and the downloaded
  artwork.
- **`.gitattributes`** forces Unix line endings (LF). Windows uses different invisible characters at
  the end of lines (CRLF); without this rule, a file edited on Windows would look entirely changed.

## 16. Containers and Docker

To put the site online, we need a computer running a web server with our files. Installing and
configuring that by hand is slow and error-prone. Instead, we package everything in an **image**: a
frozen, ready-to-run box holding a tiny Linux system, the web server, its settings and our files.
Running an image gives a **container**. The same image runs the same way on any machine.

The recipe of the image is the `Dockerfile`. It has two **stages**:

```dockerfile
FROM node:24-alpine AS build          # stage 1: a small Linux with Node 24
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci                            # install the exact versions of package-lock.json
COPY . .
RUN npm run assets:skilltree && npm run build   # download artwork, build dist/

FROM nginxinc/nginx-unprivileged:1.30-alpine    # stage 2: only a web server
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/dist /usr/share/nginx/html
```

The first stage needs Node and all the packages to build the site. The final image only needs the
result: the second stage starts again from a clean web server image and copies only `dist/` into
it. The image stays small, and contains no build tools. Copying `package.json` before the rest is
an optimization: Docker reuses the result of `npm ci` as long as the package files don't change.

`.dockerignore` lists files not to send to the build, like `node_modules/`, which is installed fresh
inside.

To try it, with [Docker](https://www.docker.com) installed:

```sh
docker build -t samichibani-pro .
docker run --rm -p 8080:8080 samichibani-pro    # then open http://localhost:8080
```

## 17. nginx: the web server

[nginx](https://nginx.org) (say "engine-x") is the web server in the image: it receives requests
and answers with files. Our settings are in `nginx.conf`:

- `listen 8080`: the port it answers on. The image runs without administrator rights
  ("unprivileged"), safer, and such programs may not use ports below 1024 (like 80).
- `try_files $uri $uri/ =404`: for `/cv`, look for a file `cv`, then a folder `cv/` (with its
  `index.html`), else answer "404 Not Found", with our `404.html` page.
- `/_astro/` files get a one-year cache: Astro puts a fingerprint of their content in their names
  (`BreachProtocol.LnNz4UlI.js`), so a new version always has a new name and browsers can keep old
  ones forever.
- `gzip`: compresses text files before sending them, so they download faster.
- Two redirects send old addresses of the previous site to the new pages.

HTTPS (the padlock in the address bar) is not handled here but by the server in front of it
(chapter 20).

## 18. CI/CD: checking and shipping automatically

- **CI, Continuous Integration**: every time someone pushes code, robots check it (formatting,
  types, build, tests). Mistakes are caught before they reach the real site, and before a reviewer
  spends time on them.
- **CD, Continuous Delivery**: every time code is accepted on the `main` branch, robots build a new
  version, ready to go online, with no manual steps.

Here the robots are [GitHub Actions](https://docs.github.com/actions): GitHub runs the
**workflows** described in `.github/workflows/` on its own machines.

- `ci.yml`, named **Continuous Integration**, runs on every push and every pull request. Its one
  step runs `dagger check` (next chapter).
- `cd.yml`, named **Continuous Delivery**, runs when Continuous Integration succeeded on `main`. It
  builds the Docker image and **publishes** it to GitHub's container **registry** (a storage for
  images), as `ghcr.io/<owner>/<repo>:main-<run>-<commit>`. That last part is the **tag**: the run
  number (bigger means newer) and the commit it was built from.

## 19. Dagger: CI that also runs on your computer

A classic problem: the CI fails, but everything works on your computer. Or the reverse. CI scripts
written for GitHub can't run anywhere else, so you debug them by pushing again and again.

[Dagger](https://dagger.io) solves this: it runs every step inside containers, so it behaves the same
on your computer and in CI. And instead of writing the steps ourselves, we install ready-made
**toolchains** (also called modules) that know how to test a JavaScript project, and declare them
in `dagger.toml`:

```toml
[modules.vitest]
source = "github.com/dagger/vitest"

[modules.vitest.settings]
baseImageAddress = "node:24-alpine"
build = true

[modules.prettier]
source = "github.com/dagger/prettier"
```

- [dagger/vitest](https://github.com/dagger/vitest) finds the project (thanks to
  `vitest.config.ts`), installs the packages, runs `npm run build` (because `build = true`, which
  also checks the types), then runs the tests. It even reports each test separately.
- [dagger/prettier](https://github.com/dagger/prettier) finds `.prettierrc.json` and checks the
  formatting.
- `dagger.lock` records the exact version of each toolchain, like `package-lock.json` does for npm.

With the [Dagger CLI](https://docs.dagger.io/install) and Docker installed, run the whole CI on your
computer:

```sh
dagger check            # everything CI checks
dagger check -l --all   # list the checks without running them
```

The delivery workflow uses Dagger too, with its built-in functions, in one line:

```
host | directory . | docker-build | with-registry-auth ... | publish ghcr.io/...
```

Read it like a pipeline: take this folder, build its `Dockerfile`, log in to the registry, publish
the image.

## 20. Going online: from the image to samichibani.pro

The image is ready in the registry. The last steps happen outside this repository:

1. **The server.** The site runs on a small **Kubernetes** cluster at home (a "homelab"). Kubernetes
   is a system that runs containers on one or more machines and restarts them if they crash.
2. **Automatic updates.** A tool called **Flux** watches the registry. When a tag with a higher run
   number appears, it updates the cluster's configuration (stored in another Git repository), and
   Kubernetes replaces the old container with the new one. Nobody logs in to deploy: merging to
   `main` is enough.
3. **HTTPS.** In front of the containers, a **gateway** receives every visitor, handles the HTTPS
   encryption with a free certificate from [Let's Encrypt](https://letsencrypt.org), and forwards
   the request to our nginx.
4. **DNS.** Finally, the **DNS** is the internet's address book: it tells browsers that
   `samichibani.pro` lives at the home's public IP address.

The whole journey of a change:

```
git push ─▶ Continuous Integration (dagger check) ─▶ Continuous Delivery (image to ghcr.io)
        ─▶ Flux sees the new tag ─▶ Kubernetes runs it ─▶ visitors see it
```

## 21. Your first changes

Practice on your own copy. After each change, run `npm test` and `npm run build`.

1. **Make it yours.** Change the name and title in `src/data/resume.ts`. Check the three pages:
   they all change.
2. **Tune the game.** In `src/lib/daemons.ts`, set `timeLimit: 60` or `size: 7`. Play.
3. **Add a terminal command.** In `src/lib/terminal/shell.ts`, add a `date` entry to `COMMANDS` that
   prints today's date with the `say` helper. Then add a test in `shell.test.ts`, copying an
   existing one. Type `help` in the terminal: your command is listed.
4. **Break a rule on purpose.** In `src/lib/breach/engine.ts`, make `pick` forget to switch between
   rows and columns. Run `npm test` and read which tests fail, and why. Undo.
5. **Run the CI yourself.** Install Dagger and run `dagger check`.

Before proposing a change to the real repository, `npm run format:check && npm test && npm run build`
must pass, as `AGENTS.md` says. That file also tells you where to change what.

## 22. Glossary

| Word                     | Meaning                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| **Build**                | Turning source code into the files a browser understands (`npm run build`, into `dist/`).         |
| **CI / CD**              | Continuous Integration / Delivery: robots that check every change, and package the accepted ones. |
| **Commit**               | A saved snapshot of the code in Git, with a message saying what changed.                          |
| **Component**            | A reusable piece of interface (a `.svelte` file) with its logic, HTML and CSS.                    |
| **Container**            | A running image: an isolated box running a program with everything it needs.                      |
| **Daemon**               | In the game, a sequence of codes to reproduce in the buffer. Here, it unlocks part of the CV.     |
| **Dependency / package** | Code written by others that the project downloads with npm and reuses.                            |
| **DNS**                  | The internet's address book, turning names like `samichibani.pro` into IP addresses.              |
| **Image**                | A frozen package of a program and everything it needs to run, built from a `Dockerfile`.          |
| **Immutability**         | Never changing a value in place; making a new, updated copy instead.                              |
| **Island**               | An interactive component in an otherwise static Astro page.                                       |
| **localStorage**         | A small storage space in the browser, per website, that survives closing the tab.                 |
| **Pure function**        | A function whose result depends only on its inputs, and that changes nothing else.                |
| **Registry**             | A storage for images, like `ghcr.io` (GitHub's).                                                  |
| **Rune**                 | A Svelte 5 keyword starting with `$` (`$state`, `$derived`, `$props`).                            |
| **Seed**                 | The starting number of a random generator: the same seed gives the same "random" numbers.         |
| **Server**               | A computer (or program) that answers requests from browsers.                                      |
| **State**                | The data describing the current situation (of a game, of a screen) at a given moment.             |
| **Static site**          | A site made of finished files, sent as they are, without per-visitor computing.                   |
| **Tag**                  | The version label of an image, after the `:` in `ghcr.io/owner/repo:tag`.                         |
| **Toolchain**            | Here, a ready-made Dagger module that knows how to run one tool (Vitest, Prettier).               |
| **Type**                 | In TypeScript, the description of a value's shape, checked before the code runs.                  |
| **Unit test**            | A small program that checks one piece of code gives the expected result.                          |
