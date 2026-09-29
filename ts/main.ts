import "../css/main.css";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

import {
    getBuildings,
    getDegrees,
    getEventTypes,
    getExamTypes,
    getFaculties,
    getSemesters,
    getStaff,
} from "./api/api";
import { ensureCalendar, refreshCalendarEvents } from "./calendar";
import {
    appendCheckboxOptions,
    initFilterPanel,
    initTreeRetry,
    refreshFilterSummary,
    refreshTree,
    registerCollections,
    requeryAll,
    requeryCourses,
    requeryDegrees,
    requeryEvents,
    requeryExams,
    requeryLocations,
    requeryModules,
    setStaffDirectory,
    toBuildingOptions,
    toDegreeOptions,
    toDegreeTypeOptions,
    toEventTypeOptions,
    toExamTypeOptions,
    toFacultyOptions,
    toSemesterOptions,
    toStaffOptions,
    wireFilterGroup,
} from "./filters";
import { reportError } from "./feedback";
import { initFilterSheet } from "./filter-sheet";
import { applyViewMode, getActiveMainView, switchMainView, switchViewMode } from "./layout";
import { getState } from "./state";
import {
    captureState,
    initStateBindings,
    loadInitialState,
    refreshStateFilters,
    registerCalendarLoader,
    syncSortSummary,
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

/**
 * Create the calendar of a pane and draw the events linked to the active slot.
 * @param paneId - Pane identifier.
 */
function showCalendar(paneId: 1 | 2): void {
    ensureCalendar(paneId, getState().calendar.view);
    void refreshCalendarEvents();
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
        showCalendar(paneId);
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

registerCalendarLoader(showCalendar);
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
wireSwitcher("#type-switcher1", (type) => {
    setActiveType(1, type);
    syncSortSummary(1);
});
wireSwitcher("#type-switcher2", (type) => {
    setActiveType(2, type);
    syncSortSummary(2);
});
initTheme();
initStateBindings();
initFilterSheet();

/** Re-derive the layout mode whenever the viewport crosses a layout breakpoint. */
const layoutQueries = [
    window.matchMedia("(min-width: 64rem)"),
    window.matchMedia("(min-width: 80rem)"),
];
layoutQueries.forEach((query) => {
    query.addEventListener("change", () => {
        applyViewMode();
        handleViewModeChange();
    });
});

/** Fetch the filter options; the state filters are re-applied once they exist. */
const filterOptionLoads = [
    getStaff()
        .then((staff) => {
            setStaffDirectory(staff.items);
            appendCheckboxOptions("filter-instructors", toStaffOptions(staff.items));
            appendCheckboxOptions("filter-staff", toStaffOptions(staff.items));
            appendCheckboxOptions("filter-event-staff", toStaffOptions(staff.items));
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
            appendCheckboxOptions("filter-event-types", toEventTypeOptions(eventTypes.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
    getBuildings()
        .then((buildings) => {
            appendCheckboxOptions("filter-event-buildings", toBuildingOptions(buildings.items));
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
    getDegrees()
        .then((degrees) => {
            appendCheckboxOptions("filter-degree-types", toDegreeTypeOptions(degrees.items));
            appendCheckboxOptions("filter-degree", toDegreeOptions(degrees.items));
        })
        .catch((error) => {
            reportError("Filteroptionen konnten nicht geladen werden.", error);
        }),
];

/**
 * Persist and re-run the queries after a filter chip or a group reset changed
 * the filter controls.
 */
function handleFilterControlChange(): void {
    captureState();
    requeryAll();
    refreshFilterSummary();
}

void Promise.allSettled(filterOptionLoads).then(() => {
    initFilterPanel(handleFilterControlChange);
    refreshStateFilters();
});

wireFilterGroup("filter-group-global", requeryAll);
wireFilterGroup("filter-group-module", requeryModules);
wireFilterGroup("filter-group-course", requeryCourses);
wireFilterGroup("filter-group-event", requeryEvents);
wireFilterGroup("filter-group-exam", requeryExams);
wireFilterGroup("filter-group-degree", requeryDegrees);
wireFilterGroup("filter-group-locations", requeryLocations);
