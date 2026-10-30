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

type PageOptions = {
    page?: number;
    pageSize?: number;
};
type SortOptions = {
    sort?: string;
    order?: SortOrder;
};
type GeneralOptions = PageOptions & SortOptions;

type ModuleOptions = GeneralOptions & {
    name?: string | string[];
    number?: string | string[];
    facultyId?: number | number[];
    responsiblePerson?: string;
    creditsMin?: number;
    creditsMax?: number;
    durationSemestersMin?: number;
    durationSemestersMax?: number;
    semesterId?: string | string[];
    degreeId?: string | string[];
    hasCourses?: boolean;
    hasEvents?: boolean;
    hasStaff?: boolean;
    path?: string | string[];
    pathPrefix?: string;
};

type CourseOptions = GeneralOptions & {
    name?: string | string[];
    number?: string | string[];
    type?: string | string[];
    typeId?: string | string[];
    staffId?: number | number[];
    weekHoursMin?: number;
    weekHoursMax?: number;
    semesterId?: string | string[];
};

type EventOptions = GeneralOptions & {
    startTimeFrom?: string;
    startTimeTo?: string;
    endTimeFrom?: string;
    endTimeTo?: string;
    dateFrom?: string;
    dateTo?: string;
    buildingId?: number | number[];
    staff?: string | string[];
    staffId?: number | number[];
    courseTypeId?: number | number[];
    semesterId?: number | number[];
};

type ExamOptions = GeneralOptions & {
    name?: string | string[];
    startTimeFrom?: string;
    startTimeTo?: string;
    endTimeFrom?: string;
    endTimeTo?: string;
    examDateFrom?: string;
    examDateTo?: string;
    required?: boolean;
    buildingId?: number | number[];
    staff?: string | string[];
    staffId?: number | number[];
    semesterId?: number | number[];
};

type DegreesOptions = GeneralOptions & {
    names?: string | string[];
    subjects?: string | string[];
    degrees?: string | string[];
    faculty?: string | string[];
};

type LocationOptions = GeneralOptions & {
    accessible?: string;
};

/**
 * Create URL search parameters from an options object.
 * @param options - Options object to convert.
 * @returns URLSearchParams instance containing the encoded options.
 */
function createQueryParams<Type>(options?: Type): URLSearchParams {
    const queryParams = new URLSearchParams();
    if (!options) {
        return queryParams;
    }
    Object.entries(options as Record<string, unknown>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            const expandedKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
            if (Array.isArray(value)) {
                value
                    .filter((v) => v !== undefined && v !== null && v !== "")
                    .forEach((v) => queryParams.append(expandedKey, v.toString()));
            } else {
                queryParams.append(expandedKey, value.toString());
            }
        }
    });
    return queryParams;
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
 * Fetch module data from the API.
 * @param options - Module query options.
 * @returns The module response data.
 */
export async function getModules(options?: ModuleOptions): Promise<PagedResponse<Module>> {
    const queryParams = createQueryParams<ModuleOptions>(options);
    return fetchApi(
        `/modules?include=faculty&include=courses&include=exams&fields=id&fields=name&fields=number&fields=language&fields=duration_semesters&fields=credits&fields=frequency&fields=path&fields=faculty.name&fields=courses.type&fields=exams.name&${queryParams.toString()}`,
    );
}

/**
 * Fetch course data from the API.
 * @param options - Course query options.
 * @returns The course response data.
 */
export async function getCourses(options?: CourseOptions): Promise<PagedResponse<Course>> {
    const queryParams = createQueryParams<CourseOptions>(options);
    return fetchApi(
        `/courses?fields=id&fields=name&fields=number&fields=weekday&fields=weekly_hours&fields=language&fields=staff&fields=type.name&${queryParams.toString()}`,
    );
}

/**
 * Fetch event data from the API.
 * @param options - Event query options.
 * @returns The event response data.
 */
export async function getEvents(options?: EventOptions): Promise<PagedResponse<Event>> {
    const queryParams = createQueryParams<EventOptions>(options);
    return fetchApi(
        `/events?fields=id&fields=number&fields=name&fields=start_time&fields=end_time&fields=event_date&fields=location&fields=location.building&fields=staff&fields=courses.name&fields=courses.type.name&${queryParams.toString()}`,
    );
}

/**
 * Fetch every event linked to a module.
 *
 * Uses the dedicated `/modules/{module_id}/events` endpoint; pagination is left
 * out so the API returns the complete list of linked events.
 * @param moduleId - Module id.
 * @param dateFrom - Optional inclusive lower date bound (`YYYY-MM-DD`).
 * @param dateTo - Optional inclusive upper date bound (`YYYY-MM-DD`).
 * @param weekday - Optional weekday values (0=Monday … 6=Sunday).
 * @returns The module event response data.
 */
