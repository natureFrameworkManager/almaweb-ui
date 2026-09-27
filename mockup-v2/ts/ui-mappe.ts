// mockup-v2/ts/ui-mappe.ts
import { store } from "./store";
import { ALL_ITEMS } from "./data";
import { showToast } from "./ui-toast";

export function renderMappe() {
    const state = store.getState();
    const sc = state.mappe.activeScenario;
    const markedIds = state.mappe.markedItems[sc];
    const items = ALL_ITEMS.filter((i) => markedIds.includes(i.id));

    // Register tabs
    const regTabs = document.querySelectorAll(".register-tab");
    regTabs.forEach((tab) => {
        const targetSc = tab.getAttribute("data-sc");
        if (targetSc === sc) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    // LP calculation
    const totalLp = items.reduce((sum, item) => sum + (item.lp || 0), 0);
    const lpTarget = state.mappe.targetLp;
    const lpPercent = Math.min(100, Math.round((totalLp / lpTarget) * 100));

    const lpLabel = document.getElementById("lp-meter-text");
    const lpBar = document.getElementById("lp-meter-bar");
    if (lpLabel) lpLabel.textContent = `${totalLp} von ${lpTarget} LP angestrichen`;
    if (lpBar) {
        lpBar.style.width = `${lpPercent}%`;
        lpBar.style.background = totalLp > lpTarget ? "var(--warn)" : "var(--brand-700)";
    }

    const container = document.getElementById("mappe-items-list");
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 32px 16px; color: var(--ink-subtle);">
                <p style="font-size: 0.9rem; margin-bottom: 8px;">Noch nichts angestrichen in Szenario ${sc}.</p>
                <p style="font-size: 0.8rem;">Nutze das Lesezeichen-Symbol <span style="color:var(--brand-700);">🔖</span> in der Suche oder im Studienführer.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "mappe-item-card";
        const note = state.mappe.notes[item.id] || "";

        card.innerHTML = `
            <div class="mappe-item-header">
                <div>
                    <span class="entity-badge badge-${item.type}">${item.type.toUpperCase()}</span>
                    <span class="mappe-item-title ${store.isItemMarked(item.id) ? "highlighter" : ""}">${item.title}</span>
                </div>
                <button class="mark-btn marked" title="Aus Mappe entfernen" data-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </button>
            </div>
            <div class="mappe-item-meta">${item.lp ? `${item.lp} LP · ` : ""}${item.responsible || item.room || ""}</div>
            ${note ? `<div style="font-size:0.75rem; background:var(--sheet-2); padding:4px 6px; border-radius:4px; margin-top:6px; font-style:italic;">✎ ${note}</div>` : ""}
            <div style="margin-top: 8px; display: flex; gap: 8px;">
                <button class="btn-peek-mini" data-id="${item.id}" style="font-size: 0.72rem; color: var(--brand-700); font-weight: 600;">Vorschau</button>
                <button class="btn-blatt-mini" data-id="${item.id}" style="font-size: 0.72rem; color: var(--ink-muted);">Blatt öffnen ↗</button>
            </div>
        `;

        card.querySelector(".mark-btn")?.addEventListener("click", () => {
            store.toggleMarkItem(item.id);
            showToast(`"${item.title}" aus Szenario ${sc} entfernt.`, "Rückgängig", () => {
                store.toggleMarkItem(item.id);
            });
        });

        card.querySelector(".btn-peek-mini")?.addEventListener("click", () => store.setQuickPeek(item.id));
        card.querySelector(".btn-blatt-mini")?.addEventListener("click", () => store.setBlatt(item.id));

        container.appendChild(card);
    });
}
