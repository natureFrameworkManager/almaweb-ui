// ==========================================================================
// mockup/ts/ui-views.ts — View dispatcher (Section 9)
// ==========================================================================

import { store } from "./store";
import type { EntityType, LayoutMode } from "./store";
import { ENTITY_META, getRows } from "./entity-rows";
import { renderCardsView, renderListView } from "./view-list";
import { renderTableView } from "./view-table";
import { renderCalendarView } from "./view-calendar";
import { renderExplorerView } from "./view-explorer";
import { renderCompareView } from "./view-compare";

function paneOf(container: HTMLElement | null): HTMLElement | null {
    return container ? (container.closest(".pane") as HTMLElement | null) : null;
}

/** Renders Pane A and (when split) Pane B for the current entity + layout. */
export function renderActiveViews(containerA: HTMLElement, containerB: HTMLElement | null): void {
    const { activeLayout, activeEntity, splitMode } = store.getState();

    // Compare always owns the whole workspace (Section 7.2)
    if (splitMode === "compare" || activeLayout === "compare") {
        renderCompareView(containerA);
        const paneB = paneOf(containerB);
        if (paneB) paneB.style.display = "none";
        updatePaneHeader(containerA, "compare", "module", 2);
        return;
    }

    const rows = getRows(activeEntity);
    renderLayout(containerA, activeLayout, activeEntity);
    updatePaneHeader(containerA, activeLayout, activeEntity, rows.length);
    const paneB = paneOf(containerB);

    if (splitMode === "split" && containerB && paneB) {
        paneB.style.display = "flex";
        // Pane B carries the schedule; if the primary pane already shows the
        // calendar, pane B falls back to the row list so the two panes differ.
        const secondaryLayout: LayoutMode = activeLayout === "calendar" ? "list" : "calendar";
        const secondaryEntity: EntityType = activeLayout === "calendar" ? activeEntity : "event";
        renderLayout(containerB, secondaryLayout, secondaryEntity);
        updatePaneHeader(containerB, secondaryLayout, secondaryEntity, getRows(secondaryEntity).length);
    } else if (paneB) {
        paneB.style.display = "none";
    }
}

function renderLayout(container: HTMLElement, layout: LayoutMode, entity: EntityType): void {
    switch (layout) {
        case "cards":
            renderCardsView(container, entity);
            break;
        case "table":
            renderTableView(container, entity);
            break;
        case "calendar":
            renderCalendarView(container, entity);
            break;
        case "explorer":
            renderExplorerView(container, entity);
            break;
        default:
            renderListView(container, entity);
    }
}

/** Keeps the pane toolbar in sync with what the pane actually shows. */
function updatePaneHeader(container: HTMLElement, layout: LayoutMode, entity: EntityType, count: number): void {
    const pane = paneOf(container);
    if (!pane) return;

    const titleEl = pane.querySelector<HTMLElement>(".pane-title-text");
    const dotEl = pane.querySelector<HTMLElement>(".pane-dot");
    const metaEl = pane.querySelector<HTMLElement>(".pane-meta");
    const meta = ENTITY_META[entity];

    const layoutLabels: Record<LayoutMode, string> = {
        list: "Liste",
        cards: "Kacheln",
        table: "Tabelle",
        calendar: "Kalender",
        explorer: "Explorer",
        compare: "Vergleich",
    };

    if (titleEl) titleEl.textContent = `${meta.label} · ${layoutLabels[layout]}`;
    if (dotEl) dotEl.style.background = `var(--color-type-${meta.tone})`;
    if (metaEl) {
        metaEl.textContent = layout === "compare" ? "2 Slots" : `${count} Einträge`;
    }
}