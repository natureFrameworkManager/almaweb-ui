import {
    getBuildingDetail,
    getCourseDetail,
    getDegreeDetail,
    getEventDetail,
    getExamDetail,
    getFacultyDetail,
    getLocationDetail,
    getSemesterDetail,
    getStaffDetail,
} from "../api/api";
import type {
    BuildingDetail,
    CourseDetail,
    DegreeDetail,
    EventDetail,
    ExamDetail,
    FacultyDetail,
    LocationDetail,
    SemesterDetail,
    StaffDetail,
} from "../api/types";
import {
    createAttrGrid,
    createSection,
    createSectionsTab,
    createTableTab,
    displayText,
    formatDateValue,
    formatTime,
    registerDetail,
    staffNames,
    type DetailTab,
} from "./detail-dialog";
import {
    buildingColumns,
    collectBuildings,
    collectCourses,
    collectEvents,
    collectLocationEvents,
    collectLocations,
    collectLocationUsages,
    collectSemesters,
    collectStaff,
    courseColumns,
    degreeColumns,
    eventColumns,
    examColumns,
    locationColumns,
    moduleColumns,
    personColumns,
    semesterColumns,
    staffColumns,
    type EventWithCourse,
} from "./detail-tables";
import { registerModuleDetail } from "./module-detail";

/**
 * Build the tabs of a course detail dialog.
 * @param detail - Course detail record.
 * @returns The tabs of the course.
 */
function courseTabs(detail: CourseDetail): DetailTab[] {
    const courses = [detail];
    const events = collectEvents(courses);
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Kursnummer", value: displayText(detail.number) },
                    { label: "Typ", value: displayText(detail.type?.name) },
                    { label: "Status", value: displayText(detail.status?.name) },
                    { label: "Wochentag", value: displayText(detail.weekday) },
                    { label: "SWS", value: displayText(detail.weekly_hours) },
                    { label: "Sprache", value: displayText(detail.language) },
                ]),
            ]),
        ]),
        createTableTab("modules", "Module", moduleColumns, detail.modules ?? [], "Name"),
        createTableTab("events", "Veranstaltungen", eventColumns, events, "Datum"),
        createTableTab(
            "staff",
            "Dozenten",
            staffColumns,
            collectStaff(courses, events, []),
            "Name",
        ),
        createTableTab("locations", "Räume", locationColumns, collectLocations(events, []), "Name"),
        createTableTab(
            "buildings",
            "Gebäude",
            buildingColumns,
            collectBuildings(events, []),
            "Name",
        ),
        createTableTab("semester", "Semester", semesterColumns, detail.semesters ?? [], "Jahr"),
    ];
}

/**
 * Build the tabs of an event detail dialog.
 * @param detail - Event detail record.
 * @returns The tabs of the event.
 */
function eventTabs(detail: EventDetail): DetailTab[] {
    const courses = detail.courses ?? [];
    const events: EventWithCourse[] = [{ event: detail, course: courses[0] }];
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Nummer", value: displayText(detail.number) },
                    { label: "Datum", value: formatDateValue(detail.event_date) },
                    { label: "Zeit", value: formatTime(detail.start_time, detail.end_time) },
                    { label: "Ort", value: displayText(detail.location?.name) },
                    { label: "Gebäude", value: displayText(detail.location?.building?.name) },
                    { label: "Dozenten", value: staffNames(detail.staff ?? []) },
                ]),
            ]),
        ]),
        createTableTab("courses", "Kurse", courseColumns, courses, "Name"),
        createTableTab("staff", "Dozenten", personColumns, detail.staff ?? [], "Name"),
        createTableTab("locations", "Räume", locationColumns, collectLocations(events, []), "Name"),
        createTableTab(
            "buildings",
            "Gebäude",
            buildingColumns,
            collectBuildings(events, []),
            "Name",
        ),
        createTableTab("semester", "Semester", semesterColumns, detail.semesters ?? [], "Jahr"),
    ];
}

/**
 * Build the tabs of an exam detail dialog.
 * @param detail - Exam detail record.
 * @returns The tabs of the exam.
 */
function examTabs(detail: ExamDetail): DetailTab[] {
    const modules = detail.module ? [detail.module] : [];
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Datum", value: formatDateValue(detail.exam_date) },
                    { label: "Zeit", value: formatTime(detail.start_time, detail.end_time) },
                    { label: "Pflicht", value: detail.required ? "Ja" : "Nein" },
                    { label: "Modul", value: displayText(detail.module?.name) },
                ]),
            ]),
        ]),
        createTableTab("modules", "Modul", moduleColumns, modules, "Name"),
        createTableTab("staff", "Dozenten", personColumns, detail.staff ?? [], "Name"),
        createTableTab("semester", "Semester", semesterColumns, detail.semesters ?? [], "Jahr"),
    ];
}

/**
 * Build the tabs of a staff detail dialog.
 * @param detail - Staff detail record.
 * @returns The tabs of the staff member.
 */
function staffTabs(detail: StaffDetail): DetailTab[] {
    const events: EventWithCourse[] = (detail.events ?? []).map((event) => ({
        event,
        course: event.courses?.[0],
    }));
    const exams = detail.exams ?? [];
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([{ label: "Name", value: displayText(detail.name) }]),
            ]),
        ]),
        createTableTab("modules", "Module", moduleColumns, detail.modules ?? [], "Name"),
        createTableTab("courses", "Kurse", courseColumns, detail.courses ?? [], "Name"),
        createTableTab("events", "Veranstaltungen", eventColumns, events, "Datum"),
        createTableTab("exams", "Prüfungen", examColumns, exams, "Name"),
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
    ];
}

/**
 * Build the tabs of a location detail dialog.
 * @param detail - Location detail record.
 * @returns The tabs of the location.
 */
function locationTabs(detail: LocationDetail): DetailTab[] {
    const events = detail.events ?? [];
    const eventRows: EventWithCourse[] = events.map((event) => ({
        event,
        course: event.courses?.[0],
    }));
    const buildings = detail.building ? [detail.building] : [];
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Nummer", value: displayText(detail.external_id) },
                    { label: "Typ", value: displayText(detail.type) },
                    { label: "Plätze", value: displayText(detail.seats) },
                    { label: "Größe", value: displayText(detail.size) },
                    { label: "Barrierefrei", value: displayText(detail.accessibility) },
                    { label: "Gebäude", value: displayText(detail.building?.name) },
                ]),
            ]),
        ]),
        createTableTab("events", "Veranstaltungen", eventColumns, eventRows, "Datum"),
        createTableTab("courses", "Kurse", courseColumns, collectCourses(events), "Name"),
        createTableTab("staff", "Dozenten", staffColumns, collectStaff([], eventRows, []), "Name"),
        createTableTab("buildings", "Gebäude", buildingColumns, buildings, "Name"),
        createTableTab("semester", "Semester", semesterColumns, collectSemesters(events), "Jahr"),
    ];
}

/**
 * Build the tabs of a building detail dialog.
 * @param detail - Building detail record.
 * @returns The tabs of the building.
 */
function buildingTabs(detail: BuildingDetail): DetailTab[] {
    const locations = detail.locations ?? [];
    const events = collectLocationEvents(locations);
    const locationEvents = locations.flatMap((location) => location.events ?? []);
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Kurzname", value: displayText(detail.short_name) },
                    { label: "Adresse", value: displayText(detail.address) },
                ]),
            ]),
        ]),
        createTableTab(
            "locations",
            "Räume",
            locationColumns,
            collectLocationUsages(locations),
            "Name",
        ),
        createTableTab("events", "Veranstaltungen", eventColumns, events, "Datum"),
        createTableTab("courses", "Kurse", courseColumns, collectCourses(locationEvents), "Name"),
        createTableTab("staff", "Dozenten", staffColumns, collectStaff([], events, []), "Name"),
    ];
}

/**
 * Build the tabs of a faculty detail dialog.
 * @param detail - Faculty detail record.
 * @returns The tabs of the faculty.
 */
function facultyTabs(detail: FacultyDetail): DetailTab[] {
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Name", value: displayText(detail.name) },
                    { label: "Präfix", value: displayText(detail.prefix) },
                ]),
            ]),
        ]),
        createTableTab("modules", "Module", moduleColumns, detail.modules ?? [], "Name"),
        createTableTab("degrees", "Studiengänge", degreeColumns, detail.degrees ?? [], "Name"),
    ];
}

