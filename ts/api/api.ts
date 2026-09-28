import type {
    Module,
    Course,
    Degree,
    Event,
    Exam,
    Staff,
    Location,
    Semester,
    Building,
    EventType,
    Faculty,
    PagedResponse,
    ModuleDetail,
    CourseDetail,
    EventDetail,
    ExamDetail,
    StaffDetail,
    LocationDetail,
    BuildingDetail,
    FacultyDetail,
    SemesterDetail,
    DegreeDetail,
    SortOrder,
} from "./types";

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
 * Append pagination parameters to a query.
 * @param queryParams - Query parameters to extend.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 */
function appendPaging(queryParams: URLSearchParams, page?: number, pageSize?: number): void {
    if (page !== undefined) {
        queryParams.append("page", page.toString());
    }
    if (pageSize !== undefined) {
        queryParams.append("page_size", pageSize.toString());
    }
}

/**
 * Append the single backend sort level to a query.
 *
 * The API only supports one sort column, so the client sends the primary level
 * and applies the remaining levels itself (see `ts/sort.ts`).
 * @param queryParams - Query parameters to extend.
 * @param sort - Optional sort column.
 * @param order - Optional sort direction.
 */
function appendSort(queryParams: URLSearchParams, sort?: string, order?: SortOrder): void {
    if (sort) {
        queryParams.append("sort", sort);
    }
    if (order) {
        queryParams.append("order", order);
    }
}

/**
 * Append encoded query parameters to a URL.
 * @param url - Base URL, optionally already containing a query string.
 * @param queryParams - Query parameters to append.
 * @returns The URL including the non-empty query parameters.
 */
