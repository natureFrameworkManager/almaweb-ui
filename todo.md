# almaweb-ui — TODO

Open work, missing features, UX/UI bugs and technical problems found while
reviewing the codebase and comparing it against `openapi.json` (v1.0.3) and the
design mockups (`mockup/`, `mockup-v2/`).

**Priority legend:** `P0` blocking · `P1` high · `P2` medium · `P3` low/nice-to-have.
**Status legend:** `[x]` done · `[ ]` open.

---

## 0. Completed — verification of finished items

Checked during the filter review (2026-09-28). All validated with `npm run typecheck`,
`npm run build`, `prettier --check`, and a jsdom behaviour suite (30 checks).

- [x] **Latest-semester default** — the newest term is preselected (`ts/state-bind.ts`).
- [x] **Active-filter chip summary** — removable chips above the groups (`ts/filters/panel.ts`).
- [x] **Per-group reset** — “Zurücksetzen” per filter group.
- [x] **Collapsed non-primary groups** — only “Globale Filter” is open by default (`index.html`).
- [x] **In-list search + “Weitere anzeigen”** — for long option lists (> 6 options).
- [x] **Tri-state facets** — neutral → select → exclude, via complement include-lists (`ts/filters/facets.ts`).
- [x] **Interaction legend** — Neutral / Auswählen / Ausschließen (`index.html`).
- [x] **Stable range keys** — ranges keyed by `data-range` instead of label text.
- [x] **Unsupported controls disabled + annotated** — `data-unsupported`.
- [x] **Exam “Prüfungsarten” wired** — to `/exams?name=` (values are exam names).
- [x] **`getEvents` building type** — narrowed to `building?: number`.
- [x] **Course-instructor / exam-building controls hidden from “active”** — now disabled/annotated.

Code references: `ts/filters/panel.ts`, `ts/filters/facets.ts`, `ts/filters/query.ts`,
`ts/state-bind.ts`, `ts/state.ts`.

---

## 1. API bugs & limitations (backend — not fixable in the UI)

Backend issues surfaced (or re-checked) during the filter review. The UI either
works around, disables, or cannot implement the affected feature. **Keep this
list separate from the UI/UX sections** — nothing here can be fixed client-side.

Evidence: `openapi.json` v1.0.3; live host `https://api.casparkroll.de/almaweb/v1`
(the host was offline during the last review — see the Appendix for historical probes).

- [ ] **P1 — `/courses` has no working staff filter.**
  `/courses` exposes only a name-based `staff` filter and the call returned
  HTTP 500; there is no `staff_id`. `getCourses` therefore drops the selection
  (`ts/api/api.ts`) and `#filter-instructors` is disabled.
  → Needs a working `staff`/`staff_id` filter.

- [ ] **P1 — `/exams` has no `building_id` or `semester_id`.**
  `/exams` supports `name`, `required`, `staff` (name) and dates only. The exam
  building control is disabled and the global semester is ignored for exams.
  → Add both parameters or document them as unsupported.

- [ ] **P1 — No facet/count endpoints.**
  Distinct option endpoints exist (`/modules/distinct/fields`,
  `/exams/distinct/fields`, `/catalog/event-types`) but return no per-option
  counts, and collections are paged. This blocks planner-style live counts.
  → Add `counts=true` or a `/facets` endpoint.

- [ ] **P2 — No list-level degree relation.**
  `/modules` now accepts `degree_id` (1.0.3), but `/courses` has no `degree_id`
  and the `/degrees` list response exposes no semesters relation. A
  degree → semester cascade and a course/exam degree scope are impossible.

- [ ] **P2 — `/events` has no `name`/`number` parameter.**
  Events cannot be searched by name/number, only via `course_name`,
  `module_name` or `location`.

- [ ] **P2 — Bundled `openapi.json` is not generated automatically.**
  The committed spec is now v1.0.3 but already lags the server in places and
  there is no CI check. → Regenerate from the server and verify in CI.

- [ ] **P2 — Only one `sort` column is supported.**
  Every endpoint's `sort` is scalar, so the client sends the primary level and
  sorts the remaining levels locally (`ts/sort.ts`, `ts/views/collection.ts`).
  Fine as a workaround; track if the API gains multi-sort.

- [ ] **P2 — Linked event lists rely on disabled pagination.**
  `getModuleEvents` / `getCourseEvents` omit `page`/`page_size` to receive the
  complete list (`ts/api/api.ts`). A server change would silently drop calendar
  events.

