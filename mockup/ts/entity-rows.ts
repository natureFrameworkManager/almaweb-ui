// ==========================================================================
// mockup/ts/entity-rows.ts — Entity-aware row/column adapters (Section 8)
// ==========================================================================

import type { EntityType } from "./store";
import { MOCK_MODULES, MOCK_COURSES, MOCK_EVENTS, MOCK_EXAMS, MOCK_STAFF, MOCK_ROOMS } from "./data";

export type EntityTone = "module" | "course" | "event" | "exam" | "staff" | "location";

export interface EntityMeta {
    label: string;
    tone: EntityTone;
    glyph: string;
}

export interface EntityChip {
    label: string;
    tone: EntityTone;
}

export interface RowMetaCell {
    text: string;
    kind?: "plain" | "time" | "date" | "strong";
}

export interface EntityFlag {
    text: string;
    tone: "warn" | "danger" | "info" | "ok";
}

export interface EntityRow {
    /** Row identity — also the detail-drawer key. */
    id: string;
    tone: EntityTone;
    title: string;
    code: string;
    meta: RowMetaCell[];
    flags: EntityFlag[];
    chips: EntityChip[];
    cardFooter: string;
    /** Values aligned with getTableColumns(entity). */
    cells: string[];
}

export const ENTITY_META: Record<EntityType, EntityMeta> = {
    module: { label: "Modul", tone: "module", glyph: "◧" },
    course: { label: "Kurs", tone: "course", glyph: "◷" },
    event: { label: "Veranstaltung", tone: "event", glyph: "▦" },
    exam: { label: "Prüfung", tone: "exam", glyph: "◈" },
    staff: { label: "Person", tone: "staff", glyph: "◉" },
    location: { label: "Raum", tone: "location", glyph: "◫" },
};

const TABLE_COLUMNS: Record<EntityType, string[]> = {
    module: ["Kennung", "Name", "LP", "SWS", "Semester", "Verantwortlich"],
    course: ["Kennung", "Kurs", "Typ", "Wochentag", "Zeit", "Raum", "Dozent:in"],
    event: ["Termin", "Veranstaltung", "Wochentag", "Zeit", "Raum", "Gebäude", "Dozent:in"],
    exam: ["Kennung", "Prüfung", "Datum", "Zeit", "Raum", "Art", "erforderlich"],
    staff: ["Name", "Funktion", "Kurse", "Prüfungen", "Büro"],
    location: ["Raum", "Gebäude", "Typ", "Plätze", "Barrierefreiheit"],
};

const NUMERIC_COLUMNS: Record<EntityType, number[]> = {
    module: [2, 3],
    course: [],
    event: [],
    exam: [],
    staff: [2, 3],
    location: [3],
};

export function getTableColumns(entity: EntityType): string[] {
    return TABLE_COLUMNS[entity];
}

export function isNumericColumn(entity: EntityType, columnIndex: number): boolean {
    return NUMERIC_COLUMNS[entity].includes(columnIndex);
}

/** Count label used in pane toolbars, tabs and the status bar. */
export function getRowCountLabel(entity: EntityType, count: number): string {
    const unit: Record<EntityType, string> = {
        module: "Module",
        course: "Kurse",
        event: "Termine",
        exam: "Prüfungen",
        staff: "Personen",
        location: "Räume",
    };
    return `${count} ${unit[entity]}`;
}

export function getModuleRows(): EntityRow[] {
    return MOCK_MODULES.map((m) => ({
        id: m.id,
        tone: "module" as EntityTone,
        title: m.name,
        code: m.code,
        meta: [
            { text: `${m.lp} LP`, kind: "strong" as const },
            { text: `${m.sws} SWS` },
            { text: m.language },
        ],
        flags: [],
        chips: [
            { label: `${m.lp} LP`, tone: "module" as EntityTone },
            { label: m.semester, tone: "module" as EntityTone },
            { label: m.language, tone: "module" as EntityTone },
            { label: m.faculty, tone: "module" as EntityTone },
        ],
        cardFooter: `${m.coursesCount} Kurse · ${m.examsCount} Prüfung`,
        cells: [m.code, m.name, String(m.lp), String(m.sws), m.semester, m.responsible],
    }));
}

export function getCourseRows(): EntityRow[] {
    return MOCK_COURSES.map((c) => ({
        id: c.id,
        tone: "course" as EntityTone,
        title: c.name,
        code: c.code,
        meta: [
            { text: `${c.day} ${c.time}`, kind: "time" as const },
            { text: c.room },
            { text: c.instructor },
        ],
        flags: [],
        chips: [
            { label: c.type, tone: "course" as EntityTone },
            { label: c.day, tone: "course" as EntityTone },
            { label: `${c.sws} SWS`, tone: "course" as EntityTone },
            { label: c.room, tone: "course" as EntityTone },
        ],
        cardFooter: `${c.day} ${c.time} · ${c.instructor}`,
        cells: [c.code, c.name, c.type, c.day, c.time, c.room, c.instructor],
    }));
}

export function getEventRows(): EntityRow[] {
    return MOCK_EVENTS.map((e) => ({
        id: e.id,
        tone: "event" as EntityTone,
        title: e.title,
        code: e.date,
        meta: [
            { text: `${e.day} ${e.time}`, kind: "time" as const },
            { text: e.room, kind: "strong" as const },
            { text: e.building },
        ],
        flags: [{ text: "Überschneidung", tone: "warn" as const }],
        chips: [
            { label: e.date, tone: "event" as EntityTone },
            { label: e.time, tone: "event" as EntityTone },
            { label: e.room, tone: "event" as EntityTone },
            { label: e.building, tone: "event" as EntityTone },
        ],
        cardFooter: `${e.room} · ${e.instructor}`,
        cells: [e.date, e.title, e.day, e.time, e.room, e.building, e.instructor],
    }));
}

export function getExamRows(): EntityRow[] {
    return MOCK_EXAMS.map((x) => ({
        id: x.id,
        tone: "exam" as EntityTone,
        title: x.name,
        code: x.code,
        meta: [
            { text: x.date, kind: "date" as const },
            { text: x.time, kind: "time" as const },
            { text: x.room, kind: "strong" as const },
        ],
        flags: x.mandatory
            ? [{ text: "Pflicht", tone: "danger" as const }]
            : [{ text: "Wahl", tone: "info" as const }],
        chips: [
            { label: x.date, tone: "exam" as EntityTone },
            { label: x.time, tone: "exam" as EntityTone },
            { label: x.type, tone: "exam" as EntityTone },
            { label: x.examiner, tone: "exam" as EntityTone },
        ],
        cardFooter: `${x.type} · ${x.examiner}`,
        cells: [x.code, x.name, x.date, x.time, x.room, x.type, x.mandatory ? "Ja" : "Nein"],
    }));
}

export function getStaffRows(): EntityRow[] {
    return MOCK_STAFF.map((p) => ({
        id: p.id,
        tone: "staff" as EntityTone,
        title: p.name,
        code: p.office,
        meta: [
            { text: p.title, kind: "strong" as const },
            { text: `${p.coursesCount} Kurse` },
            { text: `${p.examsCount} Prüfungen` },
        ],
        flags: [],
        chips: [
            { label: `${p.coursesCount} Kurse`, tone: "staff" as EntityTone },
            { label: `${p.examsCount} Prüfungen`, tone: "staff" as EntityTone },
            { label: p.faculty, tone: "staff" as EntityTone },
        ],
        cardFooter: p.email,
        cells: [p.name, p.title, String(p.coursesCount), String(p.examsCount), p.office],
    }));
}

export function getLocationRows(): EntityRow[] {
    return MOCK_ROOMS.map((r) => ({
        id: r.id,
        tone: "location" as EntityTone,
        title: r.name,
        code: r.building,
        meta: [
            { text: r.type, kind: "strong" as const },
            { text: `${r.capacity} Plätze` },
        ],
        flags: r.accessible
            ? [{ text: "Barrierefrei", tone: "ok" as const }]
            : [{ text: "Treppen", tone: "warn" as const }],
        chips: [
            { label: r.type, tone: "location" as EntityTone },
            { label: `${r.capacity} Plätze`, tone: "location" as EntityTone },
            { label: r.accessible ? "Barrierefrei" : "Barrieren", tone: "location" as EntityTone },
        ],
        cardFooter: r.building,
        cells: [r.name, r.building, r.type, String(r.capacity), r.accessible ? "Ja" : "Nein"],
    }));
}

export function getRows(entity: EntityType): EntityRow[] {
    switch (entity) {
        case "course":
            return getCourseRows();
        case "event":
            return getEventRows();
        case "exam":
            return getExamRows();
        case "staff":
            return getStaffRows();
        case "location":
            return getLocationRows();
        default:
            return getModuleRows();
    }
}

