// Marks the clicked item as active (and its siblings as inactive) within a single switcher nav
/**
 * Connect a navigation switcher to an optional selection callback.
 * @param navSelector - Selector for the switcher navigation.
 * @param onSelect - Optional callback for the selected value.
 * @param dataAttribute - Attribute containing the selected value.
 */
export function wireSwitcher(
    navSelector: string,
    onSelect?: (view: string) => void,
    dataAttribute = "data-view",
) {
    document.querySelectorAll(`${navSelector} > *`).forEach((item) => {
        item.addEventListener("click", () => {
            item.parentElement
                ?.querySelectorAll(":scope > *")
                .forEach((sibling) => sibling.classList.remove("active"));
            item.classList.add("active");
            onSelect?.(item.getAttribute(dataAttribute) ?? "");
        });
    });
}
