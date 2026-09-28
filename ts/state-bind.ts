/**
 * DOM bindings for the UI state layer.
 *
 * Applies a {@link UIState} document to the layout, filter and save-slot
 * controls and captures user changes back into the shared state. Keeping this
 * separate from `state.ts` leaves the state model free of DOM access.
 */

import { refreshTree, requeryAll } from "./filters";
import { switchMainView, switchViewMode } from "./layout";
import { isSaved, toggleSaved } from "./saved";
import {
    applyShareState,
    getActiveSlot,
    getState,
    loadState,
    parseSavedKey,
    saveState,
    setState,
    updateState,
    writeStateToQuery,
    type CourseFilters,
    type EntityType,
    type EntryKind,
    type ExamFilters,
    type EventFilters,
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
import { setActiveType } from "./views";

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

/** Lazy calendar creator registered by the application bootstrap. */
let calendarLoader: (paneId: PaneId) => void = () => {};

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
    writeCheckedValues("filter-examtypes", filters.types);
    writeRange("filter-group-exam", "Start-Uhrzeit", filters.startTime);
    writeRange("filter-group-exam", "End-Uhrzeit", filters.endTime);
    writeRange("filter-group-exam", "Datumszeitraum", filters.dates);
    writeCheckedValues("filter-buildings", filters.buildings);
    writeTriState("filter-exam-required", filters.required);
    writeCheckedValues("filter-staff", filters.staff);
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
    filters.types = readCheckedValues("filter-examtypes");
    filters.startTime = readRange("filter-group-exam", "Start-Uhrzeit");
    filters.endTime = readRange("filter-group-exam", "End-Uhrzeit");
    filters.dates = readRange("filter-group-exam", "Datumszeitraum");
    filters.buildings = readNumbers("filter-buildings");
    filters.required = readTriState("filter-exam-required");
    filters.staff = readNumbers("filter-staff");
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
    const item = document.createElement("li");
    item.className = "slot-entry";
    const type = document.createElement("span");
    type.className = "entry-type";
    type.textContent = ENTRY_KIND_LABELS[entry.kind];
    const main = document.createElement("span");
    main.className = "entry-main";
    const name = document.createElement("span");
    name.className = "entry-name";
    name.textContent = `${ENTRY_KIND_LABELS[entry.kind]} #${entry.ref}`;
    main.appendChild(name);
    const remove = document.createElement("button");
    remove.className = "btn slim material-symbols";
    remove.textContent = "delete";
    remove.setAttribute("aria-label", "Eintrag entfernen");
    remove.dataset["removeKind"] = entry.kind;
    remove.dataset["removeRef"] = String(entry.ref);
    item.append(type, main, remove);
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
        const fragment = document.createDocumentFragment();
        slot.entries.forEach((entry) => fragment.appendChild(createSlotEntry(entry)));
        list.replaceChildren(fragment);
    }
    setCountBadge("entries", slot.entries.length);
}

/**
 * Create the progress card of a required module.
 * @param module - Required module to render.
 * @returns The created requirement card.
 */
function createRequirementCard(module: RequirementModule): HTMLLIElement {
    const item = document.createElement("li");
    item.className = `requirement-card${module.done ? " finished" : ""}`;
    const head = document.createElement("div");
    head.className = "requirement-head";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = module.done;
    checkbox.dataset["requirementRef"] = String(module.ref);
    checkbox.setAttribute("aria-label", `Modul #${module.ref} abgeschlossen`);
    const icon = document.createElement("span");
    icon.className = "material-symbols";
    icon.textContent = module.done ? "check_circle" : "radio_button_unchecked";
    head.append(checkbox, icon);
    const name = document.createElement("span");
    name.className = "req-name";
    name.textContent = `Modul #${module.ref}`;
    const number = document.createElement("span");
    number.className = "req-number";
    number.textContent = `#${module.ref}`;
    const lp = document.createElement("span");
    lp.className = "req-lp";
    lp.textContent = `${module.lp} LP`;
    item.append(head, name, number, lp);
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
    const element = document.querySelector("#save-slot-dialog .lp-total");
    if (!element) {
        return;
    }
    element.textContent = String(total);
    const small = document.createElement("small");
    small.textContent = "LP";
    element.appendChild(small);
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
    document
        .querySelectorAll<HTMLInputElement>("#save-slot-dialog [data-requirement-ref]")
        .forEach((input) => {
            const ref = Number(input.dataset["requirementRef"]);
            const module = slot.requirements.modules.find((item) => item.ref === ref);
            if (module) {
                module.done = input.checked;
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
    if (applyShareState()) {
        return getState();
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
    initShareButton();
}

/** Re-apply the filters after asynchronous option loading and reload the data. */
export function refreshStateFilters(): void {
    applyFilterState(getState());
    requeryAll();
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
    toggleSaved(`${kind}:${ref}`);
    syncSaveButtons();
    renderActiveSlot(getState());
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
    const observer = new MutationObserver(syncSaveButtons);
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
}

/** Delete the active slot and select the first remaining one. */
function deleteActiveSlot(): void {
    updateState((state) => {
        state.slots.items = state.slots.items.filter((slot) => slot.id !== state.slots.active);
        state.slots.active = state.slots.items[0]?.id ?? "";
    });
    renderSlotSelector(getState());
    renderActiveSlot(getState());
    syncSaveButtons();
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
    const remove = target.closest<HTMLElement>("[data-remove-kind]");
    if (remove) {
        removeEntry(`${remove.dataset["removeKind"]}:${remove.dataset["removeRef"]}`);
        return;
    }
    if (target.closest("#save-slot-clear")) {
        clearActiveSlot();
    } else if (target.closest("#save-slot-delete")) {
        deleteActiveSlot();
    } else if (target.closest("#save-slot-save")) {
        saveState(captureState());
    }
}

/**
 * Handle field changes inside the save-slot dialog.
 * @param event - Change event to inspect.
 */
function handleSlotChange(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
        return;
    }
    captureState();
    if (target.dataset["requirementRef"] !== undefined) {
        renderActiveSlot(getState());
    } else if (target.id === "save-slot-name") {
        renderSlotSelector(getState());
    }
}

/** Wire the save-slot selector and the dialog controls. */
function initSlotControls(): void {
    const select = document.querySelector<HTMLSelectElement>(
        "#save-slot-options .save-slot-selector",
    );
    select?.addEventListener("change", () => {
        updateState((state) => {
            state.slots.active = select.value;
        });
        renderActiveSlot(getState());
        syncSaveButtons();
    });
    const dialog = document.querySelector("#save-slot-dialog");
    dialog?.addEventListener("click", handleSlotClick);
    dialog?.addEventListener("change", handleSlotChange);
}

/**
 * Build a share link containing the current state.
 * @returns The share link.
 */
export function createShareLink(): string {
    return writeStateToQuery(captureState());
}

/**
 * Copy a fresh share link to the clipboard and put it into the address bar.
 * @param button - Share button used for the temporary feedback.
 */
async function shareState(button: HTMLElement): Promise<void> {
    const link = createShareLink();
    globalThis.history.replaceState(null, "", link);
    if (navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(link);
        } catch (error) {
            console.warn("Failed to copy the share link:", error);
        }
    }
    button.title = "Link kopiert!";
    setTimeout(() => {
        button.removeAttribute("title");
    }, 1500);
}

/** Wire the share button. */
function initShareButton(): void {
    const button = document.getElementById("share-button");
    button?.addEventListener("click", () => {
        void shareState(button);
    });
}
