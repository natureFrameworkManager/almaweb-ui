// mockup-v2/ts/satzfilter.ts — Satzfilter interactive logic
import { store } from "./store";

export function initSatzfilter() {
    const slotEntity = document.getElementById("slot-entity");
    const slotFaculty = document.getElementById("slot-faculty");
    const slotSemester = document.getElementById("slot-semester");
    const slotLp = document.getElementById("slot-lp");

    slotEntity?.addEventListener("click", () => {
        showSlotPicker("Entity-Typ wählen", ["Module", "Kurse", "Termine", "Prüfungen", "Personen", "Räume"], (selected) => {
            if (slotEntity) slotEntity.innerHTML = `${selected} ▾`;
            store.setFilterText("");
        });
    });

    slotFaculty?.addEventListener("click", () => {
        showSlotPicker("Fakultät wählen", ["Alle Fakultäten", "10 Fakultät für Mathematik und Informatik", "09 Wirtschaftswissenschaftliche Fakultät"], (selected) => {
            if (slotFaculty) slotFaculty.innerHTML = `${selected} ▾`;
            store.setFilterFaculty(selected);
        });
    });

    slotSemester?.addEventListener("click", () => {
        showSlotPicker("Semester wählen", ["WiSe 2025/26", "SoSe 2026", "WiSe 2026/27"], (selected) => {
            if (slotSemester) slotSemester.innerHTML = `${selected} ▾`;
            store.setFilterSemester(selected);
        });
    });

    slotLp?.addEventListener("click", () => {
        showSlotPicker("Leistungspunkte wählen", ["Alle LP", "5", "10"], (selected) => {
            if (slotLp) slotLp.innerHTML = `${selected === "Alle LP" ? "beliebig vielen" : selected} LP ▾`;
            store.setFilterLp(selected);
        });
    });
}

function showSlotPicker(title: string, options: string[], onSelect: (val: string) => void) {
    const overlay = document.createElement("div");
    overlay.className = "dialog-overlay open";

    const modal = document.createElement("div");
    modal.className = "sheet-dialog";
    modal.style.maxWidth = "360px";

    modal.innerHTML = `
        <div style="font-weight: 600; font-size: 1rem; margin-bottom: 12px; border-bottom: 1px solid var(--rule); padding-bottom: 8px;">
            ${title}
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
            ${options.map((opt) => `<button class="header-btn" style="text-align: left; justify-content: flex-start; padding: 8px 12px;" data-val="${opt}">${opt}</button>`).join("")}
        </div>
    `;

    modal.querySelectorAll("button").forEach((btn) => {
        btn.onclick = () => {
            const val = btn.getAttribute("data-val");
            if (val) onSelect(val);
            overlay.remove();
        };
    });

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