- [x] **P3 — Exam “Prüfungsarten” was unimplemented.**
  Resolved client-side: `#filter-examtypes` (values are exam **names**) is now
  wired to the supported, repeatable `/exams?name=` filter.

- [x] **P3 — `getEvents` building type was wrong.**
  The API is scalar; the client signature was narrowed to `building?: number`.

---

## 2. Missing features (product)

Features referenced in the UI, present in the state model, or designed in the
mockups but not implemented.

- [ ] **P1 — Export is not implemented.**
  `#export-button` (`index.html`) has no click handler. The mockup designs an
  export dialog with **iCalendar (.ics)**, **CSV** and **JSON**; the API exposes
  `format=ical` and many `ical_*` params for `/events`.
  → Wire the button to an export dialog / reuse the API’s iCal output.

- [ ] **P1 — English UI is not implemented (i18n).**
  `#language-switcher` persists `state.language` (`de`/`en`) but every string is
  hard-coded German; there is no translation layer. Switching to EN has no
  effect. → Add an i18n layer or remove the switcher until it works.

- [ ] **P1 — “Compare save slots” view is a stub.**
  `<main id="compare">` is a placeholder; compare mode shows only a heading.
  → Implement slot comparison (LP totals, conflicts, shared entries).

- [ ] **P2 — “Datenstand” is always “unbekannt”.**
  `#last-updated-timestamp` is hard-coded and the updating feature was removed.
  The whole `#last-updated-con` block is effectively dead UI.
  → Populate from the API or remove the block.

- [x] **P2 — Active filter chips are missing.**
  Implemented: `#filter-summary` renders removable chips for every active filter.

- [ ] **P2 — Table view is missing.**
  The mockups list a “Tabelle” view; only `list`, `cards`, `calendar`, `tree`
  exist (`ts/state.ts`).

- [ ] **P3 — “Über alma.web” (About) page is missing.**
  Present in the mockup, not in the app.

- [ ] **P3 — Save-slot requirements are only partly surfaced.**
  Target LP + required modules exist in state and render in the slot dialog, but
  there is no progress/results view or validation feedback for a study plan.

- [ ] **P3 — No offline / degraded-mode fallback.**
  `fetchLocal` and `ts/api/offline-data/*.json` exist as dead code; the app
  always hits the live API. There is no offline banner or cached fallback.

---

## 3. UX / UI bugs

- [ ] **P1 — Dead “Export” button.**
  Clicking Export does nothing (see §2). Audit all header buttons for handlers.

- [ ] **P1 — Language switcher silently does nothing.**
  Toggling DE/EN updates state but no visible text changes (see §2).

- [ ] **P2 — API base URL is hard-coded.**
  `const host = "https://api.casparkroll.de/almaweb/v1";` (`ts/api/api.ts`) is a
  committed default; local/dev builds cannot point at another host without
  editing code. → Move to `import.meta.env.VITE_API_HOST` (see §6).

- [ ] **P2 — Accessibility: switchers are not keyboard operable.**
  View/type/language/theme switchers are `<span>`/`<item>` elements with click
  handlers (`ts/switcher.ts`, `index.html`) — no `role`, `tabindex`, keyboard
  activation or `aria-selected`.

- [ ] **P2 — Exam “Prüfungsarten” label does not match its data.**
  `#filter-examtypes` is populated from `/exams/distinct/fields?field=name`, so
  its entries are exam **names** (“Klausur”, “Portfolioprüfung”), not types.
  → Rename to “Prüfungsname” (or derive real exam types) so the filter is honest.

- [ ] **P2 — Tri-state interaction is inconsistent across facet lists.**
  Only semester, faculty, module language, course type and degree type cycle
  neutral → select → exclude. Instructors, buildings, exam types and exam staff
  stay binary, so identical-looking checkboxes behave differently.
  → Extend tri-state to all facets or make the difference explicit.

- [ ] **P2 — Excluding every option shows everything.**
  The tri-state “exclude” is sent as the complement include-list; when all
  options of a facet are excluded the complement is empty and no filter is sent,
  so the result set is unfiltered instead of empty (`ts/filters/facets.ts`).
  → Represent “exclude all” as an impossible-value include-list.

- [ ] **P2 — Disabled facets can still emit captured state.**
  `captureFilterState` reads checked/hidden inputs even when their container is
  marked `data-unsupported` and disabled, so a restored share link can show
  chips for a filter that cannot work (`ts/state-bind.ts`).
  → Ignore unavailable controls when capturing/applying state.

