import { getModuleDetail } from "../api/api";
import type {
    Building,
    CourseDetail,
    Degree,
    Event,
    Exam,
    Location,
    ModuleDetail,
    Semester,
    Staff,
} from "../api/types";
import { formatDate, formatTimeRange as formatTimeSpan } from "./formatters";
import { isSaved, toggleSaved } from "../saved";
import { normalizePath } from "../tree";

/** Fallback text shown for empty or unavailable values. */
const EMPTY_VALUE = "-";

/** Definition of a single data table column. */
type Column<T> = {
    label: string;
    value: (row: T) => string;
    title?: (row: T) => string;
    sortValue?: (row: T) => string | number;
};

/** A staff member together with the entities they are linked to. */
type StaffUsage = {
    staff: Staff;
    courses: Map<number, string>;
    events: Map<number, string>;
    exams: Map<number, string>;
};

/** A location together with the names of the courses that use it. */
type LocationUsage = {
    location: Location;
    courses: string[];
};

/** An event together with the course it belongs to. */
type EventWithCourse = {
    event: Event;
    course: CourseDetail;
};

/**
 * Convert a value into the text shown in a cell or definition.
 * @param value - Value to render.
 * @returns The trimmed text or the empty placeholder.
 */
function displayText(value: unknown): string {
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
function formatTime(start: string | null, end: string | null): string {
    if (start && end) {
        return formatTimeSpan(start, end);
    }
    return displayText(start ?? end);
}

/**
 * Format an ISO date for display.
 * @param date - ISO date value.
 * @returns The formatted date or the empty placeholder.
 */
function formatDateValue(date: string | null): string {
    return date ? formatDate(date) : EMPTY_VALUE;
}

/**
 * Join the names of a staff list.
 * @param staff - Staff records.
 * @returns The comma separated names.
 */
function staffNames(staff: Staff[]): string {
    return displayText(staff.map((member) => member.name).join(", "));
}

/**
 * Build the display text for the module path.
 * @param detail - Module detail record.
 * @returns The formatted module path.
 */
function formatModulePath(detail: ModuleDetail): string {
    const faculty = detail.faculty ? detail.faculty.name : "";
    return normalizePath(detail.path, faculty)
        .map((segments) => segments.join(" > "))
        .join(" / ");
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
function createTable<T>(columns: Column<T>[], rows: T[], defaultSort?: string): HTMLDivElement {
    const visibleColumns = columns.filter(
        (column) => rows.length === 0 || rows.some((row) => column.value(row) !== EMPTY_VALUE),
    );
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
function createSection(title: string, children: Node[]): HTMLElement {
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
function createAttrGrid(entries: { label: string; value: string }[]): HTMLDListElement {
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
function createAttrTable(entries: { label: string; value: string }[]): HTMLDivElement {
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
 * Flatten the events of every course, keeping the parent course.
 * @param detail - Module detail record.
 * @returns The events with their course.
 */
function collectEvents(detail: ModuleDetail): EventWithCourse[] {
    return detail.courses.flatMap((course) => course.events.map((event) => ({ event, course })));
}

/**
 * Collect the unique locations used by the events and exams.
 * @param events - Events with their course.
 * @param exams - Module exams.
 * @returns The unique locations with their courses.
 */
function collectLocations(events: EventWithCourse[], exams: Exam[]): LocationUsage[] {
    const usages = new Map<number, LocationUsage>();
    const add = (location: Location | undefined, courseName: string): void => {
        if (!location) {
            return;
        }
        const usage = usages.get(location.id) ?? { location, courses: [] };
        if (courseName.length > 0 && !usage.courses.includes(courseName)) {
            usage.courses.push(courseName);
        }
        usages.set(location.id, usage);
    };
    events.forEach(({ event, course }) => add(event.location, course.name));
    exams.forEach((exam) => add(exam.location, ""));
    return [...usages.values()];
}

/**
 * Collect the unique buildings used by the events and exams.
 * @param events - Events with their course.
 * @param exams - Module exams.
 * @returns The unique buildings.
 */
function collectBuildings(events: EventWithCourse[], exams: Exam[]): Building[] {
    const buildings = new Map<number, Building>();
    const add = (location: Location | undefined): void => {
        const building = location ? location.building : undefined;
        const hasLabel = building
            ? (building.name || building.short_name || building.address).length > 0
            : false;
        if (building && hasLabel) {
            buildings.set(building.id, building);
        }
    };
    events.forEach(({ event }) => add(event.location));
    exams.forEach((exam) => add(exam.location));
    return [...buildings.values()];
}

/**
 * Collect the staff linked to the module's courses, events and exams.
 * @param detail - Module detail record.
 * @param events - Events with their course.
 * @returns The staff with their linked entity names.
 */
function collectStaff(detail: ModuleDetail, events: EventWithCourse[]): StaffUsage[] {
    const usages = new Map<number, StaffUsage>();
    const add = (
        staff: Staff,
        group: "courses" | "events" | "exams",
        id: number,
        label: string,
    ): void => {
        const usage =
            usages.get(staff.id) ??
            ({ staff, courses: new Map(), events: new Map(), exams: new Map() } as StaffUsage);
        usage[group].set(id, label);
        usages.set(staff.id, usage);
    };
    detail.courses.forEach((course) => {
        (course.staff ?? []).forEach((staff) => add(staff, "courses", course.id, course.name));
    });
    events.forEach(({ event, course }) => {
        (event.staff ?? []).forEach((staff) =>
            add(staff, "events", event.id, event.name || course.name),
        );
    });
    detail.exams.forEach((exam) => {
        (exam.staff ?? []).forEach((staff) => add(staff, "exams", exam.id, exam.name));
    });
    return [...usages.values()];
}

/**
 * Format a list size for a table cell.
 * @param count - Number of items.
 * @returns The item count or the empty placeholder.
 */
function countLabel(count: number): string {
    return count > 0 ? String(count) : EMPTY_VALUE;
}

/** Columns of the linked courses table. */
const courseColumns: Column<CourseDetail>[] = [
    { label: "Nummer", value: (course) => displayText(course.number) },
    { label: "Name", value: (course) => displayText(course.name) },
    { label: "Typ", value: (course) => displayText(course.type ? course.type.name : "") },
    { label: "Tag", value: (course) => displayText(course.weekday) },
    {
        label: "SWS",
        value: (course) => displayText(course.weekly_hours),
        sortValue: (course) => course.weekly_hours,
    },
    { label: "Sprache", value: (course) => displayText(course.language) },
    { label: "Dozenten", value: (course) => staffNames(course.staff ?? []) },
];

/** Columns of the linked exams table. */
const examColumns: Column<Exam>[] = [
    { label: "Name", value: (exam) => displayText(exam.name) },
    {
        label: "Datum",
        value: (exam) => formatDateValue(exam.exam_date),
        sortValue: (exam) => exam.exam_date ?? "",
    },
    { label: "Zeit", value: (exam) => formatTime(exam.start_time, exam.end_time) },
    { label: "Pflicht", value: (exam) => (exam.required ? "Ja" : "Nein") },
    { label: "Dozenten", value: (exam) => staffNames(exam.staff ?? []) },
];

/** Columns of the linked events table. */
const eventColumns: Column<EventWithCourse>[] = [
    {
        label: "Datum",
        value: ({ event }) => formatDateValue(event.event_date),
        sortValue: ({ event }) => event.event_date ?? "",
    },
    { label: "Zeit", value: ({ event }) => formatTime(event.start_time, event.end_time) },
    { label: "Typ", value: ({ course }) => displayText(course.type ? course.type.name : "") },
    { label: "Kurs", value: ({ course }) => displayText(course.name) },
    { label: "Ort", value: ({ event }) => displayText(event.location?.name) },
    { label: "Dozenten", value: ({ event }) => staffNames(event.staff ?? []) },
];

/** Columns of the linked staff table. */
const staffColumns: Column<StaffUsage>[] = [
    { label: "Name", value: ({ staff }) => displayText(staff.name) },
    {
        label: "Kurse",
        value: (usage) => countLabel(usage.courses.size),
        title: (usage) => [...usage.courses.values()].join(", "),
        sortValue: (usage) => usage.courses.size,
    },
    {
        label: "Veranstaltungen",
        value: (usage) => countLabel(usage.events.size),
        title: (usage) => [...usage.events.values()].join(", "),
        sortValue: (usage) => usage.events.size,
    },
    {
        label: "Prüfungen",
        value: (usage) => countLabel(usage.exams.size),
        title: (usage) => [...usage.exams.values()].join(", "),
        sortValue: (usage) => usage.exams.size,
    },
];

/** Columns of the linked locations table. */
const locationColumns: Column<LocationUsage>[] = [
    { label: "Name", value: ({ location }) => displayText(location.name) },
    { label: "Typ", value: ({ location }) => displayText(location.type) },
    {
        label: "Plätze",
        value: ({ location }) => displayText(location.seats),
        sortValue: ({ location }) => location.seats ?? 0,
    },
    {
        label: "Gebäude",
        value: ({ location }) =>
            displayText(location.building?.short_name || location.building?.name),
    },
    { label: "Barrierefrei", value: ({ location }) => displayText(location.accessibility) },
    { label: "Kurse", value: ({ courses }) => displayText(courses.join(", ")) },
];

/** Columns of the linked buildings table. */
const buildingColumns: Column<Building>[] = [
    { label: "Name", value: (building) => displayText(building.name) },
    { label: "Kurzname", value: (building) => displayText(building.short_name) },
    { label: "Adresse", value: (building) => displayText(building.address) },
];

/** Columns of the linked semesters table. */
const semesterColumns: Column<Semester>[] = [
    { label: "Name", value: (semester) => displayText(semester.name) },
    {
        label: "Jahr",
        value: (semester) => displayText(semester.year),
        sortValue: (semester) => semester.year,
    },
    { label: "Termin", value: (semester) => displayText(semester.term) },
];

/**
 * Create the columns of the linked degrees table.
 * @param detail - Module detail record.
 * @returns The degree table columns.
 */
function createDegreeColumns(detail: ModuleDetail): Column<Degree>[] {
    return [
        { label: "Name", value: (degree) => displayText(degree.name) },
        {
            label: "Fakultät",
            value: (degree) =>
                degree.faculty_id === detail.faculty_id
                    ? displayText(detail.faculty ? detail.faculty.name : "")
                    : `Fakultät ${degree.faculty_id}`,
        },
    ];
}

/**
 * Build the attribute rows for the module's prerequisites.
 * @param detail - Module detail record.
 * @returns The prerequisite attribute rows.
 */
function createPrerequisiteRows(detail: ModuleDetail): { label: string; value: string }[] {
    const entries = Object.entries(detail.prerequisites ?? {});
    if (entries.length === 0) {
        return [{ label: "Zulassungsvoraussetzungen", value: EMPTY_VALUE }];
    }
    return entries.map(([degree, requirement]) => ({
        label: degree,
        value: displayText(requirement),
    }));
}

/**
 * Render the details tab sections of a module.
 * @param detail - Module detail record.
 * @returns The details tab content.
 */
function createDetailsSections(detail: ModuleDetail): DocumentFragment {
    const fragment = document.createDocumentFragment();
    fragment.append(
        createSection("Angaben", [
            createAttrGrid([
                { label: "Modulnummer", value: displayText(detail.number) },
                {
                    label: "Leistungspunkte",
                    value: detail.credits ? `${detail.credits} LP` : EMPTY_VALUE,
                },
                {
                    label: "Dauer",
                    value: detail.duration_semesters
                        ? `${detail.duration_semesters} Semester`
                        : EMPTY_VALUE,
                },
                { label: "Häufigkeit", value: displayText(detail.frequency) },
                { label: "Sprache", value: displayText(detail.language) },
                {
                    label: "Fakultät",
                    value: displayText(detail.faculty ? detail.faculty.name : ""),
                },
            ]),
        ]),
        createSection("Inhalte & Voraussetzungen", [
            createAttrTable([
                { label: "Modulpfad", value: displayText(formatModulePath(detail)) },
                { label: "Inhalte", value: displayText(detail.content) },
                { label: "Qualifikationsziele", value: displayText(detail.goals) },
                { label: "Prüfungsvorleistungen", value: displayText(detail.exam_prerequisites) },
                ...createPrerequisiteRows(detail),
            ]),
        ]),
    );
    return fragment;
}

/** Dialog body element that receives the rendered tab contents. */
let dialogBody: HTMLElement | null = null;

/** Dialog tab bar element. */
let dialogTabs: HTMLElement | null = null;

/** Dialog element that shows the module name. */
let dialogName: HTMLElement | null = null;

/** Dialog element that shows the module number. */
let dialogNumber: HTMLElement | null = null;

/** Save toggle button in the dialog footer. */
let dialogSaveButton: HTMLButtonElement | null = null;

/** Module id currently shown in the dialog. */
let currentModuleId: number | null = null;

/**
 * Build the storage key of a module.
 * @param id - Module id.
 * @returns The storage key.
 */
function moduleKey(id: number): string {
    return `module:${id}`;
}

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
 * Update the count badge of a dialog tab.
 * @param tab - Tab name.
 * @param count - Number of linked items.
 */
function setTabCount(tab: string, count: number): void {
    const badge = dialogTabs?.querySelector(`span[data-tab="${tab}"] .count-badge`);
    if (badge) {
        badge.textContent = String(count);
    }
}

/**
 * Update the footer save toggle to reflect the saved state.
 * @param id - Module id.
 */
function updateSaveButton(id: number): void {
    const button = dialogSaveButton;
    if (!button) {
        return;
    }
    const saved = isSaved(moduleKey(id));
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
 * Render a module detail record into the dialog.
 * @param detail - Module detail record.
 */
function renderDetail(detail: ModuleDetail): void {
    const body = dialogBody;
    const name = dialogName;
    const number = dialogNumber;
    if (!body || !name || !number) {
        return;
    }
    name.textContent = detail.name;
    number.textContent = detail.number;

    const events = collectEvents(detail);
    const locations = collectLocations(events, detail.exams);
    const buildings = collectBuildings(events, detail.exams);
    const staff = collectStaff(detail, events);
    const degrees = detail.degrees ?? [];

    const contents: HTMLElement[] = [
        createTabContent("details", [createDetailsSections(detail)]),
        createTabContent("courses", [createTable(courseColumns, detail.courses, "Name")]),
        createTabContent("exams", [createTable(examColumns, detail.exams, "Datum")]),
        createTabContent("events", [createTable(eventColumns, events, "Datum")]),
        createTabContent("staff", [createTable(staffColumns, staff, "Name")]),
        createTabContent("locations", [createTable(locationColumns, locations, "Name")]),
        createTabContent("buildings", [createTable(buildingColumns, buildings, "Name")]),
        createTabContent("degrees", [createTable(createDegreeColumns(detail), degrees, "Name")]),
        createTabContent("semester", [createTable(semesterColumns, detail.semesters, "Jahr")]),
    ];

    body.querySelectorAll(".tab-content").forEach((content) => content.remove());
    contents.forEach((content) => body.appendChild(content));

    setTabCount("courses", detail.courses.length);
    setTabCount("exams", detail.exams.length);
    setTabCount("events", events.length);
    setTabCount("staff", staff.length);
    setTabCount("locations", locations.length);
    setTabCount("buildings", buildings.length);
    setTabCount("degrees", degrees.length);
    setTabCount("semester", detail.semesters.length);

    selectTab("details");
    updateSaveButton(detail.id);
}

/**
 * Fetch and show the detail dialog for a module.
 * @param id - Module id.
 */
export async function openModuleDetail(id: string): Promise<void> {
    currentModuleId = Number(id);
    try {
        const detail = await getModuleDetail(id);
        renderDetail(detail);
    } catch (error) {
        console.error("Failed to fetch module detail:", error);
    }
}

/** Wire the detail dialog tabs, the save toggle and the module cards. */
export function initModuleDetail(): void {
    dialogBody = document.querySelector<HTMLElement>("#detail-body");
    dialogTabs = document.querySelector<HTMLElement>("#detail-tabs");
    dialogName = document.querySelector<HTMLElement>("#detail-name");
    dialogNumber = document.querySelector<HTMLElement>("#detail-number");
    dialogSaveButton = document.querySelector<HTMLButtonElement>("#detail-save-toggle");

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
        if (currentModuleId === null) {
            return;
        }
        toggleSaved(moduleKey(currentModuleId));
        updateSaveButton(currentModuleId);
    });

    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const detailsId = target.closest<HTMLElement>("[data-details-id]")?.dataset["detailsId"];
        if (detailsId) {
            void openModuleDetail(detailsId);
        }
    });
}
