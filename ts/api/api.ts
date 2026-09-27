import type { Module, Course, Event, Exam, Staff, Location } from "./types";

const host = "https://api.casparkroll.de/almaweb/v1";

async function fetchApi(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${host}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return response.json();
}

async function fetchLocal(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`Failed to fetch local ${endpoint}: ${response.statusText}`);
    }
    return response.json();
}

export async function getModules(): Promise<{count: number, page: number, limit: number, total_pages: number, items: Module[]}> {
    return fetchLocal("/ts/api/offline-data/modules.json"); // fetchApi("/modules?include=faculty&include=courses&include=exams&fields=id&fields=name&fields=number&fields=language&fields=duration_semesters&fields=credits&fields=frequency&fields=path&fields=faculty.name&fields=courses.type&fields=exams.name");
}

export async function getCourses(): Promise<{count: number, page: number, limit: number, total_pages: number, items: Course[]}> {
    return fetchLocal("/ts/api/offline-data/courses.json"); // fetchApi("/courses?fields=id&fields=name&fields=number&fields=weekday&fields=weekly_hours&fields=language&fields=staff&fields=type.name");
}

export async function getEvents(): Promise<{count: number, page: number, limit: number, total_pages: number, items: Event[]}> {
    return fetchLocal("/ts/api/offline-data/events.json"); // fetchApi("/events?fields=id&fields=number&fields=name&fields=start_time&fields=end_time&fields=event_date&fields=location&fields=location.building&fields=staff");
}

export async function getExams(): Promise<{count: number, page: number, limit: number, total_pages: number, items: Exam[]}> {
    return fetchLocal("/ts/api/offline-data/exams.json"); // fetchApi("/exams?fields=id&fields=name&fields=exam_date&fields=start_time&fields=end_time&fields=required&fields=staff");
}

export async function getStaff(): Promise<{count: number, page: number, limit: number, total_pages: number, items: Staff[]}> {
    return fetchApi("/staff?fields=id&fields=name");
}

export async function getLocations(): Promise<{count: number, page: number, limit: number, total_pages: number, items: Location[]}> {
    return fetchApi("/locations?fields=id&fields=name&fields=external_id&fields=description&fields=type&fields=seats&fields=size&fields=accessibility&fields=building_id&fields=building");
}