const activeMainViews: Record<1 | 2, string> = { 1: "list", 2: "list" };

// List/cards switching within a pane is handled purely by CSS reacting to the "active" class; here we
// only need to toggle which top-level main (list-card-view/calendar/tree) is visible per pane.
/**
 * Set the display state for a group of pane elements.
 * @param elements - Pane elements to update.
 * @param visible - Whether the elements should be visible.
 */
function setPaneViewVisibility(elements: HTMLElement[], visible: boolean): void {
    elements.forEach((element) => {
        element.style.display = visible ? "" : "none";
    });
}

/**
 * Check whether a pane is visible in the current layout mode.
 * @param paneId - Pane identifier.
 * @returns Whether the pane is visible.
 */
export function isPaneVisible(paneId: 1 | 2): boolean {
    const viewMode = document.body.dataset.viewMode ?? "single";
    return paneId === 1 ? viewMode !== "compare" : viewMode === "split";
}

/**
 * Read the main view currently active in a pane.
 * @param paneId - Pane identifier.
 * @returns The active main view name.
 */
export function getActiveMainView(paneId: 1 | 2): string {
    return activeMainViews[paneId];
}

/**
 * Check whether a view is rendered by the list/card container.
 * @param view - View name.
 * @returns Whether the view uses the list/card container.
 */
function isListCardView(view: string): boolean {
    return view === "list" || view === "cards";
}

/**
 * Update the visibility of one named pane view.
 * @param element - Pane element to update.
 * @param paneIsVisible - Whether the pane is visible.
 * @param view - Current view name.
 * @param expectedView - View name represented by the element.
 */
function updatePaneView(
    element: HTMLElement,
    paneIsVisible: boolean,
    view: string,
    expectedView: string,
): void {
    setPaneViewVisibility([element], paneIsVisible && view === expectedView);
}

/**
 * Switch one pane between its list, calendar, and tree views.
 * @param paneId - Pane identifier.
 * @param view - View name to activate.
 */
export function switchMainView(paneId: 1 | 2, view: string): void {
    const listCardView = document.querySelector(`#list-card-view${paneId}`) as HTMLElement | null;
    const calendarView = document.querySelector(`#calendar${paneId}`) as HTMLElement | null;
    const treeView = document.querySelector(`#tree${paneId}`) as HTMLElement | null;

    if (!listCardView || !calendarView || !treeView) {
        console.error("One or more view elements are missing.");
        return;
    }

    activeMainViews[paneId] = view;
    const paneIsVisible = isPaneVisible(paneId);

    setPaneViewVisibility([listCardView], paneIsVisible && isListCardView(view));
    updatePaneView(calendarView, paneIsVisible, view, "calendar");
    updatePaneView(treeView, paneIsVisible, view, "tree");
}

/**
 * Switch between single, split, and comparison layouts.
 * @param mode - Layout mode to activate.
 */
export function switchViewMode(mode: "single" | "split" | "compare") {
    document.body.dataset.viewMode = mode;
    switchMainView(1, activeMainViews[1]);
    switchMainView(2, activeMainViews[2]);

    const compareView = document.querySelector("#compare") as HTMLElement | null;
    if (!compareView) {
        console.error("Compare view is missing.");
        return;
    }
    compareView.style.display = mode === "compare" ? "" : "none";
}
