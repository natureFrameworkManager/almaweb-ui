// ==========================================================================
// mockup/ts/ui-detail.ts — Right Detail Drawer Component (Section 9.6) Part 1
// ==========================================================================

import { store } from "./store";
import { MOCK_MODULES, MOCK_COURSES, MOCK_EXAMS } from "./data";
import { showToast } from "./ui-toast";

export function renderDetailDrawer(container: HTMLElement): void {
    const { selectedDetailId, selectedDetailType, savedItems } = store.getState();

    if (!selectedDetailId || !selectedDetailType) {
        container.style.display = "none";
        return;
    }

    container.style.display = "flex";
    const isSaved = savedItems.has(selectedDetailId);

    if (selectedDetailType === "module") {
        const mod = MOCK_MODULES.find(m => m.id === selectedDetailId) || MOCK_MODULES[0]!;
        const relatedCourses = MOCK_COURSES.filter(c => c.moduleId === mod.id);
        const relatedExams = MOCK_EXAMS.filter(e => e.moduleId === mod.id);

        container.innerHTML = `
            <div class="detail-header">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                        <span class="chip chip-module">Modul</span>
                        <span class="mono" style="font-size:12px; color:var(--color-text-subtle);">${mod.code}</span>
                    </div>
                    <h2 style="font-size: var(--text-title);">${mod.name}</h2>
                </div>
                <button class="btn btn-ghost btn-icon" id="btn-close-detail" title="Schließen">✕</button>
            </div>

            <div class="detail-body">
                <div class="detail-section">
                    <div class="detail-section-title">Kennzahlen</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">
                        <span class="chip"><strong>${mod.lp}</strong> LP</span>
                        <span class="chip"><strong>${mod.sws}</strong> SWS</span>
                        <span class="chip">${mod.semester}</span>
                        <span class="chip">${mod.language}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Fakultät & Verantwortliche</div>
                    <div style="font-size: var(--text-body-sm); color: var(--color-text);">
                        <div>${mod.faculty}</div>
                        <div style="color:var(--color-text-muted); margin-top:2px;">${mod.responsible}</div>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Beschreibung</div>
                    <p style="font-size: var(--text-body-sm); color: var(--color-text-muted); line-height: 1.5;">
                        ${mod.description}
                    </p>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Zugehörige Kurse (${relatedCourses.length})</div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${relatedCourses.map(c => `
                            <div style="padding:8px 10px; background:var(--color-surface-2); border-radius:var(--radius-sm); border-left:3px solid var(--color-type-course);">
                                <div style="font-weight:600; font-size:var(--text-body-sm);">${c.name}</div>
                                <div style="font-size:var(--text-label); color:var(--color-text-muted);">${c.day} ${c.time} · ${c.room} · ${c.instructor}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Prüfungen (${relatedExams.length})</div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        ${relatedExams.map(e => `
                            <div style="padding:8px 10px; background:var(--color-surface-2); border-radius:var(--radius-sm); border-left:3px solid var(--color-type-exam);">
                                <div style="font-weight:600; font-size:var(--text-body-sm);">${e.name}</div>
                                <div style="font-size:var(--text-label); color:var(--color-text-muted);">${e.date} · ${e.time} · ${e.room}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>

            <div class="detail-footer">
                <button class="btn ${isSaved ? 'btn-accent' : 'btn-secondary'}" id="btn-detail-save" style="flex:1;">
                    ${isSaved ? '★ Gemerkt (In Meine Liste)' : '＋ In Meine Liste'}
                </button>
            </div>
        `;
    } else {
        renderCourseDetail(container, selectedDetailId, isSaved);
    }

    container.querySelector("#btn-close-detail")?.addEventListener("click", () => {
        store.setDetail(null);
    });

    container.querySelector("#btn-detail-save")?.addEventListener("click", () => {
        store.toggleSave(selectedDetailId);
        showToast(isSaved ? "Aus Meine Liste entfernt" : "Zu Meine Liste hinzugefügt (Bellis Pink)");
    });
}


function renderCourseDetail(container: HTMLElement, selectedDetailId: string, isSaved: boolean): void {
    const c = MOCK_COURSES.find(item => item.id === selectedDetailId) || MOCK_COURSES[0]!;
    container.innerHTML = `
        <div class="detail-header">
            <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span class="chip chip-course">Kurs</span>
                    <span class="mono" style="font-size:12px; color:var(--color-text-subtle);">${c.code}</span>
                </div>
                <h2 style="font-size: var(--text-title);">${c.name}</h2>
            </div>
            <button class="btn btn-ghost btn-icon" id="btn-close-detail" title="Schließen">✕</button>
        </div>

        <div class="detail-body">
            <div class="detail-section">
                <div class="detail-section-title">Modulbezug</div>
                <div style="font-size:var(--text-body-sm); color:var(--color-brand-600); cursor:pointer;" id="link-parent-mod">${c.moduleName} ↗</div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Zeit & Ort</div>
                <div style="font-size:var(--text-body-sm);">
                    <div><strong>${c.day}, ${c.time}</strong></div>
                    <div style="color:var(--color-text-muted); margin-top:2px;">Raum: ${c.room}</div>
                    <div style="color:var(--color-text-muted);">Dozent: ${c.instructor}</div>
                </div>
            </div>
        </div>

        <div class="detail-footer">
            <button class="btn ${isSaved ? 'btn-accent' : 'btn-secondary'}" id="btn-detail-save" style="flex:1;">
                ${isSaved ? '★ Gemerkt' : '＋ In Meine Liste'}
            </button>
        </div>
    `;

    container.querySelector("#link-parent-mod")?.addEventListener("click", () => {
        store.setDetail(c.moduleId, "module");
    });
}
