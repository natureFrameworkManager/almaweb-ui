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