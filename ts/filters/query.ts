import {
    getCourses,
    getDegrees,
    getEvents,
    getExams,
    getLocations,
    getModules,
    getStaff,
} from "../api/api";
import type {
    Course,
    Degree,
    Event,
    Exam,
    Location,
    Module,
    PagedResponse,
    Staff,
} from "../api/types";
import { setPlaceholderVisible } from "../feedback";
import { facetInclude } from "./facets";
import { getActiveMainView } from "../layout";
import { getState } from "../state";
import { parseSortLevels, type SortLevel } from "../sort";
import { clearTree, displayTree } from "../tree";
import {
    COLLECTION_PAGE_SIZE,
    courseToView,
    degreeToView,
    eventToView,
    examToView,
    getActiveType,
    locationToView,
    moduleToView,
    registerCollection,
    reloadCollection,
    staffToView,
    type EntityView,
} from "../views";
import { resolveStaffNames } from "./options";

/** Debounce delay applied before re-querying filtered data. */
const FILTER_DEBOUNCE_MS = 350;

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

/**
 * Read the checked values of a checkbox filter list, excluding its default option.
 * @param containerId - Identifier of the checkbox list container.
 * @returns The values of the checked options.
 */
function getCheckedValues(containerId: string): string[] {
    const inputs = document.querySelectorAll<HTMLInputElement>(
        `#${containerId} input[type="checkbox"]:checked`,
    );
    return Array.from(inputs)
        .map((input) => input.value)
        .filter((value) => value !== "");
}

/**
 * Read the trimmed value of an input element.
 * @param elementId - Identifier of the input element.
 * @returns The trimmed value, or an empty string when the element is missing.
 */
function getInputValue(elementId: string): string {
    const input = document.getElementById(elementId) as HTMLInputElement | null;
    return input ? input.value.trim() : "";
}

/**
 * Read whether a checkbox element is checked.
 * @param elementId - Identifier of the checkbox element.
 * @returns Whether the checkbox is checked.
 */
function isChecked(elementId: string): boolean {
    const input = document.getElementById(elementId) as HTMLInputElement | null;
    return input?.checked ?? false;
}

/**
 * Read the selected value of a select element.
 * @param elementId - Identifier of the select element.
 * @returns The selected value, or an empty string when the element is missing.
 */
function getSelectedValue(elementId: string): string {
    const select = document.getElementById(elementId) as HTMLSelectElement | null;
    return select ? select.value : "";
}

/**
 * Collect the inputs of a range filter by its stable data key.
 * @param key - `data-range` key of the range filter.
 * @returns The range inputs, or an empty list when not found.
 */
function getRangeInputs(key: string): HTMLInputElement[] {
    const range = document.querySelector(`.input-container.range[data-range="${key}"]`);
    return range ? Array.from(range.querySelectorAll<HTMLInputElement>("input")) : [];
}

/**
 * Read the min and max inputs of a range filter.
 * @param key - `data-range` key of the range filter.
 * @returns The raw minimum and maximum values.
 */
function getRangeValues(key: string): { min: string; max: string } {
    const inputs = getRangeInputs(key);
    return {
        min: inputs.at(0)?.value ?? "",
        max: inputs.at(1)?.value ?? "",
    };
}

/**
 * Read a numeric range filter and parse its bounds.
 * @param key - `data-range` key of the range filter.
 * @returns The parsed minimum and maximum values.
 */
function getNumericRange(key: string): { min?: number; max?: number } {
    const { min, max } = getRangeValues(key);
    return {
        min: min === "" || Number.isNaN(Number(min)) ? undefined : Number(min),
        max: max === "" || Number.isNaN(Number(max)) ? undefined : Number(max),
    };
}

/**
 * Convert string values into optional numbers, dropping them when empty.
 * @param values - Values read from the filters.
 * @returns The numbers, or undefined when none are present.
 */
function toOptionalNumbers(values: string[]): number[] | undefined {
    return values.length > 0 ? values.map(Number) : undefined;
}

/**
 * Convert a value list into an optional value, dropping it when empty.
 * @param values - Values read from the filters.
 * @returns The values, or undefined when none are present.
 */
function toOptionalValues(values: string[]): string[] | undefined {
    return values.length > 0 ? values : undefined;
}

/**
 * Convert a string into an optional value, dropping it when empty.
 * @param value - Value read from a filter.
 * @returns The value, or undefined when empty.
 */
function toOptionalValue(value: string): string | undefined {
    return value === "" ? undefined : value;
}

