import type { Module, Course, Event, Exam, Staff, Location, Semester, Building, EventType, Faculty } from "./types";

const host = "https://api.casparkroll.de/almaweb/v1";

/**
 * Fetch JSON data from the remote API.
 * @param endpoint - API endpoint path.
 * @param options - Optional fetch options.
 * @returns The decoded JSON response.
 */
async function fetchApi(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${host}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch JSON data from a local fixture.
 * @param endpoint - Fixture path.
 * @param options - Optional fetch options.
 * @returns The decoded JSON response.
 */
async function fetchLocal(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`Failed to fetch local ${endpoint}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch module data from the local fixture.
 * @param name - Optional module name filter.
 * @param number - Optional module number filter.
 * @param faculty - Optional faculty ID filter.
 * @param responsiblePerson - Optional responsible person filter.
 * @param lpMin - Optional minimum credit points filter.
 * @param lpMax - Optional maximum credit points filter.
 * @param durationMin - Optional minimum duration filter.
 * @param durationMax - Optional maximum duration filter.
 * @param language - Optional language filter.
 * @param semester - Optional semester ID filter.
 * @returns The module response data.
 */
export async function getModules(
    name?: string | string[],
    number?: string | string[],
    faculty?: number | number[],
    responsiblePerson?: string,
    lpMin?: number,
    lpMax?: number,
    durationMin?: number,
    durationMax?: number,
    language?: string | string[],
    semester?: number | number[]
): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Module[];
}> {
    const queryParams = new URLSearchParams();
    if (name) {
        if (Array.isArray(name)) {
            name.forEach(n => queryParams.append("name", n));
        } else {
            queryParams.append("name", name);
        }
    }
    if (number) {
        if (Array.isArray(number)) {
            number.forEach(n => queryParams.append("number", n));
        } else {
            queryParams.append("number", number);
        }
    }
    if (faculty) {
        if (Array.isArray(faculty)) {
            faculty.forEach(f => queryParams.append("faculty_id", f.toString()));
        } else {
            queryParams.append("faculty_id", faculty.toString());
        }
    }
    if (responsiblePerson) {
        queryParams.append("responsible_person", responsiblePerson);
    }
    if (lpMin !== undefined) {
        queryParams.append("credits_min", lpMin.toString());
    }
    if (lpMax !== undefined) {
        queryParams.append("credits_max", lpMax.toString());
    }
    if (durationMin !== undefined) {
        queryParams.append("duration_semesters_min", durationMin.toString());
    }
    if (durationMax !== undefined) {
        queryParams.append("duration_semesters_max", durationMax.toString());
    }
    if (language) {
        if (Array.isArray(language)) {
            language.forEach(l => queryParams.append("language", l));
        } else {
            queryParams.append("language", language);
        }
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach(s => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    console.log("/modules?include=faculty&include=courses&include=exams&fields=id&fields=name&fields=number&fields=language&fields=duration_semesters&fields=credits&fields=frequency&fields=path&fields=faculty.name&fields=courses.type&fields=exams.name&" + queryParams.toString());
    return fetchLocal(`/ts/api/offline-data/modules.json?${queryParams.toString()}`); // fetchApi("/modules?include=faculty&include=courses&include=exams&fields=id&fields=name&fields=number&fields=language&fields=duration_semesters&fields=credits&fields=frequency&fields=path&fields=faculty.name&fields=courses.type&fields=exams.name");
}

/**
 * Fetch course data from the local fixture.
 * @param name - Optional course name filter.
 * @param number - Optional course number filter.
 * @param type - Optional course type filter.
 * @param staff - Optional staff ID filter.
 * @param weekHoursMin - Optional minimum weekly hours filter.
 * @param weekHoursMax - Optional maximum weekly hours filter.
 * @param semester - Optional semester ID filter.
 * @returns The course response data.
 */
export async function getCourses(
    name?: string | string[],
    number?: string | string[],
    type?: string | string[],
    staff?: number | number[],
    weekHoursMin?: number,
    weekHoursMax?: number,
    semester?: number | number[]
): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Course[];
}> {
    const queryParams = new URLSearchParams();
    if (name) {
        if (Array.isArray(name)) {
            name.forEach(n => queryParams.append("name", n));
        } else {
            queryParams.append("name", name);
        }
    }
    if (number) {
        if (Array.isArray(number)) {
            number.forEach(n => queryParams.append("number", n));
        } else {
            queryParams.append("number", number);
        }
    }
    if (type) {
        if (Array.isArray(type)) {
            type.forEach(t => queryParams.append("type", t));
        } else {
            queryParams.append("type", type);
        }
    }
    // Currently staff is not resolved to IDs -> bug API
    /* if (staff) {
        if (Array.isArray(staff)) {
            staff.forEach(s => queryParams.append("staff_id", s.toString()));
        } else {
            queryParams.append("staff_id", staff.toString());
        }
    } */
    if (weekHoursMin !== undefined) {
        queryParams.append("weekly_hours_min", weekHoursMin.toString());
    }
    if (weekHoursMax !== undefined) {
        queryParams.append("weekly_hours_max", weekHoursMax.toString());
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach(s => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    console.log("/courses?fields=id&fields=name&fields=number&fields=weekday&fields=weekly_hours&fields=language&fields=staff&fields=type.name&" + queryParams.toString());
    return fetchLocal("/ts/api/offline-data/courses.json"); // fetchApi("/courses?fields=id&fields=name&fields=number&fields=weekday&fields=weekly_hours&fields=language&fields=staff&fields=type.name");
}

/**
 * Fetch event data from the local fixture.
 * @param startTimeMin - Optional minimum start time filter.
 * @param startTimeMax - Optional maximum start time filter.
 * @param endTimeMin - Optional minimum end time filter.
 * @param endTimeMax - Optional maximum end time filter.
 * @param startDate - Optional start date filter.
 * @param endDate - Optional end date filter.
 * @param building - Optional building filter.
 * @param semester - Optional semester ID filter.
 * @returns The event response data.
 */
export async function getEvents(
    startTimeMin?: string,
    startTimeMax?: string,
    endTimeMin?: string,
    endTimeMax?: string,
    startDate?: string,
    endDate?: string,
    building?: number | number[],
    semester?: number | number[]
): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Event[];
}> {
    const queryParams = new URLSearchParams();
    if (startTimeMin) {
        queryParams.append("start_time_from", startTimeMin);
    }
    if (startTimeMax) {
        queryParams.append("start_time_to", startTimeMax);
    }
    if (endTimeMin) {
        queryParams.append("end_time_from", endTimeMin);
    }
    if (endTimeMax) {
        queryParams.append("end_time_to", endTimeMax);
    }
    if (startDate) {
        queryParams.append("date_from", startDate);
    }
    if (endDate) {
        queryParams.append("date_to", endDate);
    }
    if (building) {
        if (Array.isArray(building)) {
            building.forEach(b => queryParams.append("building_id", b.toString()));
        } else {
            queryParams.append("building_id", building.toString());
        }
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach(s => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    console.log("/events?fields=id&fields=number&fields=name&fields=start_time&fields=end_time&fields=event_date&fields=location&fields=location.building&fields=staff&" + queryParams.toString());
    return fetchLocal("/ts/api/offline-data/events.json"); // fetchApi("/events?fields=id&fields=number&fields=name&fields=start_time&fields=end_time&fields=event_date&fields=location&fields=location.building&fields=staff");
}

/**
 * Fetch exam data from the local fixture.
 * @param startTimeMin - Optional minimum start time filter.
 * @param startTimeMax - Optional maximum start time filter.
 * @param endTimeMin - Optional minimum end time filter.
 * @param endTimeMax - Optional maximum end time filter.
 * @param startDate - Optional start date filter.
 * @param endDate - Optional end date filter.
 * @param building - Optional building filter.
 * @param required - Optional required filter.
 * @param staff - Optional staff ID filter.
 * @param semester - Optional semester ID filter.
 * @returns The exam response data.
 */
export async function getExams(
    startTimeMin?: string,
    startTimeMax?: string,
    endTimeMin?: string,
    endTimeMax?: string,
    startDate?: string,
    endDate?: string,
    building?: string | string[],
    required?: boolean,
    staff?: number | number[],
    semester?: number | number[]
): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Exam[];
}> {
    const queryParams = new URLSearchParams();
    if (startTimeMin) {
        queryParams.append("start_time_from", startTimeMin);
    }
    if (startTimeMax) {
        queryParams.append("start_time_to", startTimeMax);
    }
    if (endTimeMin) {
        queryParams.append("end_time_from", endTimeMin);
    }
    if (endTimeMax) {
        queryParams.append("end_time_to", endTimeMax);
    }
    if (startDate) {
        queryParams.append("exam_date_from", startDate);
    }
    if (endDate) {
        queryParams.append("exam_date_to", endDate);
    }
    if (building) {
        if (Array.isArray(building)) {
            building.forEach(b => queryParams.append("building_id", b));
        } else {
            queryParams.append("building_id", building);
        }
    }
    if (required !== undefined) {
        queryParams.append("required", required.toString());
    }
    if (staff) {
        if (Array.isArray(staff)) {
            staff.forEach(s => queryParams.append("staff_id", s.toString()));
        } else {
            queryParams.append("staff_id", staff.toString());
        }
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach(s => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    console.log("/exams?fields=id&fields=name&fields=exam_date&fields=start_time&fields=end_time&fields=required&fields=staff&" + queryParams.toString());
    return fetchLocal("/ts/api/offline-data/exams.json"); // fetchApi("/exams?fields=id&fields=name&fields=exam_date&fields=start_time&fields=end_time&fields=required&fields=staff");
}

/**
 * Fetch staff data from the API.
 * @returns The staff response data.
 */
export async function getStaff(): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Staff[];
}> {
    return fetchApi("/staff?fields=id&fields=name");
}

/**
 * Fetch location data from the API.
 * @returns The location response data.
 */
export async function getLocations(): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Location[];
}> {
    return fetchApi(
        "/locations?fields=id&fields=name&fields=external_id&fields=description&fields=type&fields=seats&fields=size&fields=accessibility&fields=building_id&fields=building",
    );
}

export async function getBuildings(): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Building[];
}> {
    return fetchApi("/buildings");
}

export async function getSemesters(): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Semester[];
}> {
    return fetchApi("/semesters");
}

export async function getFaculties(): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: Faculty[];
}> {
    return fetchApi("/faculties");
}

export async function getEventTypes(): Promise<{
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: EventType[];
}> {
    return fetchApi("/catalog/event-types");
}