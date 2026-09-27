// ==========================================================================
// mockup/ts/view-compare.ts — Vergleichsmodus (Section 9.7, TBD-6)
// ==========================================================================

import { store } from "./store";

interface CompareEntry {
    title: string;
    meta: string;
    chips: string[];
}

const SLOT_A: CompareEntry[] = [
    { title: "Modellierung und Programmierung 1", meta: "10-201-2001 · 10 LP · 6 SWS", chips: ["Pflicht", "Deutsch"] },
    { title: "Algorithmen und Datenstrukturen 1", meta: "10-201-2011 · 5 LP · 4 SWS", chips: ["Pflicht", "Klausur"] },
    { title: "Datenbanksysteme 1", meta: "10-202-2301 · 5 LP · 3 SWS", chips: ["Wahlpflicht", "Deutsch"] },
];

const SLOT_B: CompareEntry[] = [
    { title: "Einführung in die Wirtschaftswissenschaften", meta: "09-101-1102 · 10 LP · 4 SWS", chips: ["Pflicht", "Deutsch"] },
    { title: "Datenbanksysteme 1", meta: "10-202-2301 · 5 LP · 3 SWS", chips: ["Wahlpflicht", "Deutsch"] },
    { title: "Kognitive Psychologie", meta: "11-001-0101 · 5 LP · 3 SWS", chips: ["Wahlpflicht", "Seminar"] },
];

let diffOnly = true;

export function isDiffOnly(): boolean {
    return diffOnly;
}

export function setDiffOnly(value: boolean): void {
    diffOnly = value;
}

/** Compare: two aligned columns, diff highlighting and totals row. */
export function renderCompareView(container: HTMLElement): void {
    const { compareSlots } = store.getState();
    const rowCount = Math.max(SLOT_A.length, SLOT_B.length);

    let body = "";
    for (let index = 0; index < rowCount; index++) {
        const left = SLOT_A[index];
        const right = SLOT_B[index];
        const isDiff = (left?.title ?? "") !== (right?.title ?? "");
        if (diffOnly && !isDiff) continue;
        body += cellMarkup(left, isDiff, "slot-a");
        body += cellMarkup(right, isDiff, "slot-b");
    }

    container.innerHTML = `
        <div class="compare-wrap">
            <div class="compare-toolbar">
                <label class="compare-switch">
                    <input type="checkbox" id="chk-diff-only" ${diffOnly ? "checked" : ""}>
                    <span>Nur unterschiedliche Einträge anzeigen</span>
                </label>
                <div class="compare-toolbar-actions">
                    <button class="btn btn-sm btn-secondary" id="btn-compare-swap">Plätze tauschen</button>
                    <button class="btn btn-sm btn-secondary" id="btn-compare-reset">Alle Zeilen zeigen</button>
                    <button class="btn btn-sm btn-primary" id="btn-compare-export">Vergleich exportieren</button>
                </div>
            </div>

            <div class="compare-scroll">
                <div class="compare-grid">
                    <div class="compare-head slot-a">
                        <span class="compare-head-title slot-a">★ ${compareSlots.slotA}</span>
                        <span class="compare-head-stats">3 Module · 20 LP · 13 SWS</span>
                    </div>
                    <div class="compare-head slot-b">
                        <span class="compare-head-title slot-b">★ ${compareSlots.slotB}</span>
                        <span class="compare-head-stats">3 Module · 20 LP · 10 SWS</span>
                    </div>

                    <div class="compare-section">Belegte Module</div>
                    ${body}

                    <div class="compare-totals">
                        <div class="compare-total">
                            <span>Gesamt Slot A</span>
                            <span class="compare-total-value">20 LP · 13 SWS</span>
                        </div>
                        <div class="compare-total">
                            <span>Gesamt Slot B</span>
                            <span class="compare-total-value">20 LP · 10 SWS</span>
                        </div>
                    </div>

                    <p class="compare-note">
                        Es werden ausschließlich lokal gespeicherte Listen verglichen. Umfasst ein Slot mehr als
                        eine Seite, werden standardmäßig nur abweichende Zeilen gezeigt (TBD-6).
                    </p>
                </div>
            </div>
        </div>`;

    bindCompareInteractions(container);
}

function cellMarkup(entry: CompareEntry | undefined, isDiff: boolean, slot: "slot-a" | "slot-b"): string {
    if (!entry) {
        return `<div class="compare-cell is-empty">— nicht belegt —</div>`;
    }
    const classes = ["compare-cell"];
    if (isDiff) classes.push("is-diff");
    if (slot === "slot-a") classes.push("is-mine");

    return `
        <div class="${classes.join(" ")}">
            <span class="compare-cell-title">${slot === "slot-a" ? "★ " : ""}${entry.title}</span>
            <span class="compare-cell-meta">${entry.meta}</span>
            <span class="compare-cell-chips">
                ${entry.chips.map((chip) => `<span class="chip">${chip}</span>`).join("")}
            </span>
        </div>`;
}

function bindCompareInteractions(container: HTMLElement): void {
    const checkbox = container.querySelector<HTMLInputElement>("#chk-diff-only");
    checkbox?.addEventListener("change", () => {
        diffOnly = checkbox.checked;
        renderCompareView(container);
    });

    container.querySelector("#btn-compare-swap")?.addEventListener("click", () => {
        const { compareSlots } = store.getState();
        const swap = compareSlots.slotA;
        compareSlots.slotA = compareSlots.slotB;
        compareSlots.slotB = swap;
        renderCompareView(container);
    });

    container.querySelector("#btn-compare-reset")?.addEventListener("click", () => {
        diffOnly = false;
        renderCompareView(container);
    });

    container.querySelector("#btn-compare-export")?.addEventListener("click", () => {
        store.setExportModalOpen(true);
    });
}
