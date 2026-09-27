// ==========================================================================
// mockup/ts/main.ts — alma.web Interactive Blueprint entry point
// ==========================================================================

import { store } from "./store";
import { initCommandPalette } from "./ui-palette";
import { renderDetailDrawer } from "./ui-detail";
import { renderActiveViews } from "./ui-views";
import { bindUserInteractions } from "./ui-bindings";
import { ENTITY_META, getRowCountLabel, getRows } from "./entity-rows";

function renderShell(): void {
    const state = store.getState();
    const paneA = document.getElementById("pane-a-content");
    const paneB = document.getElementById("pane-b-content");
    const drawer = document.getElementById("detail-drawer");

    if (!paneA || !drawer) return;

    // Theme & density live on the root element
    document.documentElement.setAttribute("data-theme", state.theme);
    document.documentElement.setAttribute("data-density", state.density);

    // Panes and detail panel
    renderActiveViews(paneA, paneB);
    renderDetailDrawer(drawer);

    // Toolbar + tab reflection
    document.querySelectorAll(".entity-tab").forEach((tab) => {
        tab.classList.toggle("active", tab.getAttribute("data-entity") === state.activeEntity);
        tab.setAttribute("aria-selected", String(tab.getAttribute("data-entity") === state.activeEntity));
    });
    document.querySelectorAll(".segmented-item[data-layout]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-layout") === state.activeLayout);
    });
    document.querySelectorAll(".segmented-item[data-split]").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-split") === state.splitMode);
    });

    // Overlays
    document.getElementById("command-palette-backdrop")?.classList.toggle("active", state.paletteOpen);
    document.getElementById("export-modal")?.classList.toggle("active", state.exportModalOpen);
    document.getElementById("about-modal")?.classList.toggle("active", state.aboutModalOpen);

    if (state.paletteOpen) {
        setTimeout(() => {
            (document.getElementById("palette-input") as HTMLInputElement | null)?.focus();
        }, 60);
    }

    // StatusBar counters (Section 7.1)
    const savedEl = document.getElementById("stat-saved-count");
    if (savedEl) savedEl.textContent = `${state.savedItems.size} gemerkt`;

    const selectionEl = document.getElementById("stat-selection-count");
    if (selectionEl) {
        selectionEl.textContent =
            state.selectedItems.size > 0 ? `${state.selectedItems.size} ausgewählt` : "0 ausgewählt";
    }

    const entityEl = document.getElementById("status-entity");
    if (entityEl) {
        const rows = getRows(state.activeEntity);
        entityEl.textContent = getRowCountLabel(state.activeEntity, rows.length);
    }

    // Entity tabs: counts reflect the real dataset per entity
    document.querySelectorAll<HTMLElement>(".entity-tab").forEach((tab) => {
        const entity = tab.getAttribute("data-entity") as keyof typeof ENTITY_META | null;
        const countEl = tab.querySelector<HTMLElement>(".tab-count");
        if (entity && countEl) countEl.textContent = String(getRows(entity).length);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initCommandPalette();

    store.subscribe(renderShell);
    renderShell();

    bindUserInteractions({
        paletteBackdrop: document.getElementById("command-palette-backdrop"),
        exportModal: document.getElementById("export-modal"),
        aboutModal: document.getElementById("about-modal"),
    });
});