/**
 * DOM bindings for the UI state layer.
 *
 * Applies a {@link UIState} document to the layout, filter and save-slot
 * controls and captures user changes back into the shared state. Keeping this
 * separate from `state.ts` leaves the state model free of DOM access.
 */

import { refreshCalendarEvents } from "./calendar";
import { refreshFilterSummary, refreshTree, requeryAll, validateFilterRanges } from "./filters";
import { showToast } from "./feedback";
import { switchMainView, switchViewMode } from "./layout";
import { isSaved, toggleSaved } from "./saved";
import {
    describeSort,
    parseSortLevels,
    serializeSortLevels,
    sortOptionsFor,
    type SortLevel,
    type SortOption,
} from "./sort";
import {
    applyShareState,
    clearStoredState,
    createSaveSlot,
    createSlotId,
    DEFAULT_SLOT_ID,
    defaultState,
    getActiveSlot,
    getState,
    hasSharedState,
    loadState,
    parseSavedKey,
    saveState,
    setState,
    updateState,
    writeStateToQuery,
    type CourseFilters,
    type DegreeFilters,
    type EntityType,
    type EntryKind,
    type ExamFilters,
    type EventFilters,
    type FacetExclusions,
    type GlobalFilters,
    type MainView,
    type ModuleFilters,
    type PaneId,
    type Range,
    type RequirementModule,
    type SaveSlot,
    type SaveSlotEntry,
    type TriState,
    type UIState,
    type ViewMode,
} from "./state";
import { applyTheme } from "./theme";
import {
    createActionButton,
    getActiveType,
    getCachedEntityView,
    getCachedEntityViews,
    reloadCollection,
    setActiveType,
    type EntityView,
} from "./views";

/** Debounce delay before high-frequency control changes are captured. */
const CAPTURE_DEBOUNCE_MS = 250;

/** Displayed labels of the entity kinds that can be saved. */
const ENTRY_KIND_LABELS: Record<EntryKind, string> = {
    module: "Modul",
    course: "Kurs",
    event: "Veranstaltung",
    exam: "Prüfung",
    staff: "Mitarbeiter",
    location: "Raum",
};

/** Sentinel option value that creates a new save slot from the selector. */
const NEW_SLOT_OPTION = "__new__";

/** Maps a saved entry kind to the collection type used to resolve its name. */
const ENTRY_COLLECTION_TYPES: Record<EntryKind, string> = {
    module: "modules",
    course: "courses",
    event: "events",
    exam: "exams",
    staff: "staff",
    location: "locations",
};

/**
 * Resolve the cached display data of a saved entry.
 * @param entry - Saved data point.
 * @returns The cached entity view, or null when it is not loaded yet.
 */
function resolveEntryView(entry: SaveSlotEntry): EntityView | null {
    return getCachedEntityView(ENTRY_COLLECTION_TYPES[entry.kind], entry.ref);
}

/**
 * Format the credit points of a resolved entry.
 * @param view - Resolved entity view, if any.
 * @returns The credit point label, or null when unknown.
 */
function formatEntryLp(view: EntityView | null): string | null {
    return view?.lp !== undefined ? `${view.lp} LP` : null;
}

/**
 * Build the module options that are not required yet.
 * @param slot - Save slot whose requirements and entries are inspected.
 * @returns The selectable module references with labels.
 */
function requirementAddOptions(slot: SaveSlot): { ref: number; label: string }[] {
    const required = new Set(slot.requirements.modules.map((module) => module.ref));
    const options = new Map<number, string>();
    getCachedEntityViews("modules").forEach((view) => {
        if (view.entityId !== undefined) {
            options.set(view.entityId, view.number ? `${view.name} (${view.number})` : view.name);
        }
    });
    slot.entries
        .filter((entry) => entry.kind === "module")
        .forEach((entry) => {
            if (!options.has(entry.ref)) {
                options.set(entry.ref, `Modul #${entry.ref}`);
            }
        });
    return Array.from(options.entries())
        .filter(([ref]) => !required.has(ref))
        .map(([ref, label]) => ({ ref, label }));
}

/** Lazy calendar creator registered by the application bootstrap. */
let calendarLoader: (paneId: PaneId) => void = () => {};

/** Action to run once the user accepts the currently open confirmation dialog. */
let confirmAction: (() => void) | null = null;

/** Content of a destructive-action confirmation. */
type ConfirmOptions = {
    title: string;
    message: string;
    detail?: string;
    acceptLabel?: string;
};

/**
 * Open the shared confirmation dialog for a destructive action.
 *
 * Falls back to running the action immediately when the dialog markup is
 * missing, so a missing dialog never blocks the action.
 * @param options - Text shown in the dialog.
 * @param onAccept - Action to run when the user accepts.
 */
function openConfirm(options: ConfirmOptions, onAccept: () => void): void {
    const dialog = document.getElementById("confirm-dialog");
    if (!dialog || typeof dialog.showPopover !== "function") {
        onAccept();
        return;
    }
    const title = document.getElementById("confirm-title");
    const message = document.getElementById("confirm-message");
    const detail = document.getElementById("confirm-detail");
    const accept = document.getElementById("confirm-accept");
    if (title) {
        title.textContent = options.title;
    }
    if (message) {
        message.textContent = options.message;
    }
    if (detail) {
        detail.textContent = options.detail ?? "";
        detail.hidden = options.detail === undefined || options.detail === "";
    }
    if (accept) {
        accept.textContent = options.acceptLabel ?? "Bestätigen";
    }
    confirmAction = onAccept;
    dialog.showPopover();
}

/** Wire the accept and cancel handling of the confirmation dialog. */
function initConfirmDialog(): void {
    const dialog = document.getElementById("confirm-dialog");
    document.getElementById("confirm-accept")?.addEventListener("click", () => {
        const action = confirmAction;
        confirmAction = null;
        dialog?.hidePopover();
        action?.();
    });
    dialog?.addEventListener("toggle", (event) => {
        const state = (event as Event & { newState?: string }).newState;
        if (state === "closed") {
            confirmAction = null;
        }
    });
}

/**
 * Register the callback that creates the calendar of a pane on demand.
 * @param loader - Callback creating the calendar of a pane.
 */
export function registerCalendarLoader(loader: (paneId: PaneId) => void): void {
    calendarLoader = loader;
}

/**
 * Check whether a value is a supported layout mode.
 * @param value - Value read from the layout.
 * @returns Whether the value is a layout mode.
 */
function isViewMode(value: string | undefined): value is ViewMode {
    return value === "single" || value === "split" || value === "compare";
}

