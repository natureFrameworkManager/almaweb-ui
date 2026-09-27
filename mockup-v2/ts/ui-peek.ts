// mockup-v2/ts/ui-peek.ts
import { store } from "./store";
import { ALL_ITEMS } from "./data";

export function renderPeekDrawer() {
    const drawer = document.getElementById("quick-peek-drawer");
    if (!drawer) return;

    const state = store.getState();
    if (!state.quickPeekId) {
        drawer.classList.remove("open");
        return;
    }

    const item = ALL_ITEMS.find((i) => i.id === state.quickPeekId);
    if (!item) return;

    drawer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
                <span class="entity-badge badge-${item.type}">${item.type.toUpperCase()}</span>
                <span style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 600; margin-left: 8px;">${item.title}</span>
                <div style="font-size: 0.85rem; color: var(--ink-muted); margin-top: 4px;">${item.meta || ""}</div>
            </div>
            <button id="btn-close-peek" style="font-size: 1.25rem; padding: 4px 8px; border-radius: 4px;">×</button>
        </div>
        <p style="font-size: 0.9rem; line-height: 1.5; color: var(--ink); margin-bottom: 16px;">
            ${item.description || "Keine ausführliche Beschreibung vorhanden."}
        </p>
        <div style="display: flex; gap: 10px;">
            <button class="header-btn" id="peek-btn-mark" style="background: var(--brand-700); color: var(--on-brand);">
                ${store.isItemMarked(item.id) ? "Aus Mappe entfernen" : "In Mappe anstreichen"}
            </button>
            <button class="header-btn" id="peek-btn-sheet">Vollständiges Blatt öffnen ↗</button>
        </div>
    `;

    drawer.classList.add("open");

    document.getElementById("btn-close-peek")?.addEventListener("click", () => store.setQuickPeek(null));
    document.getElementById("peek-btn-mark")?.addEventListener("click", () => {
        store.toggleMarkItem(item.id);
        renderPeekDrawer();
    });
    document.getElementById("peek-btn-sheet")?.addEventListener("click", () => {
        store.setQuickPeek(null);
        store.setBlatt(item.id);
    });
}
