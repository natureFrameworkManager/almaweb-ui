import type {
    Building,
    Course,
    CourseDetail,
    Degree,
    Event,
    Exam,
    Location,
    Module,
    Semester,
    Staff,
} from "../api/types";
import {
    countLabel,
    displayText,
    EMPTY_VALUE,
    formatDateValue,
    formatTime,
    staffNames,
    type Column,
} from "./detail-dialog";

/** A staff member together with the entities they are linked to. */
export type StaffUsage = {
    staff: Staff;
    courses: Map<number, string>;
    events: Map<number, string>;
    exams: Map<number, string>;
};

/** A location together with the names of the courses that use it. */
export type LocationUsage = {
    location: Location;
    courses: string[];
};

/** An event together with the course it belongs to. */
export type EventWithCourse = {
    event: Event;
    course?: Course;
};

/** Columns of the linked module tables. */
export const moduleColumns: Column<Module>[] = [
    { label: "Nummer", value: (module) => displayText(module.number) },
    {
        label: "Name",
        value: (module) => displayText(module.name),
        sortValue: (module) => module.name,
    },
    {
        label: "LP",
        value: (module) => (module.credits ? `${module.credits} LP` : EMPTY_VALUE),
        sortValue: (module) => module.credits ?? 0,
    },
    {
        label: "Dauer",
        value: (module) =>
            module.duration_semesters ? `${module.duration_semesters} Semester` : EMPTY_VALUE,
    },
    { label: "Fakultät", value: (module) => displayText(module.faculty?.name) },
    { label: "Sprache", value: (module) => displayText(module.language) },
    {
        label: "Kurse",
        value: (module) =>
            displayText(
                [...new Set((module.courses ?? []).map((course) => course.type?.name))].join(", "),
            ),
    },
    {
        label: "Prüfungen",
        value: (module) =>
            displayText([...new Set((module.exams ?? []).map((exam) => exam.name))].join(", ")),
    },
];

/** Columns of the linked course tables. */
export const courseColumns: Column<Course>[] = [
    { label: "Nummer", value: (course) => displayText(course.number) },
    {
        label: "Name",
        value: (course) => displayText(course.name),
        sortValue: (course) => course.name,
    },
    { label: "Typ", value: (course) => displayText(course.type?.name) },
    { label: "Tag", value: (course) => displayText(course.weekday) },
    {
        label: "SWS",
        value: (course) => displayText(course.weekly_hours),
        sortValue: (course) => course.weekly_hours ?? 0,
    },
    { label: "Sprache", value: (course) => displayText(course.language) },
    { label: "Dozenten", value: (course) => staffNames(course.staff ?? []) },
];

/** Columns of the linked exam tables. */
export const examColumns: Column<Exam>[] = [
    { label: "Name", value: (exam) => displayText(exam.name), sortValue: (exam) => exam.name },
    {
        label: "Datum",
        value: (exam) => formatDateValue(exam.exam_date),
        sortValue: (exam) => exam.exam_date ?? "",
    },
    { label: "Zeit", value: (exam) => formatTime(exam.start_time, exam.end_time) },
    { label: "Pflicht", value: (exam) => (exam.required ? "Ja" : "Nein") },
    { label: "Dozenten", value: (exam) => staffNames(exam.staff ?? []) },
];

/** Columns of the linked event tables. */
export const eventColumns: Column<EventWithCourse>[] = [
    {
        label: "Datum",
        value: ({ event }) => formatDateValue(event.event_date),
        sortValue: ({ event }) => event.event_date ?? "",
    },
    { label: "Zeit", value: ({ event }) => formatTime(event.start_time, event.end_time) },
    { label: "Typ", value: ({ course }) => displayText(course?.type?.name) },
    { label: "Kurs", value: ({ course }) => displayText(course?.name) },
    { label: "Ort", value: ({ event }) => displayText(event.location?.name) },
    { label: "Dozenten", value: ({ event }) => staffNames(event.staff ?? []) },
];