function appendQuery(url: string, queryParams: URLSearchParams): string {
    const query = queryParams.toString();
    if (query === "") {
        return url;
    }
    return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

/**
 * Append a repeatable string parameter, dropping empty values.
 * @param queryParams - Query parameters to extend.
 * @param key - Query parameter name.
 * @param values - Single value or list of values to append.
 */
function appendStringList(
    queryParams: URLSearchParams,
    key: string,
    values?: string | string[],
): void {
    if (values === undefined) {
        return;
    }
    const list = Array.isArray(values) ? values : [values];
    list.filter((value) => value !== "").forEach((value) => queryParams.append(key, value));
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
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
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
    semester?: number | number[],
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Module>> {
    const queryParams = new URLSearchParams();
    if (name) {
        if (Array.isArray(name)) {
            name.forEach((n) => queryParams.append("name", n));
        } else {
            queryParams.append("name", name);
        }
    }
    if (number) {
        if (Array.isArray(number)) {
            number.forEach((n) => queryParams.append("number", n));
        } else {
            queryParams.append("number", number);
        }
    }
    if (faculty) {
        if (Array.isArray(faculty)) {
            faculty.forEach((f) => queryParams.append("faculty_id", f.toString()));
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
            language.forEach((l) => queryParams.append("language", l));
        } else {
            queryParams.append("language", language);
        }
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach((s) => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(
        `/modules?include=faculty&include=courses&include=exams&fields=id&fields=name&fields=number&fields=language&fields=duration_semesters&fields=credits&fields=frequency&fields=path&fields=faculty.name&fields=courses.type&fields=exams.name&${queryParams.toString()}`,
    );
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
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
 * @returns The course response data.
 */
export async function getCourses(
    name?: string | string[],
    number?: string | string[],
    type?: string | string[],
    staff?: number | number[],
    weekHoursMin?: number,
    weekHoursMax?: number,
    semester?: number | number[],
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Course>> {
    const queryParams = new URLSearchParams();
    if (name) {
        if (Array.isArray(name)) {
            name.forEach((n) => queryParams.append("name", n));
        } else {
            queryParams.append("name", name);
        }
    }
    if (number) {
        if (Array.isArray(number)) {
            number.forEach((n) => queryParams.append("number", n));
        } else {
            queryParams.append("number", number);
        }
    }
    if (type) {
        if (Array.isArray(type)) {
            type.forEach((t) => queryParams.append("type", t));
        } else {
            queryParams.append("type", type);
        }
    }
    // The instructor filter stays inert: `/courses?staff=<name>` currently returns
    // HTTP 500 on the live API and `/courses` has no `staff_id` parameter, so the
    // selected ids are intentionally dropped (see todo.md §1).
    void staff;
    if (weekHoursMin !== undefined) {
        queryParams.append("weekly_hours_min", weekHoursMin.toString());
    }
    if (weekHoursMax !== undefined) {
        queryParams.append("weekly_hours_max", weekHoursMax.toString());
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach((s) => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(
        `/courses?fields=id&fields=name&fields=number&fields=weekday&fields=weekly_hours&fields=language&fields=staff&fields=type.name&${queryParams.toString()}`,
    );
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
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
 * @returns The event response data.
 */
export async function getEvents(
    startTimeMin?: string,
    startTimeMax?: string,
    endTimeMin?: string,
    endTimeMax?: string,
    startDate?: string,
    endDate?: string,
    building?: number,
    semester?: number | number[],
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Event>> {
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
    if (building !== undefined) {
        queryParams.append("building_id", building.toString());
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach((s) => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(
        `/events?fields=id&fields=number&fields=name&fields=start_time&fields=end_time&fields=event_date&fields=location&fields=location.building&fields=staff&${queryParams.toString()}`,
    );
}

/**
 * Fetch every event linked to a module.
 *
 * Uses the dedicated `/modules/{module_id}/events` endpoint; pagination is left
 * out so the API returns the complete list of linked events.
 * @param moduleId - Module id.
 * @returns The module event response data.
 */
export async function getModuleEvents(moduleId: number): Promise<PagedResponse<Event>> {
    return fetchApi(
        `/modules/${moduleId}/events?include=location&include=location.building&include=staff`,
    );
}

/**
 * Fetch every event linked to a course.
 *
 * Uses the dedicated `/courses/{course_id}/events` endpoint; pagination is left
 * out so the API returns the complete list of linked events.
 * @param courseId - Course id.
 * @returns The course event response data.
 */
export async function getCourseEvents(courseId: number): Promise<PagedResponse<Event>> {
    return fetchApi(
        `/courses/${courseId}/events?include=location&include=location.building&include=staff`,
    );
}

/**
 * Fetch exam data from the API.
 * @param name - Optional exam name filter.
 * @param startTimeMin - Optional minimum start time filter.
 * @param startTimeMax - Optional maximum start time filter.
 * @param endTimeMin - Optional minimum end time filter.
 * @param endTimeMax - Optional maximum end time filter.
 * @param startDate - Optional start date filter.
 * @param endDate - Optional end date filter.
 * @param building - Optional building filter.
 * @param required - Optional required filter.
 * @param staff - Optional staff name filter.
 * @param semester - Optional semester ID filter.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
 * @returns The exam response data.
 */
export async function getExams(
    name?: string,
    startTimeMin?: string,
    startTimeMax?: string,
    endTimeMin?: string,
    endTimeMax?: string,
    startDate?: string,
    endDate?: string,
    building?: string | string[],
    required?: boolean,
    staff?: string | string[],
    semester?: number | number[],
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Exam>> {
    const queryParams = new URLSearchParams();
    if (name) {
        queryParams.append("name", name);
    }
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
            building.forEach((b) => queryParams.append("building_id", b));
        } else {
            queryParams.append("building_id", building);
        }
    }
    if (required !== undefined) {
        queryParams.append("required", required.toString());
    }
    if (staff) {
        appendStringList(queryParams, "staff", staff);
    }
    if (semester) {
        if (Array.isArray(semester)) {
            semester.forEach((s) => queryParams.append("semester_id", s.toString()));
        } else {
            queryParams.append("semester_id", semester.toString());
        }
    }
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(
        `/exams?fields=id&fields=name&fields=exam_date&fields=start_time&fields=end_time&fields=required&fields=staff&${queryParams.toString()}`,
    );
}

/**
 * Fetch staff data from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
 * @returns The staff response data.
 */
export async function getStaff(
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Staff>> {
    const queryParams = new URLSearchParams();
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/staff?fields=id&fields=name", queryParams));
}

/**
 * Fetch degree data from the API.
 * @param name - Optional degree name filter.
 * @param subject - Optional subject filter.
 * @param degrees - Optional degree type filter, e.g. `B.Sc.`.
 * @param faculty - Optional faculty ID filter.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
 * @returns The degree response data.
 */
export async function getDegrees(
    name?: string | string[],
    subject?: string | string[],
    degrees?: string | string[],
    faculty?: number | number[],
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Degree>> {
    const queryParams = new URLSearchParams();
    appendStringList(queryParams, "names", name);
    appendStringList(queryParams, "subjects", subject);
    appendStringList(queryParams, "degrees", degrees);
    if (faculty !== undefined) {
        (Array.isArray(faculty) ? faculty : [faculty]).forEach((value) =>
            queryParams.append("faculty", value.toString()),
        );
    }
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(
        appendQuery(
            "/degrees?fields=id&fields=name&fields=subject&fields=degree&fields=school_type&fields=ects&fields=version&fields=confidence&fields=faculty_id",
            queryParams,
        ),
    );
}

/**
 * Fetch location data from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @param sort - Optional single sort column sent to the API.
 * @param order - Optional sort direction sent to the API.
 * @returns The location response data.
 */
export async function getLocations(
    page?: number,
    pageSize?: number,
    sort?: string,
    order?: SortOrder,
): Promise<PagedResponse<Location>> {
    const queryParams = new URLSearchParams();
    appendSort(queryParams, sort, order);
    appendPaging(queryParams, page, pageSize);
    return fetchApi(
        appendQuery(
            "/locations?fields=id&fields=name&fields=external_id&fields=description&fields=type&fields=seats&fields=size&fields=accessibility&fields=building_id&fields=building",
            queryParams,
        ),
    );
}

/**
 * Fetch building data from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @returns The building response data.
 */
export async function getBuildings(
    page?: number,
    pageSize?: number,
): Promise<PagedResponse<Building>> {
    const queryParams = new URLSearchParams();
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/buildings", queryParams));
}

/**
 * Fetch semester data from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @returns The semester response data.
 */
export async function getSemesters(
    page?: number,
    pageSize?: number,
): Promise<PagedResponse<Semester>> {
    const queryParams = new URLSearchParams();
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/semesters", queryParams));
}

/**
 * Fetch faculty data from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @returns The faculty response data.
 */
export async function getFaculties(
    page?: number,
    pageSize?: number,
): Promise<PagedResponse<Faculty>> {
    const queryParams = new URLSearchParams();
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/faculties", queryParams));
}

/**
 * Fetch event type catalog data from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @returns The event type response data.
 */
export async function getEventTypes(
    page?: number,
    pageSize?: number,
): Promise<PagedResponse<EventType>> {
    const queryParams = new URLSearchParams();
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/catalog/event-types", queryParams));
}

/**
 * Fetch the distinct module languages from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @returns The distinct module language response data.
 */
export async function getModuleLanguages(
    page?: number,
    pageSize?: number,
): Promise<PagedResponse<{ language: string }>> {
    const queryParams = new URLSearchParams();
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/modules/distinct/fields?field=language", queryParams));
}

/**
 * Fetch the distinct exam types from the API.
 * @param page - Optional one-based page number.
 * @param pageSize - Optional number of items per page.
 * @returns The distinct exam type response data.
 */
export async function getExamTypes(
    page?: number,
    pageSize?: number,
): Promise<PagedResponse<{ name: string }>> {
    const queryParams = new URLSearchParams();
    appendPaging(queryParams, page, pageSize);
    return fetchApi(appendQuery("/exams/distinct/fields?field=name", queryParams));
}

/**
 * Fetch the full detail record of a single module.
 * @param id - Module id.
 * @returns The module detail response data.
 */
export async function getModuleDetail(id: string): Promise<ModuleDetail> {
    return fetchApi(
        `/modules/${id}?include=faculty&include=semesters&include=degrees&include=degrees.faculty&include=courses&include=courses.type&include=courses.staff&include=courses.events&include=courses.events.location&include=courses.events.location.building&include=courses.events.staff&include=exams&include=exams.staff`,
    );
}

/**
 * Fetch the full detail record of a single course.
 * @param id - Course id.
 * @returns The course detail response data.
 */
export async function getCourseDetail(id: string): Promise<CourseDetail> {
    return fetchApi(
        `/courses/${id}?include=type&include=status&include=staff&include=semesters&include=modules&include=modules.faculty&include=modules.exams&include=events&include=events.location&include=events.location.building&include=events.staff`,
    );
}

/**
 * Fetch the full detail record of a single event.
 * @param id - Event id.
 * @returns The event detail response data.
 */
export async function getEventDetail(id: string): Promise<EventDetail> {
    return fetchApi(
        `/events/${id}?include=location&include=location.building&include=staff&include=semesters&include=courses&include=courses.type&include=courses.staff`,
    );
}

/**
 * Fetch the full detail record of a single exam.
 * @param id - Exam id.
 * @returns The exam detail response data.
 */
export async function getExamDetail(id: string): Promise<ExamDetail> {
    return fetchApi(
        `/exams/${id}?include=staff&include=semesters&include=module&include=module.faculty&include=module.courses&include=module.courses.type&include=module.courses.staff`,
    );
}

/**
 * Fetch the full detail record of a single staff member.
 * @param id - Staff id.
 * @returns The staff detail response data.
 */
export async function getStaffDetail(id: string): Promise<StaffDetail> {
    return fetchApi(
        `/staff/${id}?include=modules&include=modules.faculty&include=modules.courses&include=modules.courses.type&include=modules.exams&include=courses&include=courses.type&include=events&include=events.location&include=events.location.building&include=events.courses&include=events.courses.type&include=exams`,
    );
}

/**
 * Fetch the full detail record of a single location.
 * @param id - Location id.
 * @returns The location detail response data.
 */
export async function getLocationDetail(id: string): Promise<LocationDetail> {
    return fetchApi(
        `/locations/${id}?include=building&include=events&include=events.staff&include=events.semesters&include=events.courses&include=events.courses.type`,
    );
}

/**
 * Fetch the full detail record of a single building.
 * @param id - Building id.
 * @returns The building detail response data.
 */
export async function getBuildingDetail(id: string): Promise<BuildingDetail> {
    return fetchApi(
        `/buildings/${id}?include=locations&include=locations.events&include=locations.events.staff&include=locations.events.courses&include=locations.events.courses.type`,
    );
}

/**
 * Fetch the full detail record of a single faculty.
 * @param id - Faculty id.
 * @returns The faculty detail response data.
 */
export async function getFacultyDetail(id: string): Promise<FacultyDetail> {
    return fetchApi(
        `/faculties/${id}?include=modules&include=modules.courses&include=modules.courses.type&include=modules.exams&include=degrees`,
    );
}

/**
 * Fetch the full detail record of a single semester.
 * @param id - Semester id.
 * @returns The semester detail response data.
 */
export async function getSemesterDetail(id: string): Promise<SemesterDetail> {
    return fetchApi(
        `/semesters/${id}?include=modules&include=modules.faculty&include=modules.courses.type&include=modules.courses.staff&include=modules.exams&include=courses&include=courses.type&include=courses.staff&include=events&include=events.location&include=events.location.building&include=events.staff&include=events.courses&include=events.courses.type&include=exams&include=exams.staff`,
    );
}

/**
 * Fetch the full detail record of a single degree.
 * @param id - Degree id.
 * @returns The degree detail response data.
 */
export async function getDegreeDetail(id: string): Promise<DegreeDetail> {
    return fetchApi(
        `/degrees/${id}?include=faculty&include=modules&include=modules.faculty&include=modules.courses.type&include=modules.exams`,
    );
}

/**
 * Fetch the full detail record of a single event type.
 * @param id - Event type id.
 * @returns The event type detail response data.
 */
export async function getEventTypeDetail(id: string): Promise<EventType> {
    return fetchApi(`/catalog/event-types/${id}`);
}