/** A record that can be sorted by its name. */
type NamedRecord = {
    name: string;
};

/**
 * Compare two named records alphabetically.
 * @param a - First record.
 * @param b - Second record.
 * @returns The locale comparison result.
 */
function byName(a: NamedRecord, b: NamedRecord): number {
    return a.name.localeCompare(b.name);
}

/** Number of modules fetched per page when building the navigation tree. */
const TREE_PAGE_SIZE = 500;

/**
 * Read the primary sort level of the first pane showing an entity type.
 *
 * The API only accepts a single sort column, so the client forwards the primary
 * level to the backend and applies the remaining levels itself.
 * @param type - Entity type selector value.
 * @returns The sort column and direction, or empty defaults when unsorted.
 */
function backendSort(type: string): { sort?: string; order?: "asc" | "desc" } {
    const state = getState();
    const paneId = ([1, 2] as const).find((id) => getActiveType(id) === type) ?? 1;
    const level: SortLevel | undefined = parseSortLevels(state.display.panes[paneId].sort)[0];
    return level ? { sort: level.field, order: level.direction } : {};
}

/**
 * Fetch one page of modules using the current filter values.
 * @param page - Page number to load.
 * @param pageSize - Number of modules per page.
 * @returns The module page.
 */
function fetchModulePage(
    page: number,
    pageSize = COLLECTION_PAGE_SIZE,
): Promise<PagedResponse<Module>> {
    const { sort, order } = backendSort("modules");
    const credits = getNumericRange("module-credits");
    const duration = getNumericRange("module-duration");
    return getModules(
        toOptionalValue(getInputValue("search-input-module")),
        toOptionalValue(getInputValue("search-input-module-number")),
        toOptionalNumbers(facetInclude("filter-faculty") ?? []),
        toOptionalValue(getInputValue("filter-responsible-person")),
        credits.min,
        credits.max,
        duration.min,
        duration.max,
        facetInclude("filter-language"),
        toOptionalNumbers(facetInclude("filter-semester") ?? []),
        page,
        pageSize,
        sort,
        order,
    );
}

/**
 * Fetch one page of courses using the current filter values.
 * @param page - Page number to load.
 * @returns The course page.
 */
function fetchCoursePage(page: number): Promise<PagedResponse<Course>> {
    const { sort, order } = backendSort("courses");
    const hours = getNumericRange("course-weekly-hours");
    return getCourses(
        toOptionalValue(getInputValue("search-input-course")),
        toOptionalValue(getInputValue("search-input-course-number")),
        facetInclude("filter-type"),
        toOptionalNumbers(getCheckedValues("filter-instructors")),
        hours.min,
        hours.max,
        toOptionalNumbers(facetInclude("filter-semester") ?? []),
        page,
        COLLECTION_PAGE_SIZE,
        sort,
        order,
    );
}

/**
 * Fetch one page of events using the current filter values.
 * @param page - Page number to load.
 * @returns The event page.
 */
function fetchEventPage(page: number): Promise<PagedResponse<Event>> {
    const { sort, order } = backendSort("events");
    const startTime = getRangeValues("event-start-time");
    const endTime = getRangeValues("event-end-time");
    const dates = getRangeValues("event-dates");
    const building = getSelectedValue("filter-event-buildings");
    return getEvents(
        toOptionalValue(startTime.min),
        toOptionalValue(startTime.max),
        toOptionalValue(endTime.min),
        toOptionalValue(endTime.max),
        toOptionalValue(dates.min),
        toOptionalValue(dates.max),
        building === "" ? undefined : Number(building),
        toOptionalNumbers(facetInclude("filter-semester") ?? []),
        page,
        COLLECTION_PAGE_SIZE,
        sort,
        order,
    );
}

/**
 * Fetch one page of exams using the current filter values.
 * @param page - Page number to load.
 * @returns The exam page.
 */
function fetchExamPage(page: number): Promise<PagedResponse<Exam>> {
    const { sort, order } = backendSort("exams");
    const startTime = getRangeValues("exam-start-time");
    const endTime = getRangeValues("exam-end-time");
    const dates = getRangeValues("exam-dates");
    const names = toOptionalValues(
        [
            ...new Set([
                ...getCheckedValues("filter-examtypes"),
                getInputValue("search-input-exam"),
            ]),
        ].filter((value) => value !== ""),
    );
    return getExams(
        names,
        toOptionalValue(startTime.min),
        toOptionalValue(startTime.max),
        toOptionalValue(endTime.min),
        toOptionalValue(endTime.max),
        toOptionalValue(dates.min),
        toOptionalValue(dates.max),
        toOptionalValues(getCheckedValues("filter-buildings")),
        isChecked("filter-exam-required") ? true : undefined,
        resolveStaffNames(toOptionalNumbers(getCheckedValues("filter-staff")) ?? []),
        toOptionalNumbers(facetInclude("filter-semester") ?? []),
        page,
        COLLECTION_PAGE_SIZE,
        sort,
        order,
    );
}

