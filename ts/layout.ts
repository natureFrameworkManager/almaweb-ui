const activeMainViews: Record<1 | 2, string> = { 1: "list", 2: "list" };

/** Layout modes supported by the application. */
type ViewMode = "single" | "split" | "compare";

/**
 * Read the stored layout preference from the body.
 * @returns The layout mode the user selected, defaulting to single.
 */
function preferredViewMode(): ViewMode {
    const mode = document.body.dataset.viewMode;
    return mode === "split" || mode === "compare" ? mode : "single";
}

/**
 * Mirror the current layout mode on the view switcher.
 * @param mode - Layout mode that is rendered.
 */
function syncViewSwitcher(mode: ViewMode): void {
    document.querySelectorAll("#view-switcher [data-view]").forEach((option) => {
        option.classList.toggle("active", (option as HTMLElement).dataset["view"] === mode);
    });
}

/**
 * Reflect the layout mode on the body so the responsive CSS can react.
 *
 * Every mode is available at any width, so the rendered mode is simply mirrored
 * from the stored preference into `data-effective-view-mode`; the stored
 * preference stays in `data-view-mode`.
 */
export function applyViewMode(): void {
    const mode = preferredViewMode();
    document.body.dataset.effectiveViewMode = mode;
    syncViewSwitcher(mode);
}

/**
 * Check whether a pane is rendered in the effective layout mode.
 * @param paneId - Pane identifier.
 * @returns Whether the pane is visible.
 */
export function isPaneVisible(paneId: 1 | 2): boolean {
    const viewMode = document.body.dataset.effectiveViewMode ?? "single";
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
 * Publish the active sub-view of a pane on the body for the CSS to render.
 * @param paneId - Pane identifier.
 * @param view - View name to activate.
 */
function setPaneView(paneId: 1 | 2, view: string): void {
    document.body.dataset[paneId === 1 ? "pane1View" : "pane2View"] = view;
}

/**
 * Switch one pane between its list, calendar, and tree views.
 *
 * The active view is published as a body data attribute; which pane is visible
 * is decided by the CSS from the effective layout mode, so the rendering can
 * adapt to the viewport without the behaviour layer writing any inline styles.
 * @param paneId - Pane identifier.
 * @param view - View name to activate.
 */
export function switchMainView(paneId: 1 | 2, view: string): void {
    activeMainViews[paneId] = view;
    setPaneView(paneId, view);
}

/**
 * Switch between single, split, and comparison layouts.
 *
 * The requested mode is stored as the preference; the renderable mode is derived
 * from the viewport width by {@link applyViewMode}.
 * @param mode - Layout mode to activate.
 */
export function switchViewMode(mode: ViewMode): void {
    document.body.dataset.viewMode = mode;
    applyViewMode();
}