- [ ] **P2 — The global semester looks like it filters exams.**
  `/exams` ignores `semester_id`; only a static note in the exam group explains
  it. → Surface the limitation next to the active semester chip or per pane.

- [ ] **P2 — Screen readers are not told about the tri-state.**
  The excluded state uses the native `indeterminate` flag only; there is no
  `aria-checked="mixed"`, label or hint, and options are not reachable in a
  documented way. → Add ARIA + keyboard guidance to the facet rows.

- [ ] **P3 — Default semester is re-selected on reload.**
  If all semesters are cleared, the newest term is checked again on the next
  load (planner-style behaviour). Intentional, but surprising and undocumented
  in the UI. → Mention it or only default on first visit.

- [ ] **P3 — Active-filter summary can grow unbounded.**
  Every checked facet value becomes a chip; with many selections the bar pushes
  the groups down. → Collapse after N chips with a “+x more” expander.

- [ ] **P3 — `<item>` custom element.**
  `#display-changer1/2` uses a non-standard `<item>` element; it renders only
  because browsers treat unknown tags as inline. → Use `<button>`/`role`.

- [ ] **P3 — Tree has no back/reset controls.**
  `goBackLevel` / `resetTree` are exported but never wired (`ts/tree.ts`).

- [ ] **P3 — Staff/location are unsavable but look savable.**
  `SAVABLE_ENTITY_KINDS` excludes `staff`/`location`, yet both appear in the type
  switcher and have save-related labels in `ts/state-bind.ts`. → Clarify intent.

---

## 4. UX / UI improvements

- [ ] **P2 — Add loading placeholders for the calendar.**
  Collection views have skeletons; the calendar’s `#calendar-loading1/2`
  empty/loading handling is minimal.

- [x] **P2 — Surface active sort/filter state more clearly.**
  Active-filter chip row with per-chip remove implemented; the sort summary is
  still text only.

- [ ] **P2 — Improve empty-state messaging.**
  Explain *why* a pane is empty (e.g. “no results for the current filters”) and
  offer a reset action.

- [ ] **P2 — Keyboard and focus management for dialogs.**
  Popovers (`detail-dialog`, `save-slot-dialog`, `sort-dialog`, …) should trap
  focus and restore it to the trigger on close.

- [x] **P3 — Add a “reset filters” affordance inside each filter group.**
  Implemented a per-group “Zurücksetzen” button.

- [ ] **P3 — Persist filter-sheet open/closed state.**
  The sheet open state resets on reload; remember it on small screens.

- [ ] **P3 — Richer detail-dialog tables.**
  Add column sorting (ensure every table exposes `sortValue`) and copyable values.

- [ ] **P3 — Responsive polish.**
  Verify pane headers, sort dialog and save-slot dialog on very narrow widths.

### 4a. Filter panel follow-ups (from the `planer` review)

- [ ] **P2 — Live counts/summaries per option.** *(blocked — see §1)*
  Disable and count each option from the currently visible data; needs facet
  support from the API.

- [ ] **P2 — Degree scope over modules.** *(partially unblocked)*
  `/modules` now accepts `degree_id` (1.0.3), so a module-only degree scope is
  possible; the cascade and course/exam scope still need API work (§1).

- [ ] **P2 — “Clear all filters” action in the summary bar.**
  Per-chip remove and per-group reset exist, but there is no single clear-all
  next to the chips (only the global reset dialog).

- [ ] **P2 — Mark facets whose options failed to load.**
  If a distinct-option request fails, the list stays empty with no feedback.
  → Show an inline error/retry per facet.

- [ ] **P3 — “Only this” quick action on an option.**
  Long-press/secondary action to select one option and exclude the rest.

- [ ] **P3 — Persist open/closed state of filter groups.**
  Collapsed groups reset on reload; remember the choice.

- [ ] **P3 — Clarify the tri-state in-list legend per list.**
  The legend is global; a short hint on hover/focus per row would help.

---

## 5. Code quality / technical debt

- [ ] **P1 — No README / contributor docs.**
  Add setup, scripts (`dev`, `build`, `typecheck`, `lint`, `format`), API host
  configuration and an architecture overview.

- [ ] **P2 — Lint warnings are widespread.**
  `npx eslint ts/` reports ~66 warnings (mostly `max-lines-per-function` /
  `max-statements` / `complexity`), including the new `ts/filters/panel.ts`.
  Not blocking, but they hide real issues.

