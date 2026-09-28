# almaweb-ui — TODO

Open work, missing features, UX/UI bugs and technical problems found while
reviewing the codebase and comparing it against the live API
(`http://localhost:8009`) and the design mockups (`mockup/`, `mockup-v2/`).

**Priority legend:** `P0` blocking · `P1` high · `P2` medium · `P3` low/nice-to-have.

---

## 1. API problems & required workarounds

These are backend/API limitations that the client either works around or that
silently break a UI feature. Verified against the live API unless noted.

- [ ] **P1 — Course instructor filter is disabled (API bug).**
  `getCourses` has its `staff_id` block commented out with the note
  `// Currently staff is not resolved to IDs -> bug API` (`ts/api/api.ts:245`).
  `/courses` only exposes a **name-based** `staff` filter, while the UI
  (`#filter-instructors`) supplies staff **IDs**.
  *Proof:* `/courses?page_size=1` → `3255`; `…&staff_id=7` → `3255` (unchanged).
  → Either hide the filter or add name resolution.

- [ ] **P1 — Exam filters for building / examiner / semester do nothing (API gap).**
  `/exams` accepts neither `building_id`, `staff_id` nor `semester_id`, but
  `fetchExamPage` sends all three (`#filter-buildings`, `#filter-staff`,
  `#filter-semester`).
  *Proof (`/exams?page_size=1` baseline = `2663`):* `&building_id=1` → `2663`,
  `&staff_id=7` → `2663`, `&semester_id=1` → `2663`; `&required=true` → `2461`.
  → Hide unsupported exam filters or extend the API.

- [ ] **P2 — Exam "Prüfungsarten" filter is not implemented.**
  `#filter-examtypes` exists but `fetchExamPage` never reads it, and `/exams`
  has no exam-type parameter. The control is a no-op.

- [ ] **P2 — Events have no name/number search.**
  The event filter group (`#filter-group-event`) only has time/date/building
  controls. `/events` has no `name`/`number` query parameter either, so events
  cannot be searched like modules/courses. (`/events` does offer
  `course_name`, `module_name`, `location`.) → Add search UI + API support.

- [ ] **P2 — Event building filter is single-value only.**
  `/events` declares `building_id` as a **scalar integer**, but `getEvents` is
  typed `number | number[]` and appends it repeatedly; repeated scalar params
  are **last-value-wins**, not OR.
  *Proof:* `building_id=2` → `3880`; `building_id=1&building_id=2` → `3880`
  (took 2); `building_id=2&building_id=1` → `5281` (took 1).
  Currently latent because the events UI uses a single `<select>`, but the
  array path is incorrect. → Narrow the client type to a single value.

- [ ] **P2 — Only one sort column is supported (documented workaround).**
  Every endpoint's `sort` is a scalar string, so the client sends only the
  **primary** level and sorts the remaining levels locally
  (`ts/api/api.ts:74`, `ts/filters/query.ts:180`, `ts/sort.ts:171`,
  `ts/views/collection.ts:71`). Fine as-is, but worth tracking if the API ever
  gains multi-sort.

- [ ] **P2 — Linked event lists rely on disabling pagination.**
  `getModuleEvents` / `getCourseEvents` deliberately omit `page`/`page_size` so
  the API returns the complete list (`ts/api/api.ts:346-347`, `:360-361`).
  If the API changes that behaviour, the calendar loses events.

- [ ] **P2 — Bundled `openapi.json` is stale vs. the running API.**
  The committed spec omits parameters the live API supports (e.g. `/events`
  and `/courses` accept `semester_id`, `/modules` accepts `staff_id`), yet
  reports the same version `1.0.2`. → Regenerate the spec from the server and
  add a check to keep it in sync.

- [ ] **P3 — Events list URL had a missing leading slash (fixed).**
  `getEvents` built `events?fields=…` (invalid against the host); corrected to
  `/events?…` in commit `370ace6`. Keep an eye out for similar string-built
  URLs.

---

## 2. Missing features

Features that are referenced in the UI, present in the state model, or designed
in the mockups but not implemented.

- [ ] **P1 — Export is not implemented.**
  `#export-button` (`index.html:101`) has **no click handler** at all.
  The mockup designs an export dialog with **iCalendar (.ics)**, **CSV** and
  **JSON** formats (`mockup/dist/index.html`, "Export Modal"). The API even
  exposes `format=ical` and many `ical_*` params for `/events`.
  → Wire the button to an export dialog / reuse the API's iCal output.

- [ ] **P1 — English UI is not implemented (i18n).**
  `#language-switcher` persists `state.language` (`de`/`en`) but every string is
  hard-coded German; no translation layer exists. Switching to EN has no effect.
  → Add an i18n layer or remove the switcher until it works.

