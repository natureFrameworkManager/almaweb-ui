import type { EntryKind } from "../state";

/** Entity kinds that can be shown in the detail dialog. */
export type DetailKind = EntryKind | "building" | "faculty" | "semester" | "degree";

export type EntityView = {
    name: string;
    number: string | null;
    listInfos: InfoSpec[];
    cardInfos: InfoSpec[];
    detailsId?: string;
    detailsKind?: DetailKind;
    entityKind?: EntryKind;
    entityId?: number;
    /** Credit points of the entity, when it has any. */
    lp?: number;
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
 * Create the save toggle button of an entity.
 *
 * The button carries the entity kind and id so the state layer can save it into
 * the active save slot regardless of the entity type.
 * @param view - Entity view data.
 * @returns The created save button, or null when the entity cannot be saved.
 */
function createSaveButton(view: EntityView): HTMLButtonElement | null {
    if (view.entityKind === undefined || view.entityId === undefined) {
        return null;
    }
    const button = createActionButton("btn material-symbols save-toggle", "save");
    button.dataset["saveKind"] = view.entityKind;
    button.dataset["saveRef"] = String(view.entityId);
    button.setAttribute("aria-pressed", "false");
    return button;
}

/**
 * Create the button that opens the shared detail dialog for an entity.
 * @param view - Entity view data.
 * @returns The created details button, or null when no detail is available.
 */
function createDetailsButton(view: EntityView): HTMLButtonElement | null {
    if (!view.detailsId) {
        return null;
    }
    const button = createActionButton("btn", "Mehr Details");
    button.dataset["detailsId"] = view.detailsId;
    if (view.detailsKind) {
        button.dataset["detailsKind"] = view.detailsKind;
    }
    button.setAttribute("popovertarget", "detail-dialog");
    button.setAttribute("popovertargetaction", "toggle");
    return button;
}

/**
 * Create the action row of an entity, keeping only the available actions.
 * @param view - Entity view data.
 * @returns The action row, or null when the entity has no actions.
 */
function createActionRow(view: EntityView): HTMLDivElement | null {
    const details = createDetailsButton(view);
    const save = createSaveButton(view);
    if (!details && !save) {
        return null;
    }
    const row = document.createElement("div");
    row.className = "btn-con";
    if (details) {
        row.appendChild(details);
    }
    if (save) {
        row.appendChild(save);
    }
    return row;
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
    const actions = createActionRow(view);
    if (actions) {
        item.appendChild(actions);
    }

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
    const actions = createActionRow(view);
    if (actions) {
        card.appendChild(actions);
    }

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
