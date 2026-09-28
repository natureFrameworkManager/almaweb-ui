/**
 * Tri-state reading helpers for the checkbox facets.
 *
 * A facet option can be neutral, selected or excluded (rendered with the native
 * indeterminate state). The list endpoints only accept include-lists, so an
 * exclusion is translated into the complement of the excluded values.
 */

/** The selection state of a tri-state checkbox facet. */
export type FacetSelection = {
    selected: string[];
    hidden: string[];
    all: string[];
};

/**
 * Read a tri-state checkbox facet.
 * @param containerId - Identifier of the checkbox list container.
 * @returns The selected, hidden and available values.
 */
export function readFacetSelection(containerId: string): FacetSelection {
    const inputs = document.querySelectorAll<HTMLInputElement>(
        `#${containerId} input[type="checkbox"]`,
    );
    return Array.from(inputs).reduce<FacetSelection>(
        (facet, input) => {
            if (input.value === "") {
                return facet;
            }
            facet.all.push(input.value);
            if (input.indeterminate) {
                facet.hidden.push(input.value);
            } else if (input.checked) {
                facet.selected.push(input.value);
            }
            return facet;
        },
        { selected: [], hidden: [], all: [] },
    );
}

/**
 * Resolve the include-list of a tri-state facet.
 *
 * Selected values win. Otherwise excluded values are turned into their
 * complement, because the API only accepts include-lists.
 * @param containerId - Identifier of the checkbox list container.
 * @returns The values to include, or undefined when the facet does not filter.
 */
export function facetInclude(containerId: string): string[] | undefined {
    const { selected, hidden, all } = readFacetSelection(containerId);
    if (selected.length > 0) {
        return selected;
    }
    if (hidden.length === 0) {
        return undefined;
    }
    return all.filter((value) => !hidden.includes(value));
}
