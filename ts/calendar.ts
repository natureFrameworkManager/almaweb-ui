import { Calendar } from "fullcalendar";
import dayGridPlugin from "fullcalendar/daygrid";
import listPlugin from "fullcalendar/list";
import multiMonthPlugin from "fullcalendar/multimonth";
import themePlugin from "fullcalendar/themes/monarch";
import timeGridPlugin from "fullcalendar/timegrid";

import type { CalendarView } from "./state";

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
        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "listWeek,listMonth,dayGridMonth,timeGridWeek,timeGridDay",
        },
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
