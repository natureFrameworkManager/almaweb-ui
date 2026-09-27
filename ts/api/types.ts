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
        type: {
            id: number;
            name: string;
        };
    }[];
}

export interface Course {
    id: number;
    name: string;
    number: string;
    type: {
        name: string;
    };
    weekday: string | null;
    weekly_hours: number;
    language: string;
    staff: {
        id: number;
        name: string;
    }[];
}

export interface Event {
    id: number;
    number: string;
    name: string;
    start_time: string;
    end_time: string;
    event_date: string;
    location: {
        id: number;
        name: string;
        external_id: string;
        description: string;
        type: string;
        seats: number;
        size: number;
        accessibility: string;
        building_id: number;
        building: {
            id: number;
            name: string;
            short_name: string;
            address: string;
        };
    };
    staff: {
        id: number;
        name: string;
    }[];
}

export interface Exam {
    id: number;
    name: string;
    exam_date: string | null;
    start_time: string | null;
    end_time: string | null;
    required: boolean;
    staff: {
        id: number;
        name: string;
    }[];
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
    building: {
        id: number;
        name: string;
        short_name: string;
        address: string;
    };
}
