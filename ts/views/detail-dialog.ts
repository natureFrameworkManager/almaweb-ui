import { setPlaceholderVisible, showToast } from "../feedback";
import { isSaved, toggleSaved } from "../saved";
import type { EntryKind } from "../state";
import type { DetailKind } from "./entity-view";
import { formatDate, formatTimeRange } from "./formatters";

export type { DetailKind };

/** Fallback text shown for empty or unavailable values. */
export const EMPTY_VALUE = "-";

/** Definition of a single data table column. */
export type Column<T> = {
    label: string;
    value: (row: T) => string;
    title?: (row: T) => string;
    sortValue?: (row: T) => string | number;
};

/** A tab shown inside the detail dialog. */
export type DetailTab = {
    /** Tab name matching one of the `data-tab` values handled by the dialog styles. */
    id: string;
    label: string;
    /** Row count rendered as a badge; omitted when the tab has no badge. */
    count?: number;
    children: Node[];
};

/** Description of how a single entity kind is fetched and rendered. */
export type DetailSpec<T> = {
    kind: DetailKind;
    /** Title shown in the dialog header. */
    heading: string;
    fetch: (id: string) => Promise<T>;
    name: (detail: T) => string;
    number: (detail: T) => string | null;
    /** Entry kind used to save the entity; omitted for entities that cannot be saved. */
    saveKind?: EntryKind;
    tabs: (detail: T) => DetailTab[];
};

/** Registered specs keyed by entity kind. */
const specs = new Map<DetailKind, DetailSpec<never>>();

/**
 * Register the detail spec of an entity kind.
 * @param spec - Spec describing how to fetch and render the kind.
 */
export function registerDetail<T>(spec: DetailSpec<T>): void {
    specs.set(spec.kind, spec as unknown as DetailSpec<never>);
}

/**
 * Convert a value into the text shown in a cell or definition.
 * @param value - Value to render.
 * @returns The trimmed text or the empty placeholder.
 */
export function displayText(value: unknown): string {
    if (value === null || value === undefined) {
        return EMPTY_VALUE;
    }
    const text = String(value).trim();
    return text.length > 0 ? text : EMPTY_VALUE;
}

/**
 * Format a start and end time into a range.
 * @param start - Start time.
 * @param end - End time.
 * @returns The formatted time range.
 */
export function formatTime(start: string | null, end: string | null): string {
    if (start && end) {
        return formatTimeRange(start, end);
    }
    return displayText(start ?? end);
}

/**
 * Format an ISO date for display.
 * @param date - ISO date value.
 * @returns The formatted date or the empty placeholder.
 */
export function formatDateValue(date: string | null): string {
    return date ? formatDate(date) : EMPTY_VALUE;
}

/**
 * Join the names of a staff list.
 * @param staff - Staff records.
 * @returns The comma separated names.
 */
export function staffNames(staff: { name: string }[]): string {
    return displayText(staff.map((member) => member.name).join(", "));
}

/**
 * Format a list size for a table cell.
 * @param count - Number of items.
 * @returns The item count or the empty placeholder.
 */
export function countLabel(count: number): string {
    return count > 0 ? String(count) : EMPTY_VALUE;
}

/**
 * Compare two sortable values.
 * @param a - First value.
 * @param b - Second value.
 * @returns The comparison result.
 */
function compareValues(a: string | number, b: string | number): number {
    if (typeof a === "number" && typeof b === "number") {
        return a - b;
    }
    return String(a).localeCompare(String(b), "de", { numeric: true });
}

/**
 * Create a single body row for the given columns.
 * @param columns - Column definitions.
 * @param item - Row item.
 * @returns The table row element.
 */
function createTableRow<T>(columns: Column<T>[], item: T): HTMLTableRowElement {
    const row = document.createElement("tr");
    columns.forEach((column) => {
        const cell = document.createElement("td");
        const value = column.value(item);
        cell.textContent = value;
        if (value === EMPTY_VALUE) {
            cell.classList.add("empty");
        }
        const title = column.title ? column.title(item) : "";
        if (title.length > 0) {
            cell.title = title;
        }
        row.appendChild(cell);
    });
    return row;
}

/**
 * Create the placeholder row shown for an empty table.
 * @param columnCount - Number of columns to span.
 * @returns The placeholder row.
 */
