import "../css/main.css";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

import "./theme.ts";
import { attachViewChanger, attachDatatypeChanger, attachViewModeSwitcher } from "./layout.ts";

import "./state/data.ts";
import "./state/save.ts";

import "./filter/data.ts";
import "./filter/prefill-html.ts";
import "./filter/event-handler.ts";

import "./list/data.ts";
import "./list/list-html.ts";
import "./list/card-html.ts";

import "./calendar/compute.ts";
import "./calendar/render.ts";

import "./tree/compute.ts";
import "./tree/tree-html.ts";

import "./detail/dialog.ts";

import "./export/ical.ts";
import "./export/print.ts";
import "./export/share.ts";

// Layout changes
attachViewChanger();
attachDatatypeChanger();
attachViewModeSwitcher();

/**
 * Computes the scroll progress of an element.
 * If the element has no scrollable content, it is considered fully scrolled (returns 1).
 * @param element - The HTML element to compute scroll progress for.
 * @returns A floating-point number between 0 and 1 representing the scroll progress.
 */
function getElementScrollProgress(element: HTMLElement): number {
    // If there is no scrollable content, consider it fully scrolled
    if (element.scrollHeight <= element.clientHeight) {
        return 1;
    }
    // Compute scroll progress for scrollable content
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
}

document.querySelector("#module-list1")?.addEventListener("scroll", (event) => {
    const element = event.target as HTMLElement;
    const progress = getElementScrollProgress(element);
    console.log("Scroll progress:", progress);
});

console.log(`Baseline progress: ${getElementScrollProgress(document.querySelector("#module-list1") as HTMLElement)}`);
