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

/**
 * Handle the update to content on scroll to implement lazy loading
 * @param scrollContainerSelector - Container to watch for scroll
 * @param loaderFunction - Update function to load new content and display it
 */
export async function lazyLoader(
    scrollContainerSelector: string,
    loaderFunction: () => Promise<{ expanded: boolean; moreData: boolean }>,
) {
    const scrollElement: HTMLElement | null = document.querySelector(scrollContainerSelector);
    if (scrollElement === undefined || scrollElement === null) {
        console.error(`Scroll element not found for selector: ${scrollContainerSelector}`);
        return;
    }

    // Initial load content until container has progress under 50%
    console.log(`Initial scroll progress: ${getElementScrollProgress(scrollElement)}`);
    while (getElementScrollProgress(scrollElement) > 0.5) {
        const result = await loaderFunction();
        if (!result.moreData) {
            break;
        }
    }

    // Load new content on scroll if progress drops under 75% until again under 50%
    let waitingPromise: Promise<{ expanded: boolean; moreData: boolean }> | null = null;
    scrollElement.addEventListener("scroll", async () => {
        // Check if a request is already in progress
        // If a request is already in progress, wait for it to complete before making a new one
        // Only if the scroll progress is above 75% and no request is in progress, make a new request
        if (waitingPromise) {
            await waitingPromise;
        }
        if (getElementScrollProgress(scrollElement) > 0.75 && !waitingPromise) {
            waitingPromise = loaderFunction();
            const result = await waitingPromise;
            waitingPromise = null;
            if (!result.moreData) {
                scrollElement.removeEventListener("scroll", async () => {});
            }
        }
    });
}
