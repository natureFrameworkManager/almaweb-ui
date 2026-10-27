// TODO: Execute update function on change

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
