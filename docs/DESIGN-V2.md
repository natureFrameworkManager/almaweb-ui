# almanach — Design Blueprint V2 ("Das Studienbuch")

> **Status:** Proposal · **Date:** 2026-09-27 · **Scope:** complete alternative redesign — brand, colour, typography, shape, layout, components, views, new features, accessibility, performance.
> **Relation to [`DESIGN.md`](./DESIGN.md) (V1):** V2 is a **deliberately different direction**, not an amendment. It reuses V1's *facts* (stack, defects, API limits) but none of its *design decisions*. §1.2 lists every difference. Decisions marked **⚑ confirm** need product-owner sign-off before implementation.
> **Evidence base:** `index.html`, `css/*.css`, `ts/main.ts`, `ts/api/*`, and a data profile of `ts/api/offline-data/*.json` (§2.3). Every colour pair in §4 was contrast-checked (WCAG 2.x relative-luminance formula) on 2026-09-27.

---

## Table of contents

0. [One-page summary](#0-one-page-summary)
1. [Concept & how V2 differs from V1](#1-concept--how-v2-differs-from-v1)
2. [Current state audit (V2 lens)](#2-current-state-audit-v2-lens)
3. [Branding](#3-branding)
4. [Colour system](#4-colour-system)
5. [Typography](#5-typography)
6. [Shape, space, paper & motion](#6-shape-space-paper--motion)
7. [Layout & information architecture](#7-layout--information-architecture)
8. [Component library](#8-component-library)
9. [Views](#9-views)
10. [New features](#10-new-features)
11. [Placeholder → V2 mapping](#11-placeholder--v2-mapping)
12. [Accessibility & i18n](#12-accessibility--i18n)
13. [Data, performance & offline](#13-data-performance--offline)
14. [Architecture & file structure](#14-architecture--file-structure)
15. [Roadmap](#15-roadmap)
16. [Decisions to confirm & open questions](#16-decisions-to-confirm--open-questions)
17. [Appendix — `css/tokens.css` (V2)](#17-appendix--csstokenscss-v2)

---

## 0. One-page summary

**V1 designs a tool; V2 designs a study book.** Students think about their semester the way they think about a paper planner: they *leaf through* the catalogue, *mark* what looks interesting, *collect* it in a folder, and *plan* their week. V2 builds the whole product around that metaphor:

| Verb (DE / EN) | Product surface | Visual signature |
|---|---|---|
| **Aufschlagen / Open** | Omnibox + Satzfilter + Studienführer | Warm paper canvas, editorial serif headings |
| **Anstreichen / Mark** | Merken on every row, card, sheet | Highlighter-yellow marker stroke |
| **Sammeln / Collect** | *Mappe* (binder) tray, always visible on desktop | Coloured index tabs (Register) |
| **Planen / Plan** | Woche, Semesterplaner, Szenarien A/B/C, Heute | Ink-on-paper weekly grid, LP meter |

**Brand:** name **almanach** (⚑ confirm). It combines "alma" and "nach(schlagen)", and an *almanac* is literally a yearly calendar-catalogue. Colour **Lindgrün**, because Leipzig derives from Slavic *lipa* = linden tree, plus **Textmarker-Gelb**. Type **Fraunces** (display) + **Inter** (UI, tabular figures).
**Keywords:** *Aufschlagen. Anstreichen. Planen.* · **Tagline:** DE *„Dein Semester, aufgeschlagen."* · EN *"Your semester, opened up."*

---

## 1. Concept & how V2 differs from V1

### 1.1 Design principles

| # | Principle | Consequence |
|---|---|---|
| P1 | **Ask in sentences, not forms** | Filters are a readable sentence ("Zeige **Module** aus **Informatik** im **WiSe 2025/26** mit **5–10 LP**") instead of a 25-control rail. |
| P2 | **The binder is always in reach** | The *Mappe* is a persistent tray (desktop) / tab (mobile); marking is one click, never a menu. |
| P3 | **Time is the main axis** | Events and exams default to *Zeitachse* (timeline) and *Woche*, not lists. Days and weeks are how students think. |
| P4 | **Warm, calm, legible** | Paper tones, ink text, one highlighter. Colour carries meaning; decoration is typographic. |
| P5 | **Honest about data** | Missing dates/times and messy frequencies are explicit, styled states ("Termin offen"), never blanks or "?". |
| P6 | **Degrade into insight, never into a wall** | Too many results for a calendar → show a density heatmap, not an error. |
| P7 | **Personal, anonymous, portable** | Everything personal is local; a plan can be carried as a self-contained URL. |
| P8 | **Accessible is the default, not a mode** | WCAG 2.2 AA everywhere, plus a dedicated *Tinte* high-contrast theme and `forced-colors` support. |

### 1.2 V1 vs V2 at a glance

| Aspect | V1 (`DESIGN.md`) | **V2 (this document)** |
|---|---|---|
| Metaphor | Utility dashboard | **Study book / paper planner** |
| Name | alma.web | **almanach** (⚑ confirm; fallback keeps alma.web) |
| Brand colour | Bellis Blue `#294D9D` | **Lindgrün `#0E5C4A`** |
| "Mine" accent | Bellis Pink | **Textmarker-Gelb `#FFE066`** (fill only) + ink |
| Surfaces | Cool grey, flat hairlines, no shadows | **Warm paper, soft paper elevation, rounded sheets** |
| Type | Atkinson Hyperlegible Next + JetBrains Mono | **Fraunces (display) + Inter (UI, `tnum`)**, no mono font |
| Icons | Material Symbols Rounded (icon font) | **Lucide inline SVG sprite** (no icon font, no FOIT) |
| Shell | TopBar + filter rail + 2 panes + detail panel + StatusBar | **Nav rail + Omnibox + Satzfilter + workspace tabs + Mappe tray** |
| Filters | Faceted rail with counts | **Sentence builder + search tokens (`lp:5-10`)** |
| Multi-view | Einzeln / Geteilt / Vergleichen panes | **Workspace tabs** (browser-like) + optional *Nebeneinander* |
| Detail | Right detail panel | **Peek** (quick look) + **Blatt** (full sheet with own URL) |
| Tree | Breadcrumb tile browser | **Studienführer: Miller columns** |
| Calendar overflow | Hard stop at `CALENDAR_MAX_ITEMS` | **Density heatmap → zoom into events** |
| Compare | Slot A vs. Slot B | **Vergleichstisch** (2–4 entities) **+ Szenario-Diff** (plans) |
| Save slots | Save-Slot 1/2/3 | **Szenarien A/B/C** as coloured tabs inside the Mappe |
| Search | ⌘K command palette | **Omnibox with operators**; `/` focuses; actions via `>` prefix |
| Home | Result list | **Heute** dashboard (next dates, exam countdowns, free rooms) |
| Density | Preference Komfort/Kompakt | **Automatic by pointer type** + user override |
| Mobile | Bottom nav, search at top | **Thumb bar with search at the bottom**, 4 tabs |
| High contrast | Toggle | **Full theme "Tinte"** + `forced-colors` mapping |

### 1.3 Personas & jobs-to-be-done

| Persona | Job | V2 answer |
|---|---|---|
| **Lea**, 1st-semester B.Sc. | "Which modules do I need, and when do they happen?" | Studienführer → Mappe → Woche; LP meter shows progress toward 30 LP |
| **Jonas**, M.Sc., picks electives | "Which Wahlpflicht fits my timetable?" | Satzfilter "nur konfliktfrei mit meiner Mappe", Vergleichstisch |
| **Aylin**, exam period | "When and where are my exams?" | Heute → Prüfungs-Countdown; Zeitachse; iCal subscription |
| **Dr. Weber**, staff | "Where do I teach, and which room is free?" | Personen-Blatt with week view; *Freie Räume* finder |
| **Sam**, screen-reader user | "Same speed as everyone else" | Omnibox tokens, sentence filters read as sentences, Tinte theme |

---

## 2. Current state audit (V2 lens)

V1 §2 already inventories the stack and the 14 known defects (missing Atkinson font file, duplicate ids, `<item>` elements, broken `label for`, `<h1>` per row, 60.5 MB `events.json`, commented-out `initCal()`, `<title>Document</title>`, …). They remain valid and **all 14 are fixed in V2 Phase 0** (§15). V2 adds a **data audit**, because several V2 features are driven by what the data really looks like.

### 2.1 Stack (unchanged, confirmed)

Vite 8 SPA · TypeScript 5.9 strict · Tailwind CSS v4 (`@tailwindcss/vite`, `@theme`, `@custom-variant dark`) · FullCalendar 7 · ESLint (indent 4, `max-statements: 12`, `complexity: 7`, JSDoc required, no raw loops) · Prettier 100 cols + `prettier-plugin-tailwindcss`. **No runtime dependencies** today; V2 keeps it that way except for the additions in §14.3.

### 2.2 Inventory of existing UI and what V2 does with it

| Existing element (`index.html`) | Today | V2 fate |
|---|---|---|
| `#display-changer1/2` (Liste/Kacheln/Kalender/Navigationsbaum as `<item>`) | Works for list/cards | → per-tab **Ansicht** segmented control |
| `#view-switcher` (Einzeln/Geteilt/Vergleichen) | Cosmetic | → **Workspace tabs**, *Nebeneinander*, *Vergleichstisch* |
| `#last-updated-con` | Static timestamp | → **Datenstand** chip in the footer line |
| `#language-switcher`, `#dark-mode-toggle` | No logic | → **Einstellungen** sheet + quick toggle in the rail |
| `#share-button`, `#export-button` | No-op | → **Teilen-Sheet** (link, QR, *Plan-Link*) and **Export-Sheet** |
| `#save-slot-options` | Dropdown only | → **Szenarien A/B/C** in the Mappe |
| `#filter-options` (5 groups, ~25 inputs) | No logic, duplicate ids | → **Satzfilter** + **Filter-Sheet**; every field preserved (§9.3) |
| `.type-switcher` (6 entity types) | Works | → **Entity token** at the start of the sentence |
| `.multi-level-sort` | Empty | → "sortiert nach **Name ↑**, dann **LP ↓**" inside the sentence |
| List items / cards with `save` button | Renders | → **Zeile** / **Karteikarte** with Anstreichen marker |
| "Mehr Details" | No-op | → **Peek** / **Blatt** |
| `main.calendar#calendar1/2` | Not initialised | → **Woche**, **Monat**, **Zeitachse**, **Heatmap** |
| `main.tree#tree1/2` | Hardcoded path | → **Studienführer** Miller columns |

### 2.3 Data profile (offline snapshot, 2026-09-27)

| Dataset | Items | Finding | V2 design consequence |
|---|---|---|---|
| Modules | **2 735** | `credits`: 10 LP (1 505) and 5 LP (1 120) cover 96 % | LP filter = **quick chips "5 · 10 · andere"**, not a slider |
| Modules | 2 735 | `frequency` has **27 different spellings + 63 empty** ("jedes Sommerrsemester", "every summer term", "jedesSommersemester", …) | **Turnus normaliser** → 6 canonical values (WiSe · SoSe · jedes Semester · jährlich · alle 2 Jahre · unregelmäßig/unbekannt); the raw string is shown in the Blatt |
| Modules | 2 735 | `language` is **empty for all** items | Language filter on *modules* hidden until data exists; filter on *courses* instead |
| Modules | 2 735 | `path` has 6 388 entries: `Root › Semester › Fakultät › Fach › Studiengang › Bereich › …` (up to 7 levels) | Studienführer as **Miller columns**; "Root" is never shown |
| Modules | — | A module can live in several programmes (`path[]`), and `faculty` may differ from the path's faculty | Blatt shows **"Verwendet in n Studiengängen"** |
| Courses | **8 403** | Top types: Seminar 3 431, Übung 1 908, Vorlesung 1 172 | **Type glyphs** V/Ü/S/P/K/… in rows and the week grid |
| Courses | 8 403 | `weekday` is **null for all** items | The weekday is derived from `/schedule/weekly` (§2.4), never from `course.weekday` |
| Exams | **6 422** | **3 010 (47 %) have no date**; 5 783 are `required` | First-class **"Termin offen"** state; "Pflicht" badge |
| Events | **129 438** | Single dates with room + building + staff; `name` often empty | Title falls back to course name; events are **never listed unbounded** (§13) |

### 2.4 API capabilities the current UI does not use yet

From `https://api.casparkroll.de/almaweb/v1/openapi.json` (AlmaWeb API 1.0.2, read 2026-09-27). The frontend uses only 6 flat list calls today, but the API offers much more, and several V2 features depend on it:

| Capability | Endpoint / parameter | Enables in V2 |
|---|---|---|
| Server paging | `page`, `page_size` (omitting both disables paging!) | Virtual lists without the 60 MB download; **always send `page_size`** |
| Module texts | `ModuleRead.goals`, `content`, `prerequisites`, `exam_prerequisites` | Blatt sections "Ziele", "Inhalt", "Voraussetzungen"; **Voraussetzungs-Check** (F5) |
| Degrees | `/degrees`, `/degrees/{id}/modules`, `/modules/{id}/degrees` | Studienführer by programme; "Verwendet in n Studiengängen" |
| Semesters | `/semesters`, `/semesters/{id}/…`, `start_semester` | Semester picker values from data (not hardcoded) |
| Relations | `/modules/{id}/courses`, `/courses/{id}/events`, `/modules/{id}/events`, `/exams?module_id=` | Cross-links in every Blatt; Nebeneinander link mode |
| Weekly slots | `/schedule/weekly` (deduplicated weekday/time/room slots) | **Woche** without loading every dated event; course weekday derivation |
| Time filters | `/events?weekday=&start_time_from=&time_overlap=HH:MM&date_from=&date_to=` | Free-room finder (F6), "zwischen 08:00 und 12:00" |
| Shortcuts | `/events/today`, `/events/tomorrow`, `/events/week`, `/events/day/{date}` | Heute dashboard |
| Rooms | `/locations?accessible=&seats_min=&types=&building_ids=` | Raum filters "barrierefrei", "≥ n Plätze" |
| Facet values | `/{entity}/distinct/fields?field=` | Satzfilter popovers with real values (types, faculties, frequencies) |
| Export | `format=json\|csv` (all lists), `format=ical` (events) with `ical_collapse_recurring`, `ical_calendar_name`, `ical_reminder_minutes`, `ical_map` | Server-side CSV + iCal export and `webcal://` subscription (F9) |
| Health | `/admin/health` (200 / 503) | "Datenquelle nicht erreichbar" state |

⚠ **Weekday convention differs:** `/events?weekday=` uses **0 = Sunday**, `/schedule/weekly?weekdays=` uses **0 = Monday**. The API client must normalise to ISO (1 = Monday … 7 = Sunday) in one place (`ts/api/weekday.ts`).

---

## 3. Branding

> **ADR-V2-001 — "Das Studienbuch".** Status: *Proposed*. Replaces V1 ADR-001.
> **Context.** V1 optimises for a neutral, fast utility. The product's actual job, though, is *planning a semester*, which is personal and recurring. V2 assumes (no user research exists yet, see §16) that a warmer, more personal tool will be opened more often. Utility speed is kept; the emotional tone changes from "database" to "my planner".
> **Decision.** Paper-and-ink visual language, a Leipzig-rooted green, a single highlighter accent that always means *angestrichen / mine*, editorial serif headings over a neutral UI sans.
> **Consequences.** Bellis Blue and Bellis Pink are retired. A new wordmark and icon are needed. The calendar theme (FullCalendar Monarch) is replaced by token-driven overrides.

### 3.1 Name

| Option | Pro | Con |
|---|---|---|
| **almanach** *(recommended, ⚑ confirm)* | "alma" + "nach(schlagen)"; an almanac *is* a yearly catalogue and calendar; works in DE and EN (almanac) | New name to learn; repo stays `almaweb-ui` |
| alma.web *(fallback)* | Continuity | Sounds like the official ALMA system, which increases the risk of confusion with the university's product |
| Linde | Leipzig reference, short | Hides the purpose |

Subtitle: DE *„Vorlesungsverzeichnis, Stundenplan und Prüfungen — inoffiziell für die Universität Leipzig"* · EN *"Course catalogue, timetable and exams — unofficial, for Leipzig University"*.

### 3.2 Logo system

- **Wordmark:** `almanach` in **Fraunces 600, optical size 72, `SOFT` 50**, lowercase, tracking −2 %. No other ornament: the second **a** carries a short **highlighter stroke** (`--hl-500`) behind its lower half, the single brand gesture.
- **Mark / app icon:** a **book spine with a linden leaf as the bookmark ribbon**. Squircle 24 % radius, `--brand-700` ground, leaf in `--hl-500`. Stroke-based at 1.75 px/24 px so it survives as a 16 px favicon.
- **Monochrome variants:** ink-on-paper and paper-on-ink for the *Tinte* theme and for print.
- **Clear space:** height of the "a" x-height on all sides. Minimum wordmark width 72 px.
- **Don'ts:** no gradients, no shadows inside the mark, no recolouring outside `brand-*`, `ink`, `paper`, `hl-500`.

### 3.3 Brand gestures (used sparingly)

| Gesture | Where | Rule |
|---|---|---|
| **Highlighter stroke** (skewed, rough-edged yellow band behind text) | Marked items, active search hit, the logo | Only for personal state or a current search match, never decoration |
| **Register tabs** (index tabs on the sheet edge) | Mappe scenarios A/B/C, workspace tabs | Max. 6 visible; colour = scenario/entity |
| **Paper sheet** (warm surface, 1 px edge + soft shadow) | Blatt, Peek, dialogs | Only one sheet elevation per stack level |
| **Margin note** (small italic Fraunces in `ink-muted`) | Personal notes, data hints ("Turnus uneinheitlich angegeben") | Always tied to an element |

### 3.4 Voice & tone

Du-form, friendly, short, like a well-organised fellow student. Two rules: **say what is missing** and **offer the next step**.

| Situation | ✅ V2 | ❌ Avoid |
|---|---|---|
| Empty result | „Nichts gefunden für *Statistk*. Meintest du **Statistik**?" | „Keine Daten." |
| Exam without date | „Termin offen — noch nicht im Verzeichnis. Wir zeigen ihn, sobald er da ist." | „Kein Datum" |
| Too many events | „4 812 Termine — zu viele für eine Woche. So verteilen sie sich:" + heatmap | „Zu viele Einträge." |
| Conflict | „Überschneidet sich mittwochs mit *Analysis I* (10:15–11:45)." | „Konflikt!" |
| Offline | „Offline — du siehst den Stand von heute 08:12." | „Netzwerkfehler" |

Formatting: `Mi, 22.10.2025` · `15:15–16:45` (en dash, no spaces in compact, spaces in prose) · `10 LP` · `2 SWS` · numbers with `Intl.NumberFormat` (de: `129.438`, en: `129,438`). *Pflicht* / *Wahlpflicht* / *Wahl* as fixed terms.

### 3.5 Legal posture (retained requirement, new presentation)

The "inoffiziell" disclaimer (V1 decision Q2) remains mandatory. V2 renders it as a **colophon** (*Impressum-Seite* in book style) at `#/kolophon` and a one-line footer: *„Inoffizielles Projekt · keine Verbindung zur Universität Leipzig · Angaben ohne Gewähr"*. No university logo, colours or typography are used.

---

## 4. Colour system

Three themes ship: **Papier** (light, default), **Nacht** (dark), and **Tinte** (high contrast). Plus a `forced-colors` mapping. The theme follows the OS unless the user overrides it. It is applied **pre-paint** via `data-theme` on `<html>`, which replaces the hardcoded `class="dark"`.

### 4.1 Core palette

| Token | Papier (light) | Nacht (dark) | Use |
|---|---|---|---|
| `--paper` (canvas) | `#F7F4EC` | `#121418` | App background, warm off-white / blue-black |
| `--sheet` (surface) | `#FFFDF8` | `#1A1D22` | Cards, sheets, inputs |
| `--sheet-2` (raised/hover) | `#EFEBE0` | `#23272D` | Hover, toolbars, table header |
| `--rule` (hairline) | `#DAD4C4` | `#2E333A` | Decorative dividers only (no meaning) |
| `--rule-strong` (UI boundary) | `#8C8574` | `#7A7F88` | Input borders, focusable outlines: **3.61:1 / 3.73:1** ✓ (≥ 3:1) |
| `--ink` (text) | `#1C1E24` | `#ECEAE4` | Body text: **16.39:1 / 14.05:1** on sheet |
| `--ink-muted` | `#595C66` | `#A7A9AE` | Secondary text: **6.56:1 / 7.19:1** on sheet |
| `--ink-subtle` | `#6B6E78` | `#8A8E96` | Tertiary/meta: **5.01:1 / 5.14:1** on sheet (4.63:1 on paper) |
| `--brand-700` **Lindgrün** | `#0E5C4A` | `#5CCFB0` | Brand, primary buttons, links, focus: **7.80:1 / 8.86:1** |
| `--brand-800` | `#0A4A3C` | `#7FDCC2` | Hover/pressed brand; text on `--brand-50`: 8.78:1 |
| `--brand-50` | `#E3F1EC` | `#243B35` | Selected row, active nav background |
| `--on-brand` | `#FFFDF8` | `#06231C` | Text on brand fill: **7.80:1 / 8.70:1** |
| `--hl-500` **Textmarker** | `#FFE066` | `#E9C94A` | Highlighter fill only: ink on it **12.78:1**, dark ink on it **11.34:1** |
| `--hl-ink` | `#1C1E24` | `#121418` | Text on highlighter, always |
| `--focus` | `#0E5C4A` | `#5CCFB0` | 2 px ring + 2 px `--paper` gap |

**Highlighter rule:** `--hl-500` is **never** text colour and never the only indicator. On Papier it has 1.28:1 against the sheet, so a marked item always carries the **filled bookmark icon + "Angestrichen" label/aria** as well. Colour is reinforcement, not the signal.

### 4.2 Status colours

| Token | Papier | ratio on sheet | Nacht | ratio on sheet | Icon (redundant cue) |
|---|---|---|---|---|---|
| `--ok` | `#1E7B45` | 5.20:1 | `#6FD39A` | 9.22:1 | `check-circle` |
| `--warn` | `#8A5A00` | 5.83:1 | `#F2C35B` | 10.25:1 | `triangle-alert` |
| `--danger` | `#B42318` | 6.47:1 | `#FF8A80` | 7.40:1 | `octagon-x` |
| `--info` | `#1D5FA8` | 6.35:1 | `#8DB8F2` | 8.26:1 | `info` |

Tinted backgrounds (`--ok-50` `#E8F5EC`, `--warn-50` `#FFF4DC`, `--danger-50` `#FDECEA`, `--info-50` `#E8F0FB`) keep their foreground ≥ 4.5:1 (4.71 / 5.43 / 5.75 / 5.62 : 1).

### 4.3 Entity palette ("Register colours")

Each entity type has a **register colour, a glyph, and a label**, so colour is never the only cue. The palette is intentionally distinct from brand green and highlighter yellow.

| Entity | Register | Papier `ink` (on sheet) | Papier `tint` | Nacht `ink` (on sheet) | Glyph (Lucide) |
|---|---|---|---|---|---|
| **Modul** | Heidelbeere | `#3B5BDB` · 5.58:1 | `#EDF1FF` (5.03:1) | `#91A7FF` · 7.38:1 | `book-open` |
| **Kurs** | Petrol | `#0B7285` · 5.49:1 | `#E3F6F8` (5.00:1) | `#66D9E8` · 10.18:1 | `users` |
| **Termin** (event) | Terrakotta | `#A63C09` · 6.31:1 | `#FFF0E6` (5.76:1) | `#FFA94D` · 8.88:1 | `clock` |
| **Prüfung** | Himbeere | `#C2255C` · 5.56:1 | `#FFECF2` (4.99:1) | `#FAA2C1` · 8.85:1 | `file-pen-line` |
| **Person** | Pflaume | `#862E9C` · 7.16:1 | `#F8EDFB` (6.41:1) | `#E599F7` · 8.23:1 | `user-round` |
| **Raum** | Schiefer | `#495057` · 8.04:1 | `#EEF0F2` (7.16:1) | `#CED4DA` · 11.31:1 | `door-open` |

In Nacht, tints are the ink colour at 16 % over `--sheet` (e.g. Modul `#2D3345`, Termin `#3F3329`); ink on its tint is ≥ 5.24:1 for all six. Solid fills (calendar blocks) use `--on-entity` = `--sheet` in Papier (≥ 5.49:1) and `#121418` in Nacht (≥ 8.06:1).

> Note: V2 renames the user-facing entity "Veranstaltung" to **Termin** (a single dated session). In German university usage *Lehrveranstaltung* usually means the *course*, so "Veranstaltungen" for single sessions next to "Kurse" is ambiguous. The API name `events` is unchanged. ⚑ confirm.

### 4.4 Scenario colours (Mappe A/B/C)

| Scenario | Colour (Papier / Nacht) | Pattern (for colour-blind + print) |
|---|---|---|
| **A** | Lindgrün `#0E5C4A` / `#5CCFB0` | solid |
| **B** | Lavendel `#6741D9` (5.73:1 on paper) / `#B197FC` (7.00:1) | diagonal hatch |
| **C** | Olive `#3F6308` (6.37:1 on paper) / `#A9E34B` (11.09:1) | dots |

Scenario colours appear only as register tabs, calendar block edges, and legend swatches, always next to the letter A/B/C.

### 4.5 Tinte (high-contrast theme) & forced colours

- **Tinte:** pure `#000000` canvas / `#FFFFFF` ink (21:1), brand becomes `#5CCFB0`, highlighter `#FFE066` with black text (16.11:1), all borders 2 px `#FFFFFF`, no shadows, no tints. Entity colours collapse to white + glyph + label.
- **`@media (forced-colors: active)`:** all tokens map to system colours (`Canvas`, `CanvasText`, `LinkText`, `Highlight`, `ButtonBorder`); marker stroke → `Mark`/`Highlight`; focus ring → `Highlight`. No information is lost because every colour already has a glyph or label.

---

## 5. Typography

| Role | Family | Why |
|---|---|---|
| **Display / headings** | **Fraunces** (variable: `opsz` 9–144, `wght` 400–700, `SOFT`, `WONK` off) | Warm, bookish, editorial; this is where the "Studienbuch" identity lives. Used **only** ≥ 20 px |
| **UI / body / data** | **Inter** (variable: `wght` 400–700, `opsz` 14–32) | Neutral, highly legible at 13–16 px; `tnum` gives tabular digits for times, LP and module numbers, so no mono font is needed |
| **Numbers** | Inter with `font-feature-settings: "tnum", "zero" 0, "ss01"` | `ss01` = open digits; aligns `10:15–11:45` in columns |

Both are OFL, from Google Fonts, **self-hosted** as `woff2` in `assets/fonts/` (V1 decision Q3 honoured). Subset: Latin + Latin-Ext (umlauts, ß, typographic quotes „ " ‚ ', en dash, arrows). Budget target: ≤ 220 KB for both variable latin subsets combined (estimate, verify after subsetting), both `font-display: swap` with metric-matched fallbacks (`size-adjust`, `ascent-override`) to keep CLS ≈ 0.

### 5.1 Type scale (fluid, 1.2 minor-third)

| Token | Size | Line | Family / weight | Use |
|---|---|---|---|---|
| `--t-display` | `clamp(2rem, 1.4rem + 2.4vw, 3rem)` | 1.05 | Fraunces 600, `opsz` 96 | Heute greeting, empty-state headline |
| `--t-h1` | `clamp(1.625rem, 1.3rem + 1.2vw, 2.125rem)` | 1.15 | Fraunces 600, `opsz` 48 | Blatt title |
| `--t-h2` | `1.375rem` | 1.2 | Fraunces 560, `opsz` 32 | Section heads in Blatt, Mappe |
| `--t-h3` | `1.0625rem` | 1.3 | Inter 650 | Card titles, row titles |
| `--t-body` | `0.9375rem` (15 px) | 1.5 | Inter 420 | Running text |
| `--t-ui` | `0.875rem` (14 px) | 1.4 | Inter 500 | Buttons, tokens, tabs |
| `--t-meta` | `0.8125rem` (13 px) | 1.35 | Inter 450, `tnum` | Module numbers, times, LP |
| `--t-micro` | `0.75rem` (12 px) | 1.3 | Inter 600, `+2 %` tracking, small-caps | Overlines ("WAHLPFLICHT"), register labels |

Rules: never below 12 px; max line length 72 ch for prose; headings use `text-wrap: balance`, prose `text-wrap: pretty`; German hyphenation `hyphens: auto` with `lang="de"` for long compound words ("Wahlpflichtmodule der Geistes- und Sozialwissenschaften").

---

## 6. Shape, space, paper & motion

### 6.1 Spacing: 4 px base

`--s-0: 2px · --s-1: 4px · --s-2: 8px · --s-3: 12px · --s-4: 16px · --s-5: 24px · --s-6: 32px · --s-7: 48px · --s-8: 64px`

**Auto density** (new): `@media (pointer: coarse)` → *Bequem* (row min-height 56 px, targets ≥ 44 px); `@media (pointer: fine)` → *Dicht* (row 40 px, targets ≥ 24 px per WCAG 2.5.8). User override in Einstellungen. Implemented by one variable `--density: 1 | 0.75` multiplying vertical padding.

### 6.2 Radius: "soft paper"

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 4px | Tokens, badges |
| `--r-sm` | 8px | Inputs, buttons |
| `--r-md` | 14px | Cards (Karteikarten), popovers |
| `--r-lg` | 22px | Sheets (Blatt, Peek, dialogs) |
| `--r-pill` | 999px | Omnibox, segmented controls, avatar |

Sheets have **asymmetric corners** on the register side (tab corner 4 px), a deliberate "folder" silhouette.

### 6.3 Paper elevation

Unlike V1's no-shadow rule, V2 uses warm, low, **two-layer paper shadows**. They are tinted, never pure black:

| Level | Papier | Nacht | Use |
|---|---|---|---|
| `--e-0` | none + `1px --rule` | none + `1px --rule` | Rows, inline cards |
| `--e-1` | `0 1px 0 #2B24140F, 0 1px 3px #2B24141A` | `0 0 0 1px #FFFFFF0D` | Karteikarte, Mappe tray |
| `--e-2` | `0 2px 4px #2B241412, 0 8px 24px #2B24141F` | `0 0 0 1px #FFFFFF14, 0 8px 24px #0000008C` | Peek, popovers, Omnibox dropdown |
| `--e-3` | `0 4px 8px #2B241414, 0 24px 48px #2B241429` | `0 0 0 1px #FFFFFF1A, 0 24px 48px #000000A6` | Blatt, dialogs |

In Nacht, elevation is mostly expressed by **surface lightness** (`--sheet` → `--sheet-2`), shadows are secondary. In Tinte: no shadows, 2 px borders.

**Paper texture:** optional, **off by default**. It is a 2 % opacity SVG noise on `--paper` (≤ 1 KB, inline data URI), and never sits under text on sheets.

### 6.4 Motion: "turn the page"

| Token | Value | Use |
|---|---|---|
| `--m-fast` | 120ms `cubic-bezier(.2,0,0,1)` | Hover, press, toggles |
| `--m-base` | 200ms `cubic-bezier(.2,0,0,1)` | Popovers, Peek |
| `--m-sheet` | 280ms `cubic-bezier(.32,.72,0,1)` | Blatt slide-in, mobile sheets |
| `--m-mark` | 360ms `cubic-bezier(.6,0,.2,1)` | Highlighter stroke "drawn" left→right when marking |

- **View Transitions API** (`document.startViewTransition`) for tab switches and Peek → Blatt morph; falls back to instant swap.
- **Mark animation:** the highlighter band grows with `clip-path: inset(0 100% 0 0)` → `inset(0)`; this is the product's single "delight" moment.
- `prefers-reduced-motion: reduce` → all durations 0 ms except a 120 ms opacity fade; the mark appears instantly.

---

## 7. Layout & information architecture

### 7.1 Information architecture

Four top-level destinations replace V1's single result screen. All are hash routes, so no server is needed:

| Route | Name (DE / EN) | Purpose |
|---|---|---|
| `#/heute` | **Heute** / Today | Personal dashboard: next dates, exam countdowns, conflicts, free rooms now. Default once the Mappe is non-empty |
| `#/suche` | **Blättern** / Browse | Omnibox + Satzfilter + results in workspace tabs. Default for first-time visitors |
| `#/fuehrer` | **Studienführer** / Guide | Programme → area → module drill-down (Miller columns) |
| `#/mappe` | **Mappe** / Binder | Marked items, scenarios A/B/C, Woche, Semesterplaner, LP meter, notes |
| `#/<typ>/<id>` | **Blatt** | Full sheet for one entity (e.g. `#/modul/1`, `#/raum/12`) |
| `#/plan/<payload>` | Geteilter Plan / Shared plan | Read-only view of someone else's plan with "In meine Mappe übernehmen" (§10 F8) |
| `#/kolophon` | Kolophon | Disclaimer, Impressum, data source, licences, accessibility statement |

### 7.2 Desktop shell (≥ 1200 px)

```
┌────┬──────────────────────────────────────────────────────────────────┬──────────────────┐
│ ▣  │  ( ⌕  Suche: Module, Kurse, Räume, Personen …   lp:10  /  )      │  MAPPE        ⤢  │
│    ├──────────────────────────────────────────────────────────────────┤  ┌A┐┌B┐┌C┐       │
│ ☀  │  Zeige [Module ▾] aus [Informatik ×] im [WiSe 2025/26 ▾]          │  ▮▮▮▮▮▮▯▯ 20/30 LP│
│Heute│  mit [5–10 LP ×]  [+ Bedingung]   sortiert nach [Name ↑]  ⟲      │  ─────────────── │
│    ├──────────────────────────────────────────────────────────────────┤  ▍Analysis I  10 │
│ ⌕  │ ▭ Module · Informatik ×│ ▭ Termine · diese Woche ×│ ＋            │  ▍Algorithmen 10 │
│Blät│──────────────────────────────────────────────────────────────────│  ▍Statistik   ⚠  │
│    │ 214 Treffer  ·  Ansicht [≡ Zeilen|▦ Karten|▤ Tabelle|🗓|⌇]        │  ─────────────── │
│ ☷  │ ┌──────────────────────────────────────────────────────────────┐ │  Diese Woche     │
│Führ│ │📖 Algorithmen und Datenstrukturen 1         10-201-2001-1 🔖 │ │  Mo ▇▇  ▇        │
│    │ │   5 LP · jedes SoSe · V Ü · 1 Semester                       │ │  Di   ▇▇▇        │
│ 🔖 │ ├──────────────────────────────────────────────────────────────┤ │  Mi ▇  ⚠▇        │
│Mapp│ │📖 Analysis 1                                 10-MAT-BM001 🔖 │ │  …               │
│    │ │   10 LP · jedes WiSe · V Ü                                   │ │                  │
│ ⚙  │ └──────────────────────────────────────────────────────────────┘ │ [Woche öffnen →] │
├────┴──────────────────────────────────────────────────────────────────┴──────────────────┤
│ Datenstand 27.09.2026 08:12 · Inoffizielles Projekt · Angaben ohne Gewähr · Kolophon      │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

| Region | Size | Job |
|---|---|---|
| **Nav rail** | 72 px | Logo, 4 destinations (icon + label, never icon-only), Einstellungen, theme quick toggle |
| **Omnibox** | full width, 48 px pill | Global search with operators (§8.2). `/` focuses it; `>` switches to actions |
| **Satzfilter** | auto height | The current query as an editable sentence (§8.3). Replaces the entire filter rail |
| **Workspace tabs** | 40 px | Each tab = one saved query + view. Tabs persist; middle-click closes; drag to reorder; drag a tab onto another to open **Nebeneinander** (side by side) |
| **Result area** | fluid, `minmax(0,1fr)` | View per tab: Zeilen, Karten, Tabelle, Woche/Monat, Zeitachse |
| **Mappe tray** | 320 px, collapsible to 56 px (tabs only) | Live binder: scenario tabs, LP meter, marked items, mini week sparkline, conflicts |
| **Colophon line** | 32 px | Data timestamp, disclaimer, link to `#/kolophon` |

**Peek** opens as an anchored `--e-2` sheet *over* the result area (not a new column), so result width never jumps. **Blatt** opens as a full-height `--e-3` sheet sliding in from the right over the result area and tray, with its own URL.

### 7.3 Responsive behaviour

| Range | Shell |
|---|---|
| **< 600 px** (phone) | **Thumb bar** at the bottom: Omnibox pill *above* 4 tabs (Heute · Blättern · Führer · Mappe). Satzfilter collapses to a single summary line ("Module · Informatik · 2 weitere") that opens a bottom sheet. Karten view default. Peek = half-height bottom sheet (drag to full = Blatt). Mappe tray → Mappe tab with badge |
| **600–899 px** (small tablet) | Thumb bar stays; two-column Karten; Blatt as full-screen sheet |
| **900–1199 px** (tablet/laptop) | Nav rail replaces the thumb bar; Omnibox moves to the top; Mappe tray is an overlay drawer (toggle in rail with count badge) |
| **≥ 1200 px** | Full shell (§7.2), tray docked |
| **≥ 1600 px** | Result area max 1120 px for Zeilen/Karten (readability); Tabelle and Woche use full width; *Nebeneinander* allowed without collapsing the tray |

```
PHONE (< 600 px)
┌──────────────────────────┐
│ almanach          ☀  ⚙  │
├──────────────────────────┤
│ Module · Informatik · +2 ▾│  ← Satzfilter summary
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │📖 Analysis 1      🔖 │ │
│ │10-MAT-BM001          │ │
│ │10 LP · WiSe · V Ü    │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │📖 Lineare Algebra 1🔖│ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ ( ⌕ Suchen …          )  │  ← Omnibox in thumb reach
│  ☀     ⌕     ☷     🔖³  │
│ Heute Blätt. Führer Mappe│
└──────────────────────────┘
```

Rules: 320 px reflow and 400 % zoom never create page-level horizontal scroll (Tabelle scrolls inside its own container with a sticky first column). `env(safe-area-inset-*)` padding on the thumb bar. Virtual keyboard: the Omnibox uses `interactive-widget=resizes-content` in the viewport meta so the bar stays above the keyboard.

### 7.4 State model

| State | Where | Notes |
|---|---|---|
| Query (entity, conditions, sort, view) of the active tab | **Hash query** `#/suche?t=modul&fak=10&sem=2025w&lp=5-10&s=name&v=zeilen` | Human-readable, shareable, back/forward per committed change (not per keystroke) |
| Open tabs & order | `localStorage` | Restored on return; a shared link opens as a *new* tab rather than replacing yours |
| Open Blatt | Hash path `#/modul/46` | Deep link |
| Mappe (marks, notes, scenarios, grades) | **IndexedDB** (`almanach-mappe` DB) | Never sent anywhere; export/import as JSON |
| Plan-Link | Hash route `#/plan/<payload>` (compressed) | Self-contained, see §10 F8 |
| Settings (theme, lang, density, motion, texture) | `localStorage`, applied pre-paint | Inline 400-byte boot script in `<head>` |

---

## 8. Component library

All components are **native elements first** (`<button>`, `<dialog>`, `<details>`, `<input>`, `<table>`, Popover API `popover`), styled through tokens, with state in attributes (`aria-pressed`, `aria-selected`, `aria-expanded`, `data-state`). There is no `<item>`, and `:has()` is used only for cosmetics.

### 8.1 Primitives

| Component | Anatomy | Variants / states |
|---|---|---|
| **Button** | icon (optional) + label; min 36 px (Dicht) / 44 px (Bequem) | `primary` (brand fill), `quiet` (ink on transparent, hover `--sheet-2`), `outline` (`--rule-strong`), `danger`; `:focus-visible`, `[aria-busy]` with inline spinner, `:disabled` |
| **Icon button** | 20 px Lucide icon in a 36/44 px target | Always `aria-label` + tooltip; never used for primary actions |
| **Segmented control** | Pill with 2–5 options, sliding indicator | Replaces all current `.switcher`s; `role="radiogroup"` |
| **Token** | `--r-xs`, entity/condition coloured edge, label, `×` | Used in Omnibox and Satzfilter; `Backspace` removes the last one |
| **Badge** | micro text, tinted | `Pflicht`, `Wahlpflicht`, `Termin offen`, `neu`, count |
| **Marker (Anstreichen)** | bookmark icon toggle + highlighter band on the item title | `aria-pressed`; scenario dot when marked in B/C |
| **Field** | label above, input, help/error below | Text, number, time, date, select; the error text is linked with `aria-describedby` |
| **Popover / Menu** | Popover API + anchor positioning (`position-anchor`), fallback JS | Menus, sort, view options |
| **Sheet** | `<dialog>`, `--r-lg`, `--e-3`, drag handle on touch | Side (Blatt), bottom (mobile), center (dialogs) |
| **Toast** | bottom-left (desktop) / above thumb bar (mobile), `role="status"` | Always offers **Rückgängig** for destructive/bulk actions |
| **Skeleton** | Paper-coloured blocks with 1.2 s shimmer (off with reduced motion) | Matches final layout, so CLS = 0 |

### 8.2 Omnibox (replaces V1 command palette and per-type search inputs)

One field that understands **free text + operators**. Suggestions are grouped by entity, and each group shows its register colour + glyph.

| Operator | Example | Meaning |
|---|---|---|
| free text | `statistik` | Fuzzy over name, number, staff; diacritic- and typo-tolerant ("stat", "Statistk") |
| exact number | `10-201-2001-1` | Detected by pattern → jumps straight to the Blatt |
| `typ:` | `typ:kurs` | Entity (`modul`, `kurs`, `termin`, `pruefung`, `person`, `raum`) |
| `lp:` | `lp:5`, `lp:5-10` | Credits |
| `sem:` | `sem:wise25` | Semester |
| `fak:` | `fak:10` | Faculty by number |
| `art:` | `art:seminar` | Course type / exam type |
| `tag:` | `tag:mi` | Weekday (derived from events) |
| `zeit:` | `zeit:>14:00` | Start time |
| `von:` | `von:müller` | Staff (teaching or examining) |
| `in:` | `in:hs1` | Room / building |
| `frei:` | `frei:jetzt`, `frei:mi 10-12` | Free rooms (§10 F6) |
| `ist:` | `ist:markiert`, `ist:pflicht`, `ist:konfliktfrei` | Personal / flag filters |
| `>` prefix | `> dunkel` | Actions: theme, language, export, new tab, clear Mappe … |

Typed operators turn into **tokens** instantly, and the Satzfilter reflects them. Keyboard: `/` focus, `↑↓` move, `Enter` open, `Alt+Enter` open in new tab, `Tab` accept suggestion as token, `Esc` clear/close. The Omnibox has `role="combobox"` with `aria-activedescendant`.

### 8.3 Satzfilter (sentence builder, replaces the filter rail)

The query is rendered as a German (or English) sentence. Each **underlined slot** is a button that opens a small popover editor:

> Zeige **[Module ▾]** aus **[Informatik ×]** im **[WiSe 2025/26 ▾]** mit **[5–10 LP ×]** **[+ Bedingung]**, sortiert nach **[Name ↑]** **[+ dann nach]**.

- **Entity slot** always comes first and determines which conditions are offered, using the same fields as today's filter groups (§9.3).
- **[+ Bedingung]** opens a searchable list of conditions valid for the entity, with the most-used ones on top.
- Each slot shows a **live count preview** in its popover (e.g. "Informatik: 214 Module"; numbers in mockups are illustrative).
- **Sort** is part of the sentence ("sortiert nach Name ↑, dann nach LP ↓"), which fills the empty `.multi-level-sort` placeholder. Up to 3 keys.
- **⟲ Zurücksetzen** clears the conditions but keeps the entity.
- **Screen readers** read the sentence as-is; each slot is a button labelled e.g. "Fakultät: Informatik, ändern".
- **Mobile:** collapses to a summary line; tapping opens a bottom sheet listing the slots vertically.
- **Advanced**: "Alle Filter" opens the **Filter-Sheet**, a classic form for power users with all fields grouped. It edits the same query model.

### 8.4 Result items

| Component | Anatomy | Notes |
|---|---|---|
| **Zeile** (row) | register glyph · title (`--t-h3`) · number (`--t-meta`, `tnum`) · **one** meta line (max 4 facts, `·`-separated) · badges · marker | Single-line meta instead of V1's chip rows: calmer and faster to scan. Title is a `<a href="#/modul/46">`; clicking opens Peek, `Ctrl/⌘+Click` opens the Blatt in a new tab |
| **Karteikarte** (index card) | top edge in register colour (4 px) · overline (entity + type) · title · number · 2–3 facts as a small definition list · footer: marker + "Blatt öffnen" | `--r-md`, `--e-1`; hover lifts to `--e-2` |
| **Tabellenzeile** | Real `<table>`, sticky header, sortable `<th aria-sort>`, column picker | For comparison-minded users |
| **Zeitblock** | Calendar block: register colour fill, title, time, room short name; scenario edge on the left | Conflict = hatched `--danger` overlay + icon |

Per-entity facts (the one meta line):

| Entity | Facts (priority order) |
|---|---|
| Modul | LP · Turnus (normalised) · course-type glyphs (V Ü S …) · semesters |
| Kurs | Type · SWS · weekday + time (from `/schedule/weekly`) · lead staff |
| Termin | Weekday + date · time · room (building short name) · staff |
| Prüfung | Date or **Termin offen** · time · Pflicht · examiners |
| Person | Number of courses · number of exams this semester |
| Raum | Type · seats · accessibility (icon + text) · building short name |

### 8.5 Peek & Blatt

- **Peek** (quick look): 420 px anchored sheet with title, key facts, and the next 3 dates, plus **Anstreichen**, **Blatt öffnen**, and **In Vergleich**. `Space` toggles Peek on the focused row (like macOS Quick Look), and `Esc` closes it.
- **Blatt** (full sheet): its own route. Layout = *book page*: Fraunces title, overline with entity + number, a **margin column** (desktop ≥ 1200 px) holding personal notes, and a main column with sections (§9.6). Includes **"Zuletzt angesehen"** breadcrumbs at the top.

### 8.6 Mappe components

| Component | Description |
|---|---|
| **Register tabs** | A / B / C scenario tabs (colour + letter + pattern); max. 3 scenarios (one per defined colour/pattern); rename, duplicate, clear with undo |
| **LP-Meter** | Segmented bar: marked LP vs. target (default 30 per semester, editable); segments coloured per module; text "20 von 30 LP" |
| **Wochen-Sparkline** | 5 mini columns Mo–Fr showing occupied hours; conflicts marked ⚠ |
| **Konfliktliste** | Pairs of overlapping items with "Alternative finden" (§10 F3) |
| **Notizfeld** | Margin note per item, markdown-light (bold, lists, links), local only |

---

## 9. Views

### 9.1 Heute (new home)

```
┌───────────────────────────────────────────────────────────────────────┐
│  Guten Morgen.  Mittwoch, 22. Oktober                                   │  ← Fraunces display
│                                                                         │
│  ┌─ Als Nächstes ──────────────────┐  ┌─ Prüfungen ────────────────────┐│
│  │ 10:15  Analysis 1 · V            │  │ 12 Tage  Analysis 1 · Klausur  ││
│  │        HS 3 · Hörsaalgebäude      │  │ 27 Tage  Statistik · Klausur   ││
│  │ 13:15  Algorithmen · Ü            │  │  —       Lineare Alg. · offen  ││
│  │        SG 3-12 · Seminargebäude   │  └────────────────────────────────┘│
│  └──────────────────────────────────┘  ┌─ Achtung ──────────────────────┐│
│  ┌─ Freie Räume jetzt (nahe HS 3) ──┐  │ ⚠ 1 Überschneidung am Mittwoch  ││
│  │ S 102 · 48 Plätze · bis 13:00     │  │ ✎ 2 Module ohne Prüfungstermin  ││
│  └──────────────────────────────────┘  └────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────┘
```

- Built only from **Mappe + events + exams**; no account needed.
- Cards reorder by urgency: a conflict or exam < 7 days moves to the top.
- Empty state (no Mappe yet): *„Dein Semester ist noch leer. Fang mit dem Studienführer an."* → CTA to `#/fuehrer`, secondary CTA "Suche öffnen".

### 9.2 Blättern (browse)

Per-tab **Ansicht** control: **Zeilen** (default for Module/Kurse/Personen/Räume), **Karten**, **Tabelle**, **Kalender** (Woche/Monat), **Zeitachse** (default for Termine/Prüfungen).

- **Virtualised** rendering for Zeilen/Karten/Tabelle (≈ 40 DOM rows regardless of total).
- **Group headers** (sticky): by semester for modules, by weekday for courses, by date for Termine/Prüfungen; toggled in the view menu.
- **Result summary** line: "214 Module · 1 872 LP gesamt · 12 angestrichen". Clicking "angestrichen" adds `ist:markiert`.
- **Bulk mode:** `Shift+Click` / long-press selects; bulk bar offers "Anstreichen in A/B/C", "Vergleichen" (2–4), and "Export".
- **Nebeneinander:** two tabs side by side with a draggable divider; the **link toggle 🔗** ties the right tab to the selection in the left one (e.g. left = modules, right = Termine *of the selected module*). This replaces V1's "Geteilt" mode with a master–detail relationship instead of two unrelated panes.

### 9.3 Filter coverage (every existing field preserved)

| Current group / field (`#filter-options`) | V2 condition (slot / operator) |
|---|---|
| Globale Filter → Semester | `im [Semester]` / `sem:` (multi) |
| Modulfilter → Modulname, Modulnummer | Omnibox free text / number detection |
| Modulfilter → Fakultät | `aus [Fakultät]` / `fak:` |
| Modulfilter → Verantwortliche Person | `von [Person]` / `von:` |
| Modulfilter → Leistungspunkte (min/max) | `mit [LP]` with quick chips 5 · 10 · andere + range / `lp:` |
| Modulfilter → Semesterdauer (min/max) | `über [n Semester]` |
| Modulfilter → Sprache | Hidden for modules (field empty in data); offered on Kurse |
| Kurse → Kursname, Kursnummer | Omnibox |
| Kurse → Kurstyp | `als [Seminar, Übung …]` / `art:` |
| Kurse → Dozenten in Kursen | `von:` |
| Kurse → Wochenstunden | `mit [n SWS]` |
| Veranstaltungen → Start-/End-Uhrzeit | `zwischen [08:00] und [12:00]` / `zeit:` |
| Veranstaltungen → Datumszeitraum | `vom [Datum] bis [Datum]`, quick: heute · diese Woche · Semester |
| Veranstaltungen / Prüfungen → Gebäude | `in [Gebäude]` / `in:` |
| Prüfungen → Prüfungsarten | `als [Klausur, Hausarbeit …]` / `art:` |
| Prüfungen → Start-/End-Uhrzeit, Datumszeitraum | same as Termine |
| Prüfungen → Prüfung erforderlich | `nur Pflicht` / `ist:pflicht` |
| Prüfungen → Prüfer | `von:` |
| *(new)* | `ist:markiert`, `ist:konfliktfrei`, `Termin offen`, `Turnus`, `barrierefrei`, `Plätze ≥ n`, `frei:` |

### 9.4 Kalender & Zeitachse (time views)

| View | For | Rendering |
|---|---|---|
| **Woche** | Mappe, a course, a room, a person | FullCalendar `timeGridWeek`, Mo–Fr default (Sa toggle), 07:00–21:00, 15-min slots. Source = `/schedule/weekly` (recurring slots), not individual dates |
| **Monat** | Exams, dated Termine | FullCalendar `dayGridMonth`; exams as all-day chips if no time |
| **Zeitachse** *(new, default for Termine/Prüfungen)* | Any dated set | Custom virtualised vertical timeline: sticky day headers ("Mi, 22.10."), items as Zeitblöcke, "Heute"-line; infinite scroll in both directions, paged by `date_from/date_to` |
| **Heatmap** *(new, overflow fallback)* | Any set above the calendar limit | See below |

**Overflow → Heatmap (replaces V1's hard stop).** When a query's count exceeds `CALENDAR_LIMIT` (default 400, a starting value to be tuned in usability tests):

1. Request only aggregated data: `/schedule/weekly` for the same filters, which is already deduplicated.
2. Render a **week × hour heatmap** (5 × 14 cells), with cell shade = number of slots (5-step scale in the register colour, plus the number in each cell for accessibility).
3. Copy: *„4 812 Termine — so verteilen sie sich. Tippe eine Zelle, um hineinzuzoomen."*
4. Clicking a cell adds `tag:` + `zeit:` conditions to the query and drops into Woche/Zeitachse.
5. The heatmap is also a `<table>` with `<th scope>` headers, so screen readers get the numbers.

FullCalendar remains the engine for Woche/Monat (already a dependency), **lazy-loaded** via dynamic `import()`. The Monarch purple palette import is removed and `css/calendar-override.css` maps `--fc-*` to V2 tokens.

### 9.5 Studienführer (Miller columns, replaces Navigationsbaum)

```
┌ Semester ──────┬ Fakultät ─────────────────┬ Fach ─────────┬ Studiengang ─────────────┬ Bereich ─────────┐
│ WiSe 2026/27   │ 01 Theologische Fak.      │ Informatik  ▸ │ Informatik (B.Sc.)     ▸ │ Pflicht      12 ▸│
│▶WiSe 2025/26 ▸ │▶10 Mathematik u. Inf.   ▸ │ Mathematik  ▸ │▶Digital Humanities (M.Sc)│▶Wahlpflicht  34 ▸│
│ SoSe 2026      │ 12 Physik u. Erdsystemw.  │               │ Informatik (M.Sc.)     ▸ │                  │
│ SoSe 2025      │ Wahlbereich Geistes-/Soz. │               │                          │                  │
└────────────────┴───────────────────────────┴───────────────┴──────────────────────────┴──────────────────┘
  ↳ leaf: module rows (Zeile) with LP sum for the area: „34 Module · 250 LP · 3 angestrichen"
```

- Built from `module.path` (6 388 paths, depth 4–10 including `Root`; 4 semesters; 19 faculty-level nodes, including non-faculty nodes like "Wahlbereich …" and "Austauschstudium …", which get a neutral glyph). The `Root` segment is dropped. Columns scroll horizontally, with the last 3 columns visible and earlier ones collapsed into a breadcrumb.
- Each node shows a **count** and a **marked count**.
- **"Diesen Studiengang als Ziel setzen"** (star on a programme) personalises Heute and the LP meter target (F2).
- Keyboard: `←/→` column, `↑/↓` item, `Enter` open, type-ahead per column. Semantics: each column is a `role="listbox"` labelled by its level ("Fakultät"), and the selection path is announced via a live breadcrumb. This is simpler and more honest than a pseudo-tree.
- URL: `#/fuehrer/WiSe%202025%2F26/10/Informatik/…`, so every level is linkable.

### 9.6 Blatt (entity sheet)

Common frame: overline (register glyph + entity + number) · Fraunces title · fact strip · primary actions (**Anstreichen** · In Vergleich · Teilen · iCal) · sections · margin notes.

| Entity | Sections |
|---|---|
| **Modul** | Auf einen Blick (LP, Turnus normalised + raw, Dauer, Fakultät) · **Ziele** · **Inhalt** · **Voraussetzungen** (+ check, F5) · Kurse (with weekly slots) · Prüfungen (date or *Termin offen*) · **Verwendet in** (degrees/paths) · Verantwortliche |
| **Kurs** | Type, SWS, language · **Wochenplan** (mini Woche) · all Termine (Zeitachse) · Module · Lehrende |
| **Termin** | Date, time, room + building + address (external map link, no embedded map per V1 Q9) · course · staff · "Weitere Termine dieses Kurses" |
| **Prüfung** | Date/time or *Termin offen* · Pflicht · module · examiners · **Countdown** · iCal |
| **Person** | Courses, exams, **this person's week** (Woche) |
| **Raum** | Type, seats, size, accessibility, building + address · **Belegung this week** (Woche) · "Jetzt frei bis 13:00" badge |

### 9.7 Mappe (binder)

Tabs inside the Mappe: **Übersicht** · **Woche** · **Semesterplaner** · **Notizen**.

- **Übersicht:** scenario register tabs, LP meter, grouped list (Module → their Kurse → exams), conflict list.
- **Woche:** the timetable of the active scenario; ghosted blocks from other scenarios can be overlaid (toggle "B einblenden").
- **Semesterplaner (F4):** columns = semesters (1…n), cards = modules; drag modules between semesters; per-column LP sum with target line; warnings when a module's Turnus does not match the semester ("nur im WiSe angeboten").
- **Notizen:** all margin notes in one list, searchable.
- **Empty state:** illustration of an open binder; *„Streiche Module an, sie landen hier."*

### 9.8 Vergleichstisch & Szenario-Diff (replaces "Vergleichen")

- **Vergleichstisch:** 2–4 entities **of the same type** side by side, with attributes as rows. Differences are highlighted with a subtle `--sheet-2` row band plus a "≠" glyph, and identical rows can be collapsed. Entry points: bulk bar, Peek "In Vergleich", and the Omnibox action `> vergleichen`. A floating **Vergleichs-Ablage** (tray chip "2 im Vergleich") collects items across searches.
- **Szenario-Diff:** A vs. B (or C) in the Mappe. It has three lists (*nur in A*, *nur in B*, *in beiden*) plus totals (LP, SWS, conflicts, free days), and an overlay week showing both scenarios with pattern edges.

### 9.9 Teilen & Export (replace the two no-op buttons)

**Teilen-Sheet**

| Option | What is shared |
|---|---|
| **Link zu dieser Ansicht** | Current hash route + query |
| **Plan-Link** (F8) | The active scenario as a compressed, self-contained link |
| **QR-Code** | Of either link, rendered client-side (for the phone of the person next to you) |
| **Native share** | `navigator.share` where available |

**Export-Sheet** (result set, selection, or scenario)

| Format | Source |
|---|---|
| **iCal (.ics)** | API `format=ical` (+ `ical_collapse_recurring=true`, `ical_calendar_name="almanach – Szenario A"`, optional `ical_reminder_minutes`) |
| **Kalender abonnieren** | `webcal://` URL of the same API query, so it stays up to date without the app |
| **CSV** | API `format=csv` (lists) or client-side for the Mappe |
| **Druck / PDF** | Print stylesheet (§9.11) |
| **Mappe sichern** | JSON backup of IndexedDB (import restores it) |

### 9.10 States (every view)

| State | Design |
|---|---|
| **Loading** | Skeleton that matches the layout; after 300 ms only (no flash for fast responses) |
| **Empty (no results)** | Line illustration + sentence that names the constraint + **one-click relax** buttons, one per active condition ("ohne *5–10 LP* → 38 Treffer") |
| **Typo** | "Meintest du …?" from the local fuzzy index |
| **Termin offen** | Dashed `--rule-strong` outline block, `calendar-clock` icon, text; filterable |
| **Error** | Cause + retry + "mit gespeichertem Stand weiterarbeiten" if cached |
| **API down** (`/admin/health` 503) | Banner in the colophon line; cached data stays browsable |
| **Offline** | Colophon line turns `--warn` with "Offline · Stand 08:12" |
| **Stale** (> 24 h) | Subtle "Daten älter als 1 Tag · aktualisieren" |

### 9.11 Print

Print is a first-class output, because students print timetables. `@media print` produces an A4 landscape **Woche** or an A4 portrait **Mappe summary** (modules, LP, exams with dates), in ink-only colours, with scenario patterns preserved, URLs printed after links, and a footer with the colophon + a QR code linking back to the Plan-Link.

---

## 10. New features

Every feature below is **not** in V1's feature map, or is fundamentally redesigned (marked ↻).

| ID | Feature | What it does | Data source | Priority |
|---|---|---|---|---|
| **F1** | **Heute** dashboard | Next dates, exam countdowns, conflicts, free rooms near my next room | Mappe + `/events/today`, `/events/week`, `/exams` | P1 |
| **F2** | **Studienziel & LP-Meter** | Set the programme (from Studienführer) and a target LP per semester; meter in the tray; Heute nudges ("Noch 10 LP bis 30") | Mappe + `/degrees` | P1 |
| **F3** | **Konflikt-Löser** ↻ | Conflicts don't just show: "Alternative finden" lists *other slots of the same course* (e.g. other Übungsgruppen) that fit the week | `/schedule/weekly?course_ids=` | P1 |
| **F4** | **Semesterplaner** | Multi-semester board; drag modules; Turnus warnings (WiSe/SoSe mismatch) using the normalised frequency | Mappe + `module.frequency` | P2 |
| **F5** | **Voraussetzungs-Check** | Shows `prerequisites` / `exam_prerequisites` in the Blatt; module numbers or names found in the free text become links, with ✓ if that module is marked "bestanden" (F13) | `ModuleRead.prerequisites` (free text; heuristic, labelled "automatisch erkannt") | P2 |
| **F6** | **Freie Räume** | "Which room is free now / Wed 10–12?" filtered by seats, accessibility, building | `/locations` minus rooms in `/events?date=&time_overlap=` | P1 |
| **F7** | **Lückenfinder** | Given my week, find courses that fit only into free slots (`ist:konfliktfrei`) | Mappe + `/schedule/weekly` | P2 |
| **F8** | **Plan-Link** | Share a scenario as a self-contained URL (IDs + name, deflate via `CompressionStream` + base64url). Recipient sees a read-only plan and can "In meine Mappe übernehmen" | Client only | P1 |
| **F9** | **Abo-Kalender** ↻ | One-click `webcal://` subscription to the scenario's events; stays live via the API | API `format=ical` | P1 |
| **F10** | **Workspace-Tabs** | Multiple persistent searches like browser tabs, with Nebeneinander + link mode | Client | P1 |
| **F11** | **Omnibox-Operatoren** ↻ | Power search tokens (§8.2). Also a teaching aid: Satzfilter slots show their operator form in a tooltip | Client + API filters | P0 |
| **F12** | **Zeitachse & Heatmap** ↻ | Timeline default for dated items; heatmap instead of a hard limit | `/events` paged, `/schedule/weekly` | P1 |
| **F13** | **Notenrechner** | Enter grades for completed modules (local only); LP-weighted average; "bestanden" feeds F5 | Mappe | P3 |
| **F14** | **Prüfungsphase-Modus** | Between the first and last exam in my Mappe, Heute switches to an exam layout: countdown list, "Termin offen" watch list, free days between exams | Mappe + `/exams` | P2 |
| **F15** | **Änderungs-Wächter** | For marked items, store a fingerprint (date, time, room) and show "geändert seit deinem letzten Besuch". Field-level, only for *my* items, so it stays cheap and within V1's Q7 limits | Mappe + refetch of marked IDs (`?id=` is repeatable) | P2 |
| **F16** | **Zuletzt angesehen** | Last 20 Blätter, in the Omnibox empty state and on Heute | Client | P1 |
| **F17** | **Kurzbefehle-Übersicht** | `?` opens a sheet with all shortcuts; each is also shown in tooltips | Client | P2 |
| **F18** | **Erste Schritte** | 3-step onboarding *inside the empty states* (no coach-mark overlays): pick programme → mark modules → see your week | Client | P2 |

### 10.1 Keyboard map

| Keys | Action |
|---|---|
| `/` | Focus Omnibox |
| `>` (in Omnibox) | Actions mode |
| `g h` · `g b` · `g f` · `g m` | Go to Heute · Blättern · Führer · Mappe |
| `j / k` or `↓ / ↑` | Next / previous result |
| `Space` | Peek focused item |
| `Enter` | Open Blatt |
| `m` | Anstreichen in the active scenario (`Shift+1/2/3` switches scenario A/B/C) |
| `c` | Add to Vergleichstisch |
| `t` · `x` | New tab · close tab |
| `v` then `z/k/t/w/a` | View: Zeilen/Karten/Tabelle/Woche/Zeitachse |
| `?` | Shortcut sheet |

Single-key shortcuts are disabled while typing and can be turned off entirely (WCAG 2.1.4).

---

## 11. Placeholder → V2 mapping

Every non-functional control in today's UI and where it ends up:

| # | Placeholder today | V2 destination | Phase |
|---|---|---|---|
| 1 | ~25 filter inputs in `#filter-options` | Satzfilter + Filter-Sheet (§8.3, §9.3) | 1 |
| 2 | "Sortieren nach" (empty) | Sort clause in the sentence | 1 |
| 3 | "Mehr Details" | Peek + Blatt | 1 |
| 4 | `save` icon per row/card | Anstreichen marker → Mappe | 1 |
| 5 | Save-Slot 1/2/3 + "Slot ⚙" | Szenarien A/B/C (rename, duplicate, clear, diff) | 2 |
| 6 | Teilen | Teilen-Sheet (link, Plan-Link, QR, native share) | 2 |
| 7 | Export | Export-Sheet (iCal, webcal, CSV, print, backup) | 2 |
| 8 | DE / EN switcher | Einstellungen + `>` action; typed i18n | 0 |
| 9 | System / Dunkel / Hell | Papier / Nacht / Tinte / System; pre-paint | 0 |
| 10 | Einzeln / Geteilt / Vergleichen | Tabs, Nebeneinander (link mode), Vergleichstisch | 2 |
| 11 | Kalender (not initialised) | Woche / Monat / Zeitachse / Heatmap | 1 |
| 12 | Navigationsbaum (hardcoded) | Studienführer | 1 |
| 13 | "Zuletzt aktualisiert" (static) | Datenstand in colophon line, real timestamp + refresh | 0 |
| 14 | Veranstaltungen tab (code commented out) | Termine with Zeitachse, paged | 1 |

---

## 12. Accessibility & i18n

### 12.1 Accessibility (target: WCAG 2.2 AA, AAA for contrast of body text)

- **Contrast:** all text tokens ≥ 4.5:1, and body ink ≥ 14:1 (AAA). UI boundaries ≥ 3:1 (`--rule-strong`). Verified values are in §4.
- **Not colour alone:** entity = colour + glyph + label; scenario = colour + letter + pattern; marked = highlighter + filled icon + text; conflict = hatch + icon + text.
- **Focus:** 2 px `--focus` ring + 2 px gap, never removed; `:focus-visible` only; Peek/Blatt/dialogs trap focus and restore it on close.
- **Landmarks:** `<nav>` (rail), `<search>` (Omnibox), `<main>` (results), `<aside aria-label="Mappe">`, `<footer>` (colophon).
- **Headings:** one `<h1>` per route; result titles are links inside list items, **not** headings (fixes V1 defect #6).
- **Live regions:** result count (`polite`, debounced 500 ms), toasts (`status`), errors (`alert`).
- **Targets:** ≥ 24 × 24 px (Dicht), ≥ 44 × 44 px (Bequem / coarse pointers).
- **Motion:** reduced-motion honoured; no auto-playing animation; the texture is static.
- **Drag & drop alternatives** (WCAG 2.5.7): every drag (tabs, Semesterplaner, divider) has a menu/keyboard equivalent ("Verschieben nach Semester 3").
- **Tinte theme + `forced-colors`** (§4.5).
- **Testing:** axe in CI on the component gallery, plus manual NVDA + Firefox, VoiceOver + Safari (iOS) before each phase exit.

### 12.2 Internationalisation

- `de` is the source language, `en` is complete. Typed keys (`t("mappe.empty.title")`) live in `ts/i18n/de.ts` / `en.ts`, and a missing key fails the typecheck.
- `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` ("in 12 Tagen"), `Intl.PluralRules` ("1 Modul / 3 Module"), `Intl.ListFormat` ("Müller, Schmidt und Weber"), all timezone-pinned to `Europe/Berlin`.
- The **Satzfilter grammar is per-language** (German word order differs), defined as templates, not concatenated strings.
- Data stays in its original language (module names are German); English UI labels them with `lang="de"` for correct pronunciation.

### 12.3 Glossary (UI terms)

| DE | EN | Meaning |
|---|---|---|
| Modul | Module | Unit with LP, from `modules` |
| Kurs | Course | Teaching unit of a module (Vorlesung, Übung …) |
| Termin | Session | One dated occurrence (`events`) |
| Prüfung | Exam | `exams` |
| Person | Person | `staff` |
| Raum | Room | `locations` |
| Mappe | Binder | Personal collection |
| Szenario | Scenario | Alternative plan A/B/C in the Mappe |
| Anstreichen | Mark | Add to the Mappe |
| Blatt | Sheet | Full detail page |
| Studienführer | Guide | Programme navigation |
| Termin offen | Date TBA | Exam without date |
| LP | ECTS credits | Leistungspunkte |
| SWS | Weekly hours | Semesterwochenstunden |
| Turnus | Offered | Frequency (normalised) |

---

## 13. Data, performance & offline

### 13.1 Data strategy: "Index local, details remote"

| Layer | What | Size strategy |
|---|---|---|
| **Search index** (local) | Slim records for modules, courses, staff, rooms: `id, name, number, type, lp, faculty, turnus` | Fetched once via `fields=` projection, stored in IndexedDB, searched in a **Web Worker** (instant Omnibox, typo tolerance). Estimate ≈ 1–2 MB JSON (≈ 200–400 KB gzip), to be measured |
| **Lists** (remote, paged) | Filtered result pages | `page_size=50`, prefetch the next page on scroll; `AbortController` cancels stale queries |
| **Details** (remote, on demand) | Blatt data with `include=` | Fetched on Peek/hover-intent (150 ms), cached per ID |
| **Time data** (remote, windowed) | Events only by date window or via `/schedule/weekly` | **Never** the full 129 438 events; the offline `events.json` becomes a dev fixture only |
| **Mappe** (local) | References `{type, id, scenario, note, grade, fingerprint}` | IndexedDB; tiny |

`fetchLocal("/ts/api/offline-data/…")` is replaced by an environment switch (`VITE_DATA_SOURCE=api|fixtures`), and fixtures are moved out of `ts/` into `fixtures/` so they are never bundled.

### 13.2 Budgets

| Metric | Budget |
|---|---|
| Initial JS (gzip) | ≤ 90 KB (FullCalendar excluded: lazy-loaded as a separate chunk) |
| CSS (gzip) | ≤ 25 KB |
| Fonts | ≤ 220 KB total (see §5), max 2 files on first paint |
| LCP (Moto G-class, 4G) | ≤ 2.0 s |
| INP | ≤ 150 ms (search in worker) |
| CLS | ≤ 0.02 |
| Omnibox suggestions | ≤ 50 ms after keystroke (local index) |

### 13.3 Offline & PWA

- Web App Manifest (name *almanach*, theme colour `#0E5C4A`, background `#F7F4EC`, maskable icon).
- A service worker precaches the app shell and fonts; API responses use **stale-while-revalidate** with a 24 h max-age for the index and 1 h for lists.
- Offline, the Mappe, Heute (from cached week), Studienführer (index), and every cached Blatt work.
- Update toast: *„Neue Version verfügbar · Neu laden"*.

---

## 14. Architecture & file structure

### 14.1 Principles

- Stay **framework-free** (vanilla TS + DOM), matching the current codebase; small **component functions** return elements (the existing `createListItem` pattern), with `<template>` elements in `index.html` for static markup.
- A tiny **store** (signal-style `subscribe/set`) per domain: `query`, `tabs`, `mappe`, `settings`.
- ESLint rules stay (`max-statements: 12`, `complexity: 7`, JSDoc, no raw loops); the structure below keeps functions small enough to comply.

### 14.2 Target structure

```
index.html                 # shell: rail, omnibox, satzfilter host, tabs, main, tray, colophon, <template>s
css/
  tokens.css               # §17: themes Papier / Nacht / Tinte, forced-colors
  base.css                 # reset, typography, focus, print
  components/*.css         # button, token, row, card, sheet, omnibox, satzfilter, tray, heatmap …
  calendar.css             # --fc-* → V2 tokens (replaces calendar-override.css)
  fonts.css                # Inter + Fraunces @font-face with metric fallbacks
assets/
  fonts/                   # Inter-var.woff2, Fraunces-var.woff2 (self-hosted)
  icons/sprite.svg         # Lucide subset (~40 icons)
  brand/                   # logo.svg, favicon.svg, maskable-512.png
ts/
  main.ts                  # boot: settings → router → shell
  boot-theme.ts            # inlined pre-paint script
  router.ts                # hash routes (§7.1)
  store/{query,tabs,mappe,settings}.ts
  api/{client,endpoints,weekday,types}.ts   # paging, abort, cache, ISO weekday normalisation
  search/{index,worker,operators}.ts        # Omnibox tokens + fuzzy
  domain/{turnus,conflicts,lp,planlink,fingerprint}.ts
  i18n/{de,en,index}.ts
  ui/{omnibox,satzfilter,tabs,row,card,table,peek,blatt,tray,toast,sheet}.ts
  views/{heute,blaettern,fuehrer,mappe,woche,zeitachse,heatmap,vergleich,kolophon}.ts
fixtures/                  # former ts/api/offline-data (dev only, not bundled)
public/manifest.webmanifest, sw.js
```

### 14.3 Dependencies

| Package | Why | Status |
|---|---|---|
| `fullcalendar` | Woche / Monat (already present) | Keep; move to `dependencies`, lazy-load |
| `lucide-static` (dev) | Build the SVG sprite at build time | Proposed ⚑ |
| QR rendering | Teilen-Sheet | Hand-rolled or a ≤ 5 KB lib ⚑ |
| Fuzzy search | Omnibox | Hand-rolled (trigram + diacritic fold) preferred; no dependency |
| `vite-plugin-pwa` (dev) | SW generation | Optional ⚑ |

Compression for Plan-Link uses the built-in `CompressionStream("deflate-raw")`, so no dependency is needed.

---

## 15. Roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **0 — Fundament** | Tokens (§17), fonts self-hosted (Inter, Fraunces), SVG sprite, pre-paint theme (Papier/Nacht/Tinte), i18n skeleton, router, API client with paging + weekday normalisation, fixtures moved; **all 14 V1 defects fixed** (ids, `<item>`, labels, headings, title, font files, calendar selector, events download) | Lighthouse a11y ≥ 95 on shell; no console errors; theme switch without flash; `npm run lint`, `typecheck` green |
| **1 — Blättern** | Omnibox (F11) + local index worker, Satzfilter + Filter-Sheet (all fields of §9.3), Zeilen/Karten/Tabelle virtualised, Peek + Blatt for all 6 entities, Anstreichen → Mappe (single scenario), Studienführer, Zeitachse + Woche + Heatmap (F12), Termine enabled, states (§9.10) | Every current placeholder of Phase 1 in §11 works; 129 438 events never downloaded at once; INP ≤ 150 ms |
| **2 — Planen** | Szenarien A/B/C + Szenario-Diff, Vergleichstisch, workspace tabs + Nebeneinander (F10), Konflikt-Löser (F3), Teilen-Sheet + Plan-Link (F8) + QR, Export-Sheet + webcal (F9), Heute (F1), LP-Meter (F2), Freie Räume (F6), Zuletzt angesehen (F16), print | A plan can be built, compared, shared by link, subscribed in a calendar app, and printed |
| **3 — Vertiefen** | Semesterplaner (F4), Voraussetzungs-Check (F5), Lückenfinder (F7), Prüfungsphase (F14), Änderungs-Wächter (F15), Kurzbefehle (F17), Erste Schritte (F18), PWA/offline | Offline use of Mappe + Heute; manual screen-reader pass signed off |
| **4 — Extras** | Notenrechner (F13), paper texture option, usability test round + tuning of `CALENDAR_LIMIT`, density defaults, copy | Test with ≥ 5 students; top-3 issues fixed |

---

## 16. Decisions to confirm & open questions

| ID | Question | V2 proposal | Why it matters |
|---|---|---|---|
| **D1** ⚑ | Rename to **almanach**? | Yes (fallback: keep *alma.web* with V2 visuals) | Brand, domain, manifest, copy |
| **D2** ⚑ | Retire Bellis Blue/Pink for Lindgrün + Textmarker? | Yes | All tokens |
| **D3** ⚑ | Rename "Veranstaltung" → **Termin** in the UI? | Yes (API unchanged) | Glossary, copy, filters |
| **D4** ⚑ | Replace the filter rail with the **Satzfilter** (+ Filter-Sheet for power users)? | Yes | Largest layout change |
| **D5** ⚑ | Replace Material Symbols (font) with **Lucide SVG sprite**? | Yes; removes FOIT and the misnamed font file | Icons, assets |
| **D6** ⚑ | Add dev dependencies `lucide-static` (+ optional `vite-plugin-pwa`, QR lib)? | Yes, dev-only, except a ≤ 5 KB QR lib | Package policy |
| **Q1** | Is `/schedule/weekly` fast enough for the heatmap on large filter sets? | Measure in Phase 1; fallback: aggregate a sampled window | F12 |
| **Q2** | Are `prerequisites` texts structured enough for heuristic linking? | Spike in Phase 3; ship as "automatisch erkannt", never authoritative | F5 |
| **Q3** | Target LP per semester default | 30 LP, editable | F2 |
| **Q4** | Plan-Link size limit | Hard cap at 2 000 characters; above that, offer JSON export | F8 |
| **Q5** | Is a CORS-enabled `webcal://` / `https` iCal URL of the API stable and public? | Confirm with API owner | F9 |
| **Q6** | User research | None exists; the persona assumptions (§1.3) and the "warmer tool" hypothesis (ADR-V2-001) must be validated in Phase 4 | Brand direction |

Everything V1 decided about **scope and posture** is retained unless listed above: anonymous, no login, no writes to ALMA, no embedded map, DE-first + full EN, WCAG 2.2 AA floor, public "inoffiziell" disclaimer, self-hosted Google fonts.

---

## 17. Appendix — `css/tokens.css` (V2)

Drop-in token file for Tailwind CSS v4. Raw values live in plain custom properties per theme, and `@theme inline` exposes them as Tailwind utilities (`bg-paper`, `text-ink`, `border-rule-strong`, `bg-brand`, `text-entity-modul` …). It replaces the `@theme` block, the `@layer theme { @variant dark … }` block in `css/main.css`, and `@custom-variant dark`.

```css
/* css/tokens.css — almanach V2 design tokens */

@custom-variant dark (&:where([data-theme="nacht"], [data-theme="nacht"] *));
@custom-variant tinte (&:where([data-theme="tinte"], [data-theme="tinte"] *));

/* ---------- Papier (light, default) ---------- */
:root,
[data-theme="papier"] {
    color-scheme: light;

    --paper: #f7f4ec;
    --sheet: #fffdf8;
    --sheet-2: #efebe0;
    --rule: #dad4c4;
    --rule-strong: #8c8574;

    --ink: #1c1e24;
    --ink-muted: #595c66;
    --ink-subtle: #6b6e78;

    --brand-700: #0e5c4a;
    --brand-800: #0a4a3c;
    --brand-50: #e3f1ec;
    --on-brand: #fffdf8;
    --focus: #0e5c4a;

    --hl-500: #ffe066;
    --hl-ink: #1c1e24;

    --ok: #1e7b45;
    --ok-50: #e8f5ec;
    --warn: #8a5a00;
    --warn-50: #fff4dc;
    --danger: #b42318;
    --danger-50: #fdecea;
    --info: #1d5fa8;
    --info-50: #e8f0fb;

    --entity-modul: #3b5bdb;
    --entity-modul-tint: #edf1ff;
    --entity-kurs: #0b7285;
    --entity-kurs-tint: #e3f6f8;
    --entity-termin: #a63c09;
    --entity-termin-tint: #fff0e6;
    --entity-pruefung: #c2255c;
    --entity-pruefung-tint: #ffecf2;
    --entity-person: #862e9c;
    --entity-person-tint: #f8edfb;
    --entity-raum: #495057;
    --entity-raum-tint: #eef0f2;
    --on-entity: #fffdf8;

    --scenario-a: #0e5c4a;
    --scenario-b: #6741d9;
    --scenario-c: #3f6308;

    --e-0: none;
    --e-1: 0 1px 0 #2b24140f, 0 1px 3px #2b24141a;
    --e-2: 0 2px 4px #2b241412, 0 8px 24px #2b24141f;
    --e-3: 0 4px 8px #2b241414, 0 24px 48px #2b241429;
    --border-width: 1px;
}

/* ---------- Nacht (dark) ---------- */
[data-theme="nacht"] {
    color-scheme: dark;

    --paper: #121418;
    --sheet: #1a1d22;
    --sheet-2: #23272d;
    --rule: #2e333a;
    --rule-strong: #7a7f88;

    --ink: #eceae4;
    --ink-muted: #a7a9ae;
    --ink-subtle: #8a8e96;

    --brand-700: #5ccfb0;
    --brand-800: #7fdcc2;
    --brand-50: #243b35;
    --on-brand: #06231c;
    --focus: #5ccfb0;

    --hl-500: #e9c94a;
    --hl-ink: #121418;

    --ok: #6fd39a;
    --ok-50: #283a35;
    --warn: #f2c35b;
    --warn-50: #3d382b;
    --danger: #ff8a80;
    --danger-50: #3f2e31;
    --info: #8db8f2;
    --info-50: #2c3643;

    --entity-modul: #91a7ff;
    --entity-modul-tint: #2d3345;
    --entity-kurs: #66d9e8;
    --entity-kurs-tint: #263b42;
    --entity-termin: #ffa94d;
    --entity-termin-tint: #3f3329;
    --entity-pruefung: #faa2c1;
    --entity-pruefung-tint: #3e323b;
    --entity-person: #e599f7;
    --entity-person-tint: #3a3144;
    --entity-raum: #ced4da;
    --entity-raum-tint: #373a3f;
    --on-entity: #121418;

    --scenario-a: #5ccfb0;
    --scenario-b: #b197fc;
    --scenario-c: #a9e34b;

    --e-1: 0 0 0 1px #ffffff0d;
    --e-2: 0 0 0 1px #ffffff14, 0 8px 24px #0000008c;
    --e-3: 0 0 0 1px #ffffff1a, 0 24px 48px #000000a6;
}

/* ---------- Tinte (high contrast) ---------- */
[data-theme="tinte"] {
    color-scheme: dark;

    --paper: #000000;
    --sheet: #000000;
    --sheet-2: #000000;
    --rule: #ffffff;
    --rule-strong: #ffffff;
    --ink: #ffffff;
    --ink-muted: #ffffff;
    --ink-subtle: #ffffff;
    --brand-700: #5ccfb0;
    --brand-800: #7fdcc2;
    --brand-50: #000000;
    --on-brand: #000000;
    --focus: #ffe066;
    --hl-500: #ffe066;
    --hl-ink: #000000;

    --entity-modul: #ffffff;
    --entity-kurs: #ffffff;
    --entity-termin: #ffffff;
    --entity-pruefung: #ffffff;
    --entity-person: #ffffff;
    --entity-raum: #ffffff;
    --entity-modul-tint: #000000;
    --entity-kurs-tint: #000000;
    --entity-termin-tint: #000000;
    --entity-pruefung-tint: #000000;
    --entity-person-tint: #000000;
    --entity-raum-tint: #000000;
    --on-entity: #000000;

    --e-1: none;
    --e-2: none;
    --e-3: none;
    --border-width: 2px;
}

/* ---------- Windows High Contrast / forced colours ---------- */
@media (forced-colors: active) {
    :root {
        --paper: Canvas;
        --sheet: Canvas;
        --sheet-2: Canvas;
        --ink: CanvasText;
        --ink-muted: CanvasText;
        --ink-subtle: CanvasText;
        --rule: CanvasText;
        --rule-strong: ButtonBorder;
        --brand-700: LinkText;
        --focus: Highlight;
        --hl-500: Mark;
        --hl-ink: MarkText;
        --e-1: none;
        --e-2: none;
        --e-3: none;
    }
}

/* ---------- Theme-independent scales ---------- */
:root {
    --s-0: 2px;
    --s-1: 4px;
    --s-2: 8px;
    --s-3: 12px;
    --s-4: 16px;
    --s-5: 24px;
    --s-6: 32px;
    --s-7: 48px;
    --s-8: 64px;

    --r-xs: 4px;
    --r-sm: 8px;
    --r-md: 14px;
    --r-lg: 22px;
    --r-pill: 999px;

    --m-fast: 120ms cubic-bezier(0.2, 0, 0, 1);
    --m-base: 200ms cubic-bezier(0.2, 0, 0, 1);
    --m-sheet: 280ms cubic-bezier(0.32, 0.72, 0, 1);
    --m-mark: 360ms cubic-bezier(0.6, 0, 0.2, 1);

    --density: 0.75; /* Dicht (fine pointer) */
}

@media (pointer: coarse) {
    :root {
        --density: 1; /* Bequem */
    }
}

[data-density="dicht"] {
    --density: 0.75;
}

[data-density="bequem"] {
    --density: 1;
}

@media (prefers-reduced-motion: reduce) {
    :root {
        --m-fast: 0ms linear;
        --m-base: 120ms linear;
        --m-sheet: 0ms linear;
        --m-mark: 0ms linear;
    }
}

/* ---------- Tailwind v4 bridge ---------- */
@theme inline {
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-display: "Fraunces", ui-serif, Georgia, serif;

    --color-paper: var(--paper);
    --color-sheet: var(--sheet);
    --color-sheet-2: var(--sheet-2);
    --color-rule: var(--rule);
    --color-rule-strong: var(--rule-strong);
    --color-ink: var(--ink);
    --color-ink-muted: var(--ink-muted);
    --color-ink-subtle: var(--ink-subtle);
    --color-brand: var(--brand-700);
    --color-brand-strong: var(--brand-800);
    --color-brand-soft: var(--brand-50);
    --color-on-brand: var(--on-brand);
    --color-focus: var(--focus);
    --color-hl: var(--hl-500);
    --color-hl-ink: var(--hl-ink);
    --color-ok: var(--ok);
    --color-warn: var(--warn);
    --color-danger: var(--danger);
    --color-info: var(--info);
    --color-entity-modul: var(--entity-modul);
    --color-entity-kurs: var(--entity-kurs);
    --color-entity-termin: var(--entity-termin);
    --color-entity-pruefung: var(--entity-pruefung);
    --color-entity-person: var(--entity-person);
    --color-entity-raum: var(--entity-raum);
    --color-scenario-a: var(--scenario-a);
    --color-scenario-b: var(--scenario-b);
    --color-scenario-c: var(--scenario-c);

    --radius-xs: var(--r-xs);
    --radius-sm: var(--r-sm);
    --radius-md: var(--r-md);
    --radius-lg: var(--r-lg);

    --shadow-e1: var(--e-1);
    --shadow-e2: var(--e-2);
    --shadow-e3: var(--e-3);

    --text-display: clamp(2rem, 1.4rem + 2.4vw, 3rem);
    --text-h1: clamp(1.625rem, 1.3rem + 1.2vw, 2.125rem);
    --text-h2: 1.375rem;
    --text-h3: 1.0625rem;
    --text-body: 0.9375rem;
    --text-ui: 0.875rem;
    --text-meta: 0.8125rem;
    --text-micro: 0.75rem;
}
```

### 17.1 Pre-paint theme boot (inlined in `<head>`)

```html
<script>
    (() => {
        const stored = localStorage.getItem("almanach.theme");
        const system = matchMedia("(prefers-color-scheme: dark)").matches ? "nacht" : "papier";
        const theme = stored && stored !== "system" ? stored : system;
        document.documentElement.dataset.theme = theme;
    })();
</script>
```

This replaces the hardcoded `<html class="dark">`. Nacht status tints (`--*-50`) are 16 % mixes of the status colour over `--sheet` (rule from §4.3). Their foreground contrast was checked: ok 6.56:1, warn 7.08:1, danger 5.59:1, info 5.99:1. In Tinte, brand `#5CCFB0` on black is 11.01:1.

---

*End of DESIGN-V2.md. V1 (`DESIGN.md`) remains unchanged for comparison.*

