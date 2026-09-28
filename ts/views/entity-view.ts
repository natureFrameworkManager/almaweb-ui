export type EntityView = {
    name: string;
    number: string | null;
    listInfos: InfoSpec[];
    cardInfos: InfoSpec[];
};

export type InfoSpec = {
    className: string;
    text: string;
};

/**
 * Create an informational span for an entity view.
 * @param spec - Information span specification.
 * @returns The created information span.
 */
function createInfoSpan(spec: InfoSpec): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = `info ${spec.className}`;
    span.textContent = spec.text;
    return span;
}

/**
 * Append a heading with the requested level to an element.
 * @param parent - Parent element.
 * @param level - Heading level.
 * @param text - Heading text.
 */
function appendHeading(parent: HTMLElement, level: "h1" | "h2", text: string): void {
    const heading = document.createElement(level);
    heading.textContent = text;
    parent.appendChild(heading);
}

/**
 * Append a collection of informational spans to an element.
 * @param parent - Parent element.
 * @param infos - Information span specifications.
 */
function appendInfoContainer(parent: HTMLElement, infos: InfoSpec[]): void {
    const infoContainer = document.createElement("div");
    infoContainer.className = "info-container";
    infos.forEach((info) => infoContainer.appendChild(createInfoSpan(info)));
    parent.appendChild(infoContainer);
}

/**
 * Add an informational value when its text is not empty.
 * @param infos - Information list to update.
 * @param className - CSS class name.
 * @param text - Information text.
 */
export function addInfoIfPresent(infos: InfoSpec[], className: string, text: string): void {
    if (text) {
        infos.push({ className, text });
    }
}

/**
 * Create a button using the shared application button classes.
 * @param className - Button class names.
 * @param text - Button text.
 * @returns The created button.
 */
export function createActionButton(className: string, text: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = className;
    button.textContent = text;
    return button;
}

/**
 * Create the list representation of an entity.
 * @param view - Entity view data.
 * @returns The created list item.
 */
function createListItem(view: EntityView): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "list-item";
    appendHeading(item, "h1", view.name);
    if (view.number) {
        appendHeading(item, "h2", view.number);
    }
    appendInfoContainer(item, view.listInfos);
    item.appendChild(createActionButton("btn material-symbols", "save"));

    return item;
}

/**
 * Create the card representation of an entity.
 * @param view - Entity view data.
 * @returns The created card.
 */
function createCard(view: EntityView): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "card";
    appendHeading(card, "h1", view.name);
    if (view.number) {
        appendHeading(card, "h2", view.number);
    }
    appendInfoContainer(card, view.cardInfos);

    const btnCon = document.createElement("div");
    btnCon.className = "btn-con";
    btnCon.appendChild(createActionButton("btn", "Mehr Details"));
    btnCon.appendChild(createActionButton("btn material-symbols", "save"));
    card.appendChild(btnCon);

    return card;
}

// Renders items into every pane's list/card-grid for the given type (both list-card-view1 and list-card-view2)
/**
 * Render entity data into all matching list and card containers.
 * @param type - Entity type selector value.
 * @param items - Entity records to render.
 * @param toView - Entity-to-view converter.
 */
export function renderEntities<T>(type: string, items: T[], toView: (item: T) => EntityView) {
    const views = items.map(toView);

    document.querySelectorAll(`.type-content[data-type="${type}"] > ul.list`).forEach((listEl) => {
        listEl.innerHTML = "";
        views.forEach((view) => listEl.appendChild(createListItem(view)));
    });
    document
        .querySelectorAll(`.type-content[data-type="${type}"] > div.card-grid`)
        .forEach((gridEl) => {
            gridEl.innerHTML = "";
            views.forEach((view) => gridEl.appendChild(createCard(view)));
        });
}
