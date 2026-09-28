export type EntityView = {
    name: string;
    number: string | null;
    listInfos: InfoSpec[];
    cardInfos: InfoSpec[];
    detailsId?: string;
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
 * Create the button that opens the shared detail dialog for an entity.
 * @param view - Entity view data.
 * @returns The created details button.
 */
function createDetailsButton(view: EntityView): HTMLButtonElement {
    const button = createActionButton("btn", "Mehr Details");
    if (view.detailsId) {
        button.dataset["detailsId"] = view.detailsId;
        button.setAttribute("popovertarget", "detail-dialog");
        button.setAttribute("popovertargetaction", "toggle");
    }
    return button;
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
    btnCon.appendChild(createDetailsButton(view));
    btnCon.appendChild(createActionButton("btn material-symbols", "save"));
    card.appendChild(btnCon);

    return card;
}

/** The two representations an entity can be rendered as. */
export type EntityKind = "list" | "card";

/**
 * Build the DOM node representing an entity view.
 * @param kind - Representation to build.
 * @param view - Entity view data.
 * @returns The created list item or card.
 */
function createEntityNode(kind: EntityKind, view: EntityView): HTMLElement {
    return kind === "list" ? createListItem(view) : createCard(view);
}

/**
 * Append the entity views that are not rendered yet to a container.
 *
 * The number of already rendered views is tracked on the container itself, so
 * calling this repeatedly only creates the missing nodes and preserves the
 * current scroll position. When the incoming data shrinks (for example after a
 * filter change) the container is reset first.
 * @param container - List or card-grid container to fill.
 * @param kind - Representation to render.
 * @param views - Entity views to display.
 */
export function syncEntityContainer(
    container: HTMLElement,
    kind: EntityKind,
    views: EntityView[],
): void {
    const renderedCount = container.dataset["renderedCount"];
    const rendered = renderedCount === undefined ? 0 : Number(renderedCount);

    if (renderedCount === undefined || Number.isNaN(rendered) || rendered > views.length) {
        container.replaceChildren();
        container.dataset["renderedCount"] = "0";
    }

    const start = Number(container.dataset["renderedCount"] ?? "0");
    const fragment = document.createDocumentFragment();
    views.slice(start).forEach((view) => fragment.append(createEntityNode(kind, view)));
    container.append(fragment);
    container.dataset["renderedCount"] = String(views.length);
}