- [ ] **P1 — "Compare save slots" view is a stub.**
  `<main id="compare"><h1>Compare Save slots</h1></main>` (`index.html:1412`) is
  a placeholder; compare mode shows only this heading. → Implement slot
  comparison (LP totals, conflicts, shared entries).

- [ ] **P2 — Calendar customization is unimplemented.**
  `calendar.colorMode`, `customMap` and `pinnedEvents` are declared and defaulted
  (`ts/state.ts:126-131`) but **never read or written** anywhere. No UI exists
  for event colour modes, custom colour mapping, or pinning events.

- [ ] **P2 — "Datenstand" is always "unbekannt".**
  `#last-updated-timestamp` shows a hard-coded `unbekannt`
  (`index.html:69`); the updating feature was removed (commit `01c4b61`).
  The whole `#last-updated-con` block is effectively dead UI.
  → Populate from the API or remove the block.

- [ ] **P2 — Active filter chips are missing.**
  The mockup shows an "Aktive Filter" summary of applied filters; the app has no
  such display (only the sort summary exists).

- [ ] **P2 — Table view is missing.**
  The mockups list a "Tabelle" view next to Liste/Kacheln/Kalender; only
  `list`, `cards`, `calendar`, `tree` exist (`ts/state.ts:43`).

- [ ] **P3 — "Über alma.web" (About) page is missing.**
  Present in the mockup ("Inoffizielles Community-Projekt"), not in the app.

- [ ] **P3 — Save-slot requirements are only partly surfaced.**
  Requirements (target LP + required modules) exist in state and render in the
  slot dialog, but there is no progress/results view or validation feedback for
  a study plan.

- [ ] **P3 — No offline / degraded-mode fallback.**
  `fetchLocal` and `ts/api/offline-data/*.json` exist as dead code; the app
  always hits the live API. There is no "offline" banner or cached fallback.

---

## 3. UX / UI bugs

- [ ] **P1 — Dead "Export" button.**
  Clicking Export does nothing (see §2). Same class of issue applies to any
  control without a handler — audit all header buttons.

- [ ] **P1 — Language switcher silently does nothing.**
  Toggling DE/EN updates state but no visible text changes (see §2).

- [ ] **P2 — API base URL is hard-coded to `localhost`.**
  `const host = "http://localhost:8009";` (`ts/api/api.ts:26`) is committed as
  the default. A production build cannot reach the API (previously
  `https://api.casparkroll.de/almaweb/v1`). → Move to a Vite env var
  (`import.meta.env.VITE_API_HOST`) with a documented default.

- [ ] **P2 — Misleading exam filters.**
  Gebäude / Prüfer / global Semester and Prüfungsarten appear active but have
  no effect (see §1). Users will assume their results are filtered when they
  are not. → Disable/hide and add an explanatory hint until the API supports
  them.

- [ ] **P2 — Course instructor filter appears active but is ignored.**
  (see §1) — same "silently broken filter" problem.

- [ ] **P2 — Accessibility: switchers are not operable by keyboard.**
  View/type/language/theme switchers are plain `<span>`/`<item>` elements with
  click handlers (`ts/switcher.ts`, `index.html`). They have no `role`,
  `tabindex`, keyboard activation or `aria-selected`. → Use
  `role="tablist"`/`role="tab"` (or real `<button>`s) with arrow-key support.

- [ ] **P3 — `<item>` custom element.**
  `#display-changer1/2` uses a non-standard `<item>` element
  (`index.html:32-61`). It renders only because browsers treat unknown tags as
  inline elements; it breaks semantics/querying conventions.

- [ ] **P3 — Tree has no back/reset controls.**
  `goBackLevel` and `resetTree` are exported but never wired to any UI
  (`ts/tree.ts:297,309`), so users can only navigate forward via breadcrumbs.

- [ ] **P3 — Staff/location are unsavable but look savable.**
  `SAVABLE_ENTITY_KINDS` excludes `staff`/`location`
  (`ts/views/entity-view.ts:86`), yet both have entries in
  `ENTRY_KIND_LABELS`/`ENTRY_COLLECTION_TYPES` (`ts/state-bind.ts:70,83`) and
  appear in the type switcher. → Clarify intent or restore saving.

---

## 4. UX / UI improvements

- [ ] **P2 — Add loading placeholders for the calendar.**
  Collection views have skeletons/`list-more`; the calendar has
  `#calendar-loading1/2` but the empty/loading handling is minimal.

- [ ] **P2 — Surface active sort/filter state more clearly.**
  Only a text summary exists; consider a compact chip row with per-chip remove.

