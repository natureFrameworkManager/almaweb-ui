// ==========================================================================
// mockup/ts/view-common.ts — Shared row markup + interaction binding
// ==========================================================================

import { store } from "./store";
import type { EntityType } from "./store";
import { showToast } from "./ui-toast";
import type { EntityRow } from "./entity-rows";

/** ≤ 3 meta cells (Section 3.1 "signpost" row anatomy). */
export function rowMetaMarkup(row: EntityRow): string {
    return row.meta
        .map((cell) => {
            const kindClass =
                cell.kind === "time" ? " is-time" : cell.kind === "date" ? " is-date" : cell.kind === "strong" ? " is-strong" : "";
            return `<span class="row-meta-cell${kindClass}">${cell.text}</span>`;
        })
        .join("");
}

export function rowFlagsMarkup(row: EntityRow): string {
    return row.flags
        .map((flag) => `<span class="row-flag is-${flag.tone}">${flag.text}</span>`)
        .join("");
}

export function rowChipsMarkup(row: EntityRow, limit = 4): string {
    return row.chips
        .slice(0, limit)
        .map((chip) => `<span class="chip chip-${chip.tone}">${chip.label}</span>`)
        .join("");
}

/** A row: entity bar → title → mono number → meta cells → flags → actions. */
export function rowMarkup(row: EntityRow, isSelected: boolean, isSaved: boolean, isOpen: boolean): string {
    return `
        <div class="list-row${isOpen ? " is-selected" : ""}" data-id="${row.id}" data-entity="${row.tone}" tabindex="0">
            <input type="checkbox" class="row-checkbox" data-id="${row.id}" ${isSelected ? "checked" : ""} aria-label="Auswählen">
            <span class="list-row-indicator type-bar-${row.tone}"></span>
            <div class="list-row-content">
                <div class="list-row-title-line">
                    <span class="list-row-title">${row.title}</span>
                    <span class="list-row-code mono">${row.code}</span>
                    ${rowFlagsMarkup(row)}
                </div>
                <div class="list-row-meta">${rowMetaMarkup(row)}</div>
            </div>
            <div class="list-row-actions">
                <button class="btn-star${isSaved ? " is-on" : ""}" data-star="${row.id}" title="In Meine Liste" aria-pressed="${isSaved}">
                    ${isSaved ? "★" : "☆"}
                </button>
                <button class="btn btn-sm btn-secondary" data-open="${row.id}">Details</button>
            </div>
        </div>`;
}

/** Click / keyboard / star / checkbox wiring shared by Liste and Explorer. */
export function bindRowInteractions(container: HTMLElement, entity: EntityType): void {
    container.querySelectorAll<HTMLElement>(".list-row").forEach((rowEl) => {
        const id = rowEl.getAttribute("data-id");
        if (!id) return;
        const tone = (rowEl.getAttribute("data-entity") ?? entity) as EntityType;

        rowEl.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains("row-checkbox") || target.closest("[data-star]")) return;
            store.setDetail(id, tone);
        });

        rowEl.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                store.setDetail(id, tone);
            } else if (event.key === " ") {
                event.preventDefault();
                store.toggleSelect(id);
            } else if (event.key.toLowerCase() === "m") {
                event.preventDefault();
                toggleSaved(id);
            }
        });
    });

    container.querySelectorAll<HTMLInputElement>(".row-checkbox").forEach((box) => {
        box.addEventListener("click", (event) => event.stopPropagation());
        box.addEventListener("change", () => {
            const id = box.getAttribute("data-id");
            if (id) store.toggleSelect(id);
        });
    });

    container.querySelectorAll<HTMLElement>("[data-star]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.stopPropagation();
            const id = btn.getAttribute("data-star");
            if (id) toggleSaved(id);
        });
    });

    container.querySelectorAll<HTMLElement>("[data-open]").forEach((btn) => {
        btn.addEventListener("click", (event) => {
            event.stopPropagation();
            const id = btn.getAttribute("data-open");
            if (id) store.setDetail(id, entity);
        });
    });

    container.querySelector("#btn-bulk-clear")?.addEventListener("click", () => store.clearSelection());
    container.querySelector("#btn-bulk-save")?.addEventListener("click", () => {
        for (const id of store.getState().selectedItems) store.toggleSave(id);
        store.clearSelection();
        showToast("Auswahl zu Meine Liste hinzugefügt");
    });
    container.querySelector("#btn-bulk-export")?.addEventListener("click", () => {
        showToast("Export der Auswahl vorbereitet");
    });
}

function toggleSaved(id: string): void {
    const wasSaved = store.getState().savedItems.has(id);
    store.toggleSave(id);
    showToast(wasSaved ? "Aus Meine Liste entfernt" : "Zu Meine Liste hinzugefügt ★");
}

/** Bulk bar shown whenever a selection exists (Section 9.1). */
export function bulkBarMarkup(count: number): string {
    if (count === 0) return "";
    return `
        <div class="bulk-bar">
            <span class="bulk-bar-count">${count} ausgewählt</span>
            <div class="bulk-bar-actions">
                <button class="btn btn-sm btn-accent" id="btn-bulk-save">Zu Meine Liste</button>
                <button class="btn btn-sm btn-secondary" id="btn-bulk-export">Exportieren</button>
                <button class="btn btn-sm btn-ghost" id="btn-bulk-clear">Aufheben</button>
            </div>
        </div>`;
}