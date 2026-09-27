// mockup-v2/ts/data.ts — Mock datasets for interactive V2 prototype

export interface EntityItem {
    id: string;
    type: "modul" | "kurs" | "termin" | "pruefung" | "person" | "raum";
    number?: string;
    title: string;
    meta?: string;
    lp?: number;
    faculty?: string;
    semester?: string;
    turnus?: string;
    responsible?: string;
    description?: string;
    time?: string;
    room?: string;
    weekday?: string;
    prerequisites?: string[];
}

export const ALL_ITEMS: EntityItem[] = [
    {
        id: "mod-1",
        type: "modul",
        number: "10-201-2001-1",
        title: "Datenbanksysteme I",
        meta: "10-201-2001-1 · WiSe & SoSe · Prof. Dr. E. Rahm",
        lp: 10,
        faculty: "10 Fakultät für Mathematik und Informatik",
        semester: "WiSe 2025/26",
        turnus: "Jedes Semester",
        responsible: "Prof. Dr. Erhard Rahm",
        description: "Grundlagen relationaler Datenbanksysteme, SQL, ER-Modellierung und Normalformen.",
        prerequisites: ["Modellierung", "Algorithmen 1"]
    },
    {
        id: "mod-2",
        type: "modul",
        number: "10-201-2002-1",
        title: "Algorithmen und Datenstrukturen 1",
        meta: "10-201-2002-1 · WiSe · Prof. Dr. M. Middendorf",
        lp: 5,
        faculty: "10 Fakultät für Mathematik und Informatik",
        semester: "WiSe 2025/26",
        turnus: "Jedes Wintersemester",
        responsible: "Prof. Dr. Martin Middendorf",
        description: "Sortierverfahren, Suchbäume, Hashing und Graphenalgorithmen.",
        prerequisites: []
    },
    {
        id: "mod-3",
        type: "modul",
        number: "10-201-2003-1",
        title: "Softwaretechnik",
        meta: "10-201-2003-1 · WiSe · Dr. R. Müller",
        lp: 5,
        faculty: "10 Fakultät für Mathematik und Informatik",
        semester: "WiSe 2025/26",
        turnus: "Jedes Wintersemester",
        responsible: "Dr. René Müller",
        description: "Agile Methoden, Entwurfsmuster, Architektur und Qualitätssicherung.",
        prerequisites: ["Algorithmen 1"]
    },
    {
        id: "mod-4",
        type: "modul",
        number: "10-201-2004-1",
        title: "Lineare Algebra 1",
        meta: "10-201-2004-1 · WiSe · Prof. Dr. A. Schwarz",
        lp: 10,
        faculty: "10 Fakultät für Mathematik und Informatik",
        semester: "WiSe 2025/26",
        turnus: "Jedes Wintersemester",
        responsible: "Prof. Dr. Angela Schwarz",
        description: "Vektorräume, lineare Abbildungen, Matrizenkalkül und Determinanten.",
        prerequisites: []
    },
    {
        id: "mod-5",
        type: "modul",
        number: "09-101-1001-1",
        title: "Einführung Wirtschaftsinformatik",
        meta: "09-101-1001-1 · WiSe · Prof. Dr. R. Alt",
        lp: 5,
        faculty: "09 Wirtschaftswissenschaftliche Fakultät",
        semester: "WiSe 2025/26",
        turnus: "Jedes Wintersemester",
        responsible: "Prof. Dr. Rainer Alt",
        description: "Betriebliche Informationssysteme und digitale Geschäftsprozesse.",
        prerequisites: []
    },
    {
        id: "kurs-1",
        type: "kurs",
        title: "Vorlesung: Datenbanksysteme I",
        meta: "WiSe 2025/26 · Mi 09:15–10:45 · HS 3",
        time: "Mi 09:15–10:45",
        weekday: "Mi",
        room: "HS 3 Hörsaalgebäude",
        responsible: "Prof. Dr. Erhard Rahm"
    },
    {
        id: "kurs-2",
        type: "kurs",
        title: "Vorlesung: Softwaretechnik",
        meta: "WiSe 2025/26 · Di 13:15–14:45 · HS 1",
        time: "Di 13:15–14:45",
        weekday: "Di",
        room: "HS 1 Hörsaalgebäude",
        responsible: "Dr. René Müller"
    },
    {
        id: "pruef-1",
        type: "pruefung",
        title: "Klausur: Datenbanksysteme I",
        meta: "12.02.2026 · 10:00–11:30 · HS 3 · Pflicht",
        time: "12.02.2026 10:00",
        room: "HS 3 Hörsaalgebäude"
    },
    {
        id: "pers-1",
        type: "person",
        title: "Prof. Dr. Erhard Rahm",
        meta: "Institut für Informatik · Lehrstuhl Datenbanken"
    },
    {
        id: "raum-1",
        type: "raum",
        title: "Hörsaal 3 (HS 3)",
        meta: "Hörsaalgebäude Augustusplatz · 450 Plätze · Barrierefrei"
    }
];

export interface CalendarEvent {
    id: string;
    title: string;
    day: number; // 0=Mo, 1=Di, 2=Mi, 3=Do, 4=Fr
    startHour: number; // 9.25 = 09:15
    durationHours: number; // 1.5 = 90 min
    room: string;
    type: "modul" | "kurs";
}

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
    {
        id: "ev-1",
        title: "Algorithmen & DS 1 (V)",
        day: 0,
        startHour: 11.25,
        durationHours: 1.5,
        room: "Felix-Klein-HS",
        type: "modul"
    },
    {
        id: "ev-2",
        title: "Softwaretechnik (V)",
        day: 1,
        startHour: 13.25,
        durationHours: 1.5,
        room: "HS 1",
        type: "kurs"
    },
    {
        id: "ev-3",
        title: "Datenbanksysteme I (V)",
        day: 2,
        startHour: 9.25,
        durationHours: 1.5,
        room: "HS 3",
        type: "modul"
    },
    {
        id: "ev-4",
        title: "Datenbanksysteme I (Ü)",
        day: 3,
        startHour: 11.25,
        durationHours: 1.5,
        room: "SG 3-12",
        type: "kurs"
    },
    {
        id: "ev-5",
        title: "Wirtschaftsinf. (V)",
        day: 4,
        startHour: 10.0,
        durationHours: 1.75,
        room: "HS 2",
        type: "modul"
    }
];
