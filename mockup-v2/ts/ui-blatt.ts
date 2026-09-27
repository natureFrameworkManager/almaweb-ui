// mockup-v2/ts/ui-blatt.ts
import { store } from "./store";
import { ALL_ITEMS } from "./data";

export function renderBlattDialog() {
    const overlay = document.getElementById("blatt-dialog-overlay");
    const container = document.getElementById("blatt-dialog-content");
    if (!overlay || !container) return;

    const state = store.getState();
    if (!state.blattId) {
        overlay.classList.remove("open");
        return;
    }

    const item = ALL_ITEMS.find((i) => i.id === state.blattId);
    if (!item) return;

    const isMarked = store.isItemMarked(item.id);

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--rule); padding-bottom: 16px; margin-bottom: 20px;">
            <div>
                <div style="font-size: 0.8rem; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                    ${item.type} · ${item.number || "ID " + item.id}
                </div>
                <h1 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 600; line-height: 1.2;">
                    ${item.title}
                </h1>
            </div>
            <button id="btn-close-blatt" style="font-size: 1.5rem; line-height: 1; padding: 4px 8px; border-radius: 4px;">×</button>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div>
                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 8px;">Inhalt & Qualifikationsziele</h3>
                <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                    ${item.description || "Zu diesem Eintrag liegen derzeit keine vertiefenden Modulinformationen vor."}
                </p>

                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 8px;">Zugehörige Kurse & Lehrveranstaltungen</h3>
                <div style="background: var(--paper); border: 1px solid var(--rule); border-radius: 6px; padding: 12px; margin-bottom: 20px;">
                    <div style="font-size: 0.9rem; font-weight: 600;">Vorlesung (2 SWS)</div>
                    <div style="font-size: 0.82rem; color: var(--ink-muted);">Mi 09:15–10:45 · HS 3 Hörsaalgebäude</div>
                    <div style="font-size: 0.9rem; font-weight: 600; margin-top: 8px;">Übung (1 SWS)</div>
                    <div style="font-size: 0.82rem; color: var(--ink-muted);">Parallelgruppen Mo–Fr in Seminargebäude SG</div>
                </div>

                ${item.prerequisites && item.prerequisites.length > 0 ? `
                    <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 8px;">Empfohlene Voraussetzungen</h3>
                    <ul style="padding-left: 20px; font-size: 0.9rem; color: var(--ink-muted); margin-bottom: 20px;">
                        ${item.prerequisites.map((p) => `<li>${p}</li>`).join("")}
                    </ul>
                ` : ""}
            </div>

            <div style="background: var(--sheet-2); border: 1px solid var(--rule); border-radius: 8px; padding: 16px;">
                <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--ink-subtle); margin-bottom: 12px;">Eckdaten</h4>
                <div style="font-size: 0.85rem; margin-bottom: 10px;">
                    <strong>Leistungspunkte:</strong> ${item.lp ? `${item.lp} LP` : "—"}
                </div>
                <div style="font-size: 0.85rem; margin-bottom: 10px;">
                    <strong>Turnus:</strong> ${item.turnus || "Semesterweise"}
                </div>
                <div style="font-size: 0.85rem; margin-bottom: 10px;">
                    <strong>Fakultät:</strong> ${item.faculty || "Universität Leipzig"}
                </div>
                <div style="font-size: 0.85rem; margin-bottom: 16px;">
                    <strong>Verantwortlich:</strong> ${item.responsible || "—"}
                </div>

                <button id="blatt-toggle-mark" class="header-btn" style="width: 100%; justify-content: center; background: ${isMarked ? "var(--sheet)" : "var(--brand-700)"}; color: ${isMarked ? "var(--ink)" : "var(--on-brand)"};">
                    ${isMarked ? "Aus Mappe entfernen" : "In Mappe anstreichen 🔖"}
                </button>
            </div>
        </div>
    `;

    overlay.classList.add("open");

    document.getElementById("btn-close-blatt")?.addEventListener("click", () => store.setBlatt(null));
    overlay.onclick = (e) => {
        if (e.target === overlay) store.setBlatt(null);
    };

    document.getElementById("blatt-toggle-mark")?.addEventListener("click", () => {
        store.toggleMarkItem(item.id);
        renderBlattDialog();
    });
}
