// mockup-v2/ts/ui-views.ts
import { store } from "./store";
import { ALL_ITEMS, MOCK_CALENDAR_EVENTS } from "./data";
import { showToast } from "./ui-toast";

export function renderActiveView() {
    const state = store.getState();
    const views = ["heute", "blaettern", "fuehrer", "woche", "vergleich"];
    views.forEach((v) => {
        const pane = document.getElementById(`view-${v}`);
        if (pane) {
            if (v === state.activeView) {
                pane.classList.add("active");
            } else {
                pane.classList.remove("active");
            }
        }
    });

    const railButtons = document.querySelectorAll(".rail-btn[data-view]");
    railButtons.forEach((btn) => {
        const v = btn.getAttribute("data-view");
        if (v === state.activeView) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    if (state.activeView === "blaettern") {
        renderBrowseList();
    } else if (state.activeView === "woche") {
        renderWeekGrid();
    }
}

export function renderBrowseList() {
    const container = document.getElementById("browse-result-list");
    if (!container) return;

    const state = store.getState();
    let items = ALL_ITEMS;

    if (state.filterText) {
        const q = state.filterText.toLowerCase();
        items = items.filter((i) => i.title.toLowerCase().includes(q) || (i.number && i.number.toLowerCase().includes(q)));
    }

    if (state.filterFaculty !== "Alle Fakultäten") {
        items = items.filter((i) => i.faculty === state.filterFaculty);
    }

    if (state.filterLp !== "Alle LP") {
        const lpNum = parseInt(state.filterLp, 10);
        items = items.filter((i) => i.lp === lpNum);
    }

    const countEl = document.getElementById("browse-count-label");
    if (countEl) {
        countEl.textContent = `${items.length} Treffer`;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const isMarked = store.isItemMarked(item.id);
        const row = document.createElement("div");
        row.className = "result-row";
        row.innerHTML = `
            <button class="mark-btn ${isMarked ? "marked" : ""}" data-id="${item.id}" title="${isMarked ? "Aus Mappe entfernen" : "In Mappe anstreichen"}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="${isMarked ? "var(--hl-500)" : "none"}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <div style="cursor: pointer;" class="item-title-zone" data-id="${item.id}">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="entity-badge badge-${item.type}">${item.type.toUpperCase()}</span>
                    <span style="font-weight: 600; font-size: 0.95rem;" class="${isMarked ? "highlighter" : ""}">${item.title}</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--ink-muted); margin-top: 3px;">
                    ${item.meta || ""}
                </div>
            </div>
            <div>
                ${item.lp ? `<span style="font-size: 0.85rem; font-weight: 600; background: var(--sheet-2); padding: 3px 8px; border-radius: 4px;">${item.lp} LP</span>` : ""}
            </div>
            <div style="display: flex; gap: 6px;">
                <button class="header-btn btn-peek-row" data-id="${item.id}" title="Vorschau (Leertaste)">Vorschau</button>
                <button class="header-btn btn-blatt-row" data-id="${item.id}" title="Blatt öffnen">Blatt ↗</button>
            </div>
        `;

        row.querySelector(".mark-btn")?.addEventListener("click", () => {
            store.toggleMarkItem(item.id);
            const nowMarked = store.isItemMarked(item.id);
            showToast(nowMarked ? `"${item.title}" in Szenario ${state.mappe.activeScenario} angestrichen.` : `"${item.title}" entfernt.`);
        });

        row.querySelector(".item-title-zone")?.addEventListener("click", () => store.setBlatt(item.id));
        row.querySelector(".btn-peek-row")?.addEventListener("click", () => store.setQuickPeek(item.id));
        row.querySelector(".btn-blatt-row")?.addEventListener("click", () => store.setBlatt(item.id));

        container.appendChild(row);
    });
}

export function renderWeekGrid() {
    const gridBody = document.getElementById("week-calendar-body");
    if (!gridBody) return;

    gridBody.innerHTML = "";

    // Hour labels
    const hourCol = document.createElement("div");
    hourCol.className = "week-hour-col";
    for (let h = 8; h <= 18; h++) {
        const cell = document.createElement("div");
        cell.className = "hour-cell";
        cell.textContent = `${h}:00`;
        hourCol.appendChild(cell);
    }
    gridBody.appendChild(hourCol);

    // 5 Day columns
    for (let d = 0; d < 5; d++) {
        const dayCol = document.createElement("div");
        dayCol.className = "week-day-col";
        dayCol.setAttribute("data-day", d.toString());

        const events = MOCK_CALENDAR_EVENTS.filter((e) => e.day === d);
        events.forEach((ev) => {
            const evEl = document.createElement("div");
            evEl.className = `cal-event-block cal-${ev.type}`;
            const topPx = (ev.startHour - 8) * 48;
            const heightPx = ev.durationHours * 48;
            evEl.style.top = `${topPx}px`;
            evEl.style.height = `${heightPx}px`;

            evEl.innerHTML = `
                <div style="font-weight: 600;">${ev.title}</div>
                <div style="font-size: 0.7rem; opacity: 0.85;">${ev.room}</div>
            `;

            evEl.onclick = () => {
                showToast(`Termin: ${ev.title} im ${ev.room}`);
            };

            dayCol.appendChild(evEl);
        });

        gridBody.appendChild(dayCol);
    }
}
