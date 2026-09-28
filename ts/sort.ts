import type { Course, Degree, Event, Exam, Location, Module, Staff } from "./api/types";
import type { EntityType } from "./state";

/** Sort direction of a single sort level. */
export type SortDirection = "asc" | "desc";

/** A single configured sort level. */
export type SortLevel = {
    field: string;
    direction: SortDirection;
};

/** Value a sort field extracts from a record. */
type SortValue = string | number | boolean | null | undefined;

/** A selectable sort field with its display label and value reader. */
export type SortOption = {
    field: string;
    label: string;
    value: (item: unknown) => SortValue;
};

/** Sortable fields of modules, matching the API `sort` enum. */
const MODULE_OPTIONS: SortOption[] = [
    { field: "name", label: "Modulname", value: (item) => (item as Module).name },
    { field: "number", label: "Modulnummer", value: (item) => (item as Module).number },
    { field: "credits", label: "Leistungspunkte", value: (item) => (item as Module).credits },
    {
        field: "duration_semesters",
        label: "Semesterdauer",
        value: (item) => (item as Module).duration_semesters,
    },
    { field: "language", label: "Sprache", value: (item) => (item as Module).language },
    { field: "frequency", label: "Häufigkeit", value: (item) => (item as Module).frequency },
];

/** Sortable fields of courses, matching the API `sort` enum. */
const COURSE_OPTIONS: SortOption[] = [
    { field: "name", label: "Kursname", value: (item) => (item as Course).name },
    { field: "number", label: "Kursnummer", value: (item) => (item as Course).number },
    { field: "type", label: "Kursart", value: (item) => (item as Course).type?.name ?? null },
    { field: "weekday", label: "Wochentag", value: (item) => (item as Course).weekday },
    {
        field: "weekly_hours",
        label: "Wochenstunden",
        value: (item) => (item as Course).weekly_hours,
    },
    { field: "language", label: "Sprache", value: (item) => (item as Course).language },
];

/** Sortable fields of events, matching the API `sort` enum. */
const EVENT_OPTIONS: SortOption[] = [
    { field: "name", label: "Titel", value: (item) => (item as Event).name },
    { field: "number", label: "Nummer", value: (item) => (item as Event).number },
    { field: "event_date", label: "Datum", value: (item) => (item as Event).event_date },
    { field: "start_time", label: "Startzeit", value: (item) => (item as Event).start_time },
    { field: "end_time", label: "Endzeit", value: (item) => (item as Event).end_time },
];

/** Sortable fields of exams, matching the API `sort` enum. */
const EXAM_OPTIONS: SortOption[] = [
    { field: "name", label: "Prüfungsname", value: (item) => (item as Exam).name },
    { field: "exam_date", label: "Datum", value: (item) => (item as Exam).exam_date },
    { field: "start_time", label: "Startzeit", value: (item) => (item as Exam).start_time },
    { field: "end_time", label: "Endzeit", value: (item) => (item as Exam).end_time },
    { field: "required", label: "Verpflichtend", value: (item) => (item as Exam).required },
];

/** Sortable fields of staff, matching the API `sort` enum. */
const STAFF_OPTIONS: SortOption[] = [
    { field: "name", label: "Name", value: (item) => (item as Staff).name },
];

/** Sortable fields of locations, matching the API `sort` enum. */
const LOCATION_OPTIONS: SortOption[] = [
    { field: "name", label: "Name", value: (item) => (item as Location).name },
    { field: "external_id", label: "Externe ID", value: (item) => (item as Location).external_id },
    { field: "type", label: "Raumtyp", value: (item) => (item as Location).type },
    { field: "seats", label: "Plätze", value: (item) => (item as Location).seats },
    { field: "size", label: "Größe", value: (item) => (item as Location).size },
    {
        field: "accessibility",
        label: "Barrierefreiheit",
        value: (item) => (item as Location).accessibility,
    },
];

/** Sortable fields of degrees, matching the API `sort` enum. */
const DEGREE_OPTIONS: SortOption[] = [
    { field: "name", label: "Name", value: (item) => (item as Degree).name },
    { field: "subject", label: "Fach", value: (item) => (item as Degree).subject },
    { field: "degree", label: "Abschluss", value: (item) => (item as Degree).degree },
    { field: "school_type", label: "Schulart", value: (item) => (item as Degree).school_type },
    { field: "ects", label: "Leistungspunkte", value: (item) => (item as Degree).ects },
    { field: "version", label: "Version", value: (item) => (item as Degree).version },
];

