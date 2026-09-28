import "../css/main.css";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

import type { Calendar } from "fullcalendar";

import {
    getBuildings,
    getEventTypes,
    getExamTypes,
    getFaculties,
    getModuleLanguages,
    getSemesters,
    getStaff,
} from "./api/api";
import { initCal } from "./calendar";
import {
    appendCheckboxOptions,
    appendSelectOptions,
    initTreeRetry,
    refreshTree,
    registerCollections,
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
import { reportError } from "./feedback";
import { getActiveMainView, switchMainView, switchViewMode } from "./layout";
import { getState } from "./state";
import {
    initStateBindings,
    loadInitialState,
    refreshStateFilters,
    registerCalendarLoader,
} from "./state-bind";
import { wireSwitcher } from "./switcher";
import { handleThemeChange, initTheme } from "./theme";
import {
    ensurePaneCollections,
    initCollectionScrolling,
    initDetailDialog,
    registerDetailSpecs,
    setActiveType,
} from "./views";

/** Calendars created lazily the first time a pane shows them. */
const calendars: Partial<Record<1 | 2, Calendar>> = {};

/**
 * Create the calendar of a pane the first time it is shown.
 * @param paneId - Pane identifier.
 */
function ensureCalendar(paneId: 1 | 2): void {
    if (!calendars[paneId]) {
        calendars[paneId] = initCal(`calendar-container${paneId}`, getState().calendar.view);
    }
}

/**
 * Lazily load the view a pane just switched to.
 * @param paneId - Pane identifier.
 * @param view - Main view that became active.
 */
function handlePaneView(paneId: 1 | 2, view: string): void {
    switchMainView(paneId, view);
    if (view === "tree") {
        void refreshTree(paneId);
    } else if (view === "calendar") {
        ensureCalendar(paneId);
    } else {
        ensurePaneCollections();
    }
}

/** Load collections and trees for every visible pane after a layout change. */
function handleViewModeChange(): void {
    ensurePaneCollections();
    ([1, 2] as const).forEach((paneId) => {
        if (getActiveMainView(paneId) === "tree") {
            void refreshTree(paneId);
        }
    });
}

registerCollections();
registerDetailSpecs();
initCollectionScrolling();
initDetailDialog();

registerCalendarLoader(ensureCalendar);
initTreeRetry();
loadInitialState();

wireSwitcher("#display-changer1", (view) => handlePaneView(1, view));
wireSwitcher("#display-changer2", (view) => handlePaneView(2, view));
wireSwitcher("#dark-mode-toggle", handleThemeChange, "data-mode");
wireSwitcher("#view-switcher", (view) => {
    if (view === "single" || view === "split" || view === "compare") {
        switchViewMode(view);
        handleViewModeChange();
    }
});
wireSwitcher("#type-switcher1", (type) => setActiveType(1, type));
wireSwitcher("#type-switcher2", (type) => setActiveType(2, type));
initTheme();
initStateBindings();

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

/** Fetch the filter options; the state filters are re-applied once they exist. */
const filterOptionLoads = [
    getStaff()
        .then((staff) => {
            appendCheckboxOptions("filter-instructors", toStaffOptions(staff.items));
            appendCheckboxOptions("filter-staff", toStaffOptions(staff.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getSemesters()
        .then((semesters) => {
            appendCheckboxOptions("filter-semester", toSemesterOptions(semesters.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getFaculties()
        .then((faculties) => {
            appendCheckboxOptions("filter-faculty", toFacultyOptions(faculties.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getEventTypes()
        .then((eventTypes) => {
            appendCheckboxOptions("filter-type", toEventTypeOptions(eventTypes.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getBuildings()
        .then((buildings) => {
            const options = toBuildingOptions(buildings.items);
            appendCheckboxOptions("filter-buildings", options);
            appendSelectOptions("filter-event-buildings", options);
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getModuleLanguages()
        .then((languages) => {
            appendCheckboxOptions("filter-language", toLanguageOptions(languages.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getExamTypes()
        .then((examTypes) => {
            appendCheckboxOptions("filter-examtypes", toExamTypeOptions(examTypes.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
];

void Promise.allSettled(filterOptionLoads).then(refreshStateFilters);

wireFilterGroup("filter-group-global", requeryAll);
wireFilterGroup("filter-group-module", requeryModules);
wireFilterGroup("filter-group-course", requeryCourses);
wireFilterGroup("filter-group-exam", requeryExams);
