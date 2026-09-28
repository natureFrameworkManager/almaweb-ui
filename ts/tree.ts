import type { Module } from "./api/types";
import { createActionButton } from "./views/entity-view";

type TreeNode = {
    [key: string]: TreeNode | Module["id"][] | undefined;
    _modules?: Module["id"][];
};

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
 * Build the navigation tree from module paths.
 * @param modules - Module records used to build the tree.
 * @returns The module navigation tree.
 */
function computeTreeData(modules: Module[]): TreeNode {
    const tree: TreeNode = {};
    modules.forEach((module) => {
        module.path.forEach((path) => {
            const lastNode = path.reduce<TreeNode>((currentLevel, segment) => {
                if (!currentLevel[segment]) {
                    currentLevel[segment] = {};
                }
                return currentLevel[segment] as TreeNode;
            }, tree);
            lastNode._modules = [...(lastNode._modules ?? []), module.id];
        });
    });
    return tree;
}

/**
 * Create the breadcrumb-like list of opened tree levels.
 * @param openedLevels - Names of currently opened levels.
 * @returns The opened-levels container.
 */
function createOpenedLevels(openedLevels: string[]): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "opened-levels";
    openedLevels.forEach((level) => {
        const levelElement = document.createElement("div");
        levelElement.className = "opened-level";
        const title = document.createElement("span");
        title.textContent = level === "Root" ? "Wurzel" : level;
        levelElement.appendChild(title);
        levelElement.appendChild(createActionButton("btn slim material-symbols", "reply_all"));
        container.appendChild(levelElement);
    });
    return container;
}

/**
 * Create one expandable tree level element.
 * @param levelName - Tree level name.
 * @returns The tree level element.
 */
function createTreeLevel(levelName: string): HTMLDivElement {
    const levelElement = document.createElement("div");
    levelElement.className = "level";
    const title = document.createElement("span");
    title.textContent = levelName;
    levelElement.appendChild(title);
    levelElement.appendChild(
        createActionButton("btn slim material-symbols", "keyboard_double_arrow_right"),
    );
    return levelElement;
}

/**
 * Create the expandable level list for a tree node.
 * @param level - Tree node to render.
 * @returns The tree level container.
 */
function createTreeLevels(level: TreeNode): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "levels";
    Object.keys(level)
        .filter((key) => key !== "_modules")
        .map(createTreeLevel)
        .forEach((levelElement) => container.appendChild(levelElement));
    return container;
}

/**
 * Render module navigation data into a tree pane.
 * @param modules - Module records used to build the tree.
 * @param paneId - Tree pane identifier.
 */
export function displayTree(modules: Module[], paneId: 1 | 2): void {
    const treeContainer = document.querySelector(`#tree${paneId}`) as HTMLElement | null;
    if (!treeContainer) {
        console.error("Tree view container is missing.");
        return;
    }
    const treeData = computeTreeData(modules);
    treeContainer.innerHTML = "";

    const openedLevels = ["Root", "SoSe 2025", "01 - Theologische Fakultät"];
    const level = getTreeLevel(treeData, openedLevels);
    treeContainer.appendChild(createOpenedLevels(openedLevels));
    treeContainer.appendChild(createTreeLevels(level));
}
