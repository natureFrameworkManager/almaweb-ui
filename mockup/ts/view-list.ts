// ==========================================================================
// mockup/ts/view-list.ts — Ergebnisliste (Section 9.1) and Kacheln (9.3)
// ==========================================================================

import { store } from "./store";
import type { EntityType } from "./store";
import { getRows } from "./entity-rows";
import { bindRowInteractions, bulkBarMarkup, rowMarkup, rowChipsMarkup } from "./view-common";

const GROUP_LABEL: Record<EntityType, string> = {
    module: "WiSe 2025/26 · Fakultät für Mathematik und Informatik",
    course: "WiSe 2025/26 · Alle Kurse",
    event: "KW 42 · 12.–16. Oktober 2026",
    exam: "Prüfungszeitraum · Februar/März 2027",
    staff: "Lehrende der Universität Leipzig",
    location: "Standorte Augustusplatz / Seminargebäude",
};

/** Liste: sticky group header + virtualised-style rows. */
export function renderListView(container: HTMLElement, entity: EntityType): void {
    const { selectedItems, savedItems, selectedDetailId } = store.getState();
    const rows = getRows(entity);

    let html = bulkBarMarkup(selectedItems.size);
    html += `
        <div class="group-header">
            <span>${GROUP_LABEL[entity]}</span>
            <span class="group-header-count">${rows.length}</span>
        </div>`;

    for (const row of rows) {
        html += rowMarkup(
            row,
            selectedItems.has(row.id),
            savedItems.has(row.id),
            selectedDetailId === row.id,
        );
    }

    container.innerHTML = html;
    bindRowInteractions(container, entity);
}

/** Kacheln: entity stripe, 2-line title, ≤ 4 chips, footer action. */
export function renderCardsView(container: HTMLElement, entity: EntityType): void {
    const { savedItems, selectedDetailId } = store.getState();
    const rows = getRows(entity);

    let html = `<div class="card-grid">`;

    for (const row of rows) {
        const isSaved = savedItems.has(row.id);
        const isOpen = selectedDetailId === row.id;
        html += `
            <div class="card${isOpen ? " is-selected" : ""}" data-id="${row.id}" data-entity="${row.tone}" tabindex="0">
                <span class="card-stripe type-bar-${row.tone}"></span>
                <span class="card-glyph">${entityGlyph(row.tone)}</span>
                <div class="card-header">
                    <div>
                        <div class="card-title">${row.title}</div>
                        <div class="card-code mono">${row.code}</div>
                    </div>
                </div>
                <div class="card-meta">${row.meta.map((m) => m.text).join(" · ")}</div>
                <div class="card-chips">${rowChipsMarkup(row)}</div>
                <div class="card-footer">
                    <span class="card-foot-text">${row.cardFooter}</span>
                    <button class="btn-star${isSaved ? " is-on" : ""}" data-star="${row.id}" title="In Meine Liste" aria-pressed="${isSaved}">
                        ${isSaved ? "★" : "☆"}
                    </button>
                </div>
            </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    bindRowInteractions(container, entity);

    container.querySelectorAll<HTMLElement>(".card").forEach((card) => {
        card.addEventListener("click", (event) => {
            if ((event.target as HTMLElement).closest("[data-star]")) return;
            const id = card.getAttribute("data-id");
            if (id) store.setDetail(id, entity);
        });
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                const id = card.getAttribute("data-id");
                if (id) store.setDetail(id, entity);
            }
        });
    });
}

export function entityGlyph(tone: string): string {
    const glyphs: Record<string, string> = {
        module: "◧",
        course: "◷",
        event: "▦",
        exam: "◈",
        staff: "◉",
        location: "◫",
    };
    return glyphs[tone] ?? "◧";
}