/**
 * Mark the matching child of a switcher as active.
 * @param selector - Switcher container selector.
 * @param value - Value of the child to activate.
 * @param attribute - Attribute holding the child value.
 */
function setActiveSwitcher(selector: string, value: string, attribute: string): void {
    document.querySelectorAll(`${selector} > *`).forEach((item) => {
        item.classList.toggle("active", item.getAttribute(attribute) === value);
    });
}

/**
 * Read the value of the active child of a switcher.
 * @param selector - Switcher container selector.
 * @returns The active value, or null when no child is active.
 */
function activeSwitcherValue(selector: string): string | null {
    const active = document.querySelector(`${selector} > .active`);
    if (!(active instanceof HTMLElement)) {
        return null;
    }
    return active.dataset["view"] ?? active.dataset["lang"] ?? null;
}

/**
 * Read the trimmed value of a text input.
 * @param id - Input element id.
 * @returns The trimmed value, or an empty string when missing.
 */
function readText(id: string): string {
    const input = document.getElementById(id) as HTMLInputElement | null;
    return input ? input.value.trim() : "";
}

/**
 * Write a value into a text input.
 * @param id - Input element id.
 * @param value - Value to write.
 */
function writeText(id: string, value: string): void {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input) {
        input.value = value;
    }
}

/**
 * Read a numeric input, keeping the fallback for empty or invalid values.
 * @param id - Input element id.
 * @param fallback - Value used when the input is empty or invalid.
 * @returns The parsed number.
 */
function readNumberInput(id: string, fallback: number): number {
    const input = document.getElementById(id) as HTMLInputElement | null;
    const value = Number(input?.value);
    return input && input.value !== "" && Number.isFinite(value) ? value : fallback;
}

/**
 * Read the checked values of a checkbox list, ignoring its default option.
 * @param containerId - Checkbox list container id.
 * @returns The checked values.
 */
function readCheckedValues(containerId: string): string[] {
    const inputs = document.querySelectorAll<HTMLInputElement>(
        `#${containerId} input[type="checkbox"]:checked`,
    );
    return Array.from(inputs)
        .map((input) => input.value)
        .filter((value) => value !== "");
}

/**
 * Check the checkbox list entries matching the wanted values.
 * @param containerId - Checkbox list container id.
 * @param values - Values that should be checked.
 */
function writeCheckedValues(containerId: string, values: (number | string)[]): void {
    const wanted = new Set(values.map(String));
    document
        .querySelectorAll<HTMLInputElement>(`#${containerId} input[type="checkbox"]`)
        .forEach((input) => {
            input.checked = input.value !== "" && wanted.has(input.value);
        });
}

/**
 * Read the excluded (tri-state "hidden") values of every facet list.
 * @returns The excluded values keyed by filter container id.
 */
function readExcludedValues(): FacetExclusions {
    const result: FacetExclusions = {};
    document.querySelectorAll<HTMLElement>("#filter-options .checkbox-list").forEach((list) => {
        const id = list.id;
        if (!id) {
            return;
        }
        const hidden = Array.from(list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
            .filter((input) => input.indeterminate && input.value !== "")
            .map((input) => input.value);
        if (hidden.length > 0) {
            result[id] = hidden;
        }
    });
    return result;
}

/**
 * Mark the excluded (tri-state "hidden") values of every facet list.
 * @param excluded - Excluded values keyed by filter container id.
 */
function writeExcludedValues(excluded: FacetExclusions): void {
    document.querySelectorAll<HTMLElement>("#filter-options .checkbox-list").forEach((list) => {
        const id = list.id;
        const hidden = new Set(id ? (excluded[id] ?? []) : []);
        list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
            input.indeterminate = input.value !== "" && hidden.has(input.value);
        });
    });
}

/**
 * Find the inputs of a labelled range filter inside a group.
 * @param groupId - Filter group container id.
 * @param labelText - Visible label of the range filter.
 * @returns The range inputs, or an empty list when not found.
 */
function findRangeInputs(groupId: string, labelText: string): HTMLInputElement[] {
    const group = document.getElementById(groupId);
    const ranges = group ? Array.from(group.querySelectorAll(".input-container.range")) : [];
    const range = ranges.find((item) => item.querySelector("label")?.textContent === labelText);
    return range ? Array.from(range.querySelectorAll<HTMLInputElement>("input")) : [];
}

/**
 * Read a labelled range filter.
 * @param groupId - Filter group container id.
 * @param labelText - Visible label of the range filter.
 * @returns The range values.
 */
function readRange(groupId: string, labelText: string): Range {
    const [min, max] = findRangeInputs(groupId, labelText);
    return { min: min?.value ?? "", max: max?.value ?? "" };
}

/**
 * Write a labelled range filter.
 * @param groupId - Filter group container id.
 * @param labelText - Visible label of the range filter.
 * @param range - Range values to write.
 */
function writeRange(groupId: string, labelText: string, range: Range): void {
    const [min, max] = findRangeInputs(groupId, labelText);
    if (min) {
        min.value = range.min;
    }
    if (max) {
        max.value = range.max;
    }
}

/**
 * Read a tri-state checkbox using its indeterminate state as the third value.
 * @param id - Checkbox element id.
 * @returns The tri-state value.
 */
function readTriState(id: string): TriState {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) {
        return "neutral";
    }
    if (input.indeterminate) {
        return "hidden";
    }
    return input.checked ? "selected" : "neutral";
}

/**
 * Write a tri-state checkbox.
 * @param id - Checkbox element id.
 * @param value - Tri-state value to write.
 */
function writeTriState(id: string, value: TriState): void {
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (!input) {
        return;
    }
    input.indeterminate = value === "hidden";
    input.checked = value === "selected";
}

/**
 * Read the value of a select element.
 * @param id - Select element id.
 * @returns The selected value, or an empty string when missing.
 */
function readSelectValue(id: string): string {
    const select = document.getElementById(id) as HTMLSelectElement | null;
    return select ? select.value : "";
}

/**
 * Write the value of a select element.
 * @param id - Select element id.
 * @param value - Value to select.
 */
function writeSelectValue(id: string, value: string): void {
    const select = document.getElementById(id) as HTMLSelectElement | null;
    if (select) {
        select.value = value;
    }
}

/**
 * Read a checkbox list as numbers, dropping malformed entries.
 * @param containerId - Checkbox list container id.
 * @returns The checked values as numbers.
 */
function readNumbers(containerId: string): number[] {
    return readCheckedValues(containerId)
        .map(Number)
        .filter((value) => Number.isFinite(value));
}

/**
 * Apply the layout, pane and theme display settings to the live UI.
 * @param state - State to read from.
 */
export function applyDisplayState(state: UIState): void {
    setActiveSwitcher("#view-switcher", state.display.viewMode, "data-view");
    setActiveSwitcher("#language-switcher", state.language, "data-lang");
    applyTheme(state.theme);
    switchViewMode(state.display.viewMode);
    ([1, 2] as const).forEach((paneId) => applyPaneState(paneId, state));
}

/**
 * Apply the main view and entity type of a single pane.
 * @param paneId - Pane identifier.
 * @param state - State to read from.
 */
function applyPaneState(paneId: PaneId, state: UIState): void {
    const pane = state.display.panes[paneId];
    setActiveSwitcher(`#display-changer${paneId}`, pane.mainView, "data-view");
    setActiveSwitcher(`#type-switcher${paneId}`, pane.type, "data-view");
    switchMainView(paneId, pane.mainView);
    setActiveType(paneId, pane.type);
    syncSortSummary(paneId);
    if (pane.mainView === "tree") {
        void refreshTree(paneId);
    } else if (pane.mainView === "calendar") {
        calendarLoader(paneId);
    }
}

/**
 * Capture the layout, pane and language settings from the live UI.
 * @param state - State to update, defaulting to the shared state.
 */
export function captureDisplayState(state: UIState = getState()): void {
    const mode = document.body.dataset["viewMode"];
    if (isViewMode(mode)) {
        state.display.viewMode = mode;
    }
    ([1, 2] as const).forEach((paneId) => {
        const mainView = activeSwitcherValue(`#display-changer${paneId}`) as MainView | null;
        const type = activeSwitcherValue(`#type-switcher${paneId}`) as EntityType | null;
        if (mainView) {
            state.display.panes[paneId].mainView = mainView;
        }
        if (type) {
            state.display.panes[paneId].type = type;
        }
    });
    const language = activeSwitcherValue("#language-switcher");
    if (language === "de" || language === "en") {
        state.language = language;
    }
    // TODO: capture state.calendar.view from the FullCalendar instance ("viewDidMount").
}

/**
 * Write the global filters into their DOM controls.
 * @param filters - Global filters to write.
 */
function applyGlobalFilters(filters: GlobalFilters): void {
    writeCheckedValues("filter-semester", filters.semester);
}

/**
 * Write the module filters into their DOM controls.
 * @param filters - Module filters to write.
 */
function applyModuleFilters(filters: ModuleFilters): void {
    writeText("search-input-module", filters.name);
    writeText("search-input-module-number", filters.number);
    writeCheckedValues("filter-faculty", filters.faculty);
    writeText("filter-responsible-person", filters.responsiblePerson);
    writeRange("filter-group-module", "Leistungspunkte", filters.credits);
    writeRange("filter-group-module", "Semesterdauer", filters.duration);
    writeCheckedValues("filter-language", filters.languages);
}

/**
 * Write the course filters into their DOM controls.
 * @param filters - Course filters to write.
 */
function applyCourseFilters(filters: CourseFilters): void {
    writeText("search-input-course", filters.name);
    writeText("search-input-course-number", filters.number);
    writeCheckedValues("filter-type", filters.types);
    writeCheckedValues("filter-instructors", filters.instructors);
    writeRange("filter-group-course", "Wochenstunden", filters.weeklyHours);
}

/**
 * Write the event filters into their DOM controls.
 * @param filters - Event filters to write.
 */
function applyEventFilters(filters: EventFilters): void {
    writeRange("filter-group-event", "Start-Uhrzeit", filters.startTime);
    writeRange("filter-group-event", "End-Uhrzeit", filters.endTime);
    writeRange("filter-group-event", "Datumszeitraum", filters.dates);
    writeSelectValue("filter-event-buildings", filters.buildings);
}

/**
 * Write the exam filters into their DOM controls.
 * @param filters - Exam filters to write.
 */
function applyExamFilters(filters: ExamFilters): void {
    writeText("search-input-exam", filters.name);
    writeCheckedValues("filter-examtypes", filters.types);
    writeRange("filter-group-exam", "Start-Uhrzeit", filters.startTime);
    writeRange("filter-group-exam", "End-Uhrzeit", filters.endTime);
    writeRange("filter-group-exam", "Datumszeitraum", filters.dates);
    writeCheckedValues("filter-buildings", filters.buildings);
    writeTriState("filter-exam-required", filters.required);
    writeCheckedValues("filter-staff", filters.staff);
}

/**
 * Write the degree filters into their DOM controls.
 * @param filters - Degree filters to write.
 */
function applyDegreeFilters(filters: DegreeFilters): void {
    writeText("search-input-degree", filters.name);
    writeText("filter-degree-subject", filters.subject);
    writeCheckedValues("filter-degree-types", filters.degrees);
}

/**
 * Hydrate every filter DOM control from the state.
 * @param state - State to read from.
 */
export function applyFilterState(state: UIState): void {
    applyGlobalFilters(state.filters.global);
    applyModuleFilters(state.filters.module);
    applyCourseFilters(state.filters.course);
    applyEventFilters(state.filters.event);
    applyExamFilters(state.filters.exam);
    applyDegreeFilters(state.filters.degree);
    writeExcludedValues(state.filters.excluded);
}

/**
 * Capture the global filters from their DOM controls.
 * @param filters - Filter section to update.
 */
function captureGlobalFilters(filters: GlobalFilters): void {
    filters.semester = readNumbers("filter-semester");
}

/**
 * Capture the module filters from their DOM controls.
 * @param filters - Filter section to update.
 */
function captureModuleFilters(filters: ModuleFilters): void {
    filters.name = readText("search-input-module");
    filters.number = readText("search-input-module-number");
    filters.faculty = readNumbers("filter-faculty");
    filters.responsiblePerson = readText("filter-responsible-person");
    filters.credits = readRange("filter-group-module", "Leistungspunkte");
    filters.duration = readRange("filter-group-module", "Semesterdauer");
    filters.languages = readCheckedValues("filter-language");
}

/**
 * Capture the course filters from their DOM controls.
 * @param filters - Filter section to update.
 */
function captureCourseFilters(filters: CourseFilters): void {
    filters.name = readText("search-input-course");
    filters.number = readText("search-input-course-number");
    filters.types = readNumbers("filter-type");
    filters.instructors = readNumbers("filter-instructors");
    filters.weeklyHours = readRange("filter-group-course", "Wochenstunden");
}

/**
 * Capture the event filters from their DOM controls.
 * @param filters - Filter section to update.
 */
function captureEventFilters(filters: EventFilters): void {
    filters.startTime = readRange("filter-group-event", "Start-Uhrzeit");
    filters.endTime = readRange("filter-group-event", "End-Uhrzeit");
    filters.dates = readRange("filter-group-event", "Datumszeitraum");
    filters.buildings = readSelectValue("filter-event-buildings");
}

/**
 * Capture the exam filters from their DOM controls.
 * @param filters - Filter section to update.
 */
function captureExamFilters(filters: ExamFilters): void {
    filters.name = readText("search-input-exam");
    filters.types = readCheckedValues("filter-examtypes");
    filters.startTime = readRange("filter-group-exam", "Start-Uhrzeit");
    filters.endTime = readRange("filter-group-exam", "End-Uhrzeit");
    filters.dates = readRange("filter-group-exam", "Datumszeitraum");
    filters.buildings = readNumbers("filter-buildings");
    filters.required = readTriState("filter-exam-required");
    filters.staff = readNumbers("filter-staff");
}

/**
 * Capture the degree filters from their DOM controls.
 * @param filters - Filter section to update.
 */
function captureDegreeFilters(filters: DegreeFilters): void {
    filters.name = readText("search-input-degree");
    filters.subject = readText("filter-degree-subject");
    filters.degrees = readCheckedValues("filter-degree-types");
}

/**
 * Capture every filter from the live DOM controls.
 * @param state - State to update, defaulting to the shared state.
 */
export function captureFilterState(state: UIState = getState()): void {
    captureGlobalFilters(state.filters.global);
    captureModuleFilters(state.filters.module);
    captureCourseFilters(state.filters.course);
    captureEventFilters(state.filters.event);
    captureExamFilters(state.filters.exam);
    captureDegreeFilters(state.filters.degree);
    state.filters.excluded = readExcludedValues();
}

/**
 * Create an option element for the save-slot selector.
 * @param value - Option value.
 * @param label - Visible option label.
 * @returns The created option.
 */
function createSlotOption(value: string, label: string): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
}

/**
 * Create the list entry of a saved data point.
 * @param entry - Saved data point.
 * @returns The created list item.
 */
function createSlotEntry(entry: SaveSlotEntry): HTMLLIElement {
    const view = resolveEntryView(entry);
    const item = document.createElement("li");
    item.className = "slot-entry";
    const type = document.createElement("span");
    type.className = "entry-type";
    type.textContent = ENTRY_KIND_LABELS[entry.kind];
    const main = document.createElement("span");
    main.className = "entry-main";
    const name = document.createElement("span");
    name.className = "entry-name";
    name.textContent = view ? view.name : `${ENTRY_KIND_LABELS[entry.kind]} #${entry.ref}`;
    const meta = document.createElement("span");
    meta.className = "entry-meta";
    meta.textContent = view?.number
        ? `${view.number} · ${ENTRY_KIND_LABELS[entry.kind]}`
        : `${ENTRY_KIND_LABELS[entry.kind]} · #${entry.ref}`;
    main.append(name, meta);
    const lp = document.createElement("span");
    lp.className = "entry-lp";
    lp.textContent = formatEntryLp(view) ?? "";
    const remove = document.createElement("button");
    remove.className = "btn slim material-symbols";
    remove.textContent = "delete";
    remove.setAttribute("aria-label", "Eintrag entfernen");
    remove.dataset["removeKind"] = entry.kind;
    remove.dataset["removeRef"] = String(entry.ref);
    item.append(type, main, lp, remove);
    return item;
}

/**
 * Update a count badge inside a save-slot dialog tab.
 * @param tab - Dialog tab name.
 * @param count - Number to display.
 */
function setCountBadge(tab: string, count: number): void {
    const badge = document.querySelector(
        `#save-slot-dialog .tab-content[data-tab="${tab}"] .count-badge`,
    );
    if (badge) {
        badge.textContent = String(count);
    }
}

/**
 * Render the saved data points of a slot into the dialog.
 * @param slot - Save slot to render.
 */
function renderSlotEntries(slot: SaveSlot): void {
    const list = document.querySelector(
        `#save-slot-dialog .tab-content[data-tab="entries"] .slot-entry-list`,
    );
    if (list) {
        if (slot.entries.length === 0) {
            const empty = document.createElement("li");
            empty.className = "slot-empty";
            empty.textContent =
                "Noch keine gespeicherten Einträge. Speichere Daten über die Behalten-Buttons.";
            list.replaceChildren(empty);
        } else {
            const fragment = document.createDocumentFragment();
            slot.entries.forEach((entry) => fragment.appendChild(createSlotEntry(entry)));
            list.replaceChildren(fragment);
        }
    }
    setCountBadge("entries", slot.entries.length);
}

/**
 * Create the progress card of a required module.
 * @param module - Required module to render.
 * @returns The created requirement card.
 */
function createRequirementCard(module: RequirementModule): HTMLLIElement {
    const view = getCachedEntityView("modules", module.ref);
    const item = document.createElement("li");
    item.className = `requirement-card${module.done ? " finished" : ""}`;
    const head = document.createElement("div");
    head.className = "requirement-head";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = module.done;
    checkbox.dataset["requirementRef"] = String(module.ref);
    checkbox.setAttribute("aria-label", `${view?.name ?? "Modul"} abgeschlossen`);
    const remove = document.createElement("button");
    remove.className = "btn slim material-symbols req-remove";
    remove.textContent = "close";
    remove.setAttribute("aria-label", "Pflichtmodul entfernen");
    remove.dataset["removeRequirement"] = String(module.ref);
    head.append(checkbox, remove);
    const name = document.createElement("span");
    name.className = "req-name";
    name.textContent = view?.name ?? `Modul #${module.ref}`;
    const number = document.createElement("span");
    number.className = "req-number";
    number.textContent = view?.number ?? `#${module.ref}`;
    const lp = document.createElement("input");
    lp.type = "number";
    lp.className = "req-lp";
    lp.min = "0";
    lp.value = String(module.lp);
    lp.dataset["requirementLp"] = String(module.ref);
    lp.setAttribute("aria-label", "Leistungspunkte");
    item.append(head, name, number, lp);
    return item;
}

/**
 * Create the card that adds a required module.
 * @param slot - Save slot whose options are listed.
 * @returns The created add card.
 */
function createRequirementAddCard(slot: SaveSlot): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "requirement-card requirement-add";
    const head = document.createElement("div");
    head.className = "requirement-head";
    const select = document.createElement("select");
    select.id = "requirement-add-select";
    select.setAttribute("aria-label", "Modul auswählen");
    const options = requirementAddOptions(slot);
    if (options.length === 0) {
        select.appendChild(createSlotOption("", "Keine Module verfügbar"));
        select.disabled = true;
    } else {
        options.forEach((option) =>
            select.appendChild(createSlotOption(String(option.ref), option.label)),
        );
    }
    const add = document.createElement("button");
    add.id = "requirement-add";
    add.className = "btn slim material-symbols";
    add.textContent = "add_circle";
    add.setAttribute("aria-label", "Pflichtmodul hinzufügen");
    add.disabled = options.length === 0;
    head.append(select, add);
    item.appendChild(head);
    return item;
}

/**
 * Render the credit point summary of a slot.
 * @param slot - Save slot to summarise.
 */
function renderLpSummary(slot: SaveSlot): void {
    const modules = slot.requirements.modules;
    const completed = modules.filter((module) => module.done).reduce((sum, m) => sum + m.lp, 0);
    const open = modules.filter((module) => !module.done).reduce((sum, m) => sum + m.lp, 0);
    const total = slot.requirements.totalLp;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    setText(".lp-caption", `${completed} von ${total} LP der Pflichtmodule abgeschlossen`);
    setLpTotal(total);
    const fill = document.querySelector<HTMLElement>("#save-slot-dialog .lp-bar-fill");
    if (fill) {
        fill.style.width = `${percent}%`;
    }
    const infos = document.querySelectorAll("#save-slot-dialog .lp-breakdown .info");
    if (infos[0]) {
        infos[0].textContent = `Abgeschlossen: ${completed} LP`;
    }
    if (infos[1]) {
        infos[1].textContent = `Offen: ${open} LP`;
    }
    if (infos[2]) {
        infos[2].textContent = `Module: ${modules.length}`;
    }
}

/**
 * Render the required modules of a slot into the dialog.
 * @param slot - Save slot to render.
 */
function renderSlotRequirements(slot: SaveSlot): void {
    const grid = document.querySelector(
        `#save-slot-dialog .tab-content[data-tab="requirements"] .requirement-grid`,
    );
    if (grid) {
        const fragment = document.createDocumentFragment();
        slot.requirements.modules.forEach((module) =>
            fragment.appendChild(createRequirementCard(module)),
        );
        fragment.appendChild(createRequirementAddCard(slot));
        grid.replaceChildren(fragment);
    }
    setCountBadge("requirements", slot.requirements.modules.length);
    renderLpSummary(slot);
}

/**
 * Write text into the first element matching a dialog selector.
 * @param selector - Selector relative to the save-slot dialog.
 * @param text - Text to write.
 */
function setText(selector: string, text: string): void {
    const element = document.querySelector(`#save-slot-dialog ${selector}`);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Write the total credit points of a slot into the summary.
 * @param total - Total credit points.
 */
function setLpTotal(total: number): void {
    const input = document.getElementById("slot-total-lp") as HTMLInputElement | null;
    if (input) {
        input.value = String(total);
    }
}

/**
 * Render the save-slot selector from the state.
 * @param state - State to read from.
 */
function renderSlotSelector(state: UIState): void {
    const select = document.querySelector<HTMLSelectElement>(
        "#save-slot-options .save-slot-selector",
    );
    if (!select) {
        return;
    }
    const fragment = document.createDocumentFragment();
    state.slots.items.forEach((slot) => fragment.appendChild(createSlotOption(slot.id, slot.name)));
    fragment.appendChild(createSlotOption(NEW_SLOT_OPTION, "+ Neuer Slot"));
    select.replaceChildren(fragment);
    select.value = state.slots.active;
}

/**
 * Render the active save slot into the selector and the dialog.
 * @param state - State to read from.
 */
function renderActiveSlot(state: UIState): void {
    const slot = getActiveSlot(state);
    if (!slot) {
        return;
    }
    writeText("save-slot-name", slot.name);
    renderSlotEntries(slot);
    renderSlotRequirements(slot);
    validateSlotLp();
}

/** Validate the editable total credit point target and show an inline error. */
function validateSlotLp(): void {
    const input = document.getElementById("slot-total-lp") as HTMLInputElement | null;
    const error = document.getElementById("error-slot-total-lp");
    if (!input || !error) {
        return;
    }
    const value = Number(input.value);
    const invalid = input.value.trim() === "" || !Number.isFinite(value) || value < 0;
    error.textContent = invalid ? "Bitte gib einen Zielwert von mindestens 0 LP ein." : "";
}

/**
 * Hydrate the save-slot selector and dialog from the state.
 * @param state - State to read from.
 */
export function applySlotState(state: UIState): void {
    renderSlotSelector(state);
    renderActiveSlot(state);
}

/**
 * Capture the editable save-slot fields from the dialog.
 * @param state - State to update, defaulting to the shared state.
 */
export function captureSlotState(state: UIState = getState()): void {
    const slot = getActiveSlot(state);
    if (!slot) {
        return;
    }
    slot.name = readText("save-slot-name") || slot.name;
    slot.requirements.totalLp = readNumberInput("slot-total-lp", slot.requirements.totalLp);
    document
        .querySelectorAll<HTMLInputElement>("#save-slot-dialog [data-requirement-ref]")
        .forEach((input) => {
            const ref = Number(input.dataset["requirementRef"]);
            const module = slot.requirements.modules.find((item) => item.ref === ref);
            if (module) {
                module.done = input.checked;
            }
        });
    document
        .querySelectorAll<HTMLInputElement>("#save-slot-dialog [data-requirement-lp]")
        .forEach((input) => {
            const ref = Number(input.dataset["requirementLp"]);
            const value = Number(input.value);
            const module = slot.requirements.modules.find((item) => item.ref === ref);
            if (module && input.value !== "" && Number.isFinite(value)) {
                module.lp = value;
            }
        });
}

/**
 * Capture every UI setting into the shared state and persist it.
 * @returns The captured state.
 */
export function captureState(): UIState {
    const state = getState();
    captureDisplayState(state);
    captureFilterState(state);
    captureSlotState(state);
    saveState(state);
    return state;
}

/**
 * Apply every section of a state document to the live UI.
 * @param state - State to apply.
 */
export function applyState(state: UIState): void {
    applyDisplayState(state);
    applyFilterState(state);
    applySlotState(state);
}

/**
 * Load the initial state from a share link when present, otherwise from storage.
 * @returns The loaded state.
 */
export function loadInitialState(): UIState {
    const shared = hasSharedState();
    if (applyShareState()) {
        showToast("Geteilte Ansicht geladen.", "info");
        return getState();
    }
    if (shared) {
        showToast("Der geteilte Link konnte nicht gelesen werden.", "error");
    }
    return setState(loadState());
}

/**
 * Create a debounced version of a callback.
 * @param callback - Callback to debounce.
 * @param delay - Delay in milliseconds.
 * @returns The debounced callback.
 */
function debounce(callback: () => void, delay: number): () => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(callback, delay);
    };
}

/** Persist the current filter controls after they stop changing. */
const captureFilters = debounce(captureState, CAPTURE_DEBOUNCE_MS);

/** Persist the current layout controls after a switcher click. */
const captureDisplay = debounce(captureState, 0);

/** Attach debounced capture listeners to the filter groups. */
function wireFilterCapture(): void {
    document.querySelectorAll("#filter-options .filter-group").forEach((group) => {
        group.addEventListener("input", captureFilters);
        group.addEventListener("change", captureFilters);
    });
}

/** Attach capture listeners to every layout and language switcher. */
function wireDisplayCapture(): void {
    [
        "#display-changer1",
        "#display-changer2",
        "#type-switcher1",
        "#type-switcher2",
        "#view-switcher",
        "#language-switcher",
    ].forEach((selector) => {
        document
            .querySelectorAll(`${selector} > *`)
            .forEach((item) => item.addEventListener("click", captureDisplay));
    });
}

/**
 * Apply the state to the UI and wire every capture listener.
 *
 * Call this after the behaviour listeners (`wireSwitcher`) are registered so
 * capture runs last and sees the updated active classes.
 */
export function initStateBindings(): void {
    applyState(getState());
    wireFilterCapture();
    wireDisplayCapture();
    initSaveButtons();
    initSlotControls();
    initConfirmDialog();
    initShareButton();
    initResetDialog();
    initSortDialog();
}

/**
 * Preselect the newest semester when no semester filter is active yet.
 *
 * This mirrors the planner pattern of starting on the current term instead of
 * "all semesters", so results are already narrowed on first load. Selecting all
 * semesters again is possible by clearing the semester chips.
 */
function applyDefaultSemester(): void {
    const filters = getState().filters;
    if (
        filters.global.semester.length > 0 ||
        (filters.excluded["filter-semester"]?.length ?? 0) > 0
    ) {
        return;
    }
    const input = document.querySelector<HTMLInputElement>(
        '#filter-semester input[type="checkbox"]:not([value=""])',
    );
    if (!input || input.indeterminate) {
        return;
    }
    input.checked = true;
    captureState();
}

/** Re-apply the filters after asynchronous option loading and reload the data. */
export function refreshStateFilters(): void {
    applyFilterState(getState());
    applyDefaultSemester();
    validateFilterRanges();
    requeryAll();
    refreshFilterSummary();
}

/**
 * Load, apply and persist the state in one step.
 * @returns The initialised state.
 */
export function initState(): UIState {
    const state = loadInitialState();
    initStateBindings();
    return state;
}

/** Update every rendered save button to reflect its saved state. */
export function syncSaveButtons(): void {
    document.querySelectorAll<HTMLElement>("[data-save-kind]").forEach((button) => {
        const kind = button.dataset["saveKind"];
        const ref = Number(button.dataset["saveRef"]);
        const saved = kind !== undefined && Number.isFinite(ref) && isSaved(`${kind}:${ref}`);
        button.classList.toggle("saved", saved);
        button.setAttribute("aria-pressed", String(saved));
        button.setAttribute("aria-label", saved ? "Aus dem Slot entfernen" : "In Slot speichern");
        button.textContent = saved ? "bookmark" : "bookmark_add";
    });
}

/**
 * Toggle the saved state of the data point behind a save button.
 * @param button - Clicked save button.
 */
function handleSaveClick(button: HTMLElement): void {
    const kind = button.dataset["saveKind"];
    const ref = Number(button.dataset["saveRef"]);
    if (kind === undefined || !Number.isFinite(ref)) {
        return;
    }
    const result = toggleSaved(`${kind}:${ref}`);
    if (result === "unavailable") {
        showToast("Kein Speicher-Slot aktiv – bitte zuerst einen Slot anlegen.", "error");
    } else {
        showToast(
            result === "saved" ? "Im Slot gespeichert." : "Aus dem Slot entfernt.",
            result === "saved" ? "success" : "info",
        );
    }
    syncSaveButtons();
    renderActiveSlot(getState());
    void refreshCalendarEvents();
}

/** Whether a save-button sync is already scheduled for the next frame. */
let saveSyncScheduled = false;

/** Schedule a save-button sync, coalescing DOM bursts into a single frame. */
function scheduleSaveSync(): void {
    if (saveSyncScheduled) {
        return;
    }
    saveSyncScheduled = true;
    requestAnimationFrame(() => {
        saveSyncScheduled = false;
        syncSaveButtons();
    });
}

/** Wire the save buttons of every rendered data type. */
function initSaveButtons(): void {
    syncSaveButtons();
    document.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }
        const button = target.closest<HTMLElement>("[data-save-kind]");
        if (button) {
            handleSaveClick(button);
        }
    });
    const observer = new MutationObserver(scheduleSaveSync);
    ([1, 2] as const).forEach((paneId) => {
        const pane = document.getElementById(`list-card-view${paneId}`);
        if (pane) {
            observer.observe(pane, { childList: true, subtree: true });
        }
    });
}

/**
 * Remove a saved data point from the active slot.
 * @param key - Saved data point key such as `module:2011`.
 */
function removeEntry(key: string): void {
    const entry = parseSavedKey(key);
    if (!entry) {
        return;
    }
    updateState((state) => {
        const slot = getActiveSlot(state);
        if (slot) {
            slot.entries = slot.entries.filter(
                (item) => !(item.kind === entry.kind && item.ref === entry.ref),
            );
        }
    });
    renderActiveSlot(getState());
    syncSaveButtons();
    void refreshCalendarEvents();
    showToast("Eintrag entfernt.", "info");
}

/** Remove every saved data point from the active slot. */
function clearActiveSlot(): void {
    updateState((state) => {
        const slot = getActiveSlot(state);
        if (slot) {
            slot.entries = [];
        }
    });
    renderActiveSlot(getState());
    syncSaveButtons();
    void refreshCalendarEvents();
    showToast("Slot geleert.", "info");
}

/** Delete the active slot and select the first remaining one. */
function deleteActiveSlot(): void {
    updateState((state) => {
        state.slots.items = state.slots.items.filter((slot) => slot.id !== state.slots.active);
        if (state.slots.items.length === 0) {
            state.slots.items = [createSaveSlot(DEFAULT_SLOT_ID, "Mein Studienplan")];
        }
        state.slots.active = state.slots.items[0]?.id ?? DEFAULT_SLOT_ID;
    });
    renderSlotSelector(getState());
    renderActiveSlot(getState());
    syncSaveButtons();
    void refreshCalendarEvents();
    showToast("Slot gelöscht.", "info");
}

/**
 * Activate a tab in the save-slot dialog.
 * @param tab - Tab name to activate.
 */
function selectSlotTab(tab: string): void {
    document.querySelectorAll("#save-slot-dialog .dialog-tabs > span").forEach((span) => {
        span.classList.toggle("active", span.getAttribute("data-tab") === tab);
    });
}

/** Focus and select the slot name input so it can be renamed. */
function focusSlotName(): void {
    const input = document.getElementById("save-slot-name") as HTMLInputElement | null;
    input?.focus();
    input?.select();
}

/** Create a new empty save slot and select it. */
function createNewSlot(): void {
    updateState((state) => {
        const id = createSlotId(state);
        state.slots.items = [
            ...state.slots.items,
            createSaveSlot(id, `Save-Slot ${state.slots.items.length + 1}`),
        ];
        state.slots.active = id;
    });
    const state = getState();
    renderSlotSelector(state);
    renderActiveSlot(state);
    syncSaveButtons();
    void refreshCalendarEvents();
    showToast("Neuer Slot angelegt.", "success");
}

/** Add the selected module to the requirements of the active slot. */
function addRequirement(): void {
    const select = document.getElementById("requirement-add-select") as HTMLSelectElement | null;
    const ref = Number(select?.value);
    if (!select || select.value === "" || !Number.isFinite(ref)) {
        return;
    }
    const lp = getCachedEntityView("modules", ref)?.lp ?? 0;
    updateState((state) => {
        const slot = getActiveSlot(state);
        if (slot && !slot.requirements.modules.some((module) => module.ref === ref)) {
            slot.requirements.modules = [...slot.requirements.modules, { ref, lp, done: false }];
        }
    });
    renderActiveSlot(getState());
    showToast("Pflichtmodul hinzugefügt.", "success");
}

/**
 * Remove a required module from the active slot.
 * @param ref - Module reference to remove.
 */
function removeRequirement(ref: number): void {
    if (!Number.isFinite(ref)) {
        return;
    }
    updateState((state) => {
        const slot = getActiveSlot(state);
        if (slot) {
            slot.requirements.modules = slot.requirements.modules.filter(
                (module) => module.ref !== ref,
            );
        }
    });
    renderActiveSlot(getState());
    showToast("Pflichtmodul entfernt.", "info");
}

/**
 * Handle clicks inside the save-slot dialog.
 * @param event - Click event to inspect.
 */
function handleSlotClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) {
        return;
    }
    const tab = target.closest<HTMLElement>(".dialog-tabs > span[data-tab]");
    if (tab) {
        selectSlotTab(tab.dataset["tab"] ?? "");
        return;
    }
    const entryButton = target.closest<HTMLElement>("[data-remove-kind]");
    if (entryButton) {
        removeEntry(`${entryButton.dataset["removeKind"]}:${entryButton.dataset["removeRef"]}`);
        return;
    }
    const requirementButton = target.closest<HTMLElement>("[data-remove-requirement]");
    if (requirementButton) {
        removeRequirement(Number(requirementButton.dataset["removeRequirement"]));
        return;
    }
    if (target.closest("#save-slot-new")) {
        createNewSlot();
    } else if (target.closest("#save-slot-rename")) {
        focusSlotName();
    } else if (target.closest("#requirement-add")) {
        addRequirement();
    } else if (target.closest("#save-slot-clear")) {
        openConfirm(
            {
                title: "Slot leeren",
                message: "Alle gespeicherten Einträge dieses Slots werden entfernt.",
                detail: "Pflichtmodule und deren Fortschritt bleiben erhalten.",
                acceptLabel: "Slot leeren",
            },
            clearActiveSlot,
        );
    } else if (target.closest("#save-slot-delete")) {
        openConfirm(
            {
                title: "Slot löschen",
                message: "Der aktive Slot und alle seine Einträge werden gelöscht.",
                detail: "Diese Aktion kann nicht rückgängig gemacht werden.",
                acceptLabel: "Slot löschen",
            },
            deleteActiveSlot,
        );
    } else if (target.closest("#save-slot-save")) {
        saveState(captureState());
        document.getElementById("save-slot-dialog")?.hidePopover();
        showToast("Slot gespeichert.", "success");
    }
}

/**
 * Handle field changes inside the save-slot dialog.
 * @param event - Change event to inspect.
 */
function handleSlotChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
        return;
    }
    captureState();
    if (
        target.id === "slot-total-lp" ||
        target.dataset["requirementRef"] !== undefined ||
        target.dataset["requirementLp"] !== undefined
    ) {
        renderActiveSlot(getState());
        validateSlotLp();
    } else if (target.id === "save-slot-name") {
        renderSlotSelector(getState());
        showToast("Slot-Name gespeichert.", "success");
    }
}

/** Wire the save-slot selector and the dialog controls. */
function initSlotControls(): void {
    const select = document.querySelector<HTMLSelectElement>(
        "#save-slot-options .save-slot-selector",
    );
    select?.addEventListener("change", () => {
        if (select.value === NEW_SLOT_OPTION) {
            createNewSlot();
            return;
        }
        updateState((state) => {
            state.slots.active = select.value;
        });
        renderActiveSlot(getState());
        syncSaveButtons();
        void refreshCalendarEvents();
    });
    const dialog = document.querySelector("#save-slot-dialog");
    dialog?.addEventListener("click", handleSlotClick);
    dialog?.addEventListener("change", handleSlotChange);
    dialog?.addEventListener("toggle", (event) => {
        const state = (event as Event & { newState?: string }).newState;
        if (state === "open") {
            renderActiveSlot(getState());
        }
    });
}

/**
 * Build a share link containing the current state.
 * @returns The share link.
 */
export function createShareLink(): string {
    return writeStateToQuery(captureState());
}

/** Copy a fresh share link to the clipboard and put it into the address bar. */
async function shareState(): Promise<void> {
    const link = createShareLink();
    globalThis.history.replaceState(null, "", link);
    if (!navigator.clipboard) {
        showToast("Die Adresse enthält jetzt den geteilten Zustand.", "info");
        return;
    }
    try {
        await navigator.clipboard.writeText(link);
        showToast("Link in die Zwischenablage kopiert.", "success");
    } catch (error) {
        console.warn("Failed to copy the share link:", error);
        showToast("Link konnte nicht kopiert werden – die Adresse wurde aktualisiert.", "error");
    }
}

/** Wire the share button. */
function initShareButton(): void {
    document.getElementById("share-button")?.addEventListener("click", () => {
        void shareState();
    });
}

/** Reset every filter control to its default and reload the filtered data. */
function resetFilters(): void {
    updateState((state) => {
        state.filters = defaultState().filters;
    });
    applyFilterState(getState());
    validateFilterRanges();
    requeryAll();
    showToast("Filter zurückgesetzt.", "info");
}