- [ ] **P2 — Improve empty-state messaging.**
  Empty/error states exist per pane, but messages could explain *why* (e.g.
  "no results for the current filters") and offer a reset action.

- [ ] **P2 — Keyboard and focus management for dialogs.**
  Popovers (`detail-dialog`, `save-slot-dialog`, `sort-dialog`, …) should trap
  focus and restore it to the trigger on close.

- [ ] **P3 — Persist filter-sheet open/closed state.**
  The filter sheet open state resets on reload; consider remembering it on small
  screens.

- [ ] **P3 — Richer detail-dialog tables.**
  Add column sorting (the dialog has `sortValue` machinery — ensure every table
  exposes it) and copyable values.

- [ ] **P3 — Add a "reset filters" affordance inside each filter group.**
  Currently only the global reset dialog resets filters.

- [ ] **P3 — Responsive polish.**
  Verify pane headers, sort dialog and save-slot dialog on very narrow widths.

---

## 5. Code quality / technical debt

- [ ] **P1 — No automated tests.**
  `package.json` has no `test` script and there is no test framework. The state
  layer, sort, filters, key parsing and API URL building are highly testable and
  currently unprotected.

- [ ] **P1 — No README / contributor docs.**
  No `README.md`. Add setup, scripts (`dev`, `build`, `typecheck`, `lint`,
  `format`), API host configuration and architecture overview.

- [ ] **P2 — Lint warnings are widespread.**
  `npx eslint ts/` reports ~59 warnings (functions over `max-lines-per-function`
  / `max-statements` / `complexity`). Not blocking, but they hide real issues.

- [ ] **P2 — Dead code.**
  - `fetchLocal` (`ts/api/api.ts:48`) is unused.
  - `resetTree` / `goBackLevel` (`ts/tree.ts`) are unused.
  - `#export-button` / `#last-updated-con` UI is unwired.
  - `datasave.json` in the repo root looks like a leftover sample.

- [ ] **P2 — Large committed fixtures.**
  `ts/api/offline-data/*.json` are very large (e.g. `events.json` ~24 MB,
  `modules.json` ~150k lines). They bloat the repo and are no longer used.
  → Remove or move to a separate fixture package.

- [ ] **P2 — Duplicated sort metadata.**
  Sort fields are maintained in `ts/sort.ts` and mirror the API `sort` enums.
  Add a test or generate them from `openapi.json` to prevent drift.

- [ ] **P3 — `getEvents` building type is wrong.**
  Typed `number | number[]` but the API is scalar (see §1). Fix the signature.

- [ ] **P3 — Hard-coded German strings scattered across modules.**
  Blocking any real i18n (see §2). Centralise strings when adding i18n.

---

## 6. Build, config & deployment

- [ ] **P1 — Make the API host configurable.**
  Replace the hard-coded `localhost` host with an environment variable and
  document it; ensure the production default points at the real API.

- [ ] **P2 — Regenerate/verify `openapi.json` against the live server.**
  (see §1) and add a CI step so the committed spec stays current.

- [ ] **P2 — CI checks.**
  No CI config found. Add a pipeline running `typecheck`, `lint`,
  `format:check`, `build` (and a future `test`).

- [ ] **P3 — Bundle/size review.**
  The production bundle is ~366 KB JS / 91 KB CSS. Consider code-splitting the
  calendar (FullCalendar) and detail dialogs.

---

## Appendix — verification notes

Live-API probes used for §1 (counts via `GET …?page_size=1`):

| Query | Count | Interpretation |
| --- | --- | --- |
| `/exams?page_size=1` | 2663 | baseline |
| `/exams?page_size=1&building_id=1` | 2663 | `building_id` ignored |
| `/exams?page_size=1&staff_id=7` | 2663 | `staff_id` ignored |
| `/exams?page_size=1&semester_id=1` | 2663 | `semester_id` ignored |
| `/exams?page_size=1&required=true` | 2461 | `required` works (control) |
| `/courses?page_size=1` | 3255 | baseline |
| `/courses?page_size=1&staff_id=7` | 3255 | `staff_id` ignored |
| `/courses?page_size=1&semester_id=1` | 984 | `semester_id` works |
| `/events?page_size=1&semester_id=1` | 12373 | `semester_id` works |
| `/events?page_size=1&building_id=1` | 5281 | scalar building filter |
| `/events?page_size=1&building_id=1&building_id=2` | 3880 | last value wins (= bld 2) |
| `/events?page_size=1&building_id=2&building_id=1` | 5281 | last value wins (= bld 1) |

> Generated from a codebase + live-API review. Line references point at
> `index.html` and `ts/**` as of commit `370ace6` (plus local changes).
