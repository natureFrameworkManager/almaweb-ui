import "../css/main.css";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

import {
    getBuildings,
    getEventTypes,
    getEvents,
    getExamTypes,
    getFaculties,
    getLocations,
    getModuleLanguages,
    getSemesters,
    getStaff,
} from "./api/api";
import { initCal } from "./calendar";
import {
    appendCheckboxOptions,
    appendSelectOptions,
    requeryAll,
    requeryCourses,
    requeryExams,
    requeryModules,
    toBuildingOptions,
    toEventTypeOptions,
    toExamTypeOptions,
    toFacultyOptions,
    toLanguageOptions,
    toSemesterOptions,
    toStaffOptions,
    wireFilterGroup,
} from "./filters";
import { switchMainView, switchViewMode } from "./layout";
import { wireSwitcher } from "./switcher";
import { handleThemeChange, initTheme } from "./theme";
import { eventToView, locationToView, renderEntities, staffToView } from "./views";

wireSwitcher("#display-changer1", (view) => switchMainView(1, view));
wireSwitcher("#display-changer2", (view) => switchMainView(2, view));
wireSwitcher("#dark-mode-toggle", handleThemeChange, "data-mode");
wireSwitcher("#view-switcher", (view) => {
    if (view === "single" || view === "split" || view === "compare") {
        switchViewMode(view);
    }
});
wireSwitcher("#type-switcher1");
wireSwitcher("#type-switcher2");
initTheme();
switchViewMode("single");
switchMainView(1, "list");
switchMainView(2, "list");

const calendars = [initCal("calendar-container1"), initCal("calendar-container2")];
requeryAll();

/* getEvents()
    .then((events) => {
        const sortedEvents = events.items.sort((a, b) => a.event_date.localeCompare(b.event_date));
        renderEntities("events", sortedEvents, eventToView);
        const calendarEvents = sortedEvents.map((event) => ({
            id: String(event.id),
            title: event.name || event.location.name,
            start: `${event.event_date}T${event.start_time}`,
            end: `${event.event_date}T${event.end_time}`,
        }));
        calendars.forEach((calendar) => calendar.addEventSource(calendarEvents));
    })
    .catch((error) => {
        console.error("Failed to fetch events:", error);
    }); */

getStaff()
    .then((staff) => {
        renderEntities(
            "staff",
            staff.items.sort((a, b) => a.name.localeCompare(b.name)),
            staffToView,
        );
        appendCheckboxOptions("filter-instructors", toStaffOptions(staff.items));
        appendCheckboxOptions("filter-staff", toStaffOptions(staff.items));
    })
    .catch((error) => {
        console.error("Failed to fetch staff:", error);
    });

getLocations()
    .then((locations) => {
        renderEntities(
            "locations",
            locations.items.sort((a, b) => a.name.localeCompare(b.name)),
            locationToView,
        );
    })
    .catch((error) => {
        console.error("Failed to fetch locations:", error);
    });

getSemesters()
    .then((semesters) => {
        appendCheckboxOptions("filter-semester", toSemesterOptions(semesters.items));
    })
    .catch((error) => {
        console.error("Failed to fetch semesters:", error);
    });

getFaculties()
    .then((faculties) => {
        appendCheckboxOptions("filter-faculty", toFacultyOptions(faculties.items));
    })
    .catch((error) => {
        console.error("Failed to fetch faculties:", error);
    });

getEventTypes()
    .then((eventTypes) => {
        appendCheckboxOptions("filter-type", toEventTypeOptions(eventTypes.items));
    })
    .catch((error) => {
        console.error("Failed to fetch event types:", error);
    });

getBuildings()
    .then((buildings) => {
        const options = toBuildingOptions(buildings.items);
        appendCheckboxOptions("filter-buildings", options);
        appendSelectOptions("filter-event-buildings", options);
    })
    .catch((error) => {
        console.error("Failed to fetch buildings:", error);
    });

getModuleLanguages()
    .then((languages) => {
        appendCheckboxOptions("filter-language", toLanguageOptions(languages.items));
    })
    .catch((error) => {
        console.error("Failed to fetch languages:", error);
    });

getExamTypes()
    .then((examTypes) => {
        appendCheckboxOptions("filter-examtypes", toExamTypeOptions(examTypes.items));
    })
    .catch((error) => {
        console.error("Failed to fetch exam types:", error);
    });

wireFilterGroup("filter-group-global", requeryAll);
wireFilterGroup("filter-group-module", requeryModules);
wireFilterGroup("filter-group-course", requeryCourses);
wireFilterGroup("filter-group-exam", requeryExams);
