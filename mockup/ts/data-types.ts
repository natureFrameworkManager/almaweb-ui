// mockup/ts/data-types.ts
export interface MockModule {
    id: string;
    code: string;
    name: string;
    lp: number;
    sws: number;
    semester: string;
    faculty: string;
    language: string;
    description: string;
    responsible: string;
    coursesCount: number;
    examsCount: number;
}

export interface MockCourse {
    id: string;
    code: string;
    name: string;
    moduleId: string;
    moduleName: string;
    type: "Vorlesung" | "Übung" | "Seminar" | "Praktikum";
    day: "Mo" | "Di" | "Mi" | "Do" | "Fr";
    time: string;
    room: string;
    instructor: string;
    sws: number;
}

export interface MockEvent {
    id: string;
    title: string;
    courseId: string;
    date: string;
    day: "Mo" | "Di" | "Mi" | "Do" | "Fr";
    startHour: number;
    durationHours: number;
    time: string;
    room: string;
    building: string;
    instructor: string;
    type: "Veranstaltung";
}

export interface MockExam {
    id: string;
    code: string;
    name: string;
    moduleId: string;
    date: string;
    time: string;
    room: string;
    examiner: string;
    type: "Klausur" | "Mündliche Prüfung" | "Hausarbeit";
    mandatory: boolean;
}

export interface MockStaff {
    id: string;
    name: string;
    title: string;
    faculty: string;
    coursesCount: number;
    examsCount: number;
    email: string;
    office: string;
}

export interface MockRoom {
    id: string;
    name: string;
    building: string;
    capacity: number;
    type: "Hörsaal" | "Seminarraum" | "Rechnerpool";
    accessible: boolean;
}
