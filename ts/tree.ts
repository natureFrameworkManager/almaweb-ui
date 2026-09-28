import type { Module } from "./api/types";
import { createActionButton, syncEntityContainer, type EntityView } from "./views/entity-view";

/** A node in the module navigation tree. */
type TreeNode = {
    [key: string]: TreeNode | Module["id"][] | undefined;
    /** Module ids grouped below this node. */
    _modules?: Module["id"][];
};

/** Name of the synthetic tree level every navigation starts from. */
const ROOT_LEVEL = "Root";

/** Display label used for the synthetic root level. */
const ROOT_LABEL = "Wurzel";

/** Navigation state of a single tree pane. */
type TreeState = {
    tree: TreeNode;
    modulesById: Map<Module["id"], Module>;
    openedLevels: string[];
    toView: (module: Module) => EntityView;
};

/** Per-pane navigation state that is kept across re-renders. */
const treeStates = new Map<1 | 2, TreeState>();

/**
 * Remove redundant faculty and root segments from module paths.
 * @param path - Module path segments.
 * @param faculty - Faculty segment to normalize from.
 * @returns Normalized module paths.
 */
export function normalizePath(path: string[][], faculty: string): string[][] {
    return path.map((el) => {
        if (el.find((segment) => segment === faculty)) {
            el = el.slice(el.indexOf(faculty));
        }
        if (el.find((segment) => segment === "Root")) {
            el = el.slice(el.indexOf("Root") + 1);
        }
        return el;
    });
}

/**
 * Resolve a path to a tree node, creating missing nodes as needed.
 * @param tree - Root tree node.
 * @param path - Path segments to resolve.
 * @returns The resolved tree node.
 */
function getTreeLevel(tree: TreeNode, path: string[]): TreeNode {
    return path.reduce<TreeNode>((currentLevel, segment) => {
        if (!currentLevel[segment]) {
            currentLevel[segment] = {};
        }
        return currentLevel[segment] as TreeNode;
    }, tree);
}

/**
 * List the child level names of a tree node.
 * @param node - Tree node to inspect.
 * @returns Child level names in insertion order.
 */
function getChildLevels(node: TreeNode): string[] {
    return Object.keys(node).filter((key) => key !== "_modules");
}

/**
 * Build the navigation tree from module paths.
 * @param modules - Module records used to build the tree.
 * @returns The module navigation tree.
 */
function computeTreeData(modules: Module[]): TreeNode {
    const tree: TreeNode = {};
    modules.forEach((module) => {
        module.path.forEach((path) => {
            const lastNode = getTreeLevel(tree, path);
            lastNode._modules = [...(lastNode._modules ?? []), module.id];
        });
    });
    return tree;
}

/**
 * Keep only the opened levels that still exist in a freshly built tree.
 *
 * Filtering can remove previously visible branches, so every segment is
 * validated against the new tree before it is restored.
 * @param openedLevels - Previously opened level names.
 * @param tree - Newly built navigation tree.
 * @returns A valid path, falling back to the root level.
 */
function normalizeOpenedLevels(openedLevels: string[], tree: TreeNode): string[] {
    const invalidIndex = openedLevels.findIndex((level, index) => {
        const node = getTreeLevel(tree, openedLevels.slice(0, index));
        const child = node[level];
        return child === undefined || Array.isArray(child);
    });
    const validCount = invalidIndex === -1 ? openedLevels.length : invalidIndex;
    return validCount > 0 ? openedLevels.slice(0, validCount) : [ROOT_LEVEL];
}

/**
 * Create the breadcrumb-like list of opened tree levels.
 * @param openedLevels - Names of currently opened levels.
 * @param onNavigate - Callback invoked with the index of a clicked level.
 * @returns The opened-levels container.
 */
function createOpenedLevels(
    openedLevels: string[],
    onNavigate: (levelIndex: number) => void,
): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "opened-levels";
    openedLevels.forEach((level, index) => {
        const levelElement = document.createElement("div");
        levelElement.className = "opened-level";
        const title = document.createElement("span");
        title.textContent = level === ROOT_LEVEL ? ROOT_LABEL : level;
        levelElement.appendChild(title);
        if (index < openedLevels.length - 1) {
            levelElement.classList.add("clickable");
            levelElement.appendChild(createActionButton("btn slim material-symbols", "reply_all"));
            levelElement.addEventListener("click", () => onNavigate(index));
        }
        container.appendChild(levelElement);
    });
    return container;
}

/**
 * Create one expandable tree level element.
 * @param levelName - Tree level name.
 * @param onOpen - Callback invoked when the level is opened.
 * @returns The tree level element.
 */
function createTreeLevel(levelName: string, onOpen: (level: string) => void): HTMLDivElement {
    const levelElement = document.createElement("div");
    levelElement.className = "level";
    const title = document.createElement("span");
    title.textContent = levelName;
    levelElement.appendChild(title);
    levelElement.appendChild(
        createActionButton("btn slim material-symbols", "keyboard_double_arrow_right"),
    );
    levelElement.addEventListener("click", () => onOpen(levelName));
    return levelElement;
}

/**
 * Create the expandable level list for a tree node.
 * @param node - Tree node to render.
 * @param onOpen - Callback invoked when a child level is opened.
 * @returns The tree level container, or null when the node has no children.
 */
