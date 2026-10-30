// TODO: Execute update function on change

/**
 * Attaches event listeners to view changers in the navigation bar.
 * When a view changer item is clicked, it updates the active state and the corresponding data attribute on the body element.
 */
export function attachViewChanger() {
    [1, 2].forEach((changer) => {
        const changerElement = document.querySelector(`nav#display-changer${changer}`);
        if (!changerElement) {
            return;
        }

        changerElement.querySelectorAll<HTMLElement>("item").forEach((item) => {
            item.addEventListener("click", () => {
                changerElement
                    .querySelectorAll<HTMLElement>("item")
                    .forEach((i) => i.classList.remove("active"));
                item.classList.add("active");
                document.body.dataset[`pane${changer}View`] = item.dataset.view;
            });
        });
    });
}

/**
 * Attaches event listeners to datatype changers in the list card view headers.
 * When a datatype changer item is clicked, it updates the active state and the corresponding data attribute on the body element.
 */
export function attachDatatypeChanger() {
    [1, 2].forEach((view) => {
        const viewElement = document.querySelector(`main#list-card-view${view}`);
        if (!viewElement) {
            return;
        }

        viewElement
            .querySelectorAll<HTMLElement>("header.list-card-view-header div.type-switcher span")
            .forEach((item) => {
                item.addEventListener("click", () => {
                    viewElement
                        .querySelectorAll<HTMLElement>(
                            "header.list-card-view-header div.type-switcher span",
                        )
                        .forEach((i) => i.classList.remove("active"));
                    item.classList.add("active");
                    // document.body.dataset[`pane${view}Datatype`] = item.dataset.datatype;
                });
            });
    });
}

/**
 * Attaches event listeners to the view mode switcher in the navigation bar.
 * When a view mode switcher item is clicked, it updates the active state and the corresponding data attribute on the body element.
 */
export function attachViewModeSwitcher() {
    document.querySelectorAll<HTMLElement>("#view-switcher span").forEach((item) => {
        item.addEventListener("click", () => {
            document
                .querySelectorAll<HTMLElement>("#view-switcher span")
                .forEach((i) => i.classList.remove("active"));
            item.classList.add("active");
            document.body.dataset.viewMode = item.dataset.view;
        });
    });
}
