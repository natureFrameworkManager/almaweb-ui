// ==========================================================================
// mockup/ts/view-explorer.ts — Explorer (Section 9.5)
// ==========================================================================

import { store } from "./store";
import type { EntityType } from "./store";
import { getRows } from "./entity-rows";
import { bindRowInteractions, rowMarkup } from "./view-common";
import { showToast } from "./ui-toast";

interface LevelNode {
    name: string;
    path: string;
    modules: number;
    hue: string;
}

const LEVELS: LevelNode[] = [
    { name: "Fakultät für Mathematik und Informatik", path: "/10", modules: 42, hue: "var(--color-type-module)" },
    { name: "Wirtschaftswissenschaftliche Fakultät", path: "/08", modules: 28, hue: "var(--color-type-course)" },
    { name: "Fakultät für Lebenswissenschaften", path: "/11", modules: 35, hue: "var(--color-type-event)" },
    { name: "Philologische Fakultät", path: "/04", modules: 19, hue: "var(--color-type-staff)" },
    { name: "Medizinische Fakultät", path: "/13", modules: 54, hue: "var(--color-type-exam)" },
    { name: "Erziehungswissenschaftliche Fakultät", path: "/07", modules: 23, hue: "var(--color-type-location)" },
];

/** Explorer: breadcrumb + level tiles + real result rows at the leaf. */
export function renderExplorerView(container: HTMLElement, entity: EntityType): void {
    const rows = getRows(entity).slice(0, 3);

    let html = `
        <div class="explorer-wrap">
            <div class="explorer-bar">
                <nav class="crumbs" aria-label="Explorer-Pfad">
                    <button class="crumb" data-crumb="root">Wurzel</button>
                    <span class="crumb-sep">›</span>
                    <button class="crumb" data-crumb="semester">WiSe 2025/26</button>
                    <span class="crumb-sep">›</span>
                    <span class="crumb is-current" aria-current="page">Fakultäten</span>
                </nav>
                <div class="explorer-actions">
                    <button class="btn btn-sm btn-secondary" id="btn-explorer-expand">Alles aufklappen</button>
                    <button class="btn btn-sm btn-secondary" id="btn-explorer-filter">Diesen Pfad filtern</button>
                    <button class="btn btn-sm btn-ghost" id="btn-explorer-share">Pfad teilen</button>
                </div>
            </div>

            <div class="explorer-body">
                <div class="explorer-level-title">
                    <span>Fakultäten · Ebene 2</span>
                    <span class="explorer-level-count">6 Knoten · 201 Module</span>
                </div>

                <div class="level-grid">
                    ${LEVELS.map(
                        (node) => `
                        <button class="level-tile" data-node="${node.path}" style="--tile-hue: ${node.hue};">
                            <span class="level-tile-name">${node.name}</span>
                            <span class="level-tile-path">${node.path}</span>
                            <span class="level-tile-foot">
                                <span class="level-tile-count">${node.modules} Module</span>
                                <span class="level-tile-goto">öffnen →</span>
                            </span>
                        </button>`,
                    ).join("")}
                </div>

                <div class="explorer-leaf">
                    <div class="explorer-leaf-title">Module an diesem Knoten</div>
                    <div class="explorer-rows">
                        ${rows
                            .map((row) => rowMarkup(row, false, store.getState().savedItems.has(row.id), false))
                            .join("")}
                    </div>
                    <p class="explorer-hint">
                        Tastatur: <kbd>←</kbd>/<kbd>→</kbd> Ebene wechseln · <kbd>Enter</kbd> absteigen ·
                        <kbd>Backspace</kbd> aufsteigen · <kbd>M</kbd> merken
                    </p>
                </div>
            </div>
        </div>`;

    container.innerHTML = html;
    bindRowInteractions(container, entity);

    container.querySelectorAll<HTMLElement>(".level-tile").forEach((tile) => {
        tile.addEventListener("click", () => {
            const node = tile.getAttribute("data-node");
            showToast(`Ebene geöffnet — Teilbaum ${node}`);
        });
    });

    container.querySelectorAll<HTMLElement>(".crumb[data-crumb]").forEach((crumb) => {
        crumb.addEventListener("click", () => {
            showToast(`Zurück zu „${crumb.textContent?.trim()}“`);
        });
    });

    container.querySelector("#btn-explorer-expand")?.addEventListener("click", () => {
        showToast("Baum bis Tiefe 3 aufgeklappt");
    });
    container.querySelector("#btn-explorer-filter")?.addEventListener("click", () => {
        showToast("Aktueller Pfad als Filter übernommen");
    });
    container.querySelector("#btn-explorer-share")?.addEventListener("click", () => {
        showToast("Pfad-URL kopiert: …?path=2025w,10,Fakultäten");
    });
}