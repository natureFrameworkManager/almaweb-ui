import { getCourses, getExams, getModules } from "../api/api";
import { displayTree } from "../tree";
import { courseToView, examToView, moduleToView, renderEntities } from "../views";

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

/** Re-query module data using the current filter values. */
export function requeryModules(): void {
    const credits = getNumericRange("filter-group-module", "Leistungspunkte");
    const duration = getNumericRange("filter-group-module", "Semesterdauer");
    getModules(
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
    )
        .then((modules) => {
            const sorted = modules.items.sort((a, b) => a.name.localeCompare(b.name));
            renderEntities("modules", sorted, moduleToView);
            displayTree(sorted, 1);
            displayTree(sorted, 2);
        })
        .catch((error) => {
            console.error("Failed to fetch modules:", error);
        });
}

/** Re-query course data using the current filter values. */
export function requeryCourses(): void {
    const hours = getNumericRange("filter-group-course", "Wochenstunden");
    getCourses(
        toOptionalValue(getInputValue("search-input-course")),
        toOptionalValue(getInputValue("search-input-course-number")),
        toOptionalValues(getCheckedValues("filter-type")),
        toOptionalNumbers(getCheckedValues("filter-instructors")),
        hours.min,
        hours.max,
        toOptionalNumbers(getCheckedValues("filter-semester")),
    )
        .then((courses) => {
            renderEntities(
                "courses",
                courses.items.sort((a, b) => a.name.localeCompare(b.name)),
                courseToView,
            );
        })
        .catch((error) => {
            console.error("Failed to fetch courses:", error);
        });
}

/** Re-query exam data using the current filter values. */
export function requeryExams(): void {
    const startTime = getRangeValues("filter-group-exam", "Start-Uhrzeit");
    const endTime = getRangeValues("filter-group-exam", "End-Uhrzeit");
    const dates = getRangeValues("filter-group-exam", "Datumszeitraum");
    getExams(
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
    )
        .then((exams) => {
            renderEntities(
                "exams",
                exams.items.sort((a, b) => a.name.localeCompare(b.name)),
                examToView,
            );
        })
        .catch((error) => {
            console.error("Failed to fetch exams:", error);
        });
}

/** Re-query every filtered entity type using the current filter values. */
export function requeryAll(): void {
    requeryModules();
    requeryCourses();
    requeryExams();
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
