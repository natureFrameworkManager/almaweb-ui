// ==========================================================================
// mockup/ts/view-table.ts — Tabelle (Section 9.2)
// ==========================================================================

import { store } from "./store";
import type { EntityType } from "./store";
import { getRows, getTableColumns, isNumericColumn } from "./entity-rows";
import { bulkBarMarkup } from "./view-common";

/** Sort state lives in the mockup, not in the store (visual only). */
let sortColumn = -1;
let sortAscending = true;
let visibleColumns: Record<string, boolean> = {};

function isColumnVisible(entity: EntityType, columnIndex: number): boolean {
    const key = `${entity}:${columnIndex}`;
    return visibleColumns[key] ?? true;
}

export function renderTableView(container: HTMLElement, entity: EntityType): void {
    const { selectedItems, savedItems, selectedDetailId } = store.getState();
    const columns = getTableColumns(entity);
    const rows = getRows(entity).slice();

    if (sortColumn >= 0) {
        rows.sort((a, b) => {
            const left = a.cells[sortColumn] ?? "";
            const right = b.cells[sortColumn] ?? "";
            const numeric = isNumericColumn(entity, sortColumn);
            const result = numeric ? Number(left) - Number(right) : left.localeCompare(right, "de");
            return sortAscending ? result : -result;
        });
    }

    let html = bulkBarMarkup(selectedItems.size);
    html += `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="col-select" scope="col"><span class="sr-only">Auswahl</span></th>
                        <th class="col-star" scope="col"><span class="sr-only">Meine Liste</span></th>`;

    columns.forEach((column, index) => {
        if (!isColumnVisible(entity, index)) return;
        const ariaSort =
            sortColumn === index ? (sortAscending ? "ascending" : "descending") : "none";
        const numericClass = isNumericColumn(entity, index) ? " col-num" : "";
        const marker = sortColumn === index ? (sortAscending ? "▲" : "▼") : "↕";
        html += `
                        <th class="${numericClass.trim()}" scope="col" data-sort="${index}" aria-sort="${ariaSort}">
                            ${column} <span class="sort-marker">${marker}</span>
                        </th>`;
    });

    html += `
                    </tr>
                </thead>
                <tbody>`;

    for (const row of rows) {
        const isSaved = savedItems.has(row.id);
        const isOpen = selectedDetailId === row.id;
        const isChecked = selectedItems.has(row.id);

        html += `
                <tr class="${isOpen ? "is-selected" : ""}" data-id="${row.id}">
                    <td>
                        <input type="checkbox" class="row-checkbox" data-id="${row.id}" ${isChecked ? "checked" : ""} aria-label="Auswählen">
                    </td>
                    <td>
                        <button class="btn-star${isSaved ? " is-on" : ""}" data-star="${row.id}" title="In Meine Liste" aria-pressed="${isSaved}">
                            ${isSaved ? "★" : "☆"}
                        </button>
                    </td>`;

        columns.forEach((_column, index) => {
            if (!isColumnVisible(entity, index)) return;
            const value = row.cells[index] ?? "";
            const classes = `${isNumericColumn(entity, index) ? "col-num" : ""}${index === 0 ? " col-mono" : ""}`.trim();
            html += `<td class="${classes}">${value}</td>`;
        });

        html += `
                </tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>`;

    container.innerHTML = html;

    // Row selection / detail
    container.querySelectorAll<HTMLElement>(".data-table tbody tr").forEach((rowEl) => {
        const id = rowEl.getAttribute("data-id");
        if (!id) return;
        rowEl.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.classList.contains("row-checkbox") || target.closest("[data-star]")) return;
            store.setDetail(id, entity);
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
            if (id) store.toggleSave(id);
        });
    });

    // Sortable headers with aria-sort
    container.querySelectorAll<HTMLElement>("[data-sort]").forEach((th) => {
        th.addEventListener("click", () => {
            const index = Number(th.getAttribute("data-sort"));
            if (sortColumn === index) {
                sortAscending = !sortAscending;
            } else {
                sortColumn = index;
                sortAscending = true;
            }
            renderTableView(container, entity);
        });
    });

    container.querySelector("#btn-bulk-clear")?.addEventListener("click", () => store.clearSelection());
}

/** Column configuration popover (visual only in the mockup). */
export function resetTableConfig(): void {
    sortColumn = -1;
    sortAscending = true;
    visibleColumns = {};
}