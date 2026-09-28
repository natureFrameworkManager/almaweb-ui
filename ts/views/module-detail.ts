import { getModuleDetail } from "../api/api";
import type { ModuleDetail } from "../api/types";
import { normalizePath } from "../tree";
import {
    createAttrGrid,
    createAttrTable,
    createSection,
    createSectionsTab,
    createTableTab,
    displayText,
    EMPTY_VALUE,
    registerDetail,
    type DetailTab,
} from "./detail-dialog";
import {
    buildingColumns,
    collectBuildings,
    collectEvents,
    collectLocations,
    collectStaff,
    courseColumns,
    degreeColumns,
    eventColumns,
    examColumns,
    locationColumns,
    semesterColumns,
    staffColumns,
} from "./detail-tables";

/**
 * Build the display text for the module path.
 * @param detail - Module detail record.
 * @returns The formatted module path.
 */
function formatModulePath(detail: ModuleDetail): string {
    const faculty = detail.faculty ? detail.faculty.name : "";
    return normalizePath(detail.path, faculty)
        .map((segments) => segments.join(" > "))
        .join(" / ");
}

/**
 * Build the attribute rows for the module's prerequisites.
 * @param detail - Module detail record.
 * @returns The prerequisite attribute rows.
 */
function createPrerequisiteRows(detail: ModuleDetail): { label: string; value: string }[] {
    const entries = Object.entries(detail.prerequisites ?? {});
    if (entries.length === 0) {
        return [{ label: "Zulassungsvoraussetzungen", value: EMPTY_VALUE }];
    }
    return entries.map(([degree, requirement]) => ({
        label: degree,
        value: displayText(requirement),
    }));
}

/**
 * Render the details tab of a module.
 * @param detail - Module detail record.
 * @returns The details tab.
 */
function createModuleDetailsTab(detail: ModuleDetail): DetailTab {
    const attributes = createSection("Angaben", [
        createAttrGrid([
            { label: "Modulnummer", value: displayText(detail.number) },
            {
                label: "Leistungspunkte",
                value: detail.credits ? `${detail.credits} LP` : EMPTY_VALUE,
            },
            {
                label: "Dauer",
                value: detail.duration_semesters
                    ? `${detail.duration_semesters} Semester`
                    : EMPTY_VALUE,
            },
            { label: "Häufigkeit", value: displayText(detail.frequency) },
            { label: "Sprache", value: displayText(detail.language) },
            {
                label: "Fakultät",
                value: displayText(detail.faculty ? detail.faculty.name : ""),
            },
        ]),
    ]);
    const contents = createSection("Inhalte & Voraussetzungen", [
        createAttrTable([
            { label: "Modulpfad", value: displayText(formatModulePath(detail)) },
            { label: "Inhalte", value: displayText(detail.content) },
            { label: "Qualifikationsziele", value: displayText(detail.goals) },
            { label: "Prüfungsvorleistungen", value: displayText(detail.exam_prerequisites) },
            ...createPrerequisiteRows(detail),
        ]),
    ]);
    return createSectionsTab([attributes, contents]);
}

/**
 * Build the tabs of a module detail dialog.
 * @param detail - Module detail record.
 * @returns The tabs of the module.
 */
function moduleTabs(detail: ModuleDetail): DetailTab[] {
    const courses = detail.courses ?? [];
    const exams = detail.exams ?? [];
    const events = collectEvents(courses);
    return [
        createModuleDetailsTab(detail),
        createTableTab("courses", "Kurse", courseColumns, courses, "Name"),
        createTableTab("exams", "Prüfungen", examColumns, exams, "Datum"),
        createTableTab("events", "Veranstaltungen", eventColumns, events, "Datum"),
        createTableTab(
            "staff",
            "Dozenten",
            staffColumns,
            collectStaff(courses, events, exams),
            "Name",
        ),
        createTableTab(
            "locations",
            "Räume",
            locationColumns,
            collectLocations(events, exams),
            "Name",
        ),
        createTableTab(
            "buildings",
            "Gebäude",
            buildingColumns,
            collectBuildings(events, exams),
            "Name",
        ),
        createTableTab("degrees", "Studiengänge", degreeColumns, detail.degrees ?? [], "Name"),
        createTableTab("semester", "Semester", semesterColumns, detail.semesters ?? [], "Jahr"),
    ];
}

/** Register the detail dialog of modules. */
export function registerModuleDetail(): void {
    registerDetail({
        kind: "module",
        heading: "Modul-Details",
        fetch: getModuleDetail,
        name: (detail) => detail.name,
        number: (detail) => detail.number,
        saveKind: "module",
        tabs: moduleTabs,
    });
}