/** Columns of the staff tables aggregating the entities a staff member is linked to. */
export const staffColumns: Column<StaffUsage>[] = [
    {
        label: "Name",
        value: ({ staff }) => displayText(staff.name),
        sortValue: ({ staff }) => staff.name,
    },
    {
        label: "Kurse",
        value: (usage) => countLabel(usage.courses.size),
        title: (usage) => [...usage.courses.values()].join(", "),
        sortValue: (usage) => usage.courses.size,
    },
    {
        label: "Veranstaltungen",
        value: (usage) => countLabel(usage.events.size),
        title: (usage) => [...usage.events.values()].join(", "),
        sortValue: (usage) => usage.events.size,
    },
    {
        label: "Prüfungen",
        value: (usage) => countLabel(usage.exams.size),
        title: (usage) => [...usage.exams.values()].join(", "),
        sortValue: (usage) => usage.exams.size,
    },
];

/** Columns of the linked location tables. */
export const locationColumns: Column<LocationUsage>[] = [
    {
        label: "Name",
        value: ({ location }) => displayText(location.name),
        sortValue: ({ location }) => location.name,
    },
    { label: "Typ", value: ({ location }) => displayText(location.type) },
    {
        label: "Plätze",
        value: ({ location }) => displayText(location.seats),
        sortValue: ({ location }) => location.seats ?? 0,
    },
    {
        label: "Gebäude",
        value: ({ location }) =>
            displayText(location.building?.short_name || location.building?.name),
    },
    { label: "Barrierefrei", value: ({ location }) => displayText(location.accessibility) },
    { label: "Kurse", value: ({ courses }) => displayText(courses.join(", ")) },
];

/** Columns of the linked building tables. */
export const buildingColumns: Column<Building>[] = [
    {
        label: "Name",
        value: (building) => displayText(building.name),
        sortValue: (building) => building.name,
    },
    { label: "Kurzname", value: (building) => displayText(building.short_name) },
    { label: "Adresse", value: (building) => displayText(building.address) },
];

/** Columns of the linked semester tables. */
export const semesterColumns: Column<Semester>[] = [
    {
        label: "Name",
        value: (semester) => displayText(semester.name),
        sortValue: (semester) => semester.name,
    },
    {
        label: "Jahr",
        value: (semester) => displayText(semester.year),
        sortValue: (semester) => semester.year ?? 0,
    },
    { label: "Termin", value: (semester) => displayText(semester.term) },
];

/** Columns of the linked degree tables. */
export const degreeColumns: Column<Degree>[] = [
    {
        label: "Name",
        value: (degree) => displayText(degree.name),
        sortValue: (degree) => degree.name,
    },
    {
        label: "Fakultät",
        value: (degree) =>
            displayText(
                degree.faculty?.name ?? (degree.faculty_id ? `Fakultät ${degree.faculty_id}` : ""),
            ),
    },
];

/** Columns of the staff tables that only list the names. */
export const personColumns: Column<Staff>[] = [
    { label: "Name", value: (staff) => displayText(staff.name), sortValue: (staff) => staff.name },
];

/**
 * Flatten the events of every course, keeping the parent course.
 * @param courses - Courses with their events.
 * @returns The events with their course.
 */
export function collectEvents(courses: CourseDetail[]): EventWithCourse[] {
    return courses.flatMap((course) => (course.events ?? []).map((event) => ({ event, course })));
}

/**
 * Collect the unique locations used by the events and exams.
 * @param events - Events with their course.
 * @param exams - Exams with an optional location.
 * @returns The unique locations with their courses.
 */
