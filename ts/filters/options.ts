import type { Building, EventType, Faculty, Semester, Staff } from "../api/types";

export type FilterOption = {
    value: string;
    label: string;
};

/**
 * Create the checkbox input for a filter option.
 * @param optionId - Unique identifier for the checkbox input.
 * @param value - Value submitted when the checkbox is checked.
 * @returns The created checkbox input.
 */
function createFilterCheckbox(optionId: string, value: string): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = optionId;
    input.value = value;
    return input;
}

/**
 * Create a single selectable checkbox filter option.
 * @param optionId - Unique identifier for the option.
 * @param value - Value submitted when the option is checked.
 * @param label - Visible option label.
 * @returns The created checkbox option.
 */
function createFilterCheckboxOption(
    optionId: string,
    value: string,
    label: string,
): HTMLLabelElement {
    const option = document.createElement("label");
    option.className = "checkbox-item";
    option.htmlFor = optionId;
    option.appendChild(createFilterCheckbox(optionId, value));
    const text = document.createElement("span");
    text.textContent = label;
    option.appendChild(text);
    return option;
}

/**
 * Convert an option value into a safe identifier fragment.
 * @param value - Raw option value.
 * @returns A lowercase identifier without whitespace or special characters.
 */
function slugifyOptionValue(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Create a checkbox option with an identifier unique within its filter list.
 * @param containerId - Identifier of the checkbox list container.
 * @param option - Filter option to render.
 * @param usedIds - Identifiers already assigned within the container.
 * @returns The created checkbox option.
 */
function createFilterOptionItem(
    containerId: string,
    option: FilterOption,
    usedIds: Set<string>,
): HTMLLabelElement {
    const baseId = `${containerId}-${slugifyOptionValue(option.value)}`;
    const optionId = usedIds.has(baseId) ? `${baseId}-${usedIds.size}` : baseId;
    usedIds.add(optionId);
    return createFilterCheckboxOption(optionId, option.value, option.label);
}

/**
 * Append generated options after the static default of a checkbox filter list.
 * @param containerId - Identifier of the checkbox list container.
 * @param options - Filter options to render.
 */
export function appendCheckboxOptions(containerId: string, options: FilterOption[]): void {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Filter container "#${containerId}" is missing.`);
        return;
    }
    const usedIds = new Set<string>();
    options
        .map((option) => createFilterOptionItem(containerId, option, usedIds))
        .forEach((option) => container.appendChild(option));
}

/**
 * Create a single option element for a filter select.
 * @param value - Option value.
 * @param label - Visible option text.
 * @returns The created option element.
 */
function createSelectOption(value: string, label: string): HTMLOptionElement {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
}

/**
 * Append generated options after the static default of a filter select.
 * @param selectId - Identifier of the select element.
 * @param options - Filter options to render.
 */
export function appendSelectOptions(selectId: string, options: FilterOption[]): void {
    const select = document.getElementById(selectId) as HTMLSelectElement | null;
    if (!select) {
        console.error(`Filter select "#${selectId}" is missing.`);
        return;
    }
    options
        .map((option) => createSelectOption(option.value, option.label))
        .forEach((option) => select.appendChild(option));
}

/**
 * Convert semester records into filter options, newest semester first.
 * @param semesters - Semester records.
 * @returns The semester filter options.
 */
export function toSemesterOptions(semesters: Semester[]): FilterOption[] {
    return semesters
        .sort((a, b) => b.year - a.year || b.term.localeCompare(a.term))
        .map((semester) => ({ value: String(semester.id), label: semester.name }));
}

/**
 * Convert faculty records into filter options.
 * @param faculties - Faculty records.
 * @returns The faculty filter options.
 */
export function toFacultyOptions(faculties: Faculty[]): FilterOption[] {
    return faculties
        .sort((a, b) => a.id - b.id)
        .map((faculty) => ({ value: String(faculty.id), label: faculty.name }));
}

/**
 * Convert catalog event type records into filter options.
 * @param eventTypes - Event type records.
 * @returns The event type filter options.
 */
export function toEventTypeOptions(eventTypes: EventType[]): FilterOption[] {
    return eventTypes
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((eventType) => ({ value: String(eventType.id), label: eventType.name }));
}

/**
 * Convert staff records into filter options.
 * @param staff - Staff records.
 * @returns The staff filter options.
 */
export function toStaffOptions(staff: Staff[]): FilterOption[] {
    return staff
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((member) => ({ value: String(member.id), label: member.name }));
}

/**
 * Convert building records into filter options.
 * @param buildings - Building records.
 * @returns The building filter options.
 */
export function toBuildingOptions(buildings: Building[]): FilterOption[] {
    return buildings
        .filter((building) => building.name)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((building) => ({ value: String(building.id), label: building.name }));
}

/**
 * Convert distinct module language records into filter options.
 * @param languages - Distinct module language records.
 * @returns The language filter options.
 */
export function toLanguageOptions(languages: { language: string }[]): FilterOption[] {
    return languages
        .map((entry) => entry.language)
        .filter((language) => language)
        .sort((a, b) => a.localeCompare(b))
        .map((language) => ({ value: language, label: language }));
}

/**
 * Convert distinct exam name records into filter options.
 * @param examTypes - Distinct exam name records.
 * @returns The exam type filter options.
 */
export function toExamTypeOptions(examTypes: { name: string }[]): FilterOption[] {
    return examTypes
        .map((entry) => entry.name)
        .filter((name) => name)
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name }));
}