function createTreeLevels(node: TreeNode, onOpen: (level: string) => void): HTMLDivElement | null {
    const levels = getChildLevels(node);
    if (levels.length === 0) {
        return null;
    }
    const container = document.createElement("div");
    container.className = "levels";
    levels
        .map((levelName) => createTreeLevel(levelName, onOpen))
        .forEach((levelElement) => container.appendChild(levelElement));
    return container;
}

/**
 * Resolve the modules grouped below a tree node.
 * @param node - Tree node to inspect.
 * @param modulesById - Lookup of every known module.
 * @returns The node modules sorted by name.
 */
function getNodeModules(node: TreeNode, modulesById: Map<Module["id"], Module>): Module[] {
    return (node._modules ?? [])
        .map((id) => modulesById.get(id))
        .filter((module): module is Module => module !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create the card grid showing the modules of a leaf node.
 * @param modules - Modules grouped below the leaf.
 * @param toView - Converter turning a module into its card view model.
 * @returns The card grid container.
 */
function createModuleCards(
    modules: Module[],
    toView: (module: Module) => EntityView,
): HTMLDivElement {
    const grid = document.createElement("div");
    grid.className = "card-grid";
    syncEntityContainer(grid, "card", modules.map(toView));
    return grid;
}

/**
 * Read the navigation state of a tree pane.
 * @param paneId - Tree pane identifier.
 * @returns The pane state, or undefined when the tree is not displayed yet.
 */
function getTreeState(paneId: 1 | 2): TreeState | undefined {
    return treeStates.get(paneId);
}

/**
 * Build the navigable content shown at the current position of a tree pane.
 * @param paneId - Tree pane identifier.
 * @param state - Navigation state to render.
 * @returns The rendered tree content.
 */
function createTreeContent(paneId: 1 | 2, state: TreeState): DocumentFragment {
    const node = getTreeLevel(state.tree, state.openedLevels);
    const fragment = document.createDocumentFragment();
    fragment.appendChild(
        createOpenedLevels(state.openedLevels, (index) => navigateToLevel(paneId, index)),
    );
    const levels = createTreeLevels(node, (level) => openTreeLevel(paneId, level));
    if (levels) {
        fragment.appendChild(levels);
    }
    const modules = getNodeModules(node, state.modulesById);
    if (modules.length > 0) {
        fragment.appendChild(createModuleCards(modules, state.toView));
    }
    return fragment;
}

/**
 * Render the current position of a tree pane.
 * @param paneId - Tree pane identifier.
 * @param state - Navigation state to render.
 */
function renderTree(paneId: 1 | 2, state: TreeState): void {
    const treeContainer = document.querySelector(`#tree${paneId}`) as HTMLElement | null;
    if (!treeContainer) {
        console.error("Tree view container is missing.");
        return;
    }
    treeContainer.replaceChildren(createTreeContent(paneId, state));
}

/**
 * Navigate a tree pane to one of its already opened levels.
 * @param paneId - Tree pane identifier.
 * @param levelIndex - Index of the level to return to.
 */
export function navigateToLevel(paneId: 1 | 2, levelIndex: number): void {
    const state = getTreeState(paneId);
    if (!state || levelIndex < 0 || levelIndex >= state.openedLevels.length) {
        return;
    }
    state.openedLevels = state.openedLevels.slice(0, levelIndex + 1);
    renderTree(paneId, state);
}

/**
 * Open a child level of the node currently shown in a tree pane.
 * @param paneId - Tree pane identifier.
 * @param levelName - Name of the child level to open.
 */
export function openTreeLevel(paneId: 1 | 2, levelName: string): void {
    const state = getTreeState(paneId);
    if (!state) {
        return;
    }
    const node = getTreeLevel(state.tree, state.openedLevels);
    if (!getChildLevels(node).includes(levelName)) {
        return;
    }
    state.openedLevels = [...state.openedLevels, levelName];
    renderTree(paneId, state);
}

/**
 * Return a tree pane to the parent of its current level.
 * @param paneId - Tree pane identifier.
 */
export function goBackLevel(paneId: 1 | 2): void {
    const state = getTreeState(paneId);
    if (!state || state.openedLevels.length <= 1) {
        return;
    }
    navigateToLevel(paneId, state.openedLevels.length - 2);
}

/**
 * Reset a tree pane back to its root level.
 * @param paneId - Tree pane identifier.
 */
export function resetTree(paneId: 1 | 2): void {
    navigateToLevel(paneId, 0);
}

/**
 * Render module navigation data into a tree pane.
 *
 * The previously opened path is restored when it still exists in the newly
 * built tree, so filter changes keep the current position in the hierarchy.
 * @param modules - Module records used to build the tree.
 * @param paneId - Tree pane identifier.
 * @param toView - Converter turning a module into its card view model.
 */
export function displayTree(
    modules: Module[],
    paneId: 1 | 2,
    toView: (module: Module) => EntityView,
): void {
    const previous = treeStates.get(paneId);
    const tree = computeTreeData(modules);
    const state: TreeState = {
        tree,
        modulesById: new Map(modules.map((module) => [module.id, module] as const)),
        openedLevels: previous ? normalizeOpenedLevels(previous.openedLevels, tree) : [ROOT_LEVEL],
        toView,
    };
    treeStates.set(paneId, state);
    renderTree(paneId, state);
}