function createEmptyRow(columnCount: number): HTMLTableRowElement {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = columnCount;
    cell.className = "empty";
    cell.textContent = "Keine Daten";
    row.appendChild(cell);
    return row;
}

/**
 * Sort rows by a column.
 * @param rows - Row items.
 * @param column - Column to sort by.
 * @param ascending - Whether to sort ascending.
 * @returns The sorted rows.
 */
function sortRows<T>(rows: T[], column: Column<T>, ascending: boolean): T[] {
    const key = column.sortValue ?? column.value;
    return [...rows].sort((a, b) => {
        const result = compareValues(key(a), key(b));
        return ascending ? result : -result;
    });
}

/**
 * Create a sortable, scrollable data table. Columns without any value are hidden.
 * @param columns - Column definitions.
 * @param rows - Row items.
 * @param defaultSort - Label of the column sorted initially.
 * @returns The table wrapper.
 */
export function createTable<T>(
    columns: Column<T>[],
    rows: T[],
    defaultSort?: string,
): HTMLDivElement {
    const filledColumns = columns.filter(
        (column) => rows.length === 0 || rows.some((row) => column.value(row) !== EMPTY_VALUE),
    );
    const visibleColumns = filledColumns.length > 0 ? filledColumns : columns;
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("table");
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    const tableBody = document.createElement("tbody");
    let sortLabel = defaultSort ?? (visibleColumns[0] ? visibleColumns[0].label : "");
    let ascending = true;

    const renderBody = (): void => {
        tableBody.replaceChildren();
        const column = visibleColumns.find((entry) => entry.label === sortLabel);
        const data = column ? sortRows(rows, column, ascending) : rows;
        if (data.length === 0) {
            tableBody.appendChild(createEmptyRow(visibleColumns.length));
            return;
        }
        data.forEach((row) => tableBody.appendChild(createTableRow(visibleColumns, row)));
    };

    const updateHeaders = (): void => {
        headRow.querySelectorAll<HTMLTableCellElement>("th").forEach((header) => {
            const active = header.dataset["label"] === sortLabel;
            header.classList.toggle("sorted-asc", active && ascending);
            header.classList.toggle("sorted-desc", active && !ascending);
            const marker = header.querySelector(".sort-marker");
            if (marker) {
                marker.textContent = active ? (ascending ? "↑" : "↓") : "";
            }
        });
    };

    visibleColumns.forEach((column) => {
        const header = document.createElement("th");
        header.className = "sortable";
        header.dataset["label"] = column.label;
        const label = document.createElement("span");
        label.textContent = column.label;
        const marker = document.createElement("span");
        marker.className = "sort-marker";
        header.append(label, marker);
        header.addEventListener("click", () => {
            if (sortLabel === column.label) {
                ascending = !ascending;
            } else {
                sortLabel = column.label;
                ascending = true;
            }
            renderBody();
            updateHeaders();
        });
        headRow.appendChild(header);
    });

    head.appendChild(headRow);
    table.append(head, tableBody);
    wrap.appendChild(table);
    renderBody();
    updateHeaders();
    return wrap;
}

/**
 * Build a related table tab.
 * @param id - Tab name, matching a `data-tab` value of the dialog styles.
 * @param label - Tab label shown in the tab bar.
 * @param columns - Column definitions of the table.
 * @param rows - Rows of the table.
 * @param defaultSort - Label of the column sorted initially.
 * @returns The related table tab.
 */
export function createTableTab<T>(
    id: string,
    label: string,
    columns: Column<T>[],
    rows: T[],
    defaultSort?: string,
): DetailTab {
    return { id, label, count: rows.length, children: [createTable(columns, rows, defaultSort)] };
}

/**
 * Create a tab content container.
 * @param tab - Tab name.
 * @param children - Content nodes to append.
 * @returns The tab content element.
 */
function createTabContent(tab: string, children: Node[]): HTMLDivElement {
    const content = document.createElement("div");
    content.className = "tab-content";
    content.dataset["tab"] = tab;
    children.forEach((child) => content.appendChild(child));
    return content;
}

/**
 * Create a titled dialog section.
 * @param title - Section title.
 * @param children - Section content nodes.
 * @returns The section element.
 */
export function createSection(title: string, children: Node[]): HTMLElement {
    const section = document.createElement("section");
    section.className = "dialog-section";
    const heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = title;
    section.appendChild(heading);
    children.forEach((child) => section.appendChild(child));
    return section;
}