- [ ] **P2 — Dead code.**
  - `fetchLocal` (`ts/api/api.ts`) is unused (only remaining lint error).
  - `resetTree` / `goBackLevel` (`ts/tree.ts`) are unused.
  - `#export-button` / `#last-updated-con` UI is unwired.
  - `datasave.json` in the repo root looks like a leftover sample.

- [ ] **P2 — Large committed fixtures.**
  `ts/api/offline-data/*.json` are very large (`events.json` ~60 MB,
  `modules.json` ~6 MB, `courses.json`/`exams.json` ~4 MB each) and no longer
  used. → Remove or move to a fixture package.

- [ ] **P2 — Duplicated sort metadata.**
  Sort fields in `ts/sort.ts` mirror the API `sort` enums with no test.
  → Generate from `openapi.json` or test to prevent drift.

- [ ] **P2 — Filter state is hand-wired to the DOM.**
  Each facet needs matching code in `ts/state.ts` (shape), `ts/state-bind.ts`
  (read/write) and `ts/filters/query.ts` (param mapping). The new `excluded`
  field had to be threaded through all three. → Introduce a small declarative
  filter registry so a facet is defined once.

- [ ] **P2 — `STATE_VERSION` was not bumped for `excluded`.**
  `ts/state.ts` stayed at version `1` after `Filters.excluded` was added. It is
  backward compatible (missing keys fall back to defaults), but bump it and
  document migrations before the next shape change.

- [x] **P2 — Range filters were looked up by visible label text.**
  Ranges now carry a stable `data-range` key (`index.html`,
  `ts/filters/query.ts`, `ts/state-bind.ts`).

- [x] **P3 — `getEvents` building type is wrong.**
  Narrowed to `building?: number`.

- [ ] **P3 — Hard-coded German strings scattered across modules.**
  Blocking real i18n (see §2). Includes the new legend, unsupported notes and
  chip labels. → Centralise when adding i18n.

- [ ] **P3 — Per-group reset triggers a full re-query.**
  `handleFilterControlChange` calls `requeryAll()` for any chip/reset change
  (`ts/main.ts`), re-fetching unrelated entity types. → Re-query only the
  affected group/entity.

---

## 6. Build, config & deployment

- [ ] **P1 — Make the API host configurable.**
  Replace the hard-coded production host in `ts/api/api.ts` with an environment
  variable and document it.

- [ ] **P2 — CI checks.**
  No CI config found. Add a pipeline running `typecheck`, `lint`,
  `format:check`, `build` (and the future `test`).

- [ ] **P2 — No test runner despite behaviour-critical code.**
  Filter parsing, state round-trips and share-link encoding have no automated
  tests in-repo (the review used an ad-hoc jsdom harness). → Add Vitest + jsdom.

- [ ] **P3 — Bundle/size review.**
  The production bundle is ~375 KB JS / ~118 KB CSS. Consider code-splitting the
  calendar (FullCalendar) and detail dialogs.

---

## Appendix — verification notes

**API spec:** `openapi.json` v1.0.3. Relevant capabilities at review time:

| Endpoint | Filter parameters of interest |
| --- | --- |
| `/modules` | `degree_id`, `faculty_id`, `semester_id`, `staff_id`, `responsible_person`, `language` |
| `/courses` | `type`, `staff` (name), `semester_id`, `module_id`, `language` |
| `/events` | `building_id` (scalar), `semester_id`, `module_id`, `course_id`, `weekday` |
| `/exams` | `name` (repeatable), `staff` (name), `required`, `module_id`, dates |
| `/degrees` | `ids`, `names`, `subjects`, `degrees`, `faculty`, `modules` |

**Historical live-API probes** (host was offline at the last review; kept for
context, counts via `GET …?page_size=1`):

| Query | Count | Interpretation |
| --- | --- | --- |
| `/exams?page_size=1` | 2663 | baseline |
| `/exams?page_size=1&building_id=1` | 2663 | `building_id` ignored |
| `/exams?page_size=1&semester_id=1` | 2663 | `semester_id` ignored |
| `/exams?page_size=1&required=true` | 2461 | `required` works |
| `/courses?page_size=1&staff_id=7` | 3255 | same as baseline → ignored |
| `/courses?page_size=1&semester_id=1` | 984 | `semester_id` works |
| `/events?page_size=1&building_id=1&building_id=2` | 3880 | scalar: last value wins |

> Generated from a codebase + API-spec review; line references point at
> `index.html` and `ts/**` as of the filter work of 2026-09-28.