/**
 * Fetch one page of staff.
 * @param page - Page number to load.
 * @returns The staff page.
 */
function fetchStaffPage(page: number): Promise<PagedResponse<Staff>> {
    const { sort, order } = backendSort("staff");
    return getStaff(page, COLLECTION_PAGE_SIZE, sort, order);
}

/**
 * Fetch one page of locations.
 * @param page - Page number to load.
 * @returns The location page.
 */
function fetchLocationPage(page: number): Promise<PagedResponse<Location>> {
    const { sort, order } = backendSort("locations");
    return getLocations(page, COLLECTION_PAGE_SIZE, sort, order);
}

/**
 * Fetch one page of degrees using the current filter values.
 * @param page - Page number to load.
 * @returns The degree page.
 */
function fetchDegreePage(page: number): Promise<PagedResponse<Degree>> {
    const { sort, order } = backendSort("degrees");
    return getDegrees(
        toOptionalValue(getInputValue("search-input-degree")),
        toOptionalValue(getInputValue("filter-degree-subject")),
        facetInclude("filter-degree-types"),
        undefined,
        page,
        COLLECTION_PAGE_SIZE,
        sort,
        order,
    );
}

/**
 * Register a paged collection that is sorted by name on the client.
 * @param type - Entity type selector value.
 * @param fetchPage - Page fetcher using the current filter values.
 * @param toView - Converter from a record to the shared entity view model.
 */
function registerType<T extends NamedRecord>(
    type: string,
    fetchPage: (page: number) => Promise<PagedResponse<T>>,
    toView: (item: T) => EntityView,
): void {
    registerCollection(type, { fetchPage, toView, sort: byName });
}

/** Register the paged collections backing the list and card views. */
export function registerCollections(): void {
    registerType("modules", fetchModulePage, moduleToView);
    registerType("courses", fetchCoursePage, courseToView);
    registerType("events", fetchEventPage, eventToView);
    registerType("exams", fetchExamPage, examToView);
    registerType("staff", fetchStaffPage, staffToView);
    registerType("locations", fetchLocationPage, locationToView);
    registerType("degrees", fetchDegreePage, degreeToView);
}

/** Re-query module data using the current filter values. */
export function requeryModules(): void {
    reloadCollection("modules");
    invalidateTree();
    refreshVisibleTrees();
}

/** Re-query course data using the current filter values. */
export function requeryCourses(): void {
    reloadCollection("courses");
}

/** Re-query event data using the current filter values. */
export function requeryEvents(): void {
    reloadCollection("events");
}

/** Re-query exam data using the current filter values. */
export function requeryExams(): void {
    reloadCollection("exams");
}

/** Re-query degree data using the current filter values. */
export function requeryDegrees(): void {
    reloadCollection("degrees");
}

/** Re-query every filtered entity type using the current filter values. */
export function requeryAll(): void {
    requeryModules();
    requeryCourses();
    requeryEvents();
    requeryExams();
    requeryDegrees();
}

let treeModules: Module[] | null = null;
let treeLoad: Promise<Module[]> | null = null;
let treeDirty = true;

/** Mark the cached navigation tree as stale. */
export function invalidateTree(): void {
    treeDirty = true;
}

/**
 * Fetch every filtered module needed to build the navigation tree.
 * @returns The complete filtered module list.
 */
async function fetchAllModules(): Promise<Module[]> {
    const first = await fetchModulePage(1, TREE_PAGE_SIZE);
    const remainingPages = Array.from(
        { length: Math.max(0, first.total_pages - 1) },
        (_, index) => index + 2,
    );
    const rest = await Promise.all(
        remainingPages.map((page) => fetchModulePage(page, TREE_PAGE_SIZE)),
    );
    return [first, ...rest].flatMap((response) => response.items);
}

/**
 * Return the module list used by the navigation tree, fetching it lazily.
 * @returns The module list, or null when loading failed.
 */
async function ensureTreeModules(): Promise<Module[] | null> {
    if (!treeDirty && treeModules) {
        return treeModules;
    }
    if (!treeLoad) {
        treeDirty = false;
        treeLoad = fetchAllModules();
    }
    try {
        treeModules = await treeLoad;
        return treeModules;
    } catch (error) {
        console.error("Failed to load the module tree:", error);
        treeDirty = true;
        return null;
    } finally {
        treeLoad = null;
    }
}

/**
 * Load the modules and render the navigation tree in a pane.
 * @param paneId - Pane identifier.
 */
export async function refreshTree(paneId: 1 | 2): Promise<void> {
    setPlaceholderVisible(`tree-loading${paneId}`, true);
    setPlaceholderVisible(`tree-error${paneId}`, false);
    setPlaceholderVisible(`tree-empty${paneId}`, false);
    const modules = await ensureTreeModules();
    setPlaceholderVisible(`tree-loading${paneId}`, false);
    if (!modules) {
        setPlaceholderVisible(`tree-error${paneId}`, true);
        return;
    }
    if (modules.length === 0) {
        clearTree(paneId);
        setPlaceholderVisible(`tree-empty${paneId}`, true);
        return;
    }
    displayTree([...modules].sort(byName), paneId, moduleToView);
}

/** Wire the retry buttons of the tree error states. */
export function initTreeRetry(): void {
    ([1, 2] as const).forEach((paneId) => {
        document.getElementById(`tree-retry${paneId}`)?.addEventListener("click", () => {
            invalidateTree();
            void refreshTree(paneId);
        });
    });
}

/** Refresh the navigation tree of every pane that currently shows it. */
function refreshVisibleTrees(): void {
    ([1, 2] as const).forEach((paneId) => {
        if (getActiveMainView(paneId) === "tree") {
            void refreshTree(paneId);
        }
    });
}

/** Definition of a range filter that is checked for an inverted bound. */
type RangeValidation = {
    key: string;
    errorId: string;
    kind: "number" | "date";
};

/** Every range filter that shows an inline error when its min exceeds its max. */
const RANGE_VALIDATIONS: RangeValidation[] = [
    { key: "module-credits", errorId: "error-module-credits", kind: "number" },
    { key: "module-duration", errorId: "error-module-duration", kind: "number" },
    { key: "course-weekly-hours", errorId: "error-course-hours", kind: "number" },
    { key: "event-start-time", errorId: "error-event-start", kind: "date" },
    { key: "event-end-time", errorId: "error-event-end", kind: "date" },
    { key: "event-dates", errorId: "error-event-dates", kind: "date" },
    { key: "exam-start-time", errorId: "error-exam-start", kind: "date" },
    { key: "exam-end-time", errorId: "error-exam-end", kind: "date" },
    { key: "exam-dates", errorId: "error-exam-dates", kind: "date" },
];

/**
 * Check whether a range has a minimum that exceeds its maximum.
 *
 * Numbers are compared numerically; ISO dates and `HH:MM` times sort correctly
 * as plain strings.
 * @param min - Minimum input value.
 * @param max - Maximum input value.
 * @param kind - How the values are compared.
 * @returns Whether the range is inverted.
 */
function isRangeInverted(min: string, max: string, kind: RangeValidation["kind"]): boolean {
    if (min === "" || max === "") {
        return false;
    }
    return kind === "number" ? Number(min) > Number(max) : min > max;
}

/** Validate every range filter and show inline errors for inverted ranges. */
export function validateFilterRanges(): void {
    RANGE_VALIDATIONS.forEach((rule) => {
        const inputs = getRangeInputs(rule.key);
        const min = inputs.at(0)?.value ?? "";
        const max = inputs.at(1)?.value ?? "";
        const invalid = isRangeInverted(min, max, rule.kind);
        const error = document.getElementById(rule.errorId);
        if (error) {
            error.textContent = invalid
                ? "Der Minimalwert darf den Maximalwert nicht überschreiten."
                : "";
        }
        inputs.forEach((input) =>
            input.closest(".input-container")?.classList.toggle("invalid", invalid),
        );
    });
}

/**
 * Attach a debounced re-query listener to a filter group.
 * @param groupId - Identifier of the filter group container.
 * @param onChange - Callback invoked after the debounce delay.
 */
export function wireFilterGroup(groupId: string, onChange: () => void): void {
    const group = document.getElementById(groupId);
    if (!group) {
        console.error(`Filter group "#${groupId}" is missing.`);
        return;
    }
    const debounced = debounce(onChange, FILTER_DEBOUNCE_MS);
    const handleChange = (): void => {
        validateFilterRanges();
        debounced();
    };
    group.addEventListener("input", handleChange);
    group.addEventListener("change", handleChange);
}