/**
 * Create a single attribute card.
 * @param label - Attribute label.
 * @param value - Attribute value.
 * @returns The attribute card.
 */
function createAttrCard(label: string, value: string): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "attr";
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    if (value === EMPTY_VALUE) {
        description.classList.add("empty");
    }
    card.append(term, description);
    return card;
}

/**
 * Create the card grid for the short attributes.
 * @param entries - Attribute entries.
 * @returns The attribute grid.
 */
export function createAttrGrid(entries: { label: string; value: string }[]): HTMLDListElement {
    const grid = document.createElement("dl");
    grid.className = "attr-grid";
    entries.forEach((entry) => grid.appendChild(createAttrCard(entry.label, entry.value)));
    return grid;
}

/**
 * Create the row based table for the long attributes.
 * @param entries - Attribute entries.
 * @returns The attribute table wrapper.
 */
export function createAttrTable(entries: { label: string; value: string }[]): HTMLDivElement {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("dl");
    table.className = "attr-table";
    entries.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "attr-row";
        const term = document.createElement("dt");
        term.textContent = entry.label;
        const description = document.createElement("dd");
        description.textContent = entry.value;
        if (entry.value === EMPTY_VALUE) {
            description.classList.add("empty");
        }
        row.append(term, description);
        table.appendChild(row);
    });
    wrap.appendChild(table);
    return wrap;
}

/**
 * Build a details tab from several sections.
 * @param sections - Sections of the details tab.
 * @returns The details tab.
 */
export function createSectionsTab(sections: HTMLElement[]): DetailTab {
    return { id: "details", label: "Details", children: sections };
}

/**
 * Build the content (icon plus label) of the save toggle button.
 * @param icon - Material symbol name.
 * @param label - Button label.
 * @returns The button content.
 */
function createSaveButtonContent(icon: string, label: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const iconElement = document.createElement("span");
    iconElement.className = "material-symbols";
    iconElement.textContent = icon;
    fragment.append(iconElement, document.createTextNode(label));
    return fragment;
}

/** Dialog body element that receives the rendered tab contents. */
let dialogBody: HTMLElement | null = null;

/** Dialog tab bar element. */
let dialogTabs: HTMLElement | null = null;

/** Dialog element that shows the entity name. */
let dialogName: HTMLElement | null = null;

/** Dialog element that shows the entity number. */
let dialogNumber: HTMLElement | null = null;

/** Dialog header title element. */
let dialogTitle: HTMLElement | null = null;

/** Save toggle button in the dialog footer. */
let dialogSaveButton: HTMLButtonElement | null = null;

/** Save key of the entity currently shown in the dialog. */
let currentKey: string | null = null;

/** The detail dialog element. */
let detailDialog: HTMLElement | null = null;

/** Last requested record, used to retry after a failed load. */
let lastRequest: { kind: string; id: string } | null = null;

/**
 * Activate a single tab in the dialog tab bar.
 * @param tab - Tab name to activate.
 */
function selectTab(tab: string): void {
    dialogTabs?.querySelectorAll<HTMLElement>("span[data-tab]").forEach((span) => {
        span.classList.toggle("active", span.dataset["tab"] === tab);
    });
}

/**
 * Render the tab bar and the tab contents of a detail record.
 * @param tabs - Tabs to render.
 */
function renderTabs(tabs: DetailTab[]): void {
    const body = dialogBody;
    const bar = dialogTabs;
    if (!body || !bar) {
        return;
    }
    const barContent = document.createDocumentFragment();
    tabs.forEach((tab, index) => {
        const span = document.createElement("span");
        span.dataset["tab"] = tab.id;
        span.classList.toggle("active", index === 0);
        span.append(document.createTextNode(tab.label));
        if (tab.count !== undefined) {
            const badge = document.createElement("span");
            badge.className = "count-badge";
            badge.textContent = String(tab.count);
            span.append(badge);
        }
        barContent.appendChild(span);
    });
    bar.replaceChildren(barContent);

    body.querySelectorAll(".tab-content").forEach((content) => content.remove());
    tabs.forEach((tab) => body.appendChild(createTabContent(tab.id, tab.children)));
}

/**
 * Update the footer save toggle to reflect the current entity and its saved state.
 */
