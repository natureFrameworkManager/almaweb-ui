// ==========================================================================
// mockup/ts/ui-views.ts — Views Dispatcher & List/Cards Part 1
// ==========================================================================

import { store } from "./store";
import { MOCK_MODULES, MOCK_EVENTS } from "./data";
import { showToast } from "./ui-toast";

export function renderActiveViews(containerA: HTMLElement, containerB: HTMLElement | null): void {
    const { activeLayout, activeEntity, splitMode } = store.getState();

    if (splitMode === "compare") {
        containerA.style.display = "flex";
        renderCompareView(containerA);
        if (containerB) {
            const paneB = containerB.closest(".pane") as HTMLElement | null;
            if (paneB) paneB.style.display = "none";
        }
        return;
    }

    containerA.style.display = "";

    if (activeLayout === "compare") {
        renderCompareView(containerA);
    } else {
        renderSinglePaneView(containerA, activeLayout, activeEntity);
    }

    const paneB = containerB ? (containerB.closest(".pane") as HTMLElement | null) : null;

    if (splitMode === "split" && containerB && paneB) {
        paneB.style.display = "flex";
        renderSinglePaneView(containerB, "calendar", "event");
    } else if (paneB) {
        paneB.style.display = "none";
    }
}

function renderSinglePaneView(container: HTMLElement, layout: string, entity: string): void {
    if (layout === "list") {
        renderListView(container);
    } else if (layout === "cards") {
        renderCardsView(container);
    } else if (layout === "table") {
        renderTableView(container);
    } else if (layout === "calendar") {
        renderCalendarView(container);
    } else if (layout === "explorer") {
        renderExplorerView(container);
    } else if (layout === "compare") {
        renderCompareView(container);
    }
}

