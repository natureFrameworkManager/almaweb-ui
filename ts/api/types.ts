export interface Module {
    id: number;
    name: string;
    number: string;
    language: string;
    duration_semesters: number;
    credits: number;
    frequency: string;
    path: string[][];
    faculty: {
        name: string;
    };
    exams: {
        name: string;
    }[];
    courses: {
        type: EventType;
    }[];
}

export interface Course {
    id: number;
    name: string;
    number: string;
    type: EventType;
    weekday: string | null;
    weekly_hours: number;
    language: string;
    staff: Staff[];
}

export interface CourseDetail extends Course {
    status?: Status;
    semesters?: Semester[];
    modules?: Module[];
    events: Event[];
}

export interface Event {
    id: number;
    number: string;
    name: string;
    start_time: string;
    end_time: string;
    event_date: string;
    location: Location;
    staff: Staff[];
    courses?: Course[];
    semesters?: Semester[];
}

export interface EventDetail extends Event {
    semesters: Semester[];
    courses: Course[];
}

export interface Exam {
    id: number;
    name: string;
    exam_date: string | null;
    start_time: string | null;
    end_time: string | null;
    required: boolean;
    staff: Staff[];
    location?: Location;
}

export interface ExamDetail extends Exam {
    module_id: number;
    semesters: Semester[];
    module?: Module;
}

export interface Staff {
    id: number;
    name: string;
}

export interface StaffDetail extends Staff {
    modules: Module[];
    courses: Course[];
    events: Event[];
    exams: Exam[];
}

export interface Location {
    id: number;
    name: string;
    external_id: string;
    description: string;
    type: string;
    seats: number;
    size: number;
    accessibility: string;
    building_id: number;
    building: Building;
    events?: Event[];
}

export interface LocationDetail extends Location {
    events: Event[];
}

export interface Semester {
    id: number;
    name: string;
    year: number;
    term: string;
}

export interface SemesterDetail extends Semester {
    modules: Module[];
    courses: Course[];
    events: Event[];
    exams: Exam[];
}

export interface Faculty {
    id: number;
    name: string;
    prefix: number;
}

export interface FacultyDetail extends Faculty {
    modules: Module[];
    degrees: Degree[];
}

export interface Building {
    id: number;
    name: string;
    short_name: string;
    address: string;
}

export interface BuildingDetail extends Building {
    locations: Location[];
}

export interface EventType {
    id: number;
    name: string;
}

export interface Status {
    id: number;
    name: string;
}

export interface Degree {
    id: number;
    faculty_id: number;
    name: string;
    faculty?: Faculty;
}

export interface DegreeDetail extends Degree {
    faculty?: Faculty;
    modules: Module[];
}

export interface PagedResponse<T> {
    count: number;
    page: number;
    limit: number;
    total_pages: number;
    items: T[];
}

export interface ModuleDetail extends Module {
    content: string;
    goals: string;
    exam_prerequisites: string;
    prerequisites: Record<string, string> | null;
    faculty_id: number;
    faculty: Faculty;
    semesters: Semester[];
    degrees?: Degree[];
    exams: Exam[];
    courses: CourseDetail[];
}