export function collectLocations(events: EventWithCourse[], exams: Exam[]): LocationUsage[] {
    const usages = new Map<number, LocationUsage>();
    const add = (location: Location | undefined, courseName: string): void => {
        if (!location) {
            return;
        }
        const usage = usages.get(location.id) ?? { location, courses: [] };
        if (courseName.length > 0 && !usage.courses.includes(courseName)) {
            usage.courses.push(courseName);
        }
        usages.set(location.id, usage);
    };
    events.forEach(({ event, course }) => add(event.location, course?.name ?? ""));
    exams.forEach((exam) => add(exam.location, ""));
    return [...usages.values()];
}

/**
 * Collect the unique buildings used by the events and exams.
 * @param events - Events with their course.
 * @param exams - Exams with an optional location.
 * @returns The unique buildings.
 */
export function collectBuildings(events: EventWithCourse[], exams: Exam[]): Building[] {
    const buildings = new Map<number, Building>();
    const add = (location: Location | undefined): void => {
        const building = location?.building;
        const hasLabel = building
            ? (building.name || building.short_name || building.address).length > 0
            : false;
        if (building && hasLabel) {
            buildings.set(building.id, building);
        }
    };
    events.forEach(({ event }) => add(event.location));
    exams.forEach((exam) => add(exam.location));
    return [...buildings.values()];
}

/**
 * Collect the staff linked to the given courses, events and exams.
 * @param courses - Courses with their staff.
 * @param events - Events with their course.
 * @param exams - Exams with their staff.
 * @returns The staff with their linked entity names.
 */
export function collectStaff(
    courses: Course[],
    events: EventWithCourse[],
    exams: Exam[],
): StaffUsage[] {
    const usages = new Map<number, StaffUsage>();
    const add = (
        staff: Staff,
        group: "courses" | "events" | "exams",
        id: number,
        label: string,
    ): void => {
        const usage =
            usages.get(staff.id) ??
            ({ staff, courses: new Map(), events: new Map(), exams: new Map() } as StaffUsage);
        usage[group].set(id, label);
        usages.set(staff.id, usage);
    };
    courses.forEach((course) => {
        (course.staff ?? []).forEach((staff) => add(staff, "courses", course.id, course.name));
    });
    events.forEach(({ event, course }) => {
        (event.staff ?? []).forEach((staff) =>
            add(staff, "events", event.id, event.name || course?.name || ""),
        );
    });
    exams.forEach((exam) => {
        (exam.staff ?? []).forEach((staff) => add(staff, "exams", exam.id, exam.name));
    });
    return [...usages.values()];
}

/**
 * Collect the unique courses of a set of events.
 * @param events - Events that may carry their courses.
 * @returns The unique courses.
 */
export function collectCourses(events: Event[]): Course[] {
    const courses = new Map<number, Course>();
    events.forEach((event) => {
        (event.courses ?? []).forEach((course) => courses.set(course.id, course));
    });
    return [...courses.values()];
}

/**
 * Collect the unique semesters of a set of events.
 * @param events - Events that may carry their semesters.
 * @returns The unique semesters.
 */
export function collectSemesters(events: Event[]): Semester[] {
    const semesters = new Map<number, Semester>();
    events.forEach((event) => {
        (event.semesters ?? []).forEach((semester) => semesters.set(semester.id, semester));
    });
    return [...semesters.values()];
}

/**
 * Flatten the events of every location, keeping the parent course.
 * @param locations - Locations with their events.
 * @returns The events with their course.
 */
export function collectLocationEvents(locations: Location[]): EventWithCourse[] {
    return locations.flatMap((location) =>
        (location.events ?? []).map((event) => ({ event, course: event.courses?.[0] })),
    );
}

/**
 * Collect the location usages of a set of locations.
 * @param locations - Locations with their events and courses.
 * @returns The locations with the names of the courses that use them.
 */
export function collectLocationUsages(locations: Location[]): LocationUsage[] {
    return locations.map((location) => ({
        location,
        courses: [
            ...new Set(
                (location.events ?? []).flatMap((event) =>
                    (event.courses ?? []).map((course) => course.name),
                ),
            ),
        ],
    }));
}