/**
 * Build the tabs of a semester detail dialog.
 * @param detail - Semester detail record.
 * @returns The tabs of the semester.
 */
function semesterTabs(detail: SemesterDetail): DetailTab[] {
    const events = detail.events ?? [];
    const eventRows: EventWithCourse[] = events.map((event) => ({
        event,
        course: event.courses?.[0],
    }));
    const courses = detail.courses ?? [];
    const exams = detail.exams ?? [];
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([
                    { label: "Jahr", value: displayText(detail.year) },
                    { label: "Termin", value: displayText(detail.term) },
                ]),
            ]),
        ]),
        createTableTab("modules", "Module", moduleColumns, detail.modules ?? [], "Name"),
        createTableTab("courses", "Kurse", courseColumns, courses, "Name"),
        createTableTab("exams", "Prüfungen", examColumns, exams, "Name"),
        createTableTab("events", "Veranstaltungen", eventColumns, eventRows, "Datum"),
        createTableTab(
            "staff",
            "Dozenten",
            staffColumns,
            collectStaff(courses, eventRows, exams),
            "Name",
        ),
        createTableTab(
            "locations",
            "Räume",
            locationColumns,
            collectLocations(eventRows, exams),
            "Name",
        ),
        createTableTab(
            "buildings",
            "Gebäude",
            buildingColumns,
            collectBuildings(eventRows, exams),
            "Name",
        ),
    ];
}

/**
 * Build the tabs of a degree detail dialog.
 * @param detail - Degree detail record.
 * @returns The tabs of the degree.
 */
function degreeTabs(detail: DegreeDetail): DetailTab[] {
    const faculty =
        detail.faculty?.name ?? (detail.faculty_id ? `Fakultät ${detail.faculty_id}` : "");
    return [
        createSectionsTab([
            createSection("Angaben", [
                createAttrGrid([{ label: "Fakultät", value: displayText(faculty) }]),
            ]),
        ]),
        createTableTab("modules", "Module", moduleColumns, detail.modules ?? [], "Name"),
    ];
}

/** Register the detail dialogs of every entity kind. */
export function registerDetailSpecs(): void {
    registerModuleDetail();
    registerDetail({
        kind: "course",
        heading: "Kurs-Details",
        fetch: getCourseDetail,
        name: (detail) => detail.name,
        number: (detail) => detail.number,
        saveKind: "course",
        tabs: courseTabs,
    });
    registerDetail({
        kind: "event",
        heading: "Veranstaltungs-Details",
        fetch: getEventDetail,
        name: (detail) => detail.name || detail.location?.name || "",
        number: (detail) => detail.number,
        saveKind: "event",
        tabs: eventTabs,
    });
    registerDetail({
        kind: "exam",
        heading: "Prüfungs-Details",
        fetch: getExamDetail,
        name: (detail) => detail.name,
        number: () => null,
        saveKind: "exam",
        tabs: examTabs,
    });
    registerDetail({
        kind: "staff",
        heading: "Dozenten-Details",
        fetch: getStaffDetail,
        name: (detail) => detail.name,
        number: () => null,
        saveKind: "staff",
        tabs: staffTabs,
    });
    registerDetail({
        kind: "location",
        heading: "Raum-Details",
        fetch: getLocationDetail,
        name: (detail) => detail.name,
        number: (detail) => detail.external_id,
        saveKind: "location",
        tabs: locationTabs,
    });
    registerDetail({
        kind: "building",
        heading: "Gebäude-Details",
        fetch: getBuildingDetail,
        name: (detail) => detail.name,
        number: (detail) => detail.short_name,
        tabs: buildingTabs,
    });
    registerDetail({
        kind: "faculty",
        heading: "Fakultäts-Details",
        fetch: getFacultyDetail,
        name: (detail) => detail.name,
        number: () => null,
        tabs: facultyTabs,
    });
    registerDetail({
        kind: "semester",
        heading: "Semester-Details",
        fetch: getSemesterDetail,
        name: (detail) => detail.name,
        number: (detail) => detail.term,
        tabs: semesterTabs,
    });
    registerDetail({
        kind: "degree",
        heading: "Studiengang-Details",
        fetch: getDegreeDetail,
        name: (detail) => detail.name,
        number: () => null,
        tabs: degreeTabs,
    });
}
