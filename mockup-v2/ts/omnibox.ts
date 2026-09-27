// mockup-v2/ts/omnibox.ts — Omnibox operator parsing & search logic
import { store } from "./store";
import { ALL_ITEMS, EntityItem } from "./data";

export function initOmnibox() {
    const input = document.getElementById("omnibox-input") as HTMLInputElement;
    const dropdown = document.getElementById("omnibox-dropdown");
    if (!input || !dropdown) return;

    input.addEventListener("input", () => {
        const val = input.value.trim();
        if (!val) {
            dropdown.classList.remove("open");
            dropdown.innerHTML = "";
            return;
        }

        const results = searchItems(val);
        renderOmniboxResults(results, dropdown);
    });

    input.addEventListener("focus", () => {
        if (input.value.trim()) {
            dropdown.classList.add("open");
        }
    });

    document.addEventListener("click", (e) => {
        if (!e.composedPath().includes(input) && !e.composedPath().includes(dropdown)) {
            dropdown.classList.remove("open");
        }
    });

    // Keyboard shortcut CMD+K or '/'
    document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            input.focus();
            input.select();
        } else if (e.key === "/" && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    });
}

function searchItems(query: string): EntityItem[] {
    const q = query.toLowerCase();

    // Check operator filters: e.g. "typ:modul", "lp:10", "fak:10"
    if (q.startsWith("typ:")) {
        const typ = q.split("typ:")[1].trim();
        return ALL_ITEMS.filter((i) => i.type.startsWith(typ));
    }

    if (q.startsWith("lp:")) {
        const lpStr = q.split("lp:")[1].trim();
        const lpNum = parseInt(lpStr, 10);
        return ALL_ITEMS.filter((i) => i.lp === lpNum);
    }

    return ALL_ITEMS.filter((item) => {
        return (
            item.title.toLowerCase().includes(q) ||
            (item.number && item.number.toLowerCase().includes(q)) ||
            (item.responsible && item.responsible.toLowerCase().includes(q)) ||
            (item.room && item.room.toLowerCase().includes(q))
        );
    });
}

function renderOmniboxResults(items: EntityItem[], container: HTMLElement) {
    if (items.length === 0) {
        container.innerHTML = `<div style="padding: 16px; font-size: 0.85rem; color: var(--ink-muted); text-align: center;">Keine passenden Einträge gefunden.</div>`;
        container.classList.add("open");
        return;
    }

    container.innerHTML = `<div class="omnibox-group-title">Suchergebnisse (${items.length})</div>`;

    items.slice(0, 8).forEach((item) => {
        const itemEl = document.createElement("div");
        itemEl.className = "omnibox-item";
        itemEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="entity-badge badge-${item.type}">${item.type.toUpperCase()}</span>
                <span style="font-weight: 500; font-size: 0.9rem;">${item.title}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--ink-subtle);">${item.meta || ""}</span>
        `;

        itemEl.onclick = () => {
            store.setBlatt(item.id);
            container.classList.remove("open");
        };

        container.appendChild(itemEl);
    });

    container.classList.add("open");
}