// 1. Liste View (Section 9.1)
function renderListView(container: HTMLElement): void {
    const { selectedItems, savedItems, selectedDetailId } = store.getState();

    let html = "";
    if (selectedItems.size > 0) {
        html += `
            <div class="bulk-bar">
                <div style="font-size:var(--text-body-sm); font-weight:600;">${selectedItems.size} ausgewählt</div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-sm btn-accent" id="btn-bulk-save">Zu Meine Liste (Pink)</button>
                    <button class="btn btn-sm btn-secondary" id="btn-bulk-clear">Auswahl aufheben</button>
                </div>
            </div>
        `;
    }

    html += `<div style="display:flex; flex-direction:column;">`;

    for (const mod of MOCK_MODULES) {
        const isSel = selectedItems.has(mod.id);
        const isSaved = savedItems.has(mod.id);
        const isFocused = selectedDetailId === mod.id;

        html += `
            <div class="list-row ${isFocused ? 'is-selected' : ''}" data-id="${mod.id}">
                <input type="checkbox" class="row-checkbox" data-id="${mod.id}" ${isSel ? 'checked' : ''} style="cursor:pointer;" />
                <div class="list-row-indicator" style="background:var(--color-type-module);"></div>
                <div class="list-row-content">
                    <div class="list-row-title-line">
                        <span class="list-row-title">${mod.name}</span>
                        <span class="list-row-code">${mod.code}</span>
                    </div>
                    <div class="list-row-meta">
                        <span class="chip chip-module">${mod.lp} LP</span>
                        <span>${mod.sws} SWS</span>
                        <span>${mod.faculty}</span>
                    </div>
                </div>
                <div class="list-row-actions">
                    <button class="btn btn-sm ${isSaved ? 'btn-accent' : 'btn-secondary'} btn-save-row" data-id="${mod.id}" title="Merken">
                        ${isSaved ? '★ Gemerkt' : '＋ Merken'}
                    </button>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Bind list events
    container.querySelectorAll<HTMLElement>(".list-row").forEach(row => {
        row.onclick = (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("row-checkbox") || target.closest(".btn-save-row")) return;
            const id = row.getAttribute("data-id");
            if (id) store.setDetail(id, "module");
        };
    });

    container.querySelectorAll<HTMLInputElement>(".row-checkbox").forEach(cb => {
        cb.onchange = (e) => {
            e.stopPropagation();
            const id = cb.getAttribute("data-id");
            if (id) store.toggleSelect(id);
        };
    });

    container.querySelectorAll<HTMLElement>(".btn-save-row").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            if (id) {
                store.toggleSave(id);
                showToast("Meine Liste aktualisiert (Bellis Pink)");
            }
        };
    });

    container.querySelector("#btn-bulk-clear")?.addEventListener("click", () => {
        store.clearSelection();
    });

    container.querySelector("#btn-bulk-save")?.addEventListener("click", () => {
        selectedItems.forEach(id => store.toggleSave(id));
        store.clearSelection();
        showToast("Ausgewählte Elemente gemerkt");
    });
}

// 2. Kacheln View (Section 9.3)
function renderCardsView(container: HTMLElement): void {
    const { savedItems } = store.getState();

    let html = `<div class="card-grid">`;
    for (const mod of MOCK_MODULES) {
        const isSaved = savedItems.has(mod.id);
        html += `
            <div class="card" data-id="${mod.id}">
                <div class="card-stripe" style="background:var(--color-type-module);"></div>
                <div class="card-header">
                    <div>
                        <div class="card-title">${mod.name}</div>
                        <div class="card-code">${mod.code}</div>
                    </div>
                </div>
                <div class="card-chips">
                    <span class="chip chip-module">${mod.lp} LP</span>
                    <span class="chip">${mod.sws} SWS</span>
                    <span class="chip">${mod.semester}</span>
                    <span class="chip">${mod.language}</span>
                </div>
                <div class="card-footer">
                    <span style="font-size:var(--text-label); color:var(--color-text-muted);">${mod.coursesCount} Kurse · ${mod.examsCount} Prüfung</span>
                    <button class="btn btn-sm ${isSaved ? 'btn-accent' : 'btn-secondary'} btn-save-card" data-id="${mod.id}">
                        ${isSaved ? '★ Gemerkt' : '＋ Merken'}
                    </button>
                </div>
            </div>
        `;
    }
    html += `</div>`;
    container.innerHTML = html;

    container.querySelectorAll<HTMLElement>(".card").forEach(card => {
        card.onclick = (e) => {
            if ((e.target as HTMLElement).closest(".btn-save-card")) return;
            const id = card.getAttribute("data-id");
            if (id) store.setDetail(id, "module");
        };
    });

    container.querySelectorAll<HTMLElement>(".btn-save-card").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.getAttribute("data-id");
            if (id) {
                store.toggleSave(id);
                showToast("In Meine Liste aktualisiert");
            }
        };
    });
}

// 3. Tabelle View (Section 9.2)
function renderTableView(container: HTMLElement): void {
    const { selectedDetailId, savedItems } = store.getState();

    let html = `
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width:36px;"></th>
                        <th>Kennung</th>
                        <th>Name</th>
                        <th>LP</th>
                        <th>SWS</th>
                        <th>Fakultät</th>
                        <th>Semester</th>
                        <th>Verantwortlich</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const mod of MOCK_MODULES) {
        const isFocused = selectedDetailId === mod.id;
        const isSaved = savedItems.has(mod.id);

        html += `
            <tr class="${isFocused ? 'is-selected' : ''}" data-id="${mod.id}">
                <td>${isSaved ? '<span style="color:var(--color-accent-600)">★</span>' : ''}</td>
                <td class="mono" style="font-size:12px; color:var(--color-text-subtle);">${mod.code}</td>
                <td><strong>${mod.name}</strong></td>
                <td><span class="chip chip-module">${mod.lp}</span></td>
                <td>${mod.sws}</td>
                <td style="color:var(--color-text-muted);">${mod.faculty}</td>
                <td>${mod.semester}</td>
                <td style="color:var(--color-text-muted);">${mod.responsible}</td>
            </tr>
        `;
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll<HTMLElement>(".data-table tbody tr").forEach(row => {
        row.onclick = () => {
            const id = row.getAttribute("data-id");
            if (id) store.setDetail(id, "module");
        };
    });
}




// 4. Kalender View (Section 9.4)
function renderCalendarView(container: HTMLElement): void {
    const { savedItems } = store.getState();
    const days = ["Mo", "Di", "Mi", "Do", "Fr"];
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    let html = `
        <div class="calendar-view-container">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="font-weight:600; font-size:var(--text-body-sm);">Wochenübersicht: WiSe 2025/26 (Europe/Berlin)</div>
                <div style="display:flex; gap:6px;">
                    <span class="chip" style="border-left:3px solid var(--color-type-course);">Kurs</span>
                    <span class="chip" style="border-left:3px solid var(--color-accent-600);">Meine Liste ★</span>
                </div>
            </div>
            <div class="calendar-grid">
                <div class="cal-head-cell">Zeit</div>
                ${days.map(d => `<div class="cal-head-cell">${d}</div>`).join("")}
    `;

    for (const h of hours) {
        html += `<div class="cal-time-cell">${h}:00</div>`;
        for (const d of days) {
            const ev = MOCK_EVENTS.find(e => e.day === d && e.startHour === h);
            if (ev) {
                const isSaved = savedItems.has(ev.courseId);
                html += `
                    <div class="cal-cell">
                        <div class="cal-event-pill ${isSaved ? 'saved' : ''}" data-course="${ev.courseId}" title="${ev.title} (${ev.time}, ${ev.room})">
                            ${isSaved ? '★ ' : ''}${ev.title}
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="cal-cell"></div>`;
            }
        }
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;

    container.querySelectorAll<HTMLElement>(".cal-event-pill").forEach(pill => {
        pill.onclick = () => {
            const courseId = pill.getAttribute("data-course");
            if (courseId) store.setDetail(courseId, "course");
        };
    });
}

// 5. Explorer View (Section 9.5)
function renderExplorerView(container: HTMLElement): void {
    const levels = [
        { name: "Fakultät für Mathematik und Informatik", count: 42, hue: "var(--color-type-module)" },
        { name: "Wirtschaftswissenschaftliche Fakultät", count: 28, hue: "var(--color-type-course)" },
        { name: "Fakultät für Lebenswissenschaften", count: 35, hue: "var(--color-type-event)" },
        { name: "Philologische Fakultät", count: 19, hue: "var(--color-type-staff)" },
        { name: "Medizinische Fakultät", count: 54, hue: "var(--color-type-exam)" },
    ];

    let html = `
        <div class="explorer-container">
            <div class="explorer-breadcrumbs">
                <span class="chip chip-filter">Wurzel (Uni Leipzig)</span>
                <span>/</span>
                <span class="chip chip-filter">WiSe 2025/26</span>
                <span>/</span>
                <span class="chip" style="background:var(--color-brand-100); color:var(--color-brand-700);">Fakultäten</span>
            </div>

            <div style="font-size:var(--text-title); font-weight:600; margin-top:4px;">Strukturbaum & Studiengänge</div>

            <div class="explorer-grid">
                ${levels.map(lvl => `
                    <div class="explorer-tile" style="border-left: 4px solid ${lvl.hue};">
                        <div class="explorer-tile-name">${lvl.name}</div>
                        <div class="explorer-tile-count">${lvl.count} enthaltene Module ➔</div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.querySelectorAll(".explorer-tile").forEach(tile => {
        tile.addEventListener("click", () => {
            showToast("Navigationsebene betreten — Module geladen");
        });
    });
}

// 6. Compare View (Section 9.7)
function renderCompareView(container: HTMLElement): void {
    const { compareSlots } = store.getState();

    let html = `
        <div class="compare-container">
            <div class="compare-header-row">
                <div class="compare-col" style="background:var(--color-surface);">
                    <div style="font-weight:700; color:var(--color-brand-600);">${compareSlots.slotA}</div>
                    <div style="font-size:var(--text-label); color:var(--color-text-muted);">3 Module · 20 LP · 14 SWS</div>
                </div>
                <div class="compare-col" style="background:var(--color-surface);">
                    <div style="font-weight:700; color:var(--color-accent-600);">${compareSlots.slotB}</div>
                    <div style="font-size:var(--text-label); color:var(--color-text-muted);">2 Module · 15 LP · 10 SWS</div>
                </div>
            </div>

            <div style="display:flex; flex:1; overflow-y:auto;">
                <div class="compare-col">
                    <div style="margin-bottom:8px; font-weight:600; font-size:var(--text-label); color:var(--color-text-muted);">BELEGTE MODULE</div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div class="card" style="padding:10px;">
                            <strong>Modellierung und Programmierung 1</strong>
                            <div class="mono" style="font-size:11px;">10-201-2001 · 10 LP</div>
                        </div>
                        <div class="card" style="padding:10px;">
                            <strong>Algorithmen und Datenstrukturen 1</strong>
                            <div class="mono" style="font-size:11px;">10-201-2011 · 5 LP</div>
                        </div>
                    </div>
                </div>

                <div class="compare-col">
                    <div style="margin-bottom:8px; font-weight:600; font-size:var(--text-label); color:var(--color-text-muted);">BELEGTE MODULE</div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <div class="card" style="padding:10px;">
                            <strong>Einführung in die Wirtschaftswissenschaften</strong>
                            <div class="mono" style="font-size:11px;">09-101-1102 · 10 LP</div>
                        </div>
                        <div class="card" style="padding:10px;">
                            <strong>Datenbanksysteme 1</strong>
                            <div class="mono" style="font-size:11px;">10-202-2301 · 5 LP</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