/** Sortable fields per entity type. */
export const SORT_OPTIONS: Record<EntityType, SortOption[]> = {
    modules: MODULE_OPTIONS,
    courses: COURSE_OPTIONS,
    events: EVENT_OPTIONS,
    exams: EXAM_OPTIONS,
    staff: STAFF_OPTIONS,
    locations: LOCATION_OPTIONS,
    degrees: DEGREE_OPTIONS,
};

/**
 * Return the sortable fields of an entity type.
 * @param type - Entity type selector value.
 * @returns The sortable fields, or an empty list for unknown types.
 */
export function sortOptionsFor(type: string): SortOption[] {
    return SORT_OPTIONS[type as EntityType] ?? [];
}

/**
 * Look up the display label of a sort field.
 * @param type - Entity type selector value.
 * @param field - Sort field name.
 * @returns The field label, falling back to the raw field name.
 */
export function sortFieldLabel(type: string, field: string): string {
    return sortOptionsFor(type).find((option) => option.field === field)?.label ?? field;
}

/**
 * Parse persisted sort entries into sort levels.
 *
 * Each entry has the form `"field:asc"` or `"field:desc"`; malformed entries are
 * dropped so a hand-edited state document never breaks the sorting.
 * @param entries - Persisted sort entries.
 * @returns The parsed sort levels.
 */
export function parseSortLevels(entries: string[]): SortLevel[] {
    return entries
        .map((entry) => {
            const [field, direction] = entry.split(":");
            return {
                field: field ?? "",
                direction: direction === "desc" ? "desc" : "asc",
            } as SortLevel;
        })
        .filter((level) => level.field !== "");
}

/**
 * Serialise sort levels into the persisted `"field:direction"` entries.
 * @param levels - Sort levels to serialise.
 * @returns The persisted sort entries.
 */
export function serializeSortLevels(levels: SortLevel[]): string[] {
    return levels.map((level) => `${level.field}:${level.direction}`);
}

/**
 * Compare two sort values, ordering empty values last.
 * @param a - First value.
 * @param b - Second value.
 * @returns The comparison result.
 */
function compareValues(a: SortValue, b: SortValue): number {
    const aEmpty = a === null || a === undefined || a === "";
    const bEmpty = b === null || b === undefined || b === "";
    if (aEmpty || bEmpty) {
        return aEmpty && bEmpty ? 0 : aEmpty ? 1 : -1;
    }
    if (typeof a === "number" && typeof b === "number") {
        return a - b;
    }
    if (typeof a === "boolean" && typeof b === "boolean") {
        return a === b ? 0 : a ? 1 : -1;
    }
    return String(a).localeCompare(String(b), "de", { numeric: true });
}

/**
 * Compare two records by a list of sort levels.
 *
 * The first level is the primary key and every further level breaks ties of the
 * previous one. The backend only supports a single level, hence the complete
 * multi-level sort happens on the client.
 * @param a - First record.
 * @param b - Second record.
 * @param levels - Sort levels to apply, in order.
 * @param type - Entity type selector value.
 * @returns The comparison result.
 */
export function compareItems(a: unknown, b: unknown, levels: SortLevel[], type: string): number {
    const options = sortOptionsFor(type);
    return levels.reduce<number>((result, level) => {
        if (result !== 0) {
            return result;
        }
        const option = options.find((entry) => entry.field === level.field);
        const comparison = compareValues(option?.value(a), option?.value(b));
        return level.direction === "desc" ? -comparison : comparison;
    }, 0);
}

/**
 * Build a human readable summary of the configured sort levels.
 * @param levels - Sort levels to describe.
 * @param type - Entity type selector value.
 * @returns The summary text, or an empty string without any level.
 */
export function describeSort(levels: SortLevel[], type: string): string {
    return levels
        .map(
            (level) =>
                `${sortFieldLabel(type, level.field)} ${level.direction === "asc" ? "↑" : "↓"}`,
        )
        .join(", ");
}
