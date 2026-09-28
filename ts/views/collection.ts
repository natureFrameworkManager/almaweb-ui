import type { PagedResponse } from "../api/types";
import { getActiveMainView, isPaneVisible } from "../layout";
import { syncEntityContainer, type EntityKind, type EntityView } from "./entity-view";

/** Number of entities requested per page. */
export const COLLECTION_PAGE_SIZE = 40;

/** Distance in pixels from the bottom at which the next page is requested. */
const LOAD_MORE_THRESHOLD = 300;

/** Maps an entity type to the id prefix of its list/card containers. */
const TYPE_ID_PREFIX: Record<string, string> = {
    modules: "module",
    courses: "course",
    events: "event",
    exams: "exam",
    staff: "staff",
    locations: "location",
};

type CollectionConfig<T> = {
    fetchPage: (page: number) => Promise<PagedResponse<T>>;
    toView: (item: T) => EntityView;
    sort: (a: T, b: T) => number;
};

type Collection = {
    fetchPage: (page: number) => Promise<PagedResponse<unknown>>;
    toView: (item: unknown) => EntityView;
    sort: (a: unknown, b: unknown) => number;
    views: EntityView[];
    page: number;
    totalPages: number;
    loaded: boolean;
    loading: boolean;
    generation: number;
};

const collections = new Map<string, Collection>();

/** Entity type currently selected in each pane. */
const activeTypes: Record<1 | 2, string> = { 1: "modules", 2: "modules" };

/**
 * Register a paged collection for an entity type.
 * @param type - Entity type selector value.
 * @param config - Page fetcher, view converter and sort comparator.
 */
export function registerCollection<T>(type: string, config: CollectionConfig<T>): void {
    collections.set(type, {
        fetchPage: config.fetchPage,
        toView: config.toView as (item: unknown) => EntityView,
        sort: config.sort as (a: unknown, b: unknown) => number,
        views: [],
        page: 0,
        totalPages: 0,
        loaded: false,
        loading: false,
        generation: 0,
    });
}

/**
 * Resolve the container id for a type, pane and representation.
 * @param type - Entity type selector value.
 * @param paneId - Pane identifier.
 * @param kind - Representation to render.
 * @returns The container id, or null when the type is unknown.
 */
function containerId(type: string, paneId: 1 | 2, kind: EntityKind): string | null {
    const prefix = TYPE_ID_PREFIX[type];
    if (!prefix) {
        return null;
    }
    return `${prefix}-${kind === "list" ? "list" : "card-grid"}${paneId}`;
}

/**
 * Read the representation a pane currently shows.
 * @param paneId - Pane identifier.
 * @returns The representation, or null when another main view is active.
 */
function paneKind(paneId: 1 | 2): EntityKind | null {
    const view = getActiveMainView(paneId);
    if (view === "list") {
        return "list";
    }
    return view === "cards" ? "card" : null;
}

/**
 * Check whether a pane currently shows a list or card grid.
 * @param paneId - Pane identifier.
 * @returns Whether the pane displays a collection.
 */
function paneShowsCollections(paneId: 1 | 2): boolean {
    return isPaneVisible(paneId) && paneKind(paneId) !== null;
}

/**
 * Check whether a collection is displayed in any visible pane.
 * @param type - Entity type selector value.
 * @returns Whether the collection is currently needed.
 */
function isCollectionNeeded(type: string): boolean {
    return ([1, 2] as const).some(
        (paneId) => paneShowsCollections(paneId) && activeTypes[paneId] === type,
    );
}

/**
 * Render a collection into every visible pane that displays it.
 * @param type - Entity type selector value.
 */
function renderCollection(type: string): void {
    const collection = collections.get(type);
    if (!collection) {
        return;
    }
    ([1, 2] as const).forEach((paneId) => {
        const kind = paneKind(paneId);
        if (activeTypes[paneId] !== type || kind === null || !isPaneVisible(paneId)) {
            return;
        }
        const id = containerId(type, paneId, kind);
        const container = id === null ? null : document.getElementById(id);
        if (container) {
            syncEntityContainer(container, kind, collection.views);
        }
    });
}

/**
 * Clear the rendered content of every container for a type.
 * @param type - Entity type selector value.
 */
function clearCollectionContainers(type: string): void {
    ([1, 2] as const).forEach((paneId) => {
        (["list", "card"] as EntityKind[]).forEach((kind) => {
            const id = containerId(type, paneId, kind);
            const container = id === null ? null : document.getElementById(id);
            if (container) {
                container.replaceChildren();
                container.dataset["renderedCount"] = "0";
            }
        });
    });
}

/**
 * Check whether more pages are available for a collection.
 * @param collection - Collection to inspect.
 * @returns Whether another page can be loaded.
 */
function hasMorePages(collection: Collection): boolean {
    return !collection.loaded || collection.page < collection.totalPages;
}

