import "../css/main.css";

import { Calendar } from "fullcalendar";
import dayGridPlugin from "fullcalendar/daygrid";
import listPlugin from "fullcalendar/list";
import multiMonthPlugin from "fullcalendar/multimonth";
import themePlugin from "fullcalendar/themes/monarch";
import timeGridPlugin from "fullcalendar/timegrid";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

const calendarElementId = "calendar";

let calendarInstance = null;

function initCal() {
    const calendarElement = document.querySelector(`#${calendarElementId}`) as HTMLElement | null;
    if (!calendarElement) {
        throw new Error(`Calendar element with ID "${calendarElementId}" not found.`);
    }

    calendarInstance = new Calendar(calendarElement, {
        initialView: "listMonth",
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
    calendarInstance.render();
}

// initCal();
