/*
 * Bottom-sheet behaviour for the filter panel on small screens.
 *
 * On wide screens the filter panel is a static sidebar and the toggle button is
 * hidden, so this module only has an effect below the layout breakpoint. Open
 * state is expressed as the `filter-open` class on the body, which the CSS uses
 * to slide the sheet in and fade in the backdrop.
 */

/** Body class that marks the filter sheet as open. */
const OPEN_CLASS = "filter-open";

/** Whether the filter sheet is currently open. */
function isOpen(): boolean {
    return document.body.classList.contains(OPEN_CLASS);
}

/**
 * Open or close the filter sheet.
 * @param open - Whether the sheet should be open.
 */
function setOpen(open: boolean): void {
    document.body.classList.toggle(OPEN_CLASS, open);
    document.querySelector("#filter-toggle")?.setAttribute("aria-expanded", String(open));
}

/** Wire the filter sheet open, close and Escape interactions. */
export function initFilterSheet(): void {
    const toggle = document.querySelector("#filter-toggle");
    if (!toggle) {
        return;
    }
    toggle.addEventListener("click", () => setOpen(!isOpen()));
    document.querySelector("#filter-close")?.addEventListener("click", () => setOpen(false));
    document.querySelector("#filter-backdrop")?.addEventListener("click", () => setOpen(false));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && isOpen()) {
            setOpen(false);
        }
    });
}