/** Clear the persisted state and restore every setting to its default. */
function resetSavedState(): void {
    clearStoredState();
    if (hasSharedState()) {
        globalThis.history.replaceState(null, "", globalThis.location.pathname);
    }
    const state = setState(defaultState());
    applyState(state);
    requeryAll();
    syncSaveButtons();
    void refreshCalendarEvents();
    showToast("Gespeicherter Zustand gelöscht.", "info");
}

/** Wire the reset dialog and its two reset scopes. */
function initResetDialog(): void {
    const dialog = document.getElementById("reset-dialog");
    document.getElementById("reset-filters-option")?.addEventListener("click", () => {
        dialog?.hidePopover();
        resetFilters();
    });
    document.getElementById("reset-state-option")?.addEventListener("click", () => {
        dialog?.hidePopover();
        openConfirm(
            {
                title: "Gespeicherten Zustand löschen",
                message: "Alle Einstellungen, Filter und gespeicherten Daten werden zurückgesetzt.",
                detail: "Theme, Sprache, Ansicht, Kalender, Filter und alle Save-Slots kehren zu den Standardwerten zurück.",
                acceptLabel: "Zurücksetzen",
            },
            resetSavedState,
        );
    });
}

/** Pane whose sort is currently edited in the sort dialog. */
let sortPane: PaneId = 1;

/** Working copy of the sort levels while the sort dialog is open. */
let sortDraft: SortLevel[] = [];

/**
 * Update the sort summary shown in a pane header.
 * @param paneId - Pane identifier.
 */
export function syncSortSummary(paneId: PaneId): void {
    const levels = parseSortLevels(getState().display.panes[paneId].sort);
    const summary = document.querySelector(`#multi-level-sort${paneId} .sort-summary`);
    if (summary) {
        summary.textContent =
            levels.length > 0 ? describeSort(levels, getActiveType(paneId)) : "Sortieren nach";
    }
}

/**
 * Create one editable sort level row.
 * @param level - Sort level to display.
 * @param index - Position of the level.
 * @param options - Selectable fields of the entity type.
 * @returns The created list item.
 */
function createSortRow(level: SortLevel, index: number, options: SortOption[]): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "sort-level";
    const position = document.createElement("span");
    position.className = "sort-index";
    position.textContent = String(index + 1);
    const select = document.createElement("select");
    select.className = "sort-field";
    select.dataset["sortIndex"] = String(index);
    select.setAttribute("aria-label", "Sortierfeld");
    options.forEach((option) => {
        const entry = document.createElement("option");
        entry.value = option.field;
        entry.textContent = option.label;
        entry.selected = option.field === level.field;
        select.appendChild(entry);
    });
    const direction = createActionButton(
        "btn slim material-symbols sort-dir",
        level.direction === "asc" ? "arrow_upward" : "arrow_downward",
    );
    direction.dataset["sortIndex"] = String(index);
    direction.setAttribute("aria-label", "Sortierrichtung wechseln");
    const remove = createActionButton("btn slim material-symbols sort-remove", "close");
    remove.dataset["sortIndex"] = String(index);
    remove.setAttribute("aria-label", "Ebene entfernen");
    item.append(position, select, direction, remove);
    return item;
}

/** Render the working sort levels into the sort dialog. */
function renderSortRows(): void {
    const list = document.getElementById("sort-level-list");
    if (!list) {
        return;
    }
    const options = sortOptionsFor(getActiveType(sortPane));
    list.replaceChildren(...sortDraft.map((level, index) => createSortRow(level, index, options)));
    const empty = document.getElementById("sort-empty");
    if (empty) {
        empty.hidden = sortDraft.length > 0;
    }
}

/**
 * Open the sort dialog for a pane.
 * @param paneId - Pane identifier.
 */
function openSortDialog(paneId: PaneId): void {
    sortPane = paneId;
    sortDraft = parseSortLevels(getState().display.panes[paneId].sort).map((level) => ({
        ...level,
    }));
    renderSortRows();
    document.getElementById("sort-dialog")?.showPopover();
}

/** Add the next unused sort field as a new level. */
function addSortLevel(): void {
    const options = sortOptionsFor(getActiveType(sortPane));
    const used = new Set(sortDraft.map((level) => level.field));
    const next = options.find((option) => !used.has(option.field)) ?? options[0];
    if (next) {
        sortDraft.push({ field: next.field, direction: "asc" });
        renderSortRows();
    }
}

/**
 * Update a sort level when its field selection changes.
 * @param event - Change event of a field select.
 */
function handleSortFieldChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
        return;
    }
    const level = sortDraft[Number(target.dataset["sortIndex"])];
    if (level) {
        level.field = target.value;
        renderSortRows();
    }
}

/**
 * Toggle the direction or remove a sort level from a click in its row.
 * @param event - Click event inside the sort list.
 */
function handleSortRowClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) {
        return;
    }
    const direction = target.closest<HTMLElement>(".sort-dir");
    const remove = target.closest<HTMLElement>(".sort-remove");
    const level = sortDraft[Number((direction ?? remove)?.dataset["sortIndex"])];
    if (!level) {
        return;
    }
    if (direction) {
        level.direction = level.direction === "asc" ? "desc" : "asc";
        renderSortRows();
    } else if (remove) {
        sortDraft.splice(sortDraft.indexOf(level), 1);
        renderSortRows();
    }
}

/** Store the working sort levels for the active pane and reload its data. */
function applySort(): void {
    document.getElementById("sort-dialog")?.hidePopover();
    updateState((state) => {
        state.display.panes[sortPane].sort = serializeSortLevels(sortDraft);
    });
    syncSortSummary(sortPane);
    reloadCollection(getActiveType(sortPane));
    showToast("Sortierung angewendet.", "success");
}

/** Wire the sort dialog and the pane header sort controls. */
function initSortDialog(): void {
    ([1, 2] as const).forEach((paneId) => {
        const control = document.getElementById(`multi-level-sort${paneId}`);
        control?.addEventListener("click", () => openSortDialog(paneId));
        control?.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSortDialog(paneId);
            }
        });
    });
    document.getElementById("sort-level-add")?.addEventListener("click", addSortLevel);
    document.getElementById("sort-reset")?.addEventListener("click", () => {
        sortDraft = [];
        renderSortRows();
    });
    document.getElementById("sort-apply")?.addEventListener("click", applySort);
    const list = document.getElementById("sort-level-list");
    list?.addEventListener("change", handleSortFieldChange);
    list?.addEventListener("click", handleSortRowClick);
}
