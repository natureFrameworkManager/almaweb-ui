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

export interface Staff {
    id: number;
    name: string;
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
}

export interface Semester {
    id: number;
    name: string;
    year: number;
    term: string;
}

export interface Faculty {
    id: number;
    name: string;
    prefix: number;
}

export interface Building {
    id: number;
    name: string;
    short_name: string;
    address: string;
}

export interface EventType {
    id: number;
    name: string;
}

export interface Degree {
    id: number;
    faculty_id: number;
    name: string;
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
