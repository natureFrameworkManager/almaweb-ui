// ==========================================================================
// mockup/ts/ui-palette.ts — Command Palette (⌘/Ctrl + K)
// ==========================================================================

import { store } from "./store";
import { MOCK_MODULES, MOCK_COURSES, MOCK_STAFF, MOCK_ROOMS } from "./data";
import { showToast } from "./ui-toast";

export function initCommandPalette(): void {
    const paletteEl = document.getElementById("command-palette-backdrop");
    const inputEl = document.getElementById("palette-input") as HTMLInputElement | null;
    const resultsEl = document.getElementById("palette-results");

    if (!paletteEl || !inputEl || !resultsEl) return;

    const resultsContainer = resultsEl;

    function renderResults(query: string): void {
        const q = query.toLowerCase().trim();
        let html = "";

        // Actions
        const actions = [
            { id: "act-theme", title: "Farbschema wechseln (Hell / Dunkel)", action: () => {
                store.setTheme(store.getState().theme === "light" ? "dark" : "light");
                showToast("Farbschema gewechselt");
            }},
            { id: "act-density", title: "Dichte umschalten (Komfort / Kompakt)", action: () => {
                store.setDensity(store.getState().density === "normal" ? "compact" : "normal");
                showToast("Dichte gewechselt");
            }},
            { id: "act-export", title: "Export Dialog öffnen", action: () => store.setExportModalOpen(true) },
            { id: "act-clear", title: "Alle Filter zurücksetzen", action: () => {
                store.setFacultyFilter("all");
                store.setSearchQuery("");
                showToast("Filter zurückgesetzt");
            }},
        ];

        const matchedActions = actions.filter(a => a.title.toLowerCase().includes(q));
        if (matchedActions.length > 0) {
            html += `<div class="palette-group">
                <div class="palette-group-title">Aktionen</div>`;
            for (const act of matchedActions) {
                html += `
                    <div class="palette-item" data-action="${act.id}">
                        <span>⚡ ${act.title}</span>
                        <span class="chip">Aktion</span>
                    </div>
                `;
            }
            html += `</div>`;
        }

        // Matched modules
        const matchedModules = MOCK_MODULES.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)).slice(0, 3);
        if (matchedModules.length > 0) {
            html += `<div class="palette-group">
                <div class="palette-group-title">Module</div>`;
            for (const mod of matchedModules) {
                html += `
                    <div class="palette-item" data-type="module" data-id="${mod.id}">
                        <div>
                            <strong>${mod.name}</strong>
                            <div class="mono" style="font-size:11px; color:var(--color-text-subtle);">${mod.code}</div>
                        </div>
                        <span class="chip chip-module">${mod.lp} LP</span>
                    </div>
                `;
            }
            html += `</div>`;
        }

        // Matched courses
        const matchedCourses = MOCK_COURSES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 3);
        if (matchedCourses.length > 0) {
            html += `<div class="palette-group">
                <div class="palette-group-title">Kurse</div>`;
            for (const c of matchedCourses) {
                html += `
                    <div class="palette-item" data-type="course" data-id="${c.id}">
                        <div>
                            <strong>${c.name}</strong>
                            <div style="font-size:11px; color:var(--color-text-subtle);">${c.instructor}</div>
                        </div>
                        <span class="chip chip-course">${c.type}</span>
                    </div>
                `;
            }
            html += `</div>`;
        }

        resultsContainer.innerHTML = html;

        // Bind clicks
        resultsContainer.querySelectorAll<HTMLElement>(".palette-item").forEach(item => {
            item.onclick = () => {
                const actId = item.getAttribute("data-action");
                if (actId) {
                    const found = actions.find(a => a.id === actId);
                    found?.action();
                } else {
                    const id = item.getAttribute("data-id");
                    const type = item.getAttribute("data-type") as any;
                    if (id && type) {
                        store.setActiveEntity(type);
                        store.setDetail(id, type);
                    }
                }
                store.setPaletteOpen(false);
            };
        });
    }

    inputEl.oninput = () => {
        renderResults(inputEl.value);
    };

    renderResults("");
}
