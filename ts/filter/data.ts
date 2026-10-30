/**
 * Collects the value of a text input field, optionally splitting it into an array of strings.
 * @param selector - The CSS selector for the input element.
 * @param root - The root element to query within, defaults to the document.
 * @param split - Whether to split the input value by commas and trim the results.
 * @returns The input value as a string or an array of strings if split is true.
 */
function collectTextField(selector: string, root: HTMLElement | Document = document, split: boolean = false):  string[] | string {
    const input = root.querySelector(selector) as HTMLInputElement;
    if (!input) {
        return split ? [] : "";
    }
    const value = input.value;
    return split ? value.split(",").map((v) => v.trim()).filter((v) => v.length > 0) : value;
}

/**
 * Collects the checked state of a list of checkboxes.
 * @param selector - The CSS selector for the checkboxes.
 * @param root - The root element to query within, defaults to the document.
 * @returns An object mapping checkbox values to their checked state.
 */
function collectCheckboxLists(selector: string, root: HTMLElement | Document = document): Record<string, boolean> {
    const checkboxes = root.querySelectorAll(selector) as NodeListOf<HTMLInputElement>;
    const selected: Record<string, boolean> = {};
    checkboxes.forEach((checkbox) => {
        selected[checkbox.value] = checkbox.checked;
    });
    return selected;
}

/**
 * Collects the numeric range from two input fields.
 * @param selectorMin - The CSS selector for the minimum value input.
 * @param selectorMax - The CSS selector for the maximum value input.
 * @param root - The root element to query within, defaults to the document.
 * @returns A tuple containing the minimum and maximum values, or null if not specified.
 */
function collectNumberRange(selectorMin: string, selectorMax: string, root: HTMLElement | Document = document): [number | null, number | null] {
    const inputMin = root.querySelector(selectorMin) as HTMLInputElement;
    const inputMax = root.querySelector(selectorMax) as HTMLInputElement;
    const min = inputMin && inputMin.value ? parseFloat(inputMin.value) : null;
    const max = inputMax && inputMax.value ? parseFloat(inputMax.value) : null;
    return [min, max];
}

/**
 * Collects the checked state of a single checkbox.
 * @param selector - The CSS selector for the checkbox.
 * @param root - The root element to query within, defaults to the document.
 * @returns True if the checkbox is checked, false otherwise.
 */
function collectCheckbox(selector: string, root: HTMLElement | Document = document): boolean {
    const checkbox = root.querySelector(selector) as HTMLInputElement;
    return checkbox ? checkbox.checked : false;
}

/**
 * Collects the selected module filters from the filter form.
 * @returns An object containing the selected module filters, with keys representing filter names and values representing the selected filter values.
 */
function collectModuleFilters(): Record<string, string | string[] | Record<string, boolean> | [number | null, number | null] | boolean> {
    const section = document.querySelector("details#filter-group-module") as HTMLDetailsElement | null;
    if (!section) {
        return {};
    }
    const names = collectTextField("input#search-input-module", section, true) as string[];
    const numbers = collectTextField("input#search-input-module-number", section, true) as string[];
    const faculties: Record<string, boolean> = collectCheckboxLists("div#filter-faculty input[type='checkbox']", section);
    const responsiblePersons = collectTextField("input#filter-responsible-person", section, true) as string[];
    const credits: [number | null, number | null] = collectNumberRange("input#filter-module-credits-min", "input#filter-module-credits-max", section);
    const duration: [number | null, number | null] = collectNumberRange("input#filter-module-duration-min", "input#filter-module-duration-max", section);
    const degree: Record<string, boolean> = collectCheckboxLists("div#filter-degree input[type='checkbox']", section);
    const hasCourses: boolean = collectCheckbox("input#filter-has-courses-true", section);
    const hasEvents: boolean = collectCheckbox("input#filter-has-events-true", section);
    const hasStaff: boolean = collectCheckbox("input#filter-has-staff-true", section);
    const path = collectTextField("input#filter-module-path", section, true) as string[];
    const pathPrefix = collectTextField("input#filter-path-prefix", section, false) as string;
    
    const selectedFilters: Record<string, string | string[] | Record<string, boolean> | [number | null, number | null] | boolean> = {
        name: names,
        number: numbers,
        faculties: faculties,
        responsiblePersons: responsiblePersons,
        credits: credits,
        duration: duration,
        degree: degree,
        hasCourses: hasCourses,
        hasEvents: hasEvents,
        hasStaff: hasStaff,
        path: path,
        pathPrefix: pathPrefix
    };
    return selectedFilters;
}

document.querySelectorAll("details#filter-group-module input").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
        console.log(collectModuleFilters());
    });
});