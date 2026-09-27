// ==========================================================================
// mockup/ts/ui-detail.ts — Detail drawer for all six entity types (9.6)
// ==========================================================================

import { store } from "./store";
import type { EntityType } from "./store";
import { ENTITY_META } from "./entity-rows";
import { MOCK_MODULES, MOCK_COURSES, MOCK_EVENTS, MOCK_EXAMS, MOCK_STAFF, MOCK_ROOMS } from "./data";
import { showToast } from "./ui-toast";

interface Fact {
    label: string;
    value: string;
}

interface Relation {
    tone: EntityType;
    title: string;
    sub: string;
    id: string;
}

interface DetailModel {
    kicker: string;
    code: string;
    title: string;
    chips: string[];
    facts: Fact[];
    relationsTitle: string;
    relations: Relation[];
    note: string;
}

export function renderDetailDrawer(container: HTMLElement): void {
    const { selectedDetailId, selectedDetailType, savedItems } = store.getState();

    if (!selectedDetailId || !selectedDetailType) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
    }

    const model = buildModel(selectedDetailId, selectedDetailType);
    if (!model) {
        container.style.display = "none";
        return;
    }

    container.style.display = "flex";
    const isSaved = savedItems.has(selectedDetailId);
    const meta = ENTITY_META[selectedDetailType];

    container.innerHTML = `
        <div class="detail-header">
            <div class="detail-headings">
                <span class="detail-kicker">
                    <span class="chip chip-${meta.tone}">${model.kicker}</span>
                    <span class="mono detail-code">${model.code}</span>
                </span>
                <h2 class="detail-title">${model.title}</h2>
            </div>
            <button class="btn btn-ghost btn-icon" id="btn-close-detail" aria-label="Schließen">✕</button>
        </div>

        <div class="detail-body">
            <div class="detail-section">
                <div class="detail-section-title">Kennzahlen</div>
                <div class="chip-row">
                    ${model.chips.map((chip) => `<span class="chip">${chip}</span>`).join("")}
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Fakten</div>
                <dl class="fact-list">
                    ${model.facts
                        .map(
                            (fact) => `
                        <div class="fact-row">
                            <dt>${fact.label}</dt>
                            <dd>${fact.value}</dd>
                        </div>`,
                        )
                        .join("")}
                </dl>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">${model.relationsTitle}</div>
                <div class="relation-list">
                    ${
                        model.relations.length === 0
                            ? `<span class="relation-empty">Keine verknüpften Einträge.</span>`
                            : model.relations
                                  .map(
                                      (relation) => `
                            <button class="relation-item tone-${relation.tone}" data-goto="${relation.id}" data-goto-type="${relation.tone}">
                                <span class="relation-title">${relation.title}</span>
                                <span class="relation-sub">${relation.sub}</span>
                            </button>`,
                                  )
                                  .join("")
                    }
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Hinweise</div>
                <p class="detail-note">${model.note}</p>
            </div>
        </div>

        <div class="detail-footer">
            <button class="btn ${isSaved ? "btn-accent" : "btn-secondary"}" id="btn-detail-save">
                ${isSaved ? "★ In Meine Liste" : "☆ In Meine Liste"}
            </button>
            <button class="btn btn-secondary" id="btn-detail-share">Teilen</button>
            <button class="btn btn-ghost" id="btn-detail-close-foot">Schließen</button>
        </div>`;

    bindDetailInteractions(container, selectedDetailId, meta.label);
}

function bindDetailInteractions(container: HTMLElement, id: string, label: string): void {
    const close = (): void => store.setDetail(null, null);

    container.querySelector("#btn-close-detail")?.addEventListener("click", close);
    container.querySelector("#btn-detail-close-foot")?.addEventListener("click", close);

    container.querySelector("#btn-detail-save")?.addEventListener("click", () => {
        const wasSaved = store.getState().savedItems.has(id);
        store.toggleSave(id);
        showToast(wasSaved ? "Aus Meine Liste entfernt" : `${label} zu Meine Liste hinzugefügt ★`);
    });

    container.querySelector("#btn-detail-share")?.addEventListener("click", () => {
        showToast("Deep-Link in die Zwischenablage kopiert");
    });

    container.querySelectorAll<HTMLElement>("[data-goto]").forEach((item) => {
        item.addEventListener("click", () => {
            const nextId = item.getAttribute("data-goto");
            const nextType = item.getAttribute("data-goto-type") as EntityType | null;
            if (nextId && nextType) store.setDetail(nextId, nextType);
        });
    });
}