export async function getModuleEvents(
    moduleId: number,
    dateFrom?: string,
    dateTo?: string,
    weekday?: number[],
): Promise<PagedResponse<Event>> {
    const queryParams = createQueryParams({ dateFrom, dateTo, weekday });
    return fetchApi(
        appendQuery(
            `/modules/${moduleId}/events?include=location&include=location.building&include=staff&fields=courses.name&fields=courses.type.name`,
            queryParams,
        ),
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
        `/courses/${courseId}/events?include=location&include=location.building&include=staff&fields=courses.name&fields=courses.type.name`,
    );
}

/**
 * Fetch exam data from the API.
 * @param options - The exam query options.
 * @returns The exam response data.
 */
export async function getExams(options?: ExamOptions): Promise<PagedResponse<Exam>> {
    const queryParams = createQueryParams<ExamOptions>(options);
    return fetchApi(
        `/exams?fields=id&fields=name&fields=exam_date&fields=start_time&fields=end_time&fields=required&fields=staff&${queryParams.toString()}`,
    );
}

/**
 * Fetch staff data from the API.
 * @param options - The general query options including pagination and sorting.
 * @returns The staff response data.
 */
export async function getStaff(options?: GeneralOptions): Promise<PagedResponse<Staff>> {
    const queryParams = createQueryParams(options);
    return fetchApi(appendQuery("/staff?fields=id&fields=name", queryParams));
}

/**
 * Fetch degree data from the API.
 * @param options - The degree query options including name, subject, degree type, faculty, pagination, and sorting.
 * @returns The degree response data.
 */
export async function getDegrees(options?: DegreesOptions): Promise<PagedResponse<Degree>> {
    const queryParams = createQueryParams(options);
    return fetchApi(
        appendQuery(
            "/degrees?fields=id&fields=name&fields=subject&fields=degree&fields=school_type&fields=ects&fields=version&fields=confidence&fields=faculty_id",
            queryParams,
        ),
    );
}

/**
 * Fetch location data from the API.
 * @param options - The location query options including accessibility, pagination, and sorting.
 * @returns The location response data.
 */
export async function getLocations(options?: LocationOptions): Promise<PagedResponse<Location>> {
    const queryParams = createQueryParams(options);
    return fetchApi(
        appendQuery(
            "/locations?fields=id&fields=name&fields=external_id&fields=description&fields=type&fields=seats&fields=size&fields=accessibility&fields=building_id&fields=building",
            queryParams,
        ),
    );
}

/**
 * Fetch building data from the API.
 * @param options - The pagination options including page and page size.
 * @returns The building response data.
 */
export async function getBuildings(options?: PageOptions): Promise<PagedResponse<Building>> {
    const queryParams = createQueryParams(options);
    return fetchApi(appendQuery("/buildings", queryParams));
}

/**
 * Fetch semester data from the API.
 * @param options - The pagination options including page and page size.
 * @returns The semester response data.
 */
export async function getSemesters(options?: PageOptions): Promise<PagedResponse<Semester>> {
    const queryParams = createQueryParams(options);
    return fetchApi(appendQuery("/semesters", queryParams));
}

/**
 * Fetch faculty data from the API.
 * @param options - The pagination options including page and page size.
 * @returns The faculty response data.
 */
export async function getFaculties(options?: PageOptions): Promise<PagedResponse<Faculty>> {
    const queryParams = createQueryParams(options);
    return fetchApi(appendQuery("/faculties", queryParams));
}

/**
 * Fetch event type catalog data from the API.
 * @param options - The pagination options including page and page size.
 * @returns The event type response data.
 */
export async function getEventTypes(options?: PageOptions): Promise<PagedResponse<EventType>> {
    const queryParams = createQueryParams(options);
    return fetchApi(appendQuery("/catalog/event-types", queryParams));
}

/**
 * Fetch the distinct module languages from the API.
 * @param options - The pagination options including page and page size.
 * @returns The distinct module language response data.
 */
export async function getModuleLanguages(
    options: PageOptions,
): Promise<PagedResponse<{ language: string }>> {
    const queryParams = createQueryParams(options);
    return fetchApi(appendQuery("/modules/distinct/fields?field=language", queryParams));
}

/**
 * Fetch the distinct exam types from the API.
 * @param options - The pagination options including page and page size.
 * @returns The distinct exam type response data.
 */
export async function getExamTypes(
    options?: PageOptions,
): Promise<PagedResponse<{ name: string }>> {
    const queryParams = createQueryParams(options);
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
