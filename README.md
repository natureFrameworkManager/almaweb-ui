# almaweb-ui

A modern, framework-free web front-end for the **[Almaweb Parser & API](https://github.com/natureFrameworkManager/almaweb-parser)**. It renders the
*Vorlesungsverzeichnis* (course catalogue) of the University of Leipzig as an interactive, filterable catalogue with list, card, calendar, and tree views.

The app is a pure client: it talks to the read-only AlmaWeb REST API (default
`https://api.casparkroll.de/almaweb/v1`) and keeps every user-facing setting in a single, shareable
JSON state document.

## Related repositories

| Repository | Role |
| ---------- | ---- |
| **almaweb-ui** (this repo) | TypeScript/Vite front-end. |
| **Almaweb Parser & API** (`https://github.com/natureFrameworkManager/almaweb-parser`) | Scrapy crawler + FastAPI/SQLModel backend that scrapes and serves the data. |
| **planer** (`https://github.com/natureFrameworkManager/planer`) | Earlier timetable app for the faculty of mathematics and computer science. |

## Features

- **Entity browser** for modules, courses, events, exams, staff, locations, and degrees.
- **Four view modes per pane** - list, cards, calendar, and navigation tree.
- **Layout modes** - single, split (two panes), and comparison, responsive down to mobile.
- **Rich filtering** - per-entity filter groups with tri-state facets (neutral / select / exclude),
  range filters, and removable active-filter chips.
- **Client-side multi-level sorting** with a sort dialog (the API sorts by one column; the client
  applies the remaining levels).
- **Save slots ("Studienplan")** - collect modules, courses, events, exams, staff, and locations into
  named slots, track target credit points (`totalLp`) and per-module progress.
- **Calendar** powered by FullCalendar with week/month/day/list views, drawing the events linked to
  the saved modules/courses plus directly saved events.
- **Shareable links** - the whole UI state is base64url-encoded into the `?d=` query parameter
  (with a `?v=` version) and copied to the clipboard.
- **Local persistence** in `localStorage` under the `almaweb.state` key.
- **Dark / light / system theme**, a **DE/EN language switcher**, and toast-style feedback.
- **Detail dialog** with tabbed relations (modules ↔ degrees ↔ courses ↔ events ↔ exams ↔ staff).

## Requirements

- **Node.js** `^22.22.2 || >=24.15.0` (Vite 8 engine requirement)
- **npm** (or a compatible package manager)
- Network access to the AlmaWeb API host for live data

## Getting started

```bash
# Clone
git clone https://github.com/natureFrameworkManager/almaweb-ui.git
cd almaweb-ui

# Install dependencies
npm install

# Start the dev server (with HMR)
npm run dev
```

The Vite dev server is mounted at the configured base path, so it is served at
**`http://localhost:5173/almaweb/`** by default (see [Configuration](#configuration)).

### Production build

```bash
npm run build     # outputs a static bundle to dist/
npm run preview   # serve the built bundle locally
```

Deploy the contents of `dist/` behind any static host at the same base path the build used.

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the Vite dev server with hot reload. |
| `npm run build` | Production build into `dist/`. |
| `npm run preview` | Preview the built `dist/` bundle. |
| `npm run typecheck` | Run `tsc --noEmit` over `ts/**` and `vite.config.ts`. |
| `npm run lint` | Run ESLint over the project. |
| `npm run format` | Format `**/*.{html,css,js,ts}` with Prettier. |
| `npm run format:check` | Verify formatting without writing. |

## Configuration

**Base path** - `vite.config.ts` sets `base` from the `BASE_PATH` environment variable, defaulting
to `/almaweb/`. Set it when the app is served from a different sub-path:

**API host** - the AlmaWeb API base URL is currently a constant in `ts/api/api.ts`:

Pointing the app at a different backend (for example a local `fastapi dev src/api/main.py` from the
parser repo) requires editing this constant. 

## State, persistence & sharing

Every setting - theme, language, layout, per-pane views, filters, calendar options, and save slots -
lives in one `UIState` object (`ts/state.ts`, version `STATE_VERSION = 2`).

The same object is used in three ways:

1. **localStorage** - written to the `almaweb.state` key on every change.
2. **Share link** - compacted (defaults pruned), base64url-encoded into `?d=`, with the version in
   `?v=`. The `#share-button` copies the link to the clipboard.
3. **Hand editing** - plain JSON with arrays/objects only (no `Set`/`Map`), so it can be edited in
   devtools without helper code.

A saved data point (`{ kind, ref }`, where `kind` is one of `module`, `course`, `event`, `exam`,
`staff`, `location`) is stored inside the **active save slot**, so switching slots changes what is
reported as saved.

## Backend / data model

The UI consumes the read-only AlmaWeb API.  
Highlights:

- Collection endpoints support paging (`page` + `page_size`), single-column sorting (`sort` +
  `order`), field selection (`fields`), relation embedding (`include=…`), and `format=json|csv|ical`.
- All filters combine with **AND**; repeated parameters (e.g. `building_id`, `name`) are **OR-ed**.
- Entities: `modules`, `courses`, `events`, `exams`, `staff`, `locations`, `degrees`, `faculties`,
  `semesters`, `buildings`, plus catalog endpoints (`/catalog/event-types`, …).
- Interactive docs are available at `http://localhost:8000/docs` when running the parser API
  locally.

## Development conventions

- **TypeScript strict** - `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`,
  `verbatimModuleSyntax` (see `tsconfig.json`).
- **ESLint** enforces 4-space indent, double quotes, semicolons, JSDoc on functions/methods, and
  discourages raw `for`/`for..of`/`for..in` loops in favour of array methods (`eslint.config.mjs`).
- **Prettier** - 100-char width, 4-space tabs, trailing commas, LF endings, Tailwind class sorting
  (`prettier-plugin-tailwindcss`).
- Run `npm run typecheck && npm run lint && npm run format:check` before committing.

## License

[Open Software License 3.0](https://choosealicense.com/licenses/osl-3.0/) - see [`LICENSE.txt`](LICENSE.txt).

## Acknowledgements

- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FullCalendar](https://fullcalendar.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [FastAPI](https://fastapi.tiangolo.com/) & [SQLModel](https://sqlmodel.tiangolo.com/) (backend)
- [Choose an open source license](https://choosealicense.com/)

## Disclaimer regarding AI usage

Some AI tools and models may have been used to assist in the development of this project, including
code generation and documentation. However, all final decisions, implementations, and verifications
were performed by the developers. Users should independently verify any AI-generated content for
accuracy and reliability.

**If any commit included AI-generated content, it has been marked with the `Assisted-by: <tool>:<model>`
trailer.**