function buildModel(id: string, type: EntityType): DetailModel | null {
    switch (type) {
        case "module": {
            const mod = MOCK_MODULES.find((m) => m.id === id);
            if (!mod) return null;
            return {
                kicker: "Modul",
                code: mod.code,
                title: mod.name,
                chips: [`${mod.lp} LP`, `${mod.sws} SWS`, mod.semester, mod.language],
                facts: [
                    { label: "Fakultät", value: mod.faculty },
                    { label: "Verantwortlich", value: mod.responsible },
                    { label: "Kurse", value: `${mod.coursesCount}` },
                    { label: "Prüfungen", value: `${mod.examsCount}` },
                ],
                relationsTitle: "Zugehörige Kurse & Prüfungen",
                relations: [
                    ...MOCK_COURSES.filter((c) => c.moduleId === mod.id).map((c) => ({
                        tone: "course" as EntityType,
                        title: c.name,
                        sub: `${c.day} ${c.time} · ${c.room} · ${c.instructor}`,
                        id: c.id,
                    })),
                    ...MOCK_EXAMS.filter((x) => x.moduleId === mod.id).map((x) => ({
                        tone: "exam" as EntityType,
                        title: x.name,
                        sub: `${x.date} · ${x.time} · ${x.room}`,
                        id: x.id,
                    })),
                ],
                note: mod.description,
            };
        }

        case "course": {
            const course = MOCK_COURSES.find((c) => c.id === id);
            if (!course) return null;
            return {
                kicker: course.type,
                code: course.code,
                title: course.name,
                chips: [`${course.sws} SWS`, course.day, course.time, course.room],
                facts: [
                    { label: "Dozent:in", value: course.instructor },
                    { label: "Raum", value: course.room },
                    { label: "Termin", value: `${course.day}, ${course.time}` },
                ],
                relationsTitle: "Gehört zum Modul",
                relations: [
                    { tone: "module", title: course.moduleName, sub: "Modul öffnen", id: course.moduleId },
                ],
                note: "Kurse werden aus dem Modul abgeleitet; Änderungen an Termin oder Raum erfolgen im Modulkontext.",
            };
        }

        case "event": {
            const event = MOCK_EVENTS.find((e) => e.id === id);
            if (!event) return null;
            const course = MOCK_COURSES.find((c) => c.id === event.courseId);
            const room = MOCK_ROOMS.find((r) => event.room.includes(r.name)) ?? MOCK_ROOMS[0];
            return {
                kicker: "Veranstaltung",
                code: event.date,
                title: event.title,
                chips: [event.day, event.time, event.room, event.building],
                facts: [
                    { label: "Dozent:in", value: event.instructor },
                    { label: "Dauer", value: `${event.durationHours * 45} Minuten` },
                    { label: "Ort", value: `${event.room}, ${event.building}` },
                ],
                relationsTitle: "Kurs & Raum",
                relations: [
                    ...(course
                        ? [{ tone: "course" as EntityType, title: course.name, sub: "Kurs öffnen", id: course.id }]
                        : []),
                    ...(room ? [{ tone: "location" as EntityType, title: room.name, sub: room.building, id: room.id }] : []),
                ],
                note: "Terminverschiebungen werden im Kalender sofort sichtbar; gemerkte Kurse behalten ihre Farbe.",
            };
        }

        case "exam": {
            const exam = MOCK_EXAMS.find((x) => x.id === id);
            if (!exam) return null;
            const mod = MOCK_MODULES.find((m) => m.id === exam.moduleId);
            return {
                kicker: exam.type,
                code: exam.code,
                title: exam.name,
                chips: [exam.date, exam.time, exam.room, exam.mandatory ? "Pflicht" : "Wahl"],
                facts: [
                    { label: "Prüfer:in", value: exam.examiner },
                    { label: "Datum", value: `${exam.date}, ${exam.time}` },
                    { label: "Raum", value: exam.room },
                    { label: "Verbindlichkeit", value: exam.mandatory ? "Pflichtprüfung" : "Wahlprüfung" },
                ],
                relationsTitle: "Gehört zum Modul",
                relations: mod ? [{ tone: "module", title: mod.name, sub: "Modul öffnen", id: mod.id }] : [],
                note: "Prüfungstermine sind verbindlich erst nach offizieller Ankündigung; diese Ansicht dient der Orientierung.",
            };
        }

        case "staff": {
            const person = MOCK_STAFF.find((p) => p.id === id);
            if (!person) return null;
            return {
                kicker: "Person",
                code: person.office,
                title: person.name,
                chips: [`${person.coursesCount} Kurse`, `${person.examsCount} Prüfungen`, person.faculty],
                facts: [
                    { label: "Funktion", value: person.title },
                    { label: "Büro", value: person.office },
                    { label: "E-Mail", value: person.email },
                ],
                relationsTitle: "Lehrveranstaltungen",
                relations: MOCK_COURSES.filter((c) => c.instructor === person.name).map((c) => ({
                    tone: "course" as EntityType,
                    title: c.name,
                    sub: `${c.day} ${c.time} · ${c.room}`,
                    id: c.id,
                })),
                note: "Kontaktdaten stammen aus dem öffentlichen Vorlesungsverzeichnis.",
            };
        }

        default: {
            const room = MOCK_ROOMS.find((r) => r.id === id);
            if (!room) return null;
            return {
                kicker: room.type,
                code: room.name,
                title: room.name,
                chips: [`${room.capacity} Plätze`, room.type, room.accessible ? "Barrierefrei" : "Barrieren"],
                facts: [
                    { label: "Gebäude", value: room.building },
                    { label: "Nutzungstyp", value: room.type },
                    { label: "Kapazität", value: `${room.capacity} Plätze` },
                    { label: "Barrierefreiheit", value: room.accessible ? "Ja" : "Eingeschränkt" },
                ],
                relationsTitle: "Termine in diesem Raum",
                relations: MOCK_EVENTS.filter((e) => e.room.includes(room.name)).map((e) => ({
                    tone: "event" as EntityType,
                    title: e.title,
                    sub: `${e.day} ${e.time}`,
                    id: e.id,
                })),
                note: "Raumdaten dienen der Orientierung; Belegungspläne können sich kurzfristig ändern.",
            };
        }
    }

    return null;
}
