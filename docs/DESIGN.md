# alma.web — Design Blueprint v1.0

> **Status:** Accepted for implementation · **Date:** 2026-09-27 · **Scope:** complete redesign — brand, colour, typography, layout, components, views, features, accessibility, performance, PWA.
> **Supersedes:** the current scaffold in `index.html` + `css/main.css`.
> **Decisions:** all open questions answered by the product owner; see [§10 Decision log](#10-decision-log) and [§16 Open items](#16-open-items).

---

## Table of contents

1. [Executive summary & design principles](#1-executive-summary--design-principles)
2. [Current state audit](#2-current-state-audit)
3. [Branding](#3-branding)
4. [Colour system](#4-colour-system)
5. [Typography](#5-typography)
6. [Spacing, radius, elevation, motion](#6-spacing-radius-elevation-motion)
7. [Layout & information architecture](#7-layout--information-architecture)
8. [Component library](#8-component-library)
9. [View designs](#9-view-designs)
10. [Decision log](#10-decision-log)
11. [Accessibility & i18n](#11-accessibility--i18n)
12. [Performance & PWA](#12-performance--pwa)
13. [Feature map](#13-feature-map)
14. [Target file structure](#14-target-file-structure)
15. [Roadmap](#15-roadmap)
16. [Open items](#16-open-items)
17. [Appendix](#17-appendix)

---

## 0. How to read this document

This is the single source of truth for the redesign of `almaweb-ui` ("alma.web"). It is written to be implemented directly: every visual decision resolves to a token, every token to a CSS custom property, and every interaction to a component or view specification.

- Section [§10](#10-decision-log) is the **contract**: it records the answers to every previously open question and their consequences. If code and this document disagree, this document wins until it is amended.
- Section [§17](#17-appendix) contains the drop-in `css/tokens.css` and the constants module, so implementation can start without re-deriving anything.
- Anything marked **TBD-n** is deliberately undecided and listed in [§16](#16-open-items).

---

## 1. Executive summary & design principles

`alma.web` is a fast, accessible, anonymous viewer and **local planner** for the Leipzig University course catalogue. Users come with one goal: *"Find the right module / course / exam / room, fast, and keep track of the ones that matter to me."*

The current codebase already contains the functional skeleton (filters, six entity types, four display modes, a two-pane split layout, live data). What it lacks is a design: the layout is a fixed 3-column grid with no responsive behaviour, the visual language is applied ad hoc through `@apply` classes, nine shipped controls are decorative, and there is no detail view, no saved-list semantics, no empty/loading/error states, no i18n, and no mobile story.

This blueprint turns the skeleton into a product.

### 1.1 Principles

| # | Principle | Concrete consequence |
|---|---|---|
| 1 | **Find fast, decide fast** | Global search + command palette (⌘/Ctrl+K) are the primary entry point. Filters are progressive disclosure, never a wall of 25 controls. |
| 2 | **One graph, six faces** | Module ⇄ Kurs ⇄ Veranstaltung ⇄ Prüfung ⇄ Person ⇄ Raum are always cross-linked and clickable. |
| 3 | **The page is the product** | Information density, scannability and instant feedback beat decoration. Colour, motion and space are used to explain, never to ornament. |
| 4 | **Accessible by default** | WCAG 2.2 AA as the floor, keyboard-complete, `prefers-reduced-motion` honoured, 200 % zoom and 320 px reflow safe, no colour-only meaning. |
| 5 | **German-first, bilingual** | Every string is an i18n key from day one. `de` is the default and the source language; `en` ships complete. |
| 6 | **Density is a preference** | Komfort / Kompakt is a user setting, not a fixed design choice. |
| 7 | **Local-first speed** | Large datasets are paged, virtualised and cached; the UI never blocks on a 60 MB JSON payload. |
| 8 | **Anonymous & read-only** | No login, no writes back to ALMA, no tracking. All personal state lives in the browser and in shareable URLs. |
| 9 | **Public resource behaviour** | Imprint, data attribution and a clear "inofficial" disclaimer; gentle on the API (caching, revalidation, no polling). |

---

## 2. Current state audit

### 2.1 Stack & structure

| Item | Detail |
|---|---|
| Build | Vite 8, `appType: "spa"`, `target: es2022`, output `dist/` |
| Language | TypeScript 5.9, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `resolveJsonModule` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`; `css/main.css` uses `@import "tailwindcss"`, `@theme`, `@custom-variant dark` |
| Fonts | `Atkinson Hyperlegible` (declared, file **missing**), `Material Symbols Outlined` (a *filled* file registered under this name) |
| Calendar | FullCalendar 7 + `daygrid`, `timegrid`, `list`, `multimonth`, `themes/monarch` (purple palette) |
| Lint/format | ESLint flat config, strict: indent 4, `curly`, `max-statements: 12`, `complexity: 7`, required JSDoc on functions/methods/classes, **no raw loops**, double quotes, semicolons. Prettier 100 cols + `prettier-plugin-tailwindcss` |
| Files | `index.html` (759), `css/main.css` (327), `css/calendar-override.css` (104), `css/fonts.css` (31), `ts/main.ts` (428), `ts/api/api.ts` (43), `ts/api/types.ts` (104) |
| Data | `ts/api/offline-data/`: `modules.json` 5.8 MB, `courses.json` 4.2 MB, `exams.json` 3.6 MB, **`events.json` 60.5 MB / 129 438 items** |
| API | `https://api.casparkroll.de/almaweb/v1` — list endpoints returning `{ count, page, limit, total_pages, items }`; supports paging, filtering, sorting; exposes an **iCal** format; no per-entity `updated_at`, no short-link service |

### 2.2 What actually works today

- Header: two per-pane view navs (Liste / Kacheln / Kalender / Navigationsbaum), Einzeln / Geteilt / Vergleichen switcher, "last updated", Teilen / Export, save-slot selector, DE/EN switcher, system/dark/light switcher.
- Left filter rail: four groups (Globale Filter, Modulfilter, Kurse, Veranstaltungen, Prüfungen) with ~25 inputs.
- Two result panes, each with a six-way entity switcher and an empty "Sortieren nach" control.
- Live rendering of Module, Kurse, Prüfungen, Mitarbeitende, Räumlichkeiten into list and card markup (`renderEntities` in `ts/main.ts`). Veranstaltungen code exists but is commented out.
- CSS-only view switching via `:has()` (`body:has(#display-changer1 item.active[data-view="cards"]) …`).
- Tree data computed from `module.path` (`computeTreeData`) and rendered (`displayTree`).
- FullCalendar fully configured (German buttons, list/week/month/day) but `initCal()` is **commented out** and its selector `#calendar` matches no element (`#calendar1` / `#calendar2` exist).

### 2.3 Placeholders (UI exists, no behaviour)

| Placeholder | Location | Note |
|---|---|---|
| ~25 filter controls | `#filter-options` | No filtering logic, no counts, most `id`s duplicated |
| "Sortieren nach" | pane headers | Empty container |
| "Mehr Details" | cards | No detail view |
| Save icon per row/card | list & cards | No saved list |
| Save-Slots + "Slot" settings | header | No persistence, no compare |
| Teilen / Export | header | No-op |
| DE / EN switcher | header | No i18n |
| system / dark / light switcher | header | No theme JS; `<html class="dark">` hardcoded |
| Einzeln / Vergleichen | header | Only "geteilt" has styling; no state machine |
| Kalender view | `main#calendar1/2` | `initCal()` commented out |
| Navigationsbaum | `main#tree1/2` | Breadcrumb hardcoded (`Root`, `SoSe 2025`, `01 - Theologische Fakultät`); clicks unwired; leaf modules only `console.log`ged |
| Freshness indicator | header | Static timestamp |

### 2.4 Known defects to fix during the redesign

| # | Defect | Evidence |
|---|---|---|
| 1 | `assets/fonts/AtkinsonHyperlegible.woff2` is referenced but **does not exist**; the app silently falls back to system sans | `css/fonts.css:5` vs. `assets/fonts/` (only `MaterialSymbols-filled.woff2`) |
| 2 | `MaterialSymbols-filled.woff2` is registered as family **"Material Symbols Outlined"**; fixed-size static file, no variable axes | `css/fonts.css:11-14` |
| 3 | **Duplicate `id`s**: `search-input`, `search-input-number` (≥ 2×) | `index.html:82, 90, 153, 161` |
| 4 | `<label for="filter-lp">`, `for="filter-duration"`, `for="filter-course-times"` target **non-existent ids** | `index.html:122, 137, 216, 231, 246, 282, 297, 312` |
| 5 | Non-standard `<item>` element used as navigation | `index.html:17-27` |
| 6 | `<h1>` per card/row title, `<h2>` for subtitles → broken document outline | `ts/main.ts:70-77`, `index.html:355+` |
| 7 | Presentation coupled to semantics (`ul.list > li.list-item > h1`) | `css/main.css:264-269` |
| 8 | Generated tree containers set duplicate ids (`opened-levels`, `levels`) once per pane | `ts/main.ts:273, 289` |
| 9 | Both panes render identical data; no per-pane state → "Geteilt" is cosmetic | `ts/main.ts:127-134` |
| 10 | 60.5 MB `events.json` fetched whole — will freeze the tab once enabled | `ts/api/api.ts:29-31` |
| 11 | `fetchLocal("/ts/api/offline-data/…")` assumes the dev-server layout | `ts/api/api.ts:22-34` |
| 12 | No loading / empty / error UI; failures only `console.error` | `ts/main.ts:396-428` |
| 13 | Monarch purple leftovers in the calendar palette (`#4f378b` on pink, tertiary `#895264`) | `css/calendar-override.css:9-33` |
| 14 | `<title>Document</title>` | `index.html:12` |

---

## 3. Branding

> ### ADR-001 — Brand identity: "Bellis Blue, sharpened" (utility-modern)
>
> **Status:** Accepted · **Date:** 2026-09-27 · **Decides:** Q1
>
> **Context.** The product's single job is to make finding information *easy, fast and intuitive*. The existing identity uses two equally loud brand colours (Bellis Blue `#294D9D` and Bellis Pink `#E4017B`), which forces users to decode two competing signals on every screen. Alternatives considered: (a) modernise the existing dual-colour identity, (b) full rebrand to an indigo/violet single-accent scheme, (c) institutional blue + gold with a serif wordmark, (d) a vibrant student-facing palette with gradients.
>
> **Decision.** Keep **Bellis Blue `#294D9D`** as the single dominant brand colour and **demote Bellis Pink to a functional accent** used only for *personal* state. Adopt a **content-first, utility-modern visual language**: hairline structure instead of shadows and gradients, one accent per surface, a six-colour entity palette that carries wayfinding information, strict type hierarchy, and motion used exclusively as feedback.
>
> **Keywords:** *Schnell. Klar. Meins.* — *Fast. Clear. Mine.*
> **Tagline:** DE *"Alle Module. Ein Blick."* · EN *"Every module. One view."*
>
> **Consequences.** Zero migration risk (existing token names and primitives survive), accessibility is satisfied by the brand colour itself (8.0:1 on white, ≈ 9:1 in dark), and colour is freed up to do real wayfinding work. No rename is required. Cost: the "two-colour brand" look is gone, and any future pink-forward surface must be confined to personal-workspace screens — that rule belongs in a future brand guide, not only here.

### 3.1 Rationale — every brand decision traces to *easy, fast, intuitive*

| Brand choice | Why it serves *easy / fast / intuitive* |
|---|---|
| **One dominant colour (blue)** instead of blue **+** pink | A 50/50 pair makes every screen ambiguous. One dominant hue makes hierarchy instant: blue = navigation, data, selection; everything else is neutral. Fewer competing signals = faster scanning. |
| **The brand blue is AA-compliant by itself** (`#294D9D` on white = 8.0:1; `#8FB4FF` on `#0E0E12` ≈ 9:1) | We never trade legibility for identity — legibility *is* the identity. Matters in a catalogue read by thousands of students, including low-vision users. |
| **Pink kept, re-purposed as the "personal" accent** (⭐ Merken, Meine Liste, Stundenplan) | Continuity (recognisable, zero rebrand) *plus* new semantics: pink always means **"this is mine"**, blue always means **"this is the catalogue"**. A one-glance mental model. |
| **Six-colour entity palette as information, not decoration** | Colour does the wayfinding that currently falls on tabs users must read. Entity is recognisable by hue **and** icon **and** label — never colour alone. |
| **Module = brand blue** | The most common entity and the brand agree, so "blue = what I'm looking for" is reinforced instead of diluted. |
| **Flat surfaces: hairlines over shadows; no gradients; no decorative imagery** | Shadows and gradients add decoding cost and render cost. Hairlines are cheap (perceived speed) and keep the data the highest-contrast element on screen. |
| **Strict "signpost" result anatomy** (type bar → title → number → ≤ 4 facts → actions) | A fixed read pattern means the eye never re-learns where to look; every result is scanned identically. |
| **Density as a preference** (Komfort / Kompakt) | Removes the biggest layout argument (airy vs. dense) by letting the user decide; both options stay fast. |
| **Motion ≤ 180 ms, feedback only, off under `prefers-reduced-motion`** | Unexplained animation is latency. Fast, purposeful animation makes the product *feel* fast, which is the brand promise. |
| **Logo = three offset bars** (a "list" that reads as an "a") | Depicts instant listed results — the core promise — and survives at 16 px favicon size because it is stroke-based, not detailed. |
| **Empty/error states speak like a helpful person** ("Keine Module mit ‚Statistik' im SoSe 2026. Filter anpassen?") | A dead end is the biggest intuitiveness failure. Brand voice turns every dead end into the next action. |
| **Perceived speed is part of the brand** (skeletons < 300 ms, virtual lists, lazy calendar, prefetch on hover, IndexedDB cache) | "Fast" cannot be a claim, it must be measurable. Making it a brand principle keeps it on the roadmap. |

### 3.2 Brand name, disclaimer & legal position

- **Name:** `alma.web` (continuity with `almaweb-ui` / `/almaweb/v1`). Subtitle: *"Studiengangs- und Modulnavigation für die Universität Leipzig"* / *"Degree programme and module navigation for Leipzig University"*.
- **No external brand guidelines are followed** (decision Q2). This is a public, inofficial community project and does **not** claim affiliation with the university.
- **Disclaimer — shipped, not optional** (decision Q2):
    - Reachable from every page: a footer line **and** an entry in the overflow menu ("Über / About").
    - German: **"Inoffizielles Community-Projekt. Keine Verbindung zur Universität Leipzig. Alle Angaben ohne Gewähr — verbindlich sind ausschließlich die offiziellen Bekanntmachungen der Universität."**
    - English: **"Inofficial community project. Not affiliated with Leipzig University. All information without guarantee — only the official university publications are binding."**
    - It is a **link** to a static `#/about` page (see below), not bare text.
- **`#/about` page (Q11 — public resource) contains:** the disclaimer, minimal Impressum (maintainer, contact, issues link), data source & attribution, refresh/caching policy, terminology note, accessibility statement, third-party licence list (fonts, FullCalendar, virtualiser), and an explicit statement that there are no accounts, no personal data and no tracking.
- **Data attribution:** repeated on `#/about` and in the StatusBar tooltip — data extracted from the university course catalogue (ALMA Web), refreshed on demand, cached in the browser. Because the API exposes **no per-entity timestamps** (decision Q7), staleness is attributed to the **whole query** only (see [§12.2](#122-caching--staleness-decision-q7)).

### 3.3 Logo & iconography

- **Wordmark:** lowercase `alma` at weight 700 + `.web` at weight 500, always `--color-brand-600`. Tracking −1 %. Minimum cap height 20 px; never recoloured outside the token set.
- **Monogram / app icon / favicon:** rounded square (22.4 % radius) filled `--color-brand-600` containing a white glyph of **three stacked, horizontally offset bars** whose negative space reads as an "a". Ships as `favicon.svg`, `apple-touch-icon.png` (180 px), maskable `icon-512.png`, plus a monochrome variant for the collapsed icon rail.
- **Clear space:** 0.5 × cap height on all sides. No gradients and no drop shadow inside the mark.
- **Icon set:** **Material Symbols Rounded** (variable axes `FILL` 0/1, `wght` 400/500, `GRAD` 0, `opsz` 20/24), sourced from Google Fonts and **self-hosted** (decision Q3). 20 px in dense rows, 24 px in toolbars. Icon-only controls always carry an `aria-label` **and** a tooltip; primary actions default to icon **+** label.
- **Empty/error illustration:** single-weight line drawings in `--color-brand-200` / `--color-border-strong`; three reusable scenes (empty results, no connection, nothing saved yet). No mascots, no 3D, no gradients.

### 3.4 Voice & tone

| Do | Don't |
|---|---|
| Plain German, second person, active: "Filter zurücksetzen" | "Der Filter wurde zurückgesetzt" |
| Units always attached: "3 LP · 2 SWS · 48 Plätze" | Bare "3 / 2 / 48" |
| Concrete empty states: "Keine Module mit ‚Statistik' im SoSe 2026. Filter anpassen?" | "Keine Daten gefunden." |
| Explain staleness: "Zuletzt aktualisiert 27.09.2026, 12:04" | Naked "Aktualisieren" |
| Name the limit: "Zu viele Termine für den Kalender (12.433). Filter einschränken oder iCal exportieren." | Silent truncation |

**Formatting rules:** dates `27.09.2026`; times `08:15 – 09:45` (en dash, spaces around it); thousands separator `.` (de) / `,` (en); `LP` in German (not `ECTS`), "ECTS credits" acceptable in English; ISO dates only in URLs, export payloads and API calls. Terminology is fixed by the glossary in [§11.3](#113-terminology-glossary) (decision Q4).

---

## 4. Colour system

Two layers, strictly separated:

1. **Semantic UI tokens** — background, surface, text, border, action, status. They describe *purpose*, never a hue.
2. **Domain tokens** — one hue per entity type, used for tabs, badges, calendar events and tree levels. They describe *data*, never decoration.

The full CSS token file is in [§17.1](#171-csstokencss). Components consume Tailwind utilities generated from these tokens (`bg-surface`, `text-brand-600`, `border-border`, `text-type-course`, …); no component hard-codes a colour.

### 4.1 Brand & accent tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-brand-50` | `#EEF3FC` | `#141A2A` | selected row / subtle tint |
| `--color-brand-100` | `#DCE6F8` | `#1B2440` | chip background, tab hover |
| `--color-brand-200` | `#B9CCF1` | `#24335C` | illustration lines, info graphics |
| `--color-brand-300` | `#8FAEE8` | `#2F4A85` | disabled brand, dividers on brand |
| `--color-brand-400` | `#5C86D6` | `#4C6FBD` | hover borders, focus ring tint |
| **`--color-brand-600`** | **`#294D9D`** *(Bellis Blue)* | **`#8FB4FF`** | **brand, primary button, link, active tab** |
| `--color-brand-700` | `#1F3C7E` | `#B0CBFF` | button hover |
| `--color-brand-800` | `#172E62` | `#C9DBFF` | button pressed |
| `--color-brand-900` | `#102047` | `#E3ECFF` | subtle brand text |
| `--color-on-brand` | `#FFFFFF` | `#0E0E12` | text/icon on a brand fill |
| `--color-accent-500` | `#E4017B` *(Bellis Pink)* | `#F872B1` | **fill only, ≥ 18 px** — ⭐-Pill, personal CTA |
| **`--color-accent-600`** | **`#C40069`** | **`#FF7FBF`** | **text-safe accent** on surface |
| `--color-accent-700` | `#9B0053` | `#FFA4D2` | accent hover / pressed |
| `--color-on-accent` | `#FFFFFF` | `#2A0018` | text/icon on an accent fill |

**Accent usage rule (reviewable, enforce in PRs):** `--color-accent-*` may only appear on affordances that create or read *personal* state — ⭐ Merken, Meine Liste, Sammlungen, Notizen, Stundenplan, Vergleichsmodus. It is **never** used for destructive or error actions (those use `--color-danger`) and never for decorative emphasis. This is what makes "pink = mine, blue = the catalogue" learnable.

### 4.2 Surfaces, text & status tokens

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--color-bg` | `#F7F8FB` | `#0E0E12` | app canvas (slightly tinted so white cards read as raised) |
| `--color-surface` | `#FFFFFF` | `#17171D` | cards, panels, table rows, inputs |
| `--color-surface-2` | `#EFF1F7` | `#20202A` | toolbar/header bars, hovered rows, skeletons |
| `--color-surface-3` | `#E5E8F1` | `#282833` | pressed state, inset wells |
| `--color-border` | `#D3D7E3` | `#33333F` | hairlines, dividers, card outlines |
| `--color-border-strong` | `#A8AEC1` | `#4A4A58` | input outlines, table header rule |
| `--color-text` | `#14151A` | `#F2F3F7` | primary text (≥ 15:1) |
| `--color-text-muted` | `#5B6070` | `#A9AEBD` | labels, meta (≥ 4.5:1) |
| `--color-text-subtle` | `#7C8291` | `#81879A` | de-emphasised, large text only (≥ 3:1) |
| `--color-success` | `#1F7A5A` | `#6DD3A8` | no conflicts, saved success |
| `--color-warning` | `#8A5300` | `#F5C36B` | overlaps, stale data, threshold reached |
| `--color-danger` | `#B3261E` | `#F08C87` | errors, hard conflicts, failed requests |
| `--color-info` | `#0F6E9B` | `#78C8EE` | hints, sync/refresh state |
| `--color-focus` | `#294D9D` | `#8FB4FF` | `:focus-visible` ring (2 px + 2 px offset) |

**Contrast contract:** body text ≥ 4.5:1, UI boundaries and icons ≥ 3:1, focus indicator ≥ 3:1, all verified per theme before a component ships. `--color-on-brand` stays near-black in dark mode (light-blue fill + black text is correct and intentional — it is already the behaviour in `css/main.css`).

### 4.3 Domain palette — entity types

| Entity (DE / EN) | Hue | Light `solid` | Dark `solid` | Light `soft` | Icon (redundant cue) | Shape cue |
|---|---|---|---|---|---|---|
| **Module / Modules** | Indigo | `#294D9D` | `#8FB4FF` | `#EEF3FC` | `menu_book` | square type bar |
| **Kurse / Courses** | Teal | `#0F7A78` | `#6FD3CF` | `#E6F5F4` | `groups` | bar with rounded tail |
| **Veranstaltungen / Events** | Amber | `#8A5300` | `#F2B84B` | `#FBF0DE` | `event` | bar + calendar glyph |
| **Prüfungen / Exams** | Red | `#B3261E` | `#F08C87` | `#FBE9E8` | `assignment` | dashed bar |
| **Mitarbeitende / Staff** | Violet | `#6A3FA0` | `#C3A6F5` | `#F1EBFA` | `person` | pill-only |
| **Räumlichkeiten / Rooms** | Cyan-slate | `#28607F` | `#8FCBE8` | `#E7F1F6` | `meeting_room` | bar + pin glyph |

Each entity also exposes `soft`, `line` and `on-solid` variants; all combinations are contrast-checked against their own soft background and remain mutually distinguishable under deuteranopia/protanopia (simulated in the design gallery).

**Secondary encodings**
- **Faculty / Fakultät** (14 entries): a deterministic muted hue from a fixed seed list, used for Explorer level tiles and "Fakultät" chips. Same seed always yields the same hue across sessions.
- **Course type** (Vorlesung / Übung / Seminar / Praktikum / Kolloquium): icon + `soft` tint only, no dedicated hue — it is already conveyed by the entity colour's context.

**Rules**
- Never encode meaning in colour alone (icon and/or label always accompany it).
- One entity hue per surface, plus status colours when relevant. No two competing accents.
- Status colours always pair with an icon and a word ("Konflikt", "Aktualisieren fehlgeschlagen").

---

## 5. Typography

**Font sourcing policy (decision Q3):** only fonts available on **Google Fonts** are used, and every file is **downloaded once and self-hosted** in `assets/fonts/`. No CDN request at runtime — that keeps the app private, offline-capable (PWA, decision Q10) and fast (no third-party connection). Licences are recorded on `#/about`.

| Role | Font | Size / line-height | Weight | Notes |
|---|---|---|---|---|
| Display | Atkinson Hyperlegible Next | 40/48 (mobile), 52/60 (desktop) | 700 | onboarding and empty-state hero only |
| Headline | Atkinson Hyperlegible Next | 28/36 | 700 | page and view titles |
| Title | Atkinson Hyperlegible Next | 20/28 | 700 | entity titles in cards and detail |
| Subtitle | Atkinson Hyperlegible Next | 16/24 | 600 | module/course number, room code |
| Body | Atkinson Hyperlegible Next | 15/22 | 400 | base text |
| Body-sm | Atkinson Hyperlegible Next | 13/20 | 400 | table cells, chips, meta |
| Label | Atkinson Hyperlegible Next | 12/16, tracking +0.02em | 600 | field labels, badges, buttons |
| ID / Code | JetBrains Mono | 13/20 | 400/500 | module, course, exam and room numbers; share IDs |

**Why these two.** *Atkinson Hyperlegible Next* is the successor to the font already referenced in `css/fonts.css`, designed for maximal letterform distinguishability — exactly the property a page full of similar-looking module numbers needs. *JetBrains Mono* gives monospaced, tabular identifiers so numbers align vertically across rows; it is only used for identifiers, never for prose (which keeps the download small).

### 5.1 Loading & implementation rules

- **Fix defect #1 first:** ship `AtkinsonHyperlegibleNext-Regular.woff2` (400), `-SemiBold.woff2` (600) and `-Bold.woff2` (700), plus `JetBrainsMono-Regular.woff2` (400) and `-Medium.woff2` (500). Subset to `latin` + `latin-ext` (`U+00A0-00FF` covers umlauts and `ß`). Budget: ≤ 5 files × ~30 KB.
- `font-display: swap`, `preload` only for the 400 weight of the UI font, `unicode-range` per subset (the existing `fonts.css` pattern is kept and extended).
- **Icons:** self-host **Material Symbols Rounded** variable font with the axes limited to `FILL 0..1`, `wght 400..500` (a variable request is far smaller than the current static `MaterialSymbols-filled.woff2` at 382 KB). The `font-variation-settings` are exposed as the `.icon` / `.icon--filled` classes so components can toggle fill for "saved" states.
- **Fallback stack** (documented, never assumed): `"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`. The app must be readable and correctly laid out on this fallback alone — metrics are checked at Phase 0.
- **`font-variant-numeric: tabular-nums`** is applied to every element carrying dates, times, numbers, LP/SWS or room codes (`.num` utility).
- **Sizes are `rem`-only** and respect the browser font-size setting; body never below 15 px, compact mode never below 12 px.
- **Density modes:** Komfort = values above. Kompakt = Body 14/20, Body-sm 12/16, Title 18/24, row padding reduced by one step, chip height 22 px. The default is **Komfort**, pending TBD-1 ([§16](#16-open-items)).
- **Accessibility preference** "Größere, besser lesbare Schrift": scale 1.15 + letter-spacing +0.01em, applied on `:root` as a `--font-scale` multiplier so no component needs to know about it.

---

## 6. Spacing, radius, elevation, motion

### 6.1 Spacing

4 px base scale, exposed as `--spacing-*`: `0, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64`. Everything in the UI snaps to it — no arbitrary pixel values in component CSS.

| Context | Komfort | Kompakt |
|---|---|---|
| App gutter (desktop / tablet / phone) | 24 / 16 / 12 | same |
| Card padding | 16 | 12 |
| Row padding (vertical × horizontal) | 12 × 16 | 8 × 12 |
| Chip padding | 4 × 8 (height 26) | 2 × 6 (height 22) |
| Stack gap inside a card | 8 | 4 |
| Between result groups | 16 | 12 |
| Section gap | 24 | 16 |
| Touch target | ≥ 44 × 44 px (touch input only) | ≥ 40 × 40 px |

### 6.2 Radius

| Token | Value | Applied to |
|---|---|---|
| `--radius-xs` | 4 px | chips, badges, table cell highlight |
| `--radius-sm` | 8 px | inputs, buttons, segmented controls |
| `--radius-md` | 12 px | cards, panels, popovers |
| `--radius-lg` | 16 px | drawers, modals, sheets |
| `--radius-full` | 9999 px | pills, avatars, icon buttons |

The current `.btn` (4 px) and `.card` (6 px) values are normalised to `sm` and `md` respectively.

### 6.3 Elevation

Structure comes from **hairlines**, not shadows. Elevation is reserved for layers that genuinely float.

| Token | Value | Applied to |
|---|---|---|
| `--shadow-1` | `0 1px 2px rgb(20 21 26 / .06), 0 1px 3px rgb(20 21 26 / .08)` | dropdown, popover, tooltip |
| `--shadow-2` | `0 4px 12px rgb(20 21 26 / .10)` | drawer, sticky toolbar when scrolled |
| `--shadow-3` | `0 12px 32px rgb(20 21 26 / .16)` | modal, command palette |
| (none) | — | cards, rows, panels, headers: `border: 1px solid var(--color-border)` |

In dark mode shadows are additionally reinforced with a 1 px `--color-border` outline so floating layers stay readable on the dark canvas.

### 6.4 Motion

| Token | Value |
|---|---|
| `--duration-fast` | 100 ms — hover, press, colour change |
| `--duration-base` | 180 ms — expand/collapse, drawer, tab indicator, toast |
| `--duration-slow` | 300 ms — route/view change |
| `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` |
| `--ease-emphasized` | `cubic-bezier(.2, 0, 0, 1.2)` |

Rules:
1. Every transition uses a token; no magic durations.
2. Motion only communicates change of state (opened, selected, loaded, moved). No decorative animation, no parallax, no auto-play.
3. `@media (prefers-reduced-motion: reduce)` sets all durations to `0ms` globally and switches skeletons from shimmer to a static placeholder — this is a global rule in `css/base.css`, not an opt-in per component.
4. No animation on first paint; skeletons appear only after 300 ms of waiting (fast responses render directly, so the UI never "flashes").
5. Content never moves after a response: skeletons are dimensioned to the final layout (CLS target < 0.1).

---

## 7. Layout & information architecture

### 7.1 Desktop app shell (≥ 1280 px)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│ ▣ alma.web   [ 🔍 Module, Kurse, Räume, Personen…              ⌘K ]   ⟳ 12:04   DE ▾   ◐   ⋯ │  TopBar 56
├────────────┬─────────────────────────────────────────────────────────────┬────────────────────┤
│ FILTER     │ [ Module │ Kurse │ Veranstaltungen │ Prüfungen │ Personen │ Räume ] │  DETAIL           │
│ ────────── │ [ Einzeln │ Geteilt │ Vergleichen ]            ⇅ Sortieren  ⋮     │  ──────────       │
│ Semester   │ ┌───────────────────────────┬───────────────────────────────┐   │  Modul            │
│ Fakultät   │ │  Ergebnis A  (virtualised)│  Ergebnis B  (virtualised)    │   │  10-201-2011      │
│ Sprache    │ │  Liste / Kacheln / Tabelle│  Liste / Kacheln / Tabelle    │   │  Algorithmen…     │
│ LP    ▁▁   │ │  / Kalender / Baum        │  / Kalender / Baum            │   │  3 LP · 1 Sem.    │
│ SWS   ▁▁   │ │                           │                               │   │  Kurse (4)   ▸    │
│ Zeitraum   │ │                           │                               │   │  Prüfungen (2) ▸  │
│ [+ Filter] │ └───────────────────────────┴───────────────────────────────┘   │  [ + Merken ]     │
├────────────┴─────────────────────────────────────────────────────────────┴────────────────────┤
│ 4.812 Ergebnisse · Daten 27.09.2026, 12:04 · ⚠ 2 Zeitkonflikte · ⭐ 7 gemerkt                  │  StatusBar 28
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

Five regions, each with exactly one job:

| Region | Size | Contents |
|---|---|---|
| **TopBar** | 56 px, sticky | Logo/wordmark → global search field (opens the commander) → freshness indicator with refresh → language menu → theme menu → overflow menu (Teilen, Export, Meine Liste, Slots, Einstellungen, Über) |
| **Filter rail** | 280 px, collapsible to a 48 px icon rail, hideable | Faceted filters with live counts, include/exclude, active-filter chip bar, presets, reset |
| **Content** | fluid | Pane toolbar (entity tabs + layout mode + sort + density) above one or two virtualised result panes |
| **Detail panel** | 360–420 px, right, resizable | Detail of the selected entity; deep-linkable; becomes a full-screen sheet below 1024 px |
| **StatusBar** | 28 px, sticky bottom | Result count, data timestamp + source tooltip, live conflict counter (click → conflicts), saved counter (click → Meine Liste), offline/refresh state |

The current `body` grid (`grid-cols-[330px_auto_auto] grid-rows-[max-content_auto]`) is replaced by a named app-shell grid using `minmax(0, 1fr)` tracks so long content can never blow out the layout, with explicit `grid-template-areas` per breakpoint.

### 7.2 Layout modes

The three modes finally become real states (today only "Geteilt" has styling):

| Mode | DE | Behaviour | Mobile (< 1024 px) |
|---|---|---|---|
| **Single** | Einzeln | One pane, full width. Detail opens in the right panel, or inline-expands in the list when the panel is closed. | Default |
| **Split** | Geteilt | Two independent panes, each with its own entity type, layout, sort and scroll position. Draggable splitter (double-click resets to 50/50) plus a per-pane "Filter synchronisieren" toggle (on by default). | Swipeable tab bar "A │ B" |
| **Compare** | Vergleichen | **Exactly two columns: Save-Slot A vs. Save-Slot B** (decision Q13). Rows are the union of both slots aligned by `type:id`, with a per-row status: *nur A*, *nur B*, *identisch*, *abweichend*. Differing fields are highlighted with `--color-warning` and a "≠" marker; identical rows collapse. | Stacked diff list (A above B per row) |

Compare specifics:

- A **compare bar** at the top of the content area holds two slot dropdowns (`Slot A ▾`, `Slot B ▾`) and a swap button.
- Empty slot → explicit empty state ("Slot A ist leer. Module aus der Liste zuweisen.") with a jump to *Meine Liste*.
- Alignment key is `type:id`; field differences are compared on the fields the row displays (number, LP, SWS, weekday, time, room, exam-required, faculty, path).
- Compare never loads unbounded data: it operates **only** on saved slots, which are local and therefore inherently bounded (decision Q5).

### 7.3 Responsive behaviour (decision Q10 — PWA + responsive)

| Range | Shell |
|---|---|
| **< 640 px** (phone) | TopBar with menu + search icon; filters and detail as **full-screen sheets**; cards are the default layout, list becomes a 2-line row; **bottom navigation** (Suche · Meine Liste · Stundenplan · Kalender · Mehr); single pane only; Compare degrades to the stacked diff |
| **640–1023 px** (tablet) | TopBar with a search field; filter rail becomes an overlay drawer; single pane + detail sheet; Split/Compare available as tabs |
| **1024–1279 px** (laptop) | Persistent filter rail (collapsible); Split side by side; detail as a sheet unless there is room for both |
| **≥ 1280 px** (desktop) | Rail + Split + Detail panel can all be visible simultaneously |
| **≥ 1600 px** (wide) | Content max-width 1600 px, centred; the two Compare columns get generous gutters |

```
MOBILE (< 640 px)                        TABLET (640–1023 px)
┌───────────────────────────┐            ┌────────────────────────────────────────────┐
│ ☰   ▣ alma.web        🔍  │            │ ▣ alma.web  [ 🔍 …………………… ]  DE ▾  ◐   ⋯ │
├───────────────────────────┤            ├────────────────────────────────────────────┤
│ Filter (3) ▾     ⇅ Sort ▾ │            │ [ Module │ Kurse │ Veranstaltungen │ … ]   │
├───────────────────────────┤            ├────────────────────────────────────────────┤
│ ┌───────────────────────┐ │            │  Filter        ┌─────────────────────────┐ │
│ │▎Algorithmen u. Daten… │ │            │  (drawer)      │ Ergebnis A              │ │
│ │ 10-201-2011   ⭐      │ │            │                │  ▎Modul 10-201-2011  ⭐ │ │
│ │ 3 LP · 1 Sem. · INF   │ │            │                │  ▎Kurs 10-201-2011-V01  │ │
│ ├───────────────────────┤ │            │                └─────────────────────────┘ │
│ │▎Statistik I           │ │            ├────────────────────────────────────────────┤
│ │ 10-201-2007   ⭐      │ │            │ 4.812 Ergebnisse · 12:04 · ⭐ 7            │
│ └───────────────────────┘ │            └────────────────────────────────────────────┘
├───────────────────────────┤
│  ▦    ⭐    🗓    ⌕    ⋯  │  bottom nav
└───────────────────────────┘
```

Touching and zooming are never disabled; at 200 % zoom and 320 px width the layout reflows to the single-column shell with no horizontal page scroll. Data tables keep their own horizontal scroll container with a sticky first column. On touch devices all interactive targets are ≥ 44 × 44 px and hover-only affordances have visible pressed equivalents.

### 7.4 URL & state model

Everything shareable lives in the URL; everything personal lives in the browser.

| Concern | Storage | Rationale |
|---|---|---|
| Filters, search query, entity type, layout mode, panes, sort, compare slots | **URL** (query string) | Shareable and reload-safe without any server (decision Q7: no short-link service exists) |
| Selected entity / open detail | **URL hash** `#/<type>/<id>` | Deep-linkable; back/forward works |
| Static pages | `#/about`, `#/design` (dev only) | Static, no router dependency needed |
| Meine Liste / slots / notes | `localStorage` + `IndexedDB` | Personal, anonymous, never sent to a server (decisions Q5, Q6) |
| Last session (filters, slots, scroll) | `localStorage` | Restored on return; a shared URL always overrides it |
| Theme, language, density, a11y preferences | `localStorage` | Applied pre-paint (no theme flash) |

Example shareable URL:

```
…/#/module/10-201-2011?q=statistik&types=module,course&sem=2025w&fac=10
   &paneA=list:module&paneB=calendar:event&mode=split&sort=name:asc
```

Sharing (decision Q7 — no short links, no QR service): **Kopieren** the full URL, a **client-side QR code** rendered from that URL, and "Als Startseite merken". Export and ICS links point directly at the API query (see [§9.4](#94-kalender) and [§9.8](#98-stundenplan-new)).

---

## 8. Component library

All components are implemented as **vanilla TS factories + Tailwind component classes**, following the existing convention (markup built in `ts/`, styling via `@apply` in `css/`). Each component lives in `ts/ui/<name>.ts` and `css/components/<name>.css`, is documented with a JSDoc block (required by the lint config), and is rendered in the dev-only `#/design` gallery in both themes and all three densities.

| Component | Spec | Replaces |
|---|---|---|
| `btn` | Variants `primary` (brand fill), `secondary` (surface + border), `ghost`, `danger`, `link`; sizes `sm 28 px`, `md 36 px`, `lg 44 px`; icon-only is square and requires `aria-label`; loading = inline spinner + `aria-busy` + disabled | `.btn`, `.btn.slim` |
| `segmented` | `role="radiogroup"` with `aria-checked`, sliding indicator, ←/→/Home/End keyboard support, optional icon + count per option | `.switcher`, `#display-changer1/2`, `#view-switcher` |
| `tabs` (entity) | `role="tablist"` + `aria-selected`; horizontal scroll with edge fades on narrow screens; per-entity colour as a 3 px top border + icon; count badge; overflow menu beyond five tabs | `.type-switcher` |
| `field` | Wraps one control + visible label + help + error; variants: text, search (with clear button), number, date, time, **range** (two inputs, "Min"/"Max"), multi-select combobox rendering chips, tri-state checkbox (`beliebig` / `ja` / `nein`) | `.input-container`, `.input-container.range` |
| `chip` | `filter` (label + value + remove), `type-<entity>`, `meta`, `interactive`, `status`; overflow collapses to "+3 mehr" | `.info` pills |
| `card` | 3 px entity bar → title (2-line clamp) → mono number → up to 4 chips → footer actions; whole card is one link/target; hover raises one elevation step and reveals "＋ Merken"; `⋮` menu for secondary actions | `div.card` |
| `row` | Virtualised list row: optional select checkbox, entity glyph, title, mono number, up to 3 configurable meta columns (CSS grid), actions; expands inline (`aria-expanded`) to a compact detail preview | `ul.list > li.list-item` |
| `table` | Real `<table>` for the "Tabelle" layout: sortable headers (`aria-sort`), resizable columns persisted per user, row selection, density toggle, sticky first column and header, virtualised body | new |
| `badge` | Static status pill: `3 LP`, `Pflicht`, `Konflikt`, `Neu`, `Geändert`; always icon + text | part of `.info` |
| `drawer` | Right-hand panel (or bottom sheet < 640 px); `role="dialog"` + `aria-modal`, focus trap, Esc to close, background `inert`, focus restored to the trigger, drag-to-dismiss on touch | new — Detail, Meine Liste, mobile filters |
| `modal` | Centred, max 560 px, for Slot-Einstellungen, Export, destructive confirms (with typed confirmation for irreversible actions) | new |
| `popover` | Anchored, non-modal, used by the sort builder, column config, overflow menus and tooltips; auto-flips, `aria-expanded` on the trigger | new |
| `toast` | Bottom-centre on desktop, above the bottom nav on mobile; 4 s (+ pause on hover), `aria-live="polite"`, optional **Undo**; max 3 stacked | new |
| `empty-state` | Illustration + headline + explanation + 1–2 actions; the primary action is always "Filter zurücksetzen" | new |
| `skeleton` | Row, card, calendar and detail skeletons dimensioned to the real layout (zero CLS); static placeholder under `prefers-reduced-motion` | new |
| `error-state` | Cause + retry + "Mit gespeicherten Daten weiterarbeiten" when a cache exists | new |
| `breadcrumb` | Explorer path as clickable chips, overflow-collapsed, `aria-current="page"` on the last level | `.opened-levels` |
| `command-palette` | ⌘/Ctrl+K: fuzzy search over all six entity types **and** actions ("Filter zurücksetzen", "Stundenplan öffnen", "Export", "Sprache wechseln"); grouped results, recent searches, full keyboard control, `role="dialog"` | new |
| `switch` / `toggle` | Settings toggles (density, animations, sync filters, high contrast) with visible label and state text | new |
| `stat` | Small metric block (value + label + optional delta) used in the StatusBar and summaries | new |
| `slider` / `range-slider` | LP and SWS ranges with keyboard support and visible min/max values; falls back to two number inputs where dragging is impractical | new |

### 8.1 Component states (mandatory coverage)

Every component ships **default, hover, active/pressed, `:focus-visible`, selected, disabled, loading, error, empty** and **compact**. States are declared with explicit class names (`is-selected`, `is-loading`, `is-disabled`) rather than inferred from position, so they are testable.

### 8.2 Rules that apply to every component

1. No hard-coded colours, sizes, radii, shadows or durations — tokens only.
2. Logical CSS properties (`ps-`, `pe-`, `ms-`, `me-`, `text-start`) so a future RTL language costs nothing.
3. Every interactive element is reachable by Tab in DOM order and operable with Enter/Space (and arrows where a control is composite).
4. No `:has()` requirement for **behaviour**: `:has()` may be used for progressive visual enhancement (as today), but state lives in JS-set classes/attributes so the UI is testable and works on any browser (decision Q14: no legacy support needed, this is simply more robust).
5. Markup uses semantic elements: `<button>`, `<a>`, `<input>`, `<table>`, `<ul>` — never `<item>` or heading-styled `<div>`s (fixes defects #5–#7).

---

## 9. View designs

Every pane independently holds one of five layouts: **Liste**, **Tabelle**, **Kacheln**, **Kalender**, **Explorer**. The entity type and the layout are independent; the entity colour is always visible in the pane toolbar so users never lose track of which pane shows what.

### 9.1 Ergebnisliste (Liste)

- Virtualised list, ~40 DOM nodes regardless of result count (`ts/util/virtual-list.ts`).
- Sticky **group headers** ("WiSe 2025/26 · Informatik") that double as collapsible sections.
- Row anatomy is fixed (see [§3.1](#31-rationale--every-brand-decision-traces-to-easy-fast-intuitive)): entity bar, title, mono number, ≤ 3 meta cells, actions.
- Multi-select via checkbox or `Space` → bulk bar appears: "Zu Meine Liste", "Vergleichen", "Export", "Auswahl aufheben".
- Keyboard: ↑/↓ move, `Enter` opens detail, `Space` selects, `M` merkt, `E` expands inline.
- Semantics: `role="listbox"` with `role="option"` + `aria-selected`, or a real `<table>` in Tabelle mode — never heading-styled divs (fixes defect #6/#7).

### 9.2 Tabelle (new)

- A real `<table>` for users who compare numbers: sortable headers with `aria-sort`, resizable columns persisted per user, column config popover, sticky header **and** sticky first column, density toggle, virtualised body.
- Default columns per entity, e.g. Module: Name · Nummer · LP · Semester · Sprache · Fakultät · Pfad · Kurse · Prüfungen. Räume: Name · Nummer · Typ · Plätze · Barrierefreiheit · Gebäude.
- Row selection reuses the bulk bar; selecting a row highlights it and opens the detail panel (no navigation away).

### 9.3 Kacheln (Cards)

- Grid `repeat(auto-fill, minmax(280px, 1fr))`, gap 16 (Komfort) / 12 (Kompakt).
- Card = entity bar, title (2-line clamp), mono number, up to four chips (most decision-relevant first), footer with the primary action and a `⋮` menu.
- Hover (and always on touch): "＋ Merken" appears in the top-right, `--color-accent-*`.
- Per-entity chips: Module → LP · Semester · Sprache · Fakultät; Kurse → Typ · Wochentag · SWS · Dozent:in; Veranstaltungen → Datum · Zeit · Raum · Dauer; Prüfungen → Datum · Zeit · Art · erforderlich; Personen → Anzahl Kurse/Prüfungen; Räume → Typ · Plätze · Barrierefreiheit · Gebäude.
- No images anywhere; instead a very low-opacity entity glyph watermark gives each card type a recognisable texture.

### 9.4 Kalender

FullCalendar is wired **per pane** (`#calendar1`, `#calendar2`) and fixes the `#calendar` selector bug (defect: `initCal()` was commented out and pointed at a non-existent element).

**Threshold rule (decision Q8).** The API exposes an iCal format, and events/exams are only plotted when the filtered count is below a constant:

```ts
/** Maximum number of events/exams that may be rendered inside the calendar. */
export const CALENDAR_MAX_ITEMS = 500;
```

Behaviour:

1. When the calendar layout is activated for Veranstaltungen or Prüfungen, the app first requests the **count** for the current filter set (cheap: `limit=1`, read `count` from the envelope).
2. `count ≤ CALENDAR_MAX_ITEMS` → fetch the matching items (paged to the constant) and render them; a discreet note in the pane toolbar reads "500 von 4.812 Terminen – Filter einschränken für mehr".
3. `count > CALENDAR_MAX_ITEMS` → the calendar is **not** rendered; instead a `warning` threshold state appears: "Zu viele Termine für den Kalender (12.433). Filter einschränken oder iCal exportieren." with actions **Filter einschränken** and **iCal herunterladen**.
4. Entities saved in Meine Liste are **always** plotted, regardless of the threshold, because personal selections are inherently small — this guarantees the Stundenplan always works.
5. The constant is user-tunable in Einstellungen (200 / 500 / 1.000) with 500 as the default, pending TBD-3 ([§16](#16-open-items)).

Other calendar requirements:

- Views offered: `listWeek` (default on mobile), `listMonth`, `dayGridMonth`, `timeGridWeek`, `timeGridDay`; German button labels kept from the current configuration; "Heute" is computed in `Europe/Berlin`.
- `validRange` is bounded to the semesters present in the data; navigating outside shows an empty state rather than unbounded scrolling.
- Events are coloured by **entity type** by default (Veranstaltung amber, Prüfung red) with an optional "nach Fakultät" legend; saved events get an accent-coloured left border and a ★ marker.
- Event popover shows title, Kurs/Modul link, date, time, room + building, staff, plus "Konflikt" warning if it overlaps another saved event.
- Exam dates without a time (`exam_date` set, `start_time`/`end_time` null) are rendered as all-day events with an explicit "Keine Zeitangabe" chip — the data model allows this.
- FullCalendar is loaded with a dynamic `import()` on first calendar use so Liste/Kacheln users never download it.
- `css/calendar-override.css` is regenerated from the new tokens (removing the Monarch purple leftovers, defect #13) and imports the theme stylesheet once, not per pane.

### 9.5 Explorer (heute "Navigationsbaum")

The tree is rebuilt as a breadcrumb-driven hierarchical browser, because the current implementation is unwired, hardcodes its fallback path (`Root` / `SoSe 2025` / `01 - Theologische Fakultät`), only `console.log`s leaf modules, and creates duplicate element ids per pane.

- **Breadcrumb** (top): one chip per opened level, each removable; first chip is "Alle Semester"/"Wurzel"; depth and node count are announced in the StatusBar.
- **Level grid** (main): tiles for the current level with a name, a count of contained modules, and a deterministic faculty hue; clicking a tile opens the next level (no page reload).
- **Leaf level**: modules at that node render with the standard **row** or **card** component — never a console log — and can be sorted, selected and saved like any other result.
- **Actions**: "Alles aufklappen" (expand to depth 3), "Zuklappen", "Diesen Pfad filtern" (turns the current path into an active filter chip), "Pfad teilen" (URL).
- **State**: the full path lives in the URL (`?path=2025w,10,Informatik`), so an Explorer position is shareable and reloadable; the hardcoded fallback disappears.
- **Keyboard**: ←/→ move between levels, Home/End jump, type-ahead selects a tile, Enter descends, Backspace ascends.
- **Data**: still derived from `module.path` (`computeTreeData` is kept and hardened), but computed once and memoised per filter set; a node with no matching modules under the current filter set is hidden, not shown empty.

### 9.6 Detailansicht (new)

Full detail for every entity, in the right drawer (≥ 1024 px) or a full-screen sheet (< 1024 px), deep-linked as `#/<type>/<id>`. Opening a detail never loses the result list; the list keeps its scroll position and highlights the selected row.

| Entity | Sections |
|---|---|
| **Modul** | Header (name, mono number, type bar) · Kennzahlen (LP, Semester, Häufigkeit, Sprache, Fakultät) · Pfad-Breadcrumbs (clickable → Explorer) · Kurse (n) · Prüfungen (n) · Veranstaltungen (n) · Verantwortliche Personen · externer Modulhandbuch-Link |
| **Kurs** | Header · Modul-Rücklink · Typ, Wochentag, Uhrzeit, SWS, Sprache · alle Termine (Liste, mit Raum) · Dozent:innen (→ Personen) · Räume (→ Räume) · Konfliktstatus |
| **Veranstaltung** | Header · Datum, Zeit, Dauer · Raum + Gebäude + Adresse + Barrierefreiheit · Dozent:innen · zugehöriger Kurs → Modul · Konfliktstatus · "Zum Kalender hinzufügen" |
| **Prüfung** | Header · Datum, Zeit, Dauer (oder "Keine Zeitangabe") · Art · erforderlich (ja / nein / offen) · Prüfer:innen (→ Personen) · zugehöriges Modul · Hinweis auf offizielle Anmeldung |
| **Person** | Header · Anzahl Kurse / Veranstaltungen / Prüfungen · alle Kurse · alle Veranstaltungen · alle Prüfungen · Räume |
| **Raum** | Header · Typ, Plätze, Größe, Barrierefreiheit · Gebäude + Adresse · Belegungsplan als Wochenraster · alle Veranstaltungen im aktuellen Semester |

Common footer actions in every detail: **＋ Merken** (accent), **In Spalte B öffnen** (Split), **Zu Vergleich hinzufügen**, **Kopieren**, **Teilen** (URL), **iCal** (where applicable), **Export** (row).

Loading behaviour: the drawer opens immediately with a **skeleton of the real layout**, then fills. If the single-entity fetch fails, an `error-state` with retry appears instead of an empty drawer. Deep links resolve server-side-free: if the id is unknown, a "nicht gefunden" state with a search suggestion is shown (never a blank page).

### 9.7 Meine Liste (local, read-only towards ALMA — decision Q5/Q6)

"No writes to ALMA" is a product constraint, not just a technical one: **Meine Liste is a personal notebook, never an enrolment basket.**

- **Structure:** three fixed **Save-Slots** (as the current header already implies) plus unlimited named **Sammlungen**. A slot is a list of `{type, id, note?, addedAt}` records — no copies of catalogue data.
- **Origins:** star from any row, card, calendar event or detail; drag-and-drop into a slot; "ganzen Filter übernehmen" saves the current result set as a collection (with the filter stored as a note so it stays reproducible).
- **Per-item:** optional note (free text, max 500 chars), reorder by drag or Alt+↑/↓, bulk remove with Undo toast.
- **Summary:** live totals for the active slot — Anzahl, Summe LP, Summe SWS, Anzahl Prüfungen, beteiligte Fakultäten.
- **Conflict detection:** same weekday + overlapping time window, optionally plus a **travel buffer** between different buildings (default 15 min, configurable). Conflicts are shown as `warning` badges on the affected rows, summarised in the StatusBar counter, and listed in a "Konflikte" section that jumps to the timetable.
- **Persistence:** `localStorage` for slot metadata, `IndexedDB` for larger collections; versioned schema with a migration hook so future fields do not break stored data.
- **Privacy:** nothing is uploaded; clearing site data clears the list — the UI says so on `#/about` and offers "Liste exportieren" (JSON) as a backup.
- **No auth seam is shipped** (decision Q6), but the store is written behind a single interface (`ts/state/saved.ts`) with a `sync` capability stub, so a future optional account can be added without touching components.

### 9.8 Stundenplan (new)

- Weekly grid Mo–So × 07:00–22:00 built from the **saved** Veranstaltungen (and optionally saved Prüfungen as date-specific overlays).
- Blocks carry the course name, type, room (short name), staff initials and the entity/faculty colour; overlapping blocks are outlined in `--color-danger` with a "Konflikt" label.
- Controls: semester selector, "nur Konflikte anzeigen", faculty colour legend, "Was wäre wenn" (temporarily add a result to preview the plan without saving), print/PDF layout, and **ICS**.
- **ICS (decision Q8):** the API exposes an iCal format, so export and subscription use server-generated feeds rather than client-side ICS generation. The UI offers "iCal herunterladen" (one-off, current semester, saved items) and "Abo hinzufügen" (`webcal://` link to the same query, so the subscription stays up to date). URLs can be long because no short-link service exists (Q7) — this is documented on `#/about` and the link is always copyable.
- Empty state: "Noch keine Termine gespeichert. Füge Kurse aus den Veranstaltungen hinzu." with a jump to the results.

### 9.9 Suche & Command Palette

- **TopBar search** performs instant search across filterable text fields of the current entity type; results drop into the pane.
- **Command palette (⌘/Ctrl+K)** searches **all six entity types at once** plus actions, and is the fastest path for returning users. Groups: *Aktionen* (Filter zurücksetzen, Sprache DE/EN, Theme, Stundenplan, Export, Teilen) → *Module* → *Kurse* → *Veranstaltungen* → *Prüfungen* → *Personen* → *Räume*, each capped at 5 with "alle anzeigen".
- Matching is fuzzy and diacritic-tolerant ("statistik" matches "Statistik", "hoersaal" matches "Hörsaal"); ISBN-like identifiers (e.g. `10-201-2011`) match exactly and rank first.
- Recent searches and "zuletzt angesehen" entities are offered when the field is empty; `Esc` closes, `Tab`/shift-Tab cycles groups, `Enter` opens, `⌘/Ctrl+Enter` opens in the other pane.
- Both search paths are debounced at **150 ms** with request cancellation (`AbortController`), and prefetch the detail of the focused result on hover/idle.

### 9.10 Filter & Sortierung UX

- **Faceted filters** in the rail, grouped exactly like the data: Globale Filter (Semester, Fakultät, Sprache) → Module → Kurse → Veranstaltungen → Prüfungen. Advanced groups start collapsed; the count of active filters is badged on the collapsed header.
- Each facet shows a **live result count** and supports include (check) and exclude (cross) where the API allows; ranges (LP, SWS, Wochenstunden) use the range-slider component with manual entry.
- **Active filter chips** sit between the rail and the results: each chip is removable, `Shift+click` clears everything else, and "Alle zurücksetzen" is always the primary empty-state action.
- **Presets**: "Meine Filter speichern" stores the current filter set under a name (local, shareable as a URL).
- **Sort** replaces the empty "Sortieren nach" container with a popover builder supporting up to **three keys** (Name, Nummer, LP, Datum, Semester, Fakultät, Relevanz) each with asc/desc; the active sort renders as chips so it is never invisible.
- Every filter and sort change is written to the URL and triggers an abortable request; the result count and StatusBar update optimistically while loading, with a subtle progress indication instead of a blocking spinner.

---

## 10. Decision log

Recording every product-owner answer and its binding consequence. If an implementation choice contradicts a row here, the row wins until this document is amended.

| ID | Question | Decision | Binding consequences |
|---|---|---|---|
| **Q1** | Brand direction | **"Bellis Blue, sharpened"** (see [ADR-001](#3-branding)) | Blue `#294D9D` is the single dominant brand colour; pink becomes the *personal-state* accent only; flat, hairline-based, utility-modern visual language; keywords *Schnell. Klar. Meins.* |
| **Q2** | Brand name, guidelines, disclaimer | Name stays **alma.web**; **no external guidelines followed**; the **inofficial disclaimer ships** | `#/about` page with disclaimer, Impressum, attribution, licences; disclaimer also in the footer and in the overflow menu; no university logo, colours or typography are copied |
| **Q3** | Fonts | **Google Fonts only, self-hosted locally** ("I will have a local font if a new one is used") | Atkinson Hyperlegible Next (400/600/700) + JetBrains Mono (400/500) + Material Symbols Rounded, all downloaded once into `assets/fonts/`, no runtime CDN; the missing-file defect is fixed in Phase 0 |
| **Q4** | Terminology | **Fixed, with a full English version** | `de` is the source language and the default; `en` ships complete; the glossary in [§11.3](#113-terminology-glossary) is authoritative; translation keys are typed |
| **Q5** | "Meine Liste" semantics | **Pure local planning workspace — no writes to ALMA** | Slots/collections store only `{type, id, note}` references; no enrolment, no submission, no server sync; conflict detection and LP/SWS totals are client-side; JSON export as backup |
| **Q6** | Authentication | **Not yet** | No login UI, no user data, no cookies for tracking; the saved-list store is written behind an interface with an unused `sync` stub so a future account is additive, not a rewrite |
| **Q7** | API capabilities | **Paging/filtering/sorting: yes. Per-entity `updated_at`/ETag: no — only whole-query. Short links: no** | All lists are server-paged and filtered; caching and staleness are tracked **per query** (`queryKey` → ETag/`Last-Modified` + `fetchedAt`); "Neu/Geändert" cannot be per entity, so change awareness is limited to "query data is newer than your last visit"; sharing uses long client-side URLs + a client-side QR code |
| **Q8** | Calendar scope | **API provides iCal; events and exams are plotted only while the count is below a constant** | `CALENDAR_MAX_ITEMS` (default 500, user-tunable) gates calendar rendering with an explicit threshold state; saved items always plot; export and `webcal://` subscription use the API's iCal output, never client-generated ICS |
| **Q9** | Location map | **No** | No map SDK (Leaflet, tiles, coordinates) is added; rooms are described by text (building, address, accessibility) with an external-map link only |
| **Q10** | Platform | **PWA, responsive** | Manifest + service worker + offline app shell + install prompt; full responsive matrix as in [§7.3](#73-responsive-behaviour-decision-q10--pwa--responsive); no native wrapper planned |
| **Q11** | Legal/public posture | **Public** | `#/about` is a real page (disclaimer, Impressum, attribution, accessibility statement, licences); no accounts, no analytics, no personal data; polite API behaviour (cache, revalidate, no polling) is part of the spec |
| **Q12** | Default density | **Decide later** | Both densities ship from Phase 0; the default is **Komfort** until revisited — tracked as **TBD-1** |
| **Q13** | Compare | **Two columns, comparing two Save-Slots** | Vergleichsmodus is exactly Slot A vs. Slot B with row alignment and field-level diffing; no free-form N-way comparison, no third column |
| **Q14** | Legacy browsers / `:has()` | **No legacy support needed** | `:has()` may be used (progressive enhancement) but behaviour is driven by JS state/classes so it is testable, debuggable and robust; no `:has()`-only logic for correctness |
| **Q15** | Accessibility target | **Decide later** | The shipped target is **WCAG 2.2 AA as a hard floor**, with AAA where it is free (contrast of large text, target size, focus appearance); a formal audit level is **TBD-2** |

---

## 11. Accessibility & i18n

### 11.1 Accessibility (WCAG 2.2 AA floor — decision Q15)

**Semantics**
- Exactly one `<h1>` per view; sections are `<h2>`; entity titles inside repeated results are **not** headings but links/buttons inside list items (fixes defect #6). The document outline therefore describes the page, not the data.
- Real elements everywhere: `<button>` for actions, `<a href>` for navigation (real URLs, middle-click works), `<input>`/`<select>`/`<fieldset>` for controls, `<table>` for tabular layouts. `<item>` disappears (defect #5).
- Every control has a programmatic name: visible `<label for>` or `aria-label`; every id is unique — enforced by an HTML validation step in CI (fixes defects #3, #4 and #8).
- Landmarks: `header`, `nav` (rail + bottom nav), `main`, `complementary` (detail drawer), `contentinfo` (footer/StatusBar).

**Keyboard**
- Everything operable without a pointer; Tab order follows DOM order; composite widgets (tabs, segmented controls, sliders, tree) follow the ARIA Authoring Practices key patterns (←/→/Home/End/Enter/Space).
- A visible `:focus-visible` ring (2 px `--color-focus` + 2 px offset) is never removed; `:focus-visible` is used instead of `:focus` so pointer users are not distracted.
- Drawers and modals trap focus, close on `Esc`, and restore focus to the invoking element. Background content gets `inert` while a modal is open.
- Shortcuts: `⌘/Ctrl+K` command palette, `/` focus search, `?` shortcut sheet, `g` + `m`/`k`/`v`/`p`/`r` jumps to entity types. Shortcuts never fire while typing in a text field, and every shortcut has a visible equivalent.

**Perception**
- Colour is never the only carrier of meaning: entity, status (conflict, required, new), selection and errors each pair colour with an icon and a word.
- Contrast: body text ≥ 4.5:1, large text ≥ 3:1, UI boundaries/icons ≥ 3:1, focus ≥ 3:1 — asserted per theme in the design gallery.
- Text remains readable at 200 % zoom with no loss of content or function; spacing is not fixed in pixels in a way that clips (no truncation of interactive labels).
- Touch targets ≥ 44 × 44 px on touch devices, ≥ 24 × 24 px minimum everywhere (WCAG 2.2 target size).
- Motion can be disabled (system preference and an explicit toggle) — all animation is non-essential.
- A "Hoher Kontrast" preference strengthens borders (`--color-border-strong`), underlines links and disables subtle tints for users who need it.

**Assistive technology behaviour**
- `aria-live="polite"` regions announce: result count changes ("4.812 Ergebnisse"), applied filters, toasts, save/remove confirmations, and conflict counts.
- `aria-busy` on regions while loading; `role="status"` for the StatusBar summary.
- Errors are announced and associated with their field via `aria-describedby`; a summary of errors precedes long forms.
- Screen-reader-only text supplies context that is visually implicit, e.g. "Modul" before a module number, "Plätze" after a seat count.

**Process**
- `#/design` gallery is the manual audit surface; automated checks (axe / Lighthouse a11y ≥ 95) run in CI on the shell, the gallery and three representative views (Liste, Detail, Kalender).
- Each roadmap phase's definition of done includes a manual keyboard pass and a screen-reader pass (NVDA on Windows, VoiceOver on macOS/iOS) for the screens that phase ships.

### 11.2 Internationalisation (decision Q4)

- **Two locales, both complete:** `de` (default and source of truth) and `en`. The switcher in the TopBar (currently decorative) is wired to a real locale state that updates `<html lang>`, `<title>`, `aria-label`s, date/number formatting and — where allowed by the data — nothing else.
- **Typed keys:** `ts/i18n/index.ts` exports `t(key, params)`; the key union is derived from `de.ts`, so a missing English key is a **compile error**, not a runtime fallback.
- **Structure of the catalogue:** flat namespaced keys (`filter.semester.label`, `entity.module.plural`, `action.save`, `error.offline.title`) with a `common.*` group for buttons and a `status.*` group for StatusBar messages.
- **Interpolation & plurals:** `t("results.count", { n })` → "1 Ergebnis" / "4.812 Ergebnisse" via `Intl.PluralRules`; numbers, dates, times and relative times all go through `Intl.*Format` with the active locale.
- **Data is never translated:** module names, room names, staff names, frequencies and exam types come from the API and are displayed verbatim in both languages (with the official German term shown in the English UI where it aids lookup, e.g. "Klausur (written exam)").
- **Layout safety:** no text is concatenated in code to build a sentence; all strings support reordering. German text is ~30 % longer than English, so the UI is designed against German (the longest case) and verified with pseudo-localisation.
- **Persistence & detection:** the chosen locale is stored in `localStorage`; on first visit `navigator.languages` decides, falling back to `de`.
- **URL:** `?lang=en` overrides the stored preference, so an English link is shareable.

### 11.3 Terminology glossary

Authoritative term mapping (decision Q4). The German column is fixed and must be used verbatim in UI copy; the English column is the translation for the `en` locale. API values are shown unchanged in both locales.

| Deutsch (fix) | English | Notes |
|---|---|---|
| Modul / Module | module / modules | catalogue entity 1 |
| Kurs / Kurse | course / courses | catalogue entity 2 (e.g. "Vorlesung") |
| Veranstaltung / Veranstaltungen | event / events | catalogue entity 3 (dated session) |
| Prüfung / Prüfungen | exam / exams | catalogue entity 4 |
| Mitarbeitende | staff | catalogue entity 5 (no gendered form; API field is `staff`) |
| Räumlichkeiten | rooms | catalogue entity 6 (API entity "locations"); singular in copy: "Raum" |
| Leistungspunkte, LP | credits (ECTS) | always with the number, e.g. "3 LP" |
| Semesterwochenstunden, SWS | weekly hours (SWS) | "2 SWS" |
| Semester | semester | values: WiSe 2025/26, SoSe 2026 |
| Fakultät | faculty | e.g. "10 - Informatik" |
| Studiengang | degree programme | |
| Abschluss | degree | Bachelor / Master / Staatsexamen |
| Pflichtmodul | compulsory module | |
| Wahlpflichtmodul | elective module | |
| Modulhandbuch | module handbook | external link |
| Verantwortliche Person | responsible person | module owner |
| Dozent:in / Lehrende | lecturer / teaching staff | generic copy uses "Lehrende" |
| Hörsaal | lecture hall | room type |
| Übungsraum | tutorial room | room type |
| Seminarraum | seminar room | room type |
| Gebäude | building | |
| Barrierefreiheit | accessibility | room attribute |
| Wochenstunden | weekly hours | filter range |
| Semesterdauer | duration (semesters) | filter range |
| Häufigkeit | frequency | e.g. "jedes Wintersemester" |
| Termin | session / date | a single dated occurrence |
| Klausur | written exam | exam type value |
| Hausarbeit | term paper | exam type value |
| mündliche Prüfung | oral exam | exam type value |
| erforderlich | required | exam attribute (tri-state: ja / nein / offen) |
| Meine Liste | My list | personal, local |
| Save-Slot | save slot | keep the anglicism, it is already in the UI |
| Sammlung | collection | named personal list |
| Stundenplan | timetable | weekly plan |
| Vergleich | comparison | Slot A vs. Slot B |
| Kennzahlen | key figures | detail summary block |
| Belegungsplan | room schedule | room detail section |
| Aktualisiert | updated / refreshed | freshness label |
| Konflikt | conflict | overlapping sessions |
| Filter zurücksetzen | reset filters | primary empty-state action |

Rules: no synonyms (never "Termine" for the entity "Veranstaltungen" in navigation), no abbreviations other than LP and SWS, no invented translations of API values, and capitalisation follows German sentence case for UI text ("Filter zurücksetzen", not "Filter Zurücksetzen").

---

## 12. Performance & PWA

Speed is a brand promise ([§3.1](#31-rationale--every-brand-decision-traces-to-easy-fast-intuitive)), so it is specified, not hoped for.

### 12.1 Data access

| Problem | Solution |
|---|---|
| `events.json` is 60.5 MB / 129 438 items and is fetched whole | Never load it whole. All six entity lists use **server-side paging + filtering + sorting** (the API envelope already exposes `count/page/limit/total_pages`). Local JSON fixtures remain **dev-only**, served through a proxy that simulates paging so production behaviour is identical. |
| Unbounded result sets in the DOM | Virtualised list, table and tree renderers (`ts/util/virtual-list.ts`), ~40 visible nodes; group headers and sticky rows implemented outside the virtual window. |
| FullCalendar bloats the initial bundle | Dynamic `import()` on first calendar activation; `daygrid`/`timegrid`/`list`/`multimonth` plugins loaded together, theme CSS imported once. |
| Sorting/filtering/conflict checks on large local sets | Offloaded to a Web Worker (`ts/util/worker/`) for saved-list conflict detection, local search over cached data and multi-key sort; main thread only renders. |
| Repeated identical requests while typing | 150 ms debounce + `AbortController` cancellation + in-flight request de-duplication by query key. |
| Perceived latency | Optimistic UI for filter/sort changes (counts and chips update immediately), skeletons only after 300 ms, hover/idle prefetch of visible detail data. |

### 12.2 Caching & staleness (decision Q7)

Per-entity timestamps and ETags do **not** exist; the API exposes caching metadata for the **whole query** only. The cache therefore keys on the query:

```ts
type QueryCacheEntry = {
    queryKey: string; // normalised, sorted query string
    etag: string | null; // strong ETag if provided
    lastModified: string | null; // Last-Modified if provided
    fetchedAt: string; // ISO timestamp of the local fetch
    payload: unknown; // the response envelope
};
```

Behaviour:

1. On request, send `If-None-Match` / `If-Modified-Since` when a cache entry exists. `304` → keep the cached payload and refresh `fetchedAt`; no re-render.
2. Cache lives in **IndexedDB** (queries + last N pages per entity), bounded by size (default 25 MB) with LRU eviction.
3. The StatusBar shows "Aktualisiert: 27.09.2026, 12:04" from `fetchedAt`, plus "Offline – Daten aus dem Cache" when the network is unavailable.
4. Because there is no per-entity change feed, "Neu/Geändert" badges are **not** claimed. The honest alternative: when a refreshed query returns a different payload than the cached one, the UI offers **"X Ergebnisse haben sich geändert – ansehen"**, computed by diffing the two payloads client-side for the pages currently loaded. This is explicitly presented as "since your last visit", not as server-verified change tracking.
5. No polling. Refresh happens on user action, on app focus after > 30 min, and on install/update.

### 12.3 PWA & offline (decision Q10)

- **Manifest:** `name` "alma.web", short name "alma", `display: standalone`, `theme_color` = light brand blue, `background_color` = `--color-bg`, maskable 512 px icon, monochrome + standard icons, `lang: de`, `dir: ltr`.
- **Service worker:** precache the app shell, fonts, and the token/component CSS; runtime-cache API GETs using stale-while-revalidate for query responses (respecting the IndexedDB cache above); navigate-fallback to the cached shell so a cold start offline still renders.
- **Update flow:** new SW → toast "Neue Version verfügbar – aktualisieren" (never a silent takeover while the user is working); the old version keeps serving until the user accepts.
- **Install:** custom "App installieren" entry appears in the overflow menu after `beforeinstallprompt`; instructions for iOS are shown as a short sheet because Safari has no install prompt.
- **Offline UX:** a persistent StatusBar banner, `error-state` with "Mit gespeicherten Daten weiterarbeiten" whenever a cached payload exists, and Meine Liste/Stundenplan remain fully usable offline (they are local).
- **Privacy:** no analytics SDK, no third-party requests at runtime (fonts and icons are self-hosted), no cookies; everything personal stays in `localStorage`/`IndexedDB`.

### 12.4 Budgets (enforced in CI)

| Metric | Budget |
|---|---|
| Initial JS (excl. FullCalendar) | < 120 KB gzipped |
| Shared CSS | < 25 KB gzipped |
| Fonts (all preloaded + lazy) | ≤ 200 KB total, ≤ 60 KB blocking |
| LCP (mid-range mobile, 4G) | < 2.5 s |
| CLS | < 0.1 |
| INP | < 200 ms |
| Lighthouse Accessibility / Best Practices | ≥ 95 |
| DOM nodes for a result list | ≤ 400 regardless of result count |

---

## 13. Feature map

Status legend: **🟢 implemented** · **🟡 placeholder** (UI exists, no behaviour) · **🆕 new** · **⛔ explicitly out of scope**.

| # | Feature | Status today | New design | Priority |
|---|---|---|---|---|
| 1 | Global search (fuzzy, diacritic-tolerant, exact id matching) | 🟡 (per-type, unwired) | TopBar search + command palette, debounced + abortable | P0 |
| 2 | Faceted filters with live counts, include/exclude, chips, presets | 🟡 (~25 static controls, duplicate ids) | Rebuilt rail, URL-synced, counts, reset, saved presets | P0 |
| 3 | Sorting (single + 3-key multi-level) | 🟡 (empty "Sortieren nach") | Sort popover builder + sort chips | P0 |
| 4 | Layouts: Liste / Tabelle / Kacheln / Kalender / Explorer | 🟡 (Liste + Kacheln only; Kalender & Baum broken) | All five fixed, per pane, virtualised, URL-stateful | P0 |
| 5 | Einzeln / Geteilt / Vergleichen | 🟡 (only Split styled) | Real pane state machine, resizable splitter, Compare = Slot A vs. Slot B | P0 |
| 6 | Detailansicht for all six entities, deep-linked | 🟡 ("Mehr Details" no-op) | Detail drawer/sheet with cross-links and skeleton/error states | P0 |
| 7 | Meine Liste / Save-Slots (local, no ALMA writes) | 🟡 (dropdown + icon, no state) | Slots + collections, notes, LP/SWS totals, conflict detection, JSON backup | P0 |
| 8 | Dark / light / system | 🟡 (hardcoded `.dark`) | `data-theme` + pre-paint script + OS sync + persistence | P0 |
| 9 | DE / EN | 🟡 (switcher, no i18n) | Typed i18n, `Intl` formatting, glossary, `?lang=` override | P0 |
| 10 | Empty / loading / error / offline / threshold states | ⛔ (console only) | Full state matrix for every view and component | P0 |
| 11 | Responsive + mobile shell (bottom nav, sheets) | ⛔ | Full breakpoint matrix, 320 px and 200 % zoom safe | P0 |
| 12 | Accessibility pass (WCAG 2.2 AA) | 🟡 (partial labels) | Full pass: semantics, focus, contrast, ARIA, audits in CI | P0 |
| 13 | Performance: paging, virtualisation, worker, cache | ⛔ (74 MB JSON fetched whole) | Server paging, IndexedDB query cache, virtual lists, lazy calendar, worker | P0 |
| 14 | Teilen | 🟡 (no-op) | Copy URL, client-side QR, "Als Startseite" | P1 |
| 15 | Export | 🟡 (no-op) | CSV / XLSX / JSON / ICS / print-PDF for result set or selection | P1 |
| 16 | Kalender with `CALENDAR_MAX_ITEMS` threshold + iCal | 🟡 (commented out, wrong selector) | Per-pane calendar, threshold state, API iCal export/subscription | P1 |
| 17 | Stundenplan (weekly grid) | 🆕 | Weekly planner from saved items, conflicts, print, ICS | P1 |
| 18 | Konflikt- und Überschneidungsprüfung | 🆕 | Badges, StatusBar counter, conflict list, travel buffer | P1 |
| 19 | Command palette + keyboard shortcut layer | 🆕 | ⌘K palette, `/`, `?` sheet, `g`-prefixed jumps | P1 |
| 20 | Explorer (rebuild of Navigationsbaum) | 🟡 (hardcoded, unwired) | Breadcrumb browser with URL paths, counts, real result rows | P1 |
| 21 | PWA: manifest, service worker, install, offline | 🆕 | Shell precache, query runtime cache, update toast, offline states | P2 |
| 22 | `#/about` (disclaimer, Impressum, attribution, licences, a11y statement) | 🆕 | Required for a public deployment | P2 |
| 23 | Design gallery `#/design` (dev only) | 🆕 | All components × themes × densities; the a11y/contrast audit surface | P2 |
| 24 | Onboarding (3-step coach marks, first-run hints) | 🆕 | Optional, dismissible, never blocks | P3 |
| 25 | Personal notes & highlights on entities | 🆕 | Part of Meine Liste; local only | P3 |
| 26 | Change awareness ("seit deinem letzten Besuch geändert") | 🆕 | Client-side payload diff of loaded pages (per Q7 limits) | P3 |
| 27 | Map of buildings/rooms | ⛔ | **Out of scope** (decision Q9) | — |
| 28 | Writing to ALMA (enrolment, registration, submission) | ⛔ | **Out of scope** (decision Q5) | — |

---

## 14. Target file structure

```
index.html                       # shell only: TopBar, rail, content host, StatusBar, template refs
css/
  tokens.css                     # @theme + theme overrides (single source of truth)
  base.css                       # reset, focus, typography, scrollbars, reduced motion, print
  main.css                       # imports: tailwind, tokens, base, fonts, components, calendar
  fonts.css                      # Atkinson 400/600/700, JetBrains Mono 400/500, Material Symbols Rounded
  calendar-override.css          # FullCalendar mapped onto the tokens (purple leftovers removed)
  components/
    btn.css  field.css  chip.css  card.css  row.css  table.css  tabs.css  segmented.css
    drawer.css  modal.css  popover.css  toast.css  empty.css  skeleton.css  badge.css
    breadcrumb.css  palette.css  switch.css  slider.css
ts/
  main.ts                        # bootstrap: theme, locale, router, stores, shell render
  state/
    store.ts                     # observable store + URL synchronisation
    filters.ts  panes.ts  selection.ts  saved.ts  settings.ts  compare.ts
  i18n/
    index.ts                     # t(), typed keys, Intl helpers
    de.ts  en.ts                 # source language + complete translation
  ui/                            # one factory per component (JSDoc'd, no framework)
    btn.ts  field.ts  chip.ts  card.ts  row.ts  table.ts  tabs.ts  segmented.ts
    drawer.ts  modal.ts  popover.ts  toast.ts  empty.ts  skeleton.ts  badge.ts
    breadcrumb.ts  palette.ts  switch.ts  slider.ts  stat.ts
  features/
    search/       fuzzy matcher, ranking, recent searches, palette actions
    filters/      facet definitions, counts, chip bar, presets
    sort/         multi-key sort builder
    list/  table/  cards/  calendar/  explorer/  compare/  detail/
    saved/        slots, collections, notes, totals
    timetable/    weekly grid, conflict detection, print
    export/       csv, xlsx, json, ics (API feed), print-pdf
    share/        url builder, qr renderer
    about/        #/about page content
  api/
    api.ts                       # typed endpoints, paging, aborting
    types.ts                     # shared response types (extended for new fields)
    cache.ts                     # IndexedDB query cache + revalidation
  util/
    virtual-list.ts  format.ts  dom.ts  worker/  qr.ts
assets/
  fonts/                         # self-hosted Google Fonts (5–6 files)
  icons/                         # favicon.svg, apple-touch-icon.png, icon-512.png, maskable
  img/                           # three line illustrations for empty/error states
docs/
  DESIGN.md                      # this document
manifest.webmanifest  sw.ts      # PWA manifest + service worker source
```

Rules that keep the structure aligned with the existing toolchain:

- The ESLint config stays authoritative: JSDoc on every function/method/class, 4-space indent, **no raw `for` loops** (use `map`/`filter`/`reduce`), `max-statements: 12`, `max-lines-per-function: 30`, `complexity: 7`, double quotes, semicolons. Modules are therefore deliberately small — the `ui/` and `features/` split already encourages that.
- Prettier keeps 100-column formatting with `prettier-plugin-tailwindcss`, so class order is automated rather than hand-maintained.
- `tsconfig` keeps `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax`; `types` is extended with `vite/client` plus PWA plugin types.
- `dist/` stays git-ignored; `docs/` is committed.

---

## 15. Roadmap

| Phase | Content | Definition of done |
|---|---|---|
| **0 — Foundations** | `tokens.css` + `data-theme` resolution with a pre-paint script; font fix (missing Atkinson files, correct Material Symbols family); component primitives (`btn`, `field`, `chip`, `card`, `row`, `drawer`, `toast`, `empty`, `skeleton`); `#/design` gallery; i18n scaffold with typed keys; a11y defect sweep (duplicate ids, dangling labels, semantics, skip link); responsive app shell (TopBar, rail, StatusBar) | Gallery renders every primitive in both themes × 3 densities; axe clean on shell and gallery; zero duplicate ids; fonts load with no fallback flash; `npm run lint && npm run typecheck && npm run build` clean |
| **1 — Find** | Search + ⌘K palette; faceted filters with counts and chip bar; sort builder; URL state; virtualised Liste + Tabelle + Kacheln; empty/loading/error states; paged API with IndexedDB query cache | The 129 438-event dataset is browsable without jank; every filter, sort, search and facet is functional and URL-shareable; keyboard-complete; performance budgets met |
| **2 — Understand** | Detail drawer for all six entities with cross-links and deep links; Explorer rebuild; calendar wired per pane with the `CALENDAR_MAX_ITEMS` threshold; Teilen (URL + QR); Export (CSV / ICS / print) | Every entity is reachable, cross-linked and shareable; the calendar either plots or explains the threshold; iCal download works against the API |
| **3 — Plan** | Meine Liste (slots, collections, notes, totals); conflict detection + StatusBar counter; Stundenplan; Compare (Slot A vs. Slot B); full responsive matrix with mobile sheets and bottom nav | Two courses can be scheduled and compared; conflicts surface correctly; mobile usable at 320 px and 200 % zoom; offline edits to the saved list never lose data |
| **4 — Polish & scale** | PWA (manifest, service worker, install, offline states); `#/about`; change awareness; high-contrast mode; formal a11y audit incl. screen readers; performance budgets enforced in CI; onboarding | Lighthouse a11y/best-practices ≥ 95; AA audit signed off; bundle/LCP/CLS/INP budgets enforced by CI; installable and fully usable offline for saved data |

Dependencies worth calling out:

- Phase 1 needs the paging/filtering API parameter names agreed (Q7 confirmed the capability, not the contract).
- Phase 2's calendar depends on `CALENDAR_MAX_ITEMS` being accepted as a UX rule (TBD-3).
- Phase 3's conflict detection depends on the travel-buffer default (TBD-4).
- Phase 4's PWA work assumes an `https` deployment with correct `Cache-Control` headers for `sw.js`.

---

## 16. Open items

Deliberately undecided. Each item names the decision owner's intent, the default this document assumes until it is answered, and the phase that is blocked if it stays open.

| ID | Open item | Assumed default | Blocks |
|---|---|---|---|
| **TBD-1** | Default density (Q12 — "decide later") | **Komfort**; both densities ship from Phase 0, the default is a one-line change | Nothing (cosmetic) |
| **TBD-2** | Formal accessibility audit level (Q15 — "decide later") | **WCAG 2.2 AA as a hard floor**, AAA only where free; no external audit contracted yet | Phase 4 sign-off |
| **TBD-3** | Exact value of `CALENDAR_MAX_ITEMS` | **500**, user-tunable to 200 / 500 / 1 000 | Phase 2 calendar |
| **TBD-4** | Default travel buffer between buildings for conflict detection | **15 min**, configurable | Phase 3 conflicts |
| **TBD-5** | Save-slot naming | Defaults "Slot 1/2/3", renameable; no preset names | Phase 3 |
| **TBD-6** | Compare behaviour when a slot holds more than one page (e.g. 300 saved items) | Compare pages internally and shows only differing rows by default, with "auch identische anzeigen" | Phase 3 compare |
| **TBD-7** | Exact paging/filter/sort parameter names and the iCal endpoint format contract | Proposed: `page`, `limit`, `sort`, `q`, plus per-field filter params; iCal via `?format=ical` on the same query | Phase 1 |
| **TBD-8** | Export format priority | Order: **CSV → ICS → print/PDF → JSON → XLSX** (XLSX only if a spreadsheet library is approved) | Phase 2 export |
| **TBD-9** | Onboarding scope | Three dismissible coach marks on first visit only, plus contextual hints | Phase 4 |
| **TBD-10** | Brand-guide follow-up | The accent-usage rule and logo specs in this document are promoted into a short `docs/BRAND.md` | Not blocking |
| **TBD-11** | Deployment target & caching headers for the service worker | Assume static hosting with `sw.js` served `no-cache` | Phase 4 PWA |
| **TBD-12** | New runtime dependencies | Proposed and all optional: **fuzzy search** (hand-rolled scorer preferred over a dependency), **QR rendering** (hand-rolled canvas or a ~3 KB lib), **XLSX** (only if TBD-8 includes it), **PWA plugin** (`vite-plugin-pwa` as a dev dependency). Each requires explicit approval before installation. | Phases 1–4 |

Nothing else is open. Items Q1–Q11, Q13 and Q14 are closed in [§10](#10-decision-log); Q12 and Q15 are closed as "decide later" and tracked above as TBD-1 and TBD-2.

---

## 17. Appendix

### 17.1 `css/tokens.css`

Drop-in replacement for the `@theme` block currently at the top of `css/main.css`. Keeps the existing pattern (`@theme` for light values, `@layer theme` for dark overrides) and the existing token *names* where possible, so nothing breaks during migration.

```css
@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));

@theme {
    /* fonts */
    --font-sans: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", ui-sans-serif, system-ui,
        -apple-system, "Segoe UI", sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

    /* brand (Bellis Blue) */
    --color-brand-50: #eef3fc;
    --color-brand-100: #dce6f8;
    --color-brand-200: #b9ccf1;
    --color-brand-300: #8faee8;
    --color-brand-400: #5c86d6;
    --color-brand-600: #294d9d;
    --color-brand-700: #1f3c7e;
    --color-brand-800: #172e62;
    --color-brand-900: #102047;
    --color-on-brand: #ffffff;

    /* accent (Bellis Pink — personal state only) */
    --color-accent-500: #e4017b;
    --color-accent-600: #c40069;
    --color-accent-700: #9b0053;
    --color-on-accent: #ffffff;

    /* surfaces & text */
    --color-bg: #f7f8fb;
    --color-surface: #ffffff;
    --color-surface-2: #eff1f7;
    --color-surface-3: #e5e8f1;
    --color-border: #d3d7e3;
    --color-border-strong: #a8aec1;
    --color-text: #14151a;
    --color-text-muted: #5b6070;
    --color-text-subtle: #7c8291;

    /* status */
    --color-success: #1f7a5a;
    --color-warning: #8a5300;
    --color-danger: #b3261e;
    --color-info: #0f6e9b;
    --color-focus: #294d9d;

    /* entity types */
    --color-type-module: #294d9d;
    --color-type-course: #0f7a78;
    --color-type-event: #8a5300;
    --color-type-exam: #b3261e;
    --color-type-staff: #6a3fa0;
    --color-type-location: #28607f;

    /* typography scale */
    --text-display: 40px;
    --text-headline: 28px;
    --text-title: 20px;
    --text-subtitle: 16px;
    --text-body: 15px;
    --text-body-sm: 13px;
    --text-label: 12px;
    --leading-display: 1.2;
    --leading-headline: 1.28;
    --leading-title: 1.4;
    --leading-body: 1.47;
    --leading-label: 1.33;

    /* radius */
    --radius-xs: 4px;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;

    /* elevation */
    --shadow-1: 0 1px 2px rgb(20 21 26 / 0.06), 0 1px 3px rgb(20 21 26 / 0.08);
    --shadow-2: 0 4px 12px rgb(20 21 26 / 0.1);
    --shadow-3: 0 12px 32px rgb(20 21 26 / 0.16);

    /* motion */
    --ease-standard: cubic-bezier(0.2, 0, 0, 1);
    --ease-emphasized: cubic-bezier(0.2, 0, 0, 1.2);
    --duration-fast: 100ms;
    --duration-base: 180ms;
    --duration-slow: 300ms;

    /* density (flipped by [data-density="compact"]) */
    --row-py: 12px;
    --row-px: 16px;
    --card-p: 16px;
    --stack-gap: 8px;
    --font-scale: 1;
}

@layer theme {
    :root,
    :host {
        @variant dark {
            --color-brand-50: #141a2a;
            --color-brand-100: #1b2440;
            --color-brand-200: #24335c;
            --color-brand-300: #2f4a85;
            --color-brand-400: #4c6fbd;
            --color-brand-600: #8fb4ff;
            --color-brand-700: #b0cbff;
            --color-brand-800: #c9dbff;
            --color-brand-900: #e3ecff;
            --color-on-brand: #0e0e12;

            --color-accent-500: #f872b1;
            --color-accent-600: #ff7fbf;
            --color-accent-700: #ffa4d2;
            --color-on-accent: #2a0018;

            --color-bg: #0e0e12;
            --color-surface: #17171d;
            --color-surface-2: #20202a;
            --color-surface-3: #282833;
            --color-border: #33333f;
            --color-border-strong: #4a4a58;
            --color-text: #f2f3f7;
            --color-text-muted: #a9aebd;
            --color-text-subtle: #81879a;

            --color-success: #6dd3a8;
            --color-warning: #f5c36b;
            --color-danger: #f08c87;
            --color-info: #78c8ee;
            --color-focus: #8fb4ff;

            --color-type-module: #8fb4ff;
            --color-type-course: #6fd3cf;
            --color-type-event: #f2b84b;
            --color-type-exam: #f08c87;
            --color-type-staff: #c3a6f5;
            --color-type-location: #8fcbe8;
        }
    }
}

[data-density="compact"] {
    --row-py: 8px;
    --row-px: 12px;
    --card-p: 12px;
    --stack-gap: 4px;
}

[data-a11y-font="large"] {
    --font-scale: 1.15;
}
```

### 17.2 Constants module (`ts/constants.ts`)

The values this document commits to, in one place so they are reviewable:

```ts
/** Maximum number of events/exams that may be rendered inside the calendar (decision Q8, TBD-3). */
export const CALENDAR_MAX_ITEMS = 500;

/** Selectable alternatives for CALENDAR_MAX_ITEMS in the settings. */
export const CALENDAR_MAX_ITEMS_OPTIONS = [200, 500, 1000] as const;

/** Fixed number of save slots in the header (decision Q13 uses exactly two of them for comparison). */
export const SAVE_SLOTS = 3;

/** Comparison is always Slot A vs. Slot B — exactly two columns (decision Q13). */
export const COMPARE_COLUMNS = 2;

/** Default travel buffer in minutes used by conflict detection (TBD-4). */
export const TRAVEL_BUFFER_MINUTES = 15;

/** Debounce for search and facet input, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 150;

/** Default page size requested from the API. */
export const PAGE_SIZE_DEFAULT = 50;

/** Delay before a skeleton is shown, so fast responses never flash (in milliseconds). */
export const SKELETON_DELAY_MS = 300;

/** Maximum number of sort keys offered by the sort builder. */
export const SORT_MAX_KEYS = 3;

/** Size budget for the IndexedDB query cache, in megabytes. */
export const CACHE_MAX_MB = 25;

/** Refresh a query automatically when the app regains focus after this many minutes (0 = never). */
export const REFRESH_ON_FOCUS_MINUTES = 30;

/** Supported locales; `de` is the source language and the default (decision Q4). */
export const LOCALES = ["de", "en"] as const;
```

### 17.3 Migration map (current → new)

| Current | New |
|---|---|
| `body { grid-cols-[330px_auto_auto] }` | App-shell grid with `grid-template-areas` per breakpoint ([§7.3](#73-responsive-behaviour-decision-q10--pwa--responsive)) |
| `header#top-header` (2-row, 3-column) | `TopBar` component, 56 px, single row + overflow menu |
| `#display-changer1/2` `<item>` elements | `segmented` component, `role="radiogroup"`, real `<button>`s |
| `#view-switcher` `span`s | `segmented` component driving the real pane state machine |
| `#language-switcher` (no-op) | Locale menu wired to i18n, `?lang=` override |
| `#dark-mode-toggle` (no-op) | Theme menu writing `data-theme`, pre-paint script, OS sync |
| `#last-updated-con` (static) | Freshness control: timestamp from the query cache + refresh action |
| `#share-button`, `#export-button` (no-op) | Share sheet (URL + QR) and Export sheet (CSV / ICS / print) |
| `#save-slot-options` (no-op) | `Meine Liste` entry point + slot selector with real state |
| `#filter-options` + `.filter-group` (~25 controls) | Faceted filter rail with `<fieldset>` groups, counts and chips |
| `.input-container` (incl. `.range`, `.slim`) | `field` component with visible label, help and error |
| `.switcher`, `.switcher span` | `segmented` component |
| `.type-switcher` `span`s + `:has()` display rules | `tabs` component, `role="tablist"`, entity colour, counts |
| `ul.list > li.list-item` + `.list-item h1/h2` | `row` component (or `table` row in Tabelle mode) |
| `div.card-grid > div.card` + `.btn-con` | `card` component with fixed anatomy and overflow menu |
| `.info` pills (`module-credits`, `course-weekday`, …) | `chip` / `badge` components with `type-*` variants |
| `main.tree > .levels/.opened-levels` | `Explorer` view with `breadcrumb` + level tiles + real result rows |
| `main#calendar1/2` + commented `initCal()` + `#calendar` selector bug | `calendar` feature, per-pane instances, dynamic import, threshold rule |
| `css/calendar-override.css` (Monarch purple leftovers) | Regenerated from the tokens; entity-coloured events |
| `.material-symbols` (filled file as "Outlined") | `.icon` / `.icon--filled` on self-hosted Material Symbols Rounded |
| `--color-primary` / `--color-secondary` / `--color-on-primary` / `--color-on-secondary` | `--color-brand-600` / `--color-accent-600` / `--color-on-brand` / `--color-on-accent` (aliases kept for one release to avoid a flag day) |
| `--color-background`, `--color-surface-filled`, `--color-backdrop` | `--color-bg`, `--color-surface-2`, `--color-backdrop` (kept as an alias for the modal scrim) |
| `--text-body-large … --text-display-small` (MD3 names) | Simplified scale: `--text-display/headline/title/subtitle/body/body-sm/label` |
| `<title>Document</title>` | `<title>alma.web – Module, Kurse und Prüfungen</title>` (i18n-driven) |

### 17.4 Document control

| Field | Value |
|---|---|
| Title | alma.web — Design Blueprint |
| Version | 1.0 |
| Date | 2026-09-27 |
| Status | Accepted for implementation |
| Scope | Brand, colour, typography, layout, components, views, features, accessibility, i18n, performance, PWA, roadmap |
| Source language | German (`de`), with a complete English (`en`) version |
| Decisions recorded | Q1–Q15 ([§10](#10-decision-log)); open items TBD-1…TBD-12 ([§16](#16-open-items)) |
| Next action | Phase 0 — Foundations ([§15](#15-roadmap)) |
| Amendment rule | Any deviation found during implementation is either corrected in code or recorded here as a new ADR/TBD row; this document is not silently ignored |

### 17.5 Summary of what changes for a user

1. **One search field and ⌘K replace hunting through filters.** Filters are still there, but they are a refinement tool with live counts, not the entry point.
2. **A real detail page for everything.** Clicking a module shows its courses, exams, sessions, people and rooms — all clickable onwards.
3. **Colour tells you where you are.** Six entities, six hues, plus icons and labels; pink only ever means "this is mine".
4. **Meine Liste, Stundenplan and Vergleichsmodus work.** Save what matters, see the week, catch conflicts, compare two save slots side by side. Everything local, nothing written back.
5. **It works on a phone.** Bottom navigation, sheets, 44 px targets, 320 px safe, installable as a PWA and usable offline for saved data.
6. **It is readable and keyboard-complete.** Atkinson Hyperlegible with real letterform clarity, tabular numbers, AA contrast, no colour-only meaning, visible focus, reduced motion honoured.
7. **It does not lie about the data.** No fake "updated" badges, no silent truncation; if the calendar cannot plot 12 433 sessions it says so and offers iCal instead, and the disclaimer about the project being inofficial is always one click away.