function updateSaveButton(): void {
    const button = dialogSaveButton;
    if (!button) {
        return;
    }
    if (currentKey === null) {
        button.hidden = true;
        return;
    }
    button.hidden = false;
    const saved = isSaved(currentKey);
    button.classList.toggle("saved", saved);
    button.setAttribute("aria-pressed", String(saved));
    button.replaceChildren(
        createSaveButtonContent(
            saved ? "bookmark" : "bookmark_add",
            saved ? "Im Slot gespeichert" : "In Slot speichern",
        ),
    );
}

/**
 * Render a detail record into the dialog.
 * @param spec - Spec of the entity kind.
 * @param detail - Detail record to render.
 * @param id - Entity id used for the save key.
 */
function renderDetail<T>(spec: DetailSpec<T>, detail: T, id: string): void {
    if (!dialogBody || !dialogName || !dialogNumber || !dialogTitle) {
        return;
    }
    dialogTitle.textContent = spec.heading;
    dialogName.textContent = spec.name(detail);
    dialogNumber.textContent = spec.number(detail) ?? "";
    renderTabs(spec.tabs(detail));
    currentKey = spec.saveKind ? `${spec.saveKind}:${id}` : null;
    updateSaveButton();
}

/** Remove the previously rendered record so a new one does not flash stale data. */
function clearDetailContent(): void {
    dialogBody?.querySelectorAll(".tab-content").forEach((content) => content.remove());
    dialogTabs?.replaceChildren();
    if (dialogName) {
        dialogName.textContent = "";
    }
    if (dialogNumber) {
        dialogNumber.textContent = "";
    }
    currentKey = null;
    updateSaveButton();
}

/**
 * Fetch and show the detail dialog of an entity.
 * @param kind - Entity kind to display.
 * @param id - Entity id.
 */
export async function openDetail(kind: string, id: string): Promise<void> {
    const spec = specs.get(kind as DetailKind);
    if (!spec) {
        console.error(`No detail dialog registered for kind "${kind}".`);
        return;
    }
    lastRequest = { kind, id };
    if (dialogTitle) {
        dialogTitle.textContent = spec.heading;
    }
    clearDetailContent();
    setPlaceholderVisible("detail-error", false);
    setPlaceholderVisible("detail-loading", true);
    detailDialog?.setAttribute("aria-busy", "true");
    try {
        const detail = await spec.fetch(id);
        renderDetail(spec, detail, id);
    } catch (error) {
        console.error(`Failed to fetch ${kind} detail:`, error);
        setPlaceholderVisible("detail-error", true);
    } finally {
        setPlaceholderVisible("detail-loading", false);
        detailDialog?.removeAttribute("aria-busy");
    }
}

/** Wire the detail dialog tabs, the save toggle and the details buttons. */
export function initDetailDialog(): void {
    detailDialog = document.getElementById("detail-dialog");
    dialogBody = document.querySelector<HTMLElement>("#detail-body");
    dialogTabs = document.querySelector<HTMLElement>("#detail-tabs");
    dialogName = document.querySelector<HTMLElement>("#detail-name");
    dialogNumber = document.querySelector<HTMLElement>("#detail-number");
    dialogTitle = document.querySelector<HTMLElement>("#detail-title");
    dialogSaveButton = document.querySelector<HTMLButtonElement>("#detail-save-toggle");

    document.getElementById("detail-retry")?.addEventListener("click", () => {
        if (lastRequest) {
            void openDetail(lastRequest.kind, lastRequest.id);
        }
    });

    dialogTabs?.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const tabName = target.closest<HTMLElement>("span[data-tab]")?.dataset["tab"];
        if (tabName) {
            selectTab(tabName);
        }
    });

    dialogSaveButton?.addEventListener("click", () => {
        if (currentKey === null) {
            return;
        }
        const result = toggleSaved(currentKey);
        if (result === "unavailable") {
            showToast("Kein Speicher-Slot aktiv – bitte zuerst einen Slot anlegen.", "error");
        } else {
            showToast(
                result === "saved" ? "Im Slot gespeichert." : "Aus dem Slot entfernt.",
                result === "saved" ? "success" : "info",
            );
        }
        updateSaveButton();
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const button = target.closest<HTMLElement>("[data-details-id]");
        const detailsId = button?.dataset["detailsId"];
        const detailsKind = button?.dataset["detailsKind"];
        if (detailsId && detailsKind) {
            void openDetail(detailsKind, detailsId);
        }
    });
}
