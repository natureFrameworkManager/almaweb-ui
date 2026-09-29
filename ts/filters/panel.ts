/**
 * Interactive enhancements for the filter panel.
 *
 * Adds three usability layers on top of the static filter groups:
 *  - an active-filter summary bar with removable chips,
 *  - a per-group reset button,
 *  - in-list search and a "show more" expander for long option lists.
 *
 * The module only reads and writes the DOM; persisting the state and
 * re-querying the data is delegated to the callback passed to
 * {@link initFilterPanel}.
 */

/** Number of options shown before a long list is collapsed behind "Weitere". */
const OPTION_VISIBLE_LIMIT = 6;

/** Delay applied before the summary is rebuilt after a filter change. */
const SUMMARY_DEBOUNCE_MS = 150;

/** Checkbox facets that cycle through neutral, selected and hidden. */
const TRI_STATE_LISTS = [
    "filter-semester",
    "filter-faculty",
    "filter-degree",
    "filter-type",
    "filter-degree-types",
    "filter-event-buildings",
    "filter-event-staff",
    "filter-event-types",
    "filter-has-courses",
    "filter-has-events",
    "filter-has-staff",
    "filter-locations-accessible",
];

/** Callback invoked after a chip or a group reset changed the filters. */
let controlChangeCallback: (() => void) | null = null;

/** A removable entry of the active-filter summary. */
type SummaryChip = {
    label: string;
    clear: () => void;
};

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
 * Read the visible field label of a filter container.
 * @param container - Filter container to inspect.
 * @returns The label text, or a generic fallback.
 */
function containerLabel(container: HTMLElement): string {
    const label = container.querySelector(":scope > label");
    return label?.textContent?.trim() ?? "Filter";
}

/**
 * Build the summary chips of a checkbox list.
 * @param label - Field label of the list.
 * @param list - Checkbox list container.
 * @returns One chip per checked or excluded option.
 */
function checkboxListChips(label: string, list: HTMLElement): SummaryChip[] {
    const inputs = Array.from(list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    return inputs.flatMap((input) => {
        if (input.value === "" || (!input.checked && !input.indeterminate)) {
            return [];
        }
        const text = input.nextElementSibling?.textContent?.trim() ?? input.value;
        const suffix = input.indeterminate ? " (ausgeschlossen)" : "";
        return [
            {
                label: `${label}: ${text}${suffix}`,
                clear: (): void => {
                    input.checked = false;
                    input.indeterminate = false;
                },
            },
        ];
    });
}

/**
 * Build the summary chips of a min/max range filter.
 * @param label - Field label of the range.
 * @param container - Range filter container.
 * @returns One chip per bound that is set.
 */
function rangeChips(label: string, container: HTMLElement): SummaryChip[] {
    const [min, max] = Array.from(container.querySelectorAll<HTMLInputElement>("input"));
    const chips: SummaryChip[] = [];
    if (min && min.value !== "") {
        chips.push({
            label: `${label} ≥ ${min.value}`,
            clear: (): void => {
                min.value = "";
            },
        });
    }
    if (max && max.value !== "") {
        chips.push({
            label: `${label} ≤ ${max.value}`,
            clear: (): void => {
                max.value = "";
            },
        });
    }
    return chips;
}

/**
 * Build the summary chip of a select filter.
 * @param label - Field label of the select.
 * @param select - Select element to inspect.
 * @returns The chip, or an empty list when the default is selected.
 */
function selectChips(label: string, select: HTMLSelectElement): SummaryChip[] {
    if (select.value === "") {
        return [];
    }
    const option = select.selectedOptions[0];
    return [
        {
            label: `${label}: ${option?.textContent?.trim() ?? select.value}`,
            clear: (): void => {
                select.value = "";
            },
        },
    ];
}

/**
 * Build the summary chip of a single standalone checkbox.
 * @param label - Field label of the checkbox.
 * @param input - Checkbox element to inspect.
 * @returns The chip, or an empty list when the checkbox is neutral.
 */
function checkboxChips(label: string, input: HTMLInputElement): SummaryChip[] {
    if (input.indeterminate) {
        return [
            {
                label: `${label}: ausgeschlossen`,
                clear: (): void => {
                    input.checked = false;
                    input.indeterminate = false;
                },
            },
        ];
    }
    if (!input.checked) {
        return [];
    }
    return [
        {
            label,
            clear: (): void => {
                input.checked = false;
            },
        },
    ];
}

/**
 * Build the summary chips of free text, number and date inputs.
 * @param label - Field label of the inputs.
 * @param container - Container holding the inputs.
 * @returns One chip per input that has a value.
 */
function textInputChips(label: string, container: HTMLElement): SummaryChip[] {
    const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>('input:not([type="checkbox"])'),
    );
    return inputs
        .filter((input) => input.value.trim() !== "")
        .map((input) => ({
            label: `${label}: ${input.value.trim()}`,
            clear: (): void => {
                input.value = "";
            },
        }));
}