/**
 * Load the next page of a collection and render it.
 * @param type - Entity type selector value.
 */
async function loadNextPage(type: string): Promise<void> {
    const collection = collections.get(type);
    if (!collection || collection.loading || !hasMorePages(collection)) {
        return;
    }
    const generation = collection.generation;
    const nextPage = collection.page + 1;
    collection.loading = true;
    try {
        const response = await collection.fetchPage(nextPage);
        if (generation !== collection.generation) {
            return;
        }
        const pageViews = [...response.items].sort(collection.sort).map(collection.toView);
        collection.views.push(...pageViews);
        collection.page = nextPage;
        collection.totalPages = response.total_pages;
        collection.loaded = true;
        renderCollection(type);
    } catch (error) {
        console.error(`Failed to load ${type}:`, error);
    } finally {
        if (generation === collection.generation) {
            collection.loading = false;
        }
    }
}

/**
 * Ensure a collection is loaded and rendered.
 * @param type - Entity type selector value.
 */
export function ensureCollection(type: string): void {
    const collection = collections.get(type);
    if (!collection) {
        return;
    }
    if (collection.loaded) {
        renderCollection(type);
        return;
    }
    if (isCollectionNeeded(type)) {
        void loadNextPage(type);
    }
}

/**
 * Select the entity type shown in a pane and load it lazily.
 * @param paneId - Pane identifier.
 * @param type - Entity type selector value.
 */
export function setActiveType(paneId: 1 | 2, type: string): void {
    activeTypes[paneId] = type;
    const collection = collections.get(type);
    if (collection && !collection.loaded) {
        // Drop the static placeholder markup while the first page is loading.
        clearCollectionContainers(type);
    }
    ensureCollection(type);
}

/** Ensure every visible pane has its active collection loaded and rendered. */
export function ensurePaneCollections(): void {
    ([1, 2] as const).forEach((paneId) => {
        if (paneShowsCollections(paneId)) {
            ensureCollection(activeTypes[paneId]);
        }
    });
}

/**
 * Load the next page for the collection displayed in a pane.
 * @param paneId - Pane identifier.
 */
export function loadMoreForPane(paneId: 1 | 2): void {
    if (paneShowsCollections(paneId)) {
        void loadNextPage(activeTypes[paneId]);
    }
}

/**
 * Reset a collection and reload it when it is currently displayed.
 * @param type - Entity type selector value.
 */
export function reloadCollection(type: string): void {
    const collection = collections.get(type);
    if (!collection) {
        return;
    }
    collection.generation += 1;
    collection.views = [];
    collection.page = 0;
    collection.totalPages = 0;
    collection.loaded = false;
    collection.loading = false;
    clearCollectionContainers(type);
    if (isCollectionNeeded(type)) {
        void loadNextPage(type);
    }
}

/** Reset and reload every collection that is currently displayed. */
export function reloadAllCollections(): void {
    Array.from(collections.keys()).forEach((type) => reloadCollection(type));
}

/**
 * Check whether a scroll container is close to its bottom edge.
 * @param element - Scroll container to inspect.
 * @returns Whether the next page should be requested.
 */
function isNearBottom(element: HTMLElement): boolean {
    return element.scrollTop + element.clientHeight >= element.scrollHeight - LOAD_MORE_THRESHOLD;
}

/**
 * Request the next page when a pane scroll container nears its end.
 * @param paneId - Pane identifier.
 * @param event - Scroll event to inspect.
 */
function handlePaneScroll(paneId: 1 | 2, event: Event): void {
    const scroller = event.currentTarget;
    if (scroller instanceof HTMLElement && isNearBottom(scroller)) {
        loadMoreForPane(paneId);
    }
}

/** Enable infinite scrolling for every list and card grid. */
export function initCollectionScrolling(): void {
    ([1, 2] as const).forEach((paneId) => {
        const pane = document.getElementById(`list-card-view${paneId}`);
        if (!pane) {
            return;
        }
        pane.addEventListener("scroll", (event) => handlePaneScroll(paneId, event));
        pane.querySelectorAll<HTMLElement>("ul.list").forEach((list) => {
            list.addEventListener("scroll", (event) => handlePaneScroll(paneId, event));
        });
    });
}

/**
 * Look up an already loaded entity view by type and id.
 * @param type - Entity type selector value.
 * @param id - Entity id.
 * @returns The cached entity view, or null when it is not loaded yet.
 */
export function getCachedEntityView(type: string, id: number): EntityView | null {
    const collection = collections.get(type);
    return collection?.views.find((view) => view.entityId === id) ?? null;
}

/**
 * List every already loaded entity view of a type.
 * @param type - Entity type selector value.
 * @returns The cached entity views.
 */
export function getCachedEntityViews(type: string): EntityView[] {
    return collections.get(type)?.views ?? [];
}
