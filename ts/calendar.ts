import { Calendar, type EventInput } from "fullcalendar";
import dayGridPlugin from "fullcalendar/daygrid";
import listPlugin from "fullcalendar/list";
import multiMonthPlugin from "fullcalendar/multimonth";
import themePlugin from "fullcalendar/themes/monarch";
import timeGridPlugin from "fullcalendar/timegrid";

import { getCourseEvents, getEventDetail, getModuleEvents } from "./api/api";
import type { Event } from "./api/types";
import { getActiveSlot, type CalendarView, type EntryKind } from "./state";

/**
 * Build the calendar toolbar for a given viewport width.
 *
 * Narrow screens get fewer view buttons so the toolbar does not overflow.
 * @param width - Viewport width in pixels.
 * @returns The FullCalendar header toolbar configuration.
 */
function calendarToolbar(width: number): { left: string; center: string; right: string } {
    if (width < 640) {
        return { left: "prev,next", center: "title", right: "today,listMonth,dayGridMonth" };
    }
    return {
        left: "prev,next today",
        center: "title",
        right: "listWeek,listMonth,dayGridMonth,timeGridWeek,timeGridDay",
    };
}

/**
 * Create and render a FullCalendar instance for a pane.
 * @param elementId - Calendar element ID.
 * @param initialView - Calendar view to show first.
 * @returns The rendered calendar instance.
 * @throws {Error} If the calendar element does not exist.
 */
export function initCal(elementId: string, initialView: CalendarView = "listMonth"): Calendar {
    const calendarElement = document.querySelector(`#${elementId}`) as HTMLElement | null;
    if (!calendarElement) {
        throw new Error(`Calendar element with ID "${elementId}" not found.`);
    }

    const calendar = new Calendar(calendarElement, {
        height: "100%",
        initialView,
        locale: "de",
        eventMaxStack: 4,
        initialDate: new Date().toISOString().split("T")[0],
        listDayFormat: { day: "numeric" },
        headerToolbar: calendarToolbar(window.innerWidth),
        buttons: {
            listWeek: { text: "Liste Woche" },
            listMonth: { text: "Liste Monat" },
            dayGridMonth: { text: "Monat" },
            timeGridWeek: { text: "Woche" },
            timeGridDay: { text: "Tag" },
            today: { text: "Heute" },
        },
        noEventsContent: "Keine anzuzeigenden Termine",
        plugins: [themePlugin, dayGridPlugin, timeGridPlugin, listPlugin, multiMonthPlugin],
    });
    calendar.render();
    return calendar;
}

/** Calendars created lazily the first time a pane shows them. */
const calendars: Partial<Record<1 | 2, Calendar>> = {};

/** Keep every created calendar's toolbar in sync with the viewport width. */
window.addEventListener("resize", () => {
    Object.values(calendars).forEach((calendar) => {
        calendar?.setOption("headerToolbar", calendarToolbar(window.innerWidth));
    });
});

/**
 * Return the calendar of a pane, creating and rendering it on first use.
 * @param paneId - Pane identifier.
 * @param initialView - Calendar view to show when the pane is created.
 * @returns The pane calendar instance.
 */
export function ensureCalendar(paneId: 1 | 2, initialView: CalendarView = "listMonth"): Calendar {
    const existing = calendars[paneId];
    if (existing) {
        return existing;
    }
    const calendar = initCal(`calendar-container${paneId}`, initialView);
    calendars[paneId] = calendar;
    return calendar;
}

/**
 * Collect the saved reference ids of one entry kind from the active save slot.
 * @param kind - Entry kind to collect.
 * @returns The saved reference ids, or an empty list without an active slot.
 */
function savedRefs(kind: EntryKind): number[] {
    const slot = getActiveSlot();
    if (!slot) {
        return [];
    }
    return slot.entries.filter((entry) => entry.kind === kind).map((entry) => entry.ref);
}

/**
 * Load the events linked to the saved modules and courses of the active slot.
 * @returns The linked events of every saved module and course.
 */
async function loadLinkedEvents(): Promise<Event[]> {
    const requests = [
        ...savedRefs("module").map((ref) => getModuleEvents(ref)),
        ...savedRefs("course").map((ref) => getCourseEvents(ref)),
    ];
    const results = await Promise.allSettled(requests);
    return results.flatMap((result) => {
        if (result.status === "fulfilled") {
            return result.value.items;
        }
        console.error("Failed to load linked calendar events:", result.reason);
        return [];
    });
}

/**
 * Load the events that are saved directly in the active slot.
 * @returns The saved events.
 */
async function loadSavedEvents(): Promise<Event[]> {
    const requests = savedRefs("event").map((ref) => getEventDetail(String(ref)));
    const results = await Promise.allSettled(requests);
    return results.flatMap((result) => {
        if (result.status === "fulfilled") {
            return [result.value];
        }
        console.error("Failed to load saved calendar events:", result.reason);
        return [];
    });
}

/**
 * Drop duplicate events reachable through several saved data points.
 * @param events - Candidate events.
 * @returns The events with unique ids, keeping the first occurrence.
 */
function dedupeEvents(events: Event[]): Event[] {
    const byId = new Map<number, Event>();
    events.forEach((event) => {
        if (!byId.has(event.id)) {
            byId.set(event.id, event);
        }
    });
    return Array.from(byId.values());
}

/**
 * Convert a domain event into a FullCalendar event input.
 * @param event - Event to convert.
 * @returns The calendar event input, or null when the event has no date.
 */
function toEventInput(event: Event): EventInput | null {
    if (!event.event_date) {
        return null;
    }
    return {
        id: String(event.id),
        title: event.name || event.location?.name || "",
        start: event.start_time ? `${event.event_date}T${event.start_time}` : event.event_date,
        end: event.end_time ? `${event.event_date}T${event.end_time}` : undefined,
    };
}

/**
 * Redraw every created calendar with the events of the active save slot.
 *
 * Draws the saved events themselves plus every event linked to the saved modules
 * and courses. Does nothing while no calendar has been created yet.
 */
export async function refreshCalendarEvents(): Promise<void> {
    const instances = Object.values(calendars).filter(
        (calendar): calendar is Calendar => calendar !== undefined,
    );
    if (instances.length === 0) {
        return;
    }
    const [linked, saved] = await Promise.all([loadLinkedEvents(), loadSavedEvents()]);
    const inputs = dedupeEvents([...linked, ...saved])
        .map(toEventInput)
        .filter((input): input is EventInput => input !== null);
    instances.forEach((calendar) => {
        calendar.removeAllEvents();
        calendar.addEventSource(inputs);
    });
}