/**
 * Build the summary chips of a single filter container.
 * @param container - Filter container to inspect.
 * @returns The chips describing the active values of the container.
 */
function containerChips(container: HTMLElement): SummaryChip[] {
    const label = containerLabel(container);
    const list = container.querySelector("div.checkbox-list");
    if (list) {
        return checkboxListChips(label, list as HTMLElement);
    }
    if (container.classList.contains("range")) {
        return rangeChips(label, container);
    }
    const select = container.querySelector("select");
    if (select) {
        return selectChips(label, select as HTMLSelectElement);
    }
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    return checkbox ? checkboxChips(label, checkbox) : textInputChips(label, container);
}

/**
 * Collect the active-filter chips of every filter group.
 * @returns The chips describing the current filter values.
 */
function collectChips(): SummaryChip[] {
    const groups = document.querySelectorAll<HTMLElement>("#filter-options details.filter-group");
    return Array.from(groups).flatMap((group) =>
        Array.from(
            group.querySelectorAll<HTMLElement>(".filter-group-content .input-container"),
        ).flatMap((container) => containerChips(container)),
    );
}

/**
 * Create the removable chip element for a summary entry.
 * @param chip - Summary entry to render.
 * @returns The created chip button.
 */
function createChip(chip: SummaryChip): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    const text = document.createElement("span");
    text.textContent = chip.label;
    const icon = document.createElement("span");
    icon.className = "material-symbols";
    icon.textContent = "close";
    button.append(text, icon);
    button.addEventListener("click", () => {
        chip.clear();
        notifyChange();
    });
    return button;
}

/** Rebuild the active-filter summary from the current filter controls. */
export function refreshFilterSummary(): void {
    const summary = document.getElementById("filter-summary");
    const target = document.getElementById("filter-summary-chips");
    if (!summary || !target) {
        return;
    }
    const chips = collectChips();
    target.replaceChildren(...chips.map(createChip));
    summary.hidden = chips.length === 0;
}

/**
 * Reset every input inside a filter group content.
 * @param content - Filter group content to clear.
 */
function clearGroupContent(content: HTMLElement): void {
    content.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((input) => {
        input.checked = false;
        input.indeterminate = false;
    });
    content.querySelectorAll<HTMLInputElement>('input:not([type="checkbox"])').forEach((input) => {
        input.value = "";
    });
    content.querySelectorAll<HTMLSelectElement>("select").forEach((select) => {
        select.value = "";
    });
    content.querySelectorAll<HTMLInputElement>(".filter-option-search").forEach((input) => {
        input.value = "";
        input.dispatchEvent(new Event("filter-reset", { bubbles: true }));
    });
}

/**
 * Append a reset button to a filter group.
 * @param group - Filter group to attach the button to.
 */
function addGroupReset(group: HTMLElement): void {
    const content = group.querySelector<HTMLElement>(".filter-group-content");
    if (!content) {
        return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn ghost slim filter-group-reset";
    button.textContent = "Zurücksetzen";
    const title = group.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim();
    button.setAttribute("aria-label", `${title ?? "Filter"} zurücksetzen`);
    button.addEventListener("click", () => {
        clearGroupContent(content);
        notifyChange();
    });
    content.appendChild(button);
}

/**
 * Format the label of the "show more" toggle.
 * @param count - Number of options that are currently hidden.
 * @returns The toggle label.
 */
function moreLabel(count: number): string {
    return `Weitere anzeigen (${count})`;
}

/**
 * Add search and a "show more" expander to a long checkbox list.
 * @param container - Filter container holding the checkbox list.
 */
function enhanceOptionList(container: HTMLElement): void {
    const list = container.querySelector<HTMLElement>("div.checkbox-list");
    const field = container.querySelector<HTMLLabelElement>(":scope > label");
    if (!list || !field) {
        return;
    }
    const options = Array.from(
        list.querySelectorAll<HTMLLabelElement>("label.checkbox-item"),
    ).filter((option) => option.querySelector("input")?.value !== "");
    if (options.length <= OPTION_VISIBLE_LIMIT) {
        return;
    }
    const fieldName = field.textContent?.trim() ?? "Liste";
    let expanded = false;
    let term = "";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "filter-option-search";
    search.placeholder = "Suchen…";
    search.setAttribute("aria-label", `${fieldName} durchsuchen`);

    const more = document.createElement("button");
    more.type = "button";
    more.className = "filter-option-more";

    /** Apply the current search term and expand state to every option. */
    const applyVisibility = (): void => {
        let visible = 0;
        options.forEach((option, index) => {
            const input = option.querySelector<HTMLInputElement>("input");
            const active = Boolean(input?.checked || input?.indeterminate);
            const matches =
                term === "" || (option.textContent?.toLowerCase().includes(term) ?? false);
            const withinLimit = expanded || term !== "" || active || index < OPTION_VISIBLE_LIMIT;
            const show = matches && withinLimit;
            option.classList.toggle("option-hidden", !show);
            if (show) {
                visible += 1;
            }
        });
        more.hidden = expanded || term !== "";
        more.textContent = moreLabel(options.length - visible);
    };

    search.addEventListener("input", () => {
        term = search.value.trim().toLowerCase();
        applyVisibility();
    });
    more.addEventListener("click", () => {
        expanded = true;
        applyVisibility();
    });
    container.addEventListener("filter-reset", () => {
        term = "";
        expanded = false;
        search.value = "";
        applyVisibility();
    });

    list.after(search);
    container.prepend(more);
    applyVisibility();
}

/**
 * Enable click cycling neutral -> selected -> hidden on a facet list.
 *
 * The native checkbox toggle is replaced so the third state can be reached.
 * A synthetic change event keeps the existing listeners in sync.
 * @param containerId - Identifier of the checkbox list container.
 */
function enableTriStateCycling(containerId: string): void {
    const list = document.getElementById(containerId);
    if (!list) {
        return;
    }
    list.addEventListener("click", (event) => {
        const origin = event.target;
        if (!(origin instanceof Element)) {
            return;
        }
        const input = origin
            .closest("label.checkbox-item")
            ?.querySelector<HTMLInputElement>('input[type="checkbox"]');
        if (!input || input.value === "") {
            return;
        }
        event.preventDefault();
        const state = input.indeterminate ? "hidden" : input.checked ? "selected" : "neutral";
        const next = state === "neutral" ? "selected" : state === "selected" ? "hidden" : "neutral";
        input.checked = next === "selected";
        input.indeterminate = next === "hidden";
        input.dispatchEvent(new Event("change", { bubbles: true }));
    });
}

/**
 * Disable and annotate filter controls the API cannot honour.
 *
 * Containers marked with `data-unsupported` get a short note and their inputs
 * are disabled so the UI does not pretend the filter works.
 */
function markUnsupportedControls(): void {
    document
        .querySelectorAll<HTMLElement>("#filter-options [data-unsupported]")
        .forEach((container) => {
            container.classList.add("unsupported");
            const reason = container.dataset["unsupported"] ?? "Von der API nicht unterstützt.";
            container.title = reason;
            container
                .querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")
                .forEach((control) => {
                    control.disabled = true;
                });
            const note = document.createElement("p");
            note.className = "filter-note";
            note.textContent = reason;
            container.appendChild(note);
        });
}

/**
 * Wire the summary, per-group reset buttons, in-list search and expanders.
 * @param onChange - Callback invoked after a chip or reset changed the filters.
 */
export function initFilterPanel(onChange: () => void): void {
    controlChangeCallback = onChange;
    document
        .querySelectorAll<HTMLElement>("#filter-options details.filter-group")
        .forEach(addGroupReset);
    document
        .querySelectorAll<HTMLElement>("#filter-options .input-container")
        .forEach(enhanceOptionList);
    TRI_STATE_LISTS.forEach(enableTriStateCycling);
    markUnsupportedControls();
    const options = document.getElementById("filter-options");
    if (options) {
        const refresh = debounce(refreshFilterSummary, SUMMARY_DEBOUNCE_MS);
        options.addEventListener("input", refresh);
        options.addEventListener("change", refresh);
    }
}

/** Notify the host that a chip or a group reset changed the filters. */
function notifyChange(): void {
    if (controlChangeCallback !== null) {
        controlChangeCallback();
    }
}
