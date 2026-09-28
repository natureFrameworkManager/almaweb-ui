import { getCourses, getExams, getLocations, getModules, getStaff } from "../api/api";
import type { Course, Exam, Location, Module, PagedResponse, Staff } from "../api/types";
import { getActiveMainView } from "../layout";
import { displayTree } from "../tree";
import {
    COLLECTION_PAGE_SIZE,
    courseToView,
    examToView,
    locationToView,
    moduleToView,
    registerCollection,
    reloadCollection,
    staffToView,
} from "../views";

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
 * Collect the inputs of a labelled range filter inside a group.
 * @param groupId - Identifier of the filter group container.
 * @param labelText - Visible label of the range filter.
 * @returns The range inputs, or an empty list when not found.
 */
function getRangeInputs(groupId: string, labelText: string): HTMLInputElement[] {
    const group = document.getElementById(groupId);
    if (!group) {
        return [];
    }
    const ranges = Array.from(group.querySelectorAll(".input-container.range"));
    const range = ranges.find((item) => item.querySelector("label")?.textContent === labelText);
    if (!range) {
        return [];
    }
    return Array.from(range.querySelectorAll<HTMLInputElement>("input"));
}

/**
 * Read the min and max inputs of a labelled range filter inside a group.
 * @param groupId - Identifier of the filter group container.
 * @param labelText - Visible label of the range filter.
 * @returns The raw minimum and maximum values.
 */
function getRangeValues(groupId: string, labelText: string): { min: string; max: string } {
    const inputs = getRangeInputs(groupId, labelText);
    return {
        min: inputs.at(0)?.value ?? "",
        max: inputs.at(1)?.value ?? "",
    };
}

/**
 * Read a labelled numeric range filter and parse its bounds.
 * @param groupId - Identifier of the filter group container.
 * @param labelText - Visible label of the range filter.
 * @returns The parsed minimum and maximum values.
 */
function getNumericRange(groupId: string, labelText: string): { min?: number; max?: number } {
    const { min, max } = getRangeValues(groupId, labelText);
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
 * Fetch one page of modules using the current filter values.
 * @param page - Page number to load.
 * @param pageSize - Number of modules per page.
 * @returns The module page.
 */
function fetchModulePage(
    page: number,
    pageSize = COLLECTION_PAGE_SIZE,
): Promise<PagedResponse<Module>> {
    const credits = getNumericRange("filter-group-module", "Leistungspunkte");
    const duration = getNumericRange("filter-group-module", "Semesterdauer");
    return getModules(
        toOptionalValue(getInputValue("search-input-module")),
        toOptionalValue(getInputValue("search-input-module-number")),
        toOptionalNumbers(getCheckedValues("filter-faculty")),
        toOptionalValue(getInputValue("filter-responsible-person")),
        credits.min,
        credits.max,
        duration.min,
        duration.max,
        toOptionalValues(getCheckedValues("filter-language")),
        toOptionalNumbers(getCheckedValues("filter-semester")),
        page,
        pageSize,
    );
}

/**
 * Fetch one page of courses using the current filter values.
 * @param page - Page number to load.
 * @returns The course page.
 */
function fetchCoursePage(page: number): Promise<PagedResponse<Course>> {
    const hours = getNumericRange("filter-group-course", "Wochenstunden");
    return getCourses(
        toOptionalValue(getInputValue("search-input-course")),
        toOptionalValue(getInputValue("search-input-course-number")),
        toOptionalValues(getCheckedValues("filter-type")),
        toOptionalNumbers(getCheckedValues("filter-instructors")),
        hours.min,
        hours.max,
        toOptionalNumbers(getCheckedValues("filter-semester")),
        page,
        COLLECTION_PAGE_SIZE,
    );
}

/**
 * Fetch one page of exams using the current filter values.
 * @param page - Page number to load.
 * @returns The exam page.
 */
function fetchExamPage(page: number): Promise<PagedResponse<Exam>> {
    const startTime = getRangeValues("filter-group-exam", "Start-Uhrzeit");
    const endTime = getRangeValues("filter-group-exam", "End-Uhrzeit");
    const dates = getRangeValues("filter-group-exam", "Datumszeitraum");
    return getExams(
        toOptionalValue(startTime.min),
        toOptionalValue(startTime.max),
        toOptionalValue(endTime.min),
        toOptionalValue(endTime.max),
        toOptionalValue(dates.min),
        toOptionalValue(dates.max),
        toOptionalValues(getCheckedValues("filter-buildings")),
        isChecked("filter-exam-required") ? true : undefined,
        toOptionalNumbers(getCheckedValues("filter-staff")),
        toOptionalNumbers(getCheckedValues("filter-semester")),
        page,
        COLLECTION_PAGE_SIZE,
    );
}

/**
 * Fetch one page of staff.
 * @param page - Page number to load.
 * @returns The staff page.
 */
function fetchStaffPage(page: number): Promise<PagedResponse<Staff>> {
    return getStaff(page, COLLECTION_PAGE_SIZE);
}

/**
 * Fetch one page of locations.
 * @param page - Page number to load.
 * @returns The location page.
 */
function fetchLocationPage(page: number): Promise<PagedResponse<Location>> {
    return getLocations(page, COLLECTION_PAGE_SIZE);
}

/** Register the paged collections backing the list and card views. */
export function registerCollections(): void {
    registerCollection("modules", {
        fetchPage: fetchModulePage,
        toView: moduleToView,
        sort: byName,
    });
    registerCollection("courses", {
        fetchPage: fetchCoursePage,
        toView: courseToView,
        sort: byName,
    });
    registerCollection("exams", {
        fetchPage: fetchExamPage,
        toView: examToView,
        sort: byName,
    });
    registerCollection("staff", {
        fetchPage: fetchStaffPage,
        toView: staffToView,
        sort: byName,
    });
    registerCollection("locations", {
        fetchPage: fetchLocationPage,
        toView: locationToView,
        sort: byName,
    });
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

/** Re-query exam data using the current filter values. */
export function requeryExams(): void {
    reloadCollection("exams");
}

/** Re-query every filtered entity type using the current filter values. */
export function requeryAll(): void {
    requeryModules();
    requeryCourses();
    requeryExams();
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
    const modules = await ensureTreeModules();
    if (modules) {
        displayTree([...modules].sort(byName), paneId, moduleToView);
    }
}

/** Refresh the navigation tree of every pane that currently shows it. */
function refreshVisibleTrees(): void {
    ([1, 2] as const).forEach((paneId) => {
        if (getActiveMainView(paneId) === "tree") {
            void refreshTree(paneId);
        }
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
    group.addEventListener("input", debounced);
    group.addEventListener("change", debounced);
}
