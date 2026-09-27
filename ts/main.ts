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

import type { Module, Course, Event, Exam, Staff, Location } from "./api/types";
import { getCourses, getEvents, getExams, getModules, getStaff, getLocations } from "./api/api";

const THEME_STORAGE_KEY = "almaweb-theme";

type ThemeMode = "system" | "dark" | "light";

/**
 * Check whether a stored value is a supported theme mode.
 * @param value - Stored theme value.
 * @returns Whether the value is a supported theme mode.
 */
function isThemeMode(value: string | null): value is ThemeMode {
    return value === "system" || value === "dark" || value === "light";
}

/**
 * Apply the selected theme mode to the document.
 * @param theme - Theme mode to apply.
 */
function applyTheme(theme: ThemeMode) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Persist and apply a theme selected by the user.
 * @param theme - Theme mode selected by the user.
 */
function handleThemeChange(theme: string) {
    if (!isThemeMode(theme)) {
        return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
}

/** Initialize the theme selector from local storage. */
function initTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const theme = isThemeMode(storedTheme) ? storedTheme : "system";

    document.querySelectorAll("#dark-mode-toggle > *").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-mode") === theme);
    });
    handleThemeChange(theme);
}

/**
 * Create and render a FullCalendar instance for a pane.
 * @param elementId - Calendar element ID.
 * @returns The rendered calendar instance.
 * @throws {Error} If the calendar element does not exist.
 */
function initCal(elementId: string): Calendar {
    const calendarElement = document.querySelector(`#${elementId}`) as HTMLElement | null;
    if (!calendarElement) {
        throw new Error(`Calendar element with ID "${elementId}" not found.`);
    }

    const calendar = new Calendar(calendarElement, {
        height: "100%",
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
    calendar.render();
    return calendar;
}

type EntityView = {
    name: string;
    number: string | null;
    listInfos: InfoSpec[];
    cardInfos: InfoSpec[];
};

type InfoSpec = {
    className: string;
    text: string;
};

/**
 * Create an informational span for an entity view.
 * @param spec - Information span specification.
 * @returns The created information span.
 */
function createInfoSpan(spec: InfoSpec): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = `info ${spec.className}`;
    span.textContent = spec.text;
    return span;
}

/**
 * Append a heading with the requested level to an element.
 * @param parent - Parent element.
 * @param level - Heading level.
 * @param text - Heading text.
 */
function appendHeading(parent: HTMLElement, level: "h1" | "h2", text: string): void {
    const heading = document.createElement(level);
    heading.textContent = text;
    parent.appendChild(heading);
}

/**
 * Append a collection of informational spans to an element.
 * @param parent - Parent element.
 * @param infos - Information span specifications.
 */
function appendInfoContainer(parent: HTMLElement, infos: InfoSpec[]): void {
    const infoContainer = document.createElement("div");
    infoContainer.className = "info-container";
    infos.forEach((info) => infoContainer.appendChild(createInfoSpan(info)));
    parent.appendChild(infoContainer);
}

/**
 * Create a button using the shared application button classes.
 * @param className - Button class names.
 * @param text - Button text.
 * @returns The created button.
 */
function createActionButton(className: string, text: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = className;
    button.textContent = text;
    return button;
}

/**
 * Create the list representation of an entity.
 * @param view - Entity view data.
 * @returns The created list item.
 */
function createListItem(view: EntityView): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "list-item";
    appendHeading(item, "h1", view.name);
    if (view.number) {
        appendHeading(item, "h2", view.number);
    }
    appendInfoContainer(item, view.listInfos);
    item.appendChild(createActionButton("btn material-symbols", "save"));

    return item;
}

/**
 * Create the card representation of an entity.
 * @param view - Entity view data.
 * @returns The created card.
 */
function createCard(view: EntityView): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "card";
    appendHeading(card, "h1", view.name);
    if (view.number) {
        appendHeading(card, "h2", view.number);
    }
    appendInfoContainer(card, view.cardInfos);

    const btnCon = document.createElement("div");
    btnCon.className = "btn-con";
    btnCon.appendChild(createActionButton("btn", "Mehr Details"));
    btnCon.appendChild(createActionButton("btn material-symbols", "save"));
    card.appendChild(btnCon);

    return card;
}

// Renders items into every pane's list/card-grid for the given type (both list-card-view1 and list-card-view2)
/**
 * Render entity data into all matching list and card containers.
 * @param type - Entity type selector value.
 * @param items - Entity records to render.
 * @param toView - Entity-to-view converter.
 */
function renderEntities<T>(type: string, items: T[], toView: (item: T) => EntityView) {
    const views = items.map(toView);

    document.querySelectorAll(`.type-content[data-type="${type}"] > ul.list`).forEach((listEl) => {
        listEl.innerHTML = "";
        views.forEach((view) => listEl.appendChild(createListItem(view)));
    });
    document
        .querySelectorAll(`.type-content[data-type="${type}"] > div.card-grid`)
        .forEach((gridEl) => {
            gridEl.innerHTML = "";
            views.forEach((view) => gridEl.appendChild(createCard(view)));
        });
}

/**
 * Format an ISO date for the German interface.
 * @param date - ISO date value.
 * @returns The localized date string.
 */
function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("de-DE");
}

/**
 * Format a pair of time values for display.
 * @param start - Start time.
 * @param end - End time.
 * @returns The formatted time range.
 */
function formatTimeRange(start: string, end: string): string {
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

/**
 * Add an informational value when its text is not empty.
 * @param infos - Information list to update.
 * @param className - CSS class name.
 * @param text - Information text.
 */
function addInfoIfPresent(infos: InfoSpec[], className: string, text: string): void {
    if (text) {
        infos.push({ className, text });
    }
}

/**
 * Get normalized module path labels for display.
 * @param module - Module record.
 * @returns Normalized path labels.
 */
function getModulePathLabels(module: Module): string[] {
    return normalizePath(module.path, module.faculty.name).map((el) => el.join(" > "));
}

/**
 * Add optional course and exam metadata to module list information.
 * @param infos - Information list to update.
 * @param module - Module record.
 */
function addModuleListDetails(infos: InfoSpec[], module: Module): void {
    if (module.courses.length > 0) {
        addInfoIfPresent(
            infos,
            "module-course-types",
            [...new Set(module.courses.map((course) => course.type.name))].join(", "),
        );
    }
    if (module.exams.length > 0) {
        addInfoIfPresent(
            infos,
            "module-exam-types",
            [...new Set(module.exams.map((exam) => exam.name))].join(", "),
        );
    }
}

/**
 * Build the detailed information shown in the module list.
 * @param module - Module record.
 * @returns Module list information.
 */
function getModuleListInfos(module: Module): InfoSpec[] {
    const listInfos: InfoSpec[] = [
        { className: "module-credits", text: `${module.credits ? module.credits : "?"} LP` },
    ];
    addInfoIfPresent(
        listInfos,
        "module-duration",
        module.duration_semesters ? `${module.duration_semesters} Semester` : "",
    );
    addInfoIfPresent(listInfos, "module-frequency", module.frequency);
    addInfoIfPresent(listInfos, "module-language", module.language);
    listInfos.push({ className: "module-faculty", text: module.faculty.name });
    if (module.duration_semesters) {
        addInfoIfPresent(listInfos, "module-path", getModulePathLabels(module).join(" / "));
    }
    addModuleListDetails(listInfos, module);
    return listInfos;
}

/**
 * Build the compact information shown in a module card.
 * @param module - Module record.
 * @returns Module card information.
 */
function getModuleCardInfos(module: Module): InfoSpec[] {
    const cardInfos: InfoSpec[] = [
        { className: "module-credits", text: `${module.credits ? module.credits : "?"} LP` },
    ];
    addInfoIfPresent(
        cardInfos,
        "module-duration",
        module.duration_semesters ? `${module.duration_semesters} Semester` : "",
    );
    cardInfos.push({ className: "module-faculty", text: module.faculty.name });
    if (module.path.length > 0) {
        const pathLabels = getModulePathLabels(module).map(
            (path) => path.split(" > ").at(-1) ?? "",
        );
        addInfoIfPresent(cardInfos, "module-path", [...new Set(pathLabels)].join(" / "));
    }
    return cardInfos;
}

/**
 * Convert a module record into the shared entity view model.
 * @param module - Module record.
 * @returns Entity view data.
 */
function moduleToView(module: Module): EntityView {
    return {
        name: module.name,
        number: module.number,
        listInfos: getModuleListInfos(module),
        cardInfos: getModuleCardInfos(module),
    };
}

/**
 * Convert a course record into the shared entity view model.
 * @param course - Course record.
 * @returns Entity view data.
 */
function courseToView(course: Course): EntityView {
    const staffNames = course.staff.map((staff) => staff.name).join(", ");
    const baseInfos = (): InfoSpec[] => {
        const infos: InfoSpec[] = [{ className: "course-type", text: course.type.name }];
        if (course.weekday) {
            infos.push({ className: "course-weekday", text: course.weekday });
        }
        infos.push({ className: "course-weekly-hours", text: `${course.weekly_hours} SWS` });
        return infos;
    };

    const listInfos = baseInfos();
    if (course.language) {
        listInfos.push({ className: "course-language", text: course.language });
    }
    if (staffNames) {
        listInfos.push({ className: "course-staff", text: staffNames });
    }

    return {
        name: `${course.name} - ${course.type.name}`,
        number: course.number,
        listInfos,
        cardInfos: baseInfos(),
    };
}

/**
 * Convert an event record into the shared entity view model.
 * @param event - Event record.
 * @returns Entity view data.
 */
function eventToView(event: Event): EntityView {
    const staffNames = event.staff.map((staff) => staff.name).join(", ");
    const listInfos: InfoSpec[] = [
        { className: "event-date", text: formatDate(event.event_date) },
        { className: "event-time", text: formatTimeRange(event.start_time, event.end_time) },
        {
            className: "event-location",
            text: `${event.location.name} (${event.location.building.name})`,
        },
    ];
    if (staffNames) {
        listInfos.push({ className: "event-staff", text: staffNames });
    }

    const cardInfos: InfoSpec[] = [
        { className: "event-date", text: formatDate(event.event_date) },
        { className: "event-time", text: formatTimeRange(event.start_time, event.end_time) },
        { className: "event-location", text: event.location.name },
    ];

    return { name: event.name || event.location.name, number: event.number, listInfos, cardInfos };
}

/**
 * Convert an exam record into the shared entity view model.
 * @param exam - Exam record.
 * @returns Entity view data.
 */
function examToView(exam: Exam): EntityView {
    const staffNames = exam.staff.map((staff) => staff.name).join(", ");
    const baseInfos = (): InfoSpec[] => [
        {
            className: "exam-date",
            text: exam.exam_date ? formatDate(exam.exam_date) : "Kein Datum",
        },
        {
            className: "exam-time",
            text:
                exam.start_time && exam.end_time
                    ? formatTimeRange(exam.start_time, exam.end_time)
                    : "Kein Zeitangabe",
        },
        { className: "exam-required", text: exam.required ? "Erforderlich" : "Nicht erforderlich" },
    ];

    const listInfos = baseInfos();
    if (staffNames) {
        listInfos.push({ className: "exam-staff", text: staffNames });
    }

    return { name: exam.name, number: null, listInfos, cardInfos: baseInfos() };
}

/**
 * Convert a staff record into the shared entity view model.
 * @param staff - Staff record.
 * @returns Entity view data.
 */
function staffToView(staff: Staff): EntityView {
    return { name: staff.name, number: null, listInfos: [], cardInfos: [] };
}

/**
 * Build location information for list or card display.
 * @param location - Location record.
 * @param includeDetails - Whether to include detailed location information.
 * @returns Location information.
 */
function getLocationInfos(location: Location, includeDetails: boolean): InfoSpec[] {
    const infos: InfoSpec[] = [];
    addInfoIfPresent(infos, "location-type", location.type);
    addInfoIfPresent(infos, "location-seats", location.seats ? `${location.seats} Plätze` : "");
    if (includeDetails) {
        addInfoIfPresent(infos, "location-accessibility", location.accessibility);
        addInfoIfPresent(
            infos,
            "location-building",
            location.building.name
                ? `${location.building.name} - ${location.building.address}`
                : "",
        );
    }
    return infos;
}

/**
 * Convert a location record into the shared entity view model.
 * @param location - Location record.
 * @returns Entity view data.
 */
function locationToView(location: Location): EntityView {
    return {
        name: location.name,
        number: location.external_id,
        listInfos: getLocationInfos(location, true),
        cardInfos: getLocationInfos(location, false),
    };
}

/**
 * Create the breadcrumb-like list of opened tree levels.
 * @param openedLevels - Names of currently opened levels.
 * @returns The opened-levels container.
 */
function createOpenedLevels(openedLevels: string[]): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "opened-levels";
    openedLevels.forEach((level) => {
        const levelElement = document.createElement("div");
        levelElement.className = "opened-level";
        const title = document.createElement("span");
        title.textContent = level === "Root" ? "Wurzel" : level;
        levelElement.appendChild(title);
        levelElement.appendChild(createActionButton("btn slim material-symbols", "reply_all"));
        container.appendChild(levelElement);
    });
    return container;
}

/**
 * Create one expandable tree level element.
 * @param levelName - Tree level name.
 * @returns The tree level element.
 */
function createTreeLevel(levelName: string): HTMLDivElement {
    const levelElement = document.createElement("div");
    levelElement.className = "level";
    const title = document.createElement("span");
    title.textContent = levelName;
    levelElement.appendChild(title);
    levelElement.appendChild(
        createActionButton("btn slim material-symbols", "keyboard_double_arrow_right"),
    );
    return levelElement;
}

/**
 * Create the expandable level list for a tree node.
 * @param level - Tree node to render.
 * @returns The tree level container.
 */
function createTreeLevels(level: TreeNode): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "levels";
    Object.keys(level)
        .filter((key) => key !== "_modules")
        .map(createTreeLevel)
        .forEach((levelElement) => container.appendChild(levelElement));
    return container;
}

/**
 * Render module navigation data into a tree pane.
 * @param modules - Module records used to build the tree.
 * @param paneId - Tree pane identifier.
 */
function displayTree(modules: Module[], paneId: 1 | 2): void {
    const treeContainer = document.querySelector(`#tree${paneId}`) as HTMLElement | null;
    if (!treeContainer) {
        console.error("Tree view container is missing.");
        return;
    }
    const treeData = computeTreeData(modules);
    treeContainer.innerHTML = "";

    const openedLevels = ["Root", "SoSe 2025", "01 - Theologische Fakultät"];
    const level = getTreeLevel(treeData, openedLevels);
    treeContainer.appendChild(createOpenedLevels(openedLevels));
    treeContainer.appendChild(createTreeLevels(level));
}

/**
 * Remove redundant faculty and root segments from module paths.
 * @param path - Module path segments.
 * @param faculty - Faculty segment to normalize from.
 * @returns Normalized module paths.
 */
function normalizePath(path: string[][], faculty: string): string[][] {
    return path.map((el) => {
        if (el.find((segment) => segment === faculty)) {
            el = el.slice(el.indexOf(faculty));
        }
        if (el.find((segment) => segment === "Root")) {
            el = el.slice(el.indexOf("Root") + 1);
        }
        return el;
    });
}

/**
 * Resolve a path to a tree node, creating missing nodes as needed.
 * @param tree - Root tree node.
 * @param path - Path segments to resolve.
 * @returns The resolved tree node.
 */
function getTreeLevel(tree: TreeNode, path: string[]): TreeNode {
    return path.reduce<TreeNode>((currentLevel, segment) => {
        if (!currentLevel[segment]) {
            currentLevel[segment] = {};
        }
        return currentLevel[segment] as TreeNode;
    }, tree);
}

type TreeNode = {
    [key: string]: TreeNode | Module["id"][] | undefined;
    _modules?: Module["id"][];
};

/**
 * Build the navigation tree from module paths.
 * @param modules - Module records used to build the tree.
 * @returns The module navigation tree.
 */
function computeTreeData(modules: Module[]): TreeNode {
    const tree: TreeNode = {};
    modules.forEach((module) => {
        module.path.forEach((path) => {
            const lastNode = path.reduce<TreeNode>((currentLevel, segment) => {
                if (!currentLevel[segment]) {
                    currentLevel[segment] = {};
                }
                return currentLevel[segment] as TreeNode;
            }, tree);
            lastNode._modules = [...(lastNode._modules ?? []), module.id];
        });
    });
    return tree;
}

const activeMainViews: Record<1 | 2, string> = { 1: "list", 2: "list" };

// List/cards switching within a pane is handled purely by CSS reacting to the "active" class; here we
// only need to toggle which top-level main (list-card-view/calendar/tree) is visible per pane.
/**
 * Set the display state for a group of pane elements.
 * @param elements - Pane elements to update.
 * @param visible - Whether the elements should be visible.
 */
function setPaneViewVisibility(elements: HTMLElement[], visible: boolean): void {
    elements.forEach((element) => {
        element.style.display = visible ? "" : "none";
    });
}

/**
 * Check whether a pane is visible in the current layout mode.
 * @param paneId - Pane identifier.
 * @returns Whether the pane is visible.
 */
function isPaneVisible(paneId: 1 | 2): boolean {
    const viewMode = document.body.dataset.viewMode ?? "single";
    return paneId === 1 ? viewMode !== "compare" : viewMode === "split";
}

/**
 * Check whether a view is rendered by the list/card container.
 * @param view - View name.
 * @returns Whether the view uses the list/card container.
 */
function isListCardView(view: string): boolean {
    return view === "list" || view === "cards";
}

/**
 * Update the visibility of one named pane view.
 * @param element - Pane element to update.
 * @param paneIsVisible - Whether the pane is visible.
 * @param view - Current view name.
 * @param expectedView - View name represented by the element.
 */
function updatePaneView(
    element: HTMLElement,
    paneIsVisible: boolean,
    view: string,
    expectedView: string,
): void {
    setPaneViewVisibility([element], paneIsVisible && view === expectedView);
}

/**
 * Switch one pane between its list, calendar, and tree views.
 * @param paneId - Pane identifier.
 * @param view - View name to activate.
 */
function switchMainView(paneId: 1 | 2, view: string): void {
    const listCardView = document.querySelector(`#list-card-view${paneId}`) as HTMLElement | null;
    const calendarView = document.querySelector(`#calendar${paneId}`) as HTMLElement | null;
    const treeView = document.querySelector(`#tree${paneId}`) as HTMLElement | null;

    if (!listCardView || !calendarView || !treeView) {
        console.error("One or more view elements are missing.");
        return;
    }

    activeMainViews[paneId] = view;
    const paneIsVisible = isPaneVisible(paneId);

    setPaneViewVisibility([listCardView], paneIsVisible && isListCardView(view));
    updatePaneView(calendarView, paneIsVisible, view, "calendar");
    updatePaneView(treeView, paneIsVisible, view, "tree");
}

/**
 * Switch between single, split, and comparison layouts.
 * @param mode - Layout mode to activate.
 */
function switchViewMode(mode: "single" | "split" | "compare") {
    document.body.dataset.viewMode = mode;
    switchMainView(1, activeMainViews[1]);
    switchMainView(2, activeMainViews[2]);

    const compareView = document.querySelector("#compare") as HTMLElement | null;
    if (!compareView) {
        console.error("Compare view is missing.");
        return;
    }
    compareView.style.display = mode === "compare" ? "" : "none";
}

// Marks the clicked item as active (and its siblings as inactive) within a single switcher nav
/**
 * Connect a navigation switcher to an optional selection callback.
 * @param navSelector - Selector for the switcher navigation.
 * @param onSelect - Optional callback for the selected value.
 * @param dataAttribute - Attribute containing the selected value.
 */
function wireSwitcher(
    navSelector: string,
    onSelect?: (view: string) => void,
    dataAttribute = "data-view",
) {
    document.querySelectorAll(`${navSelector} > *`).forEach((item) => {
        item.addEventListener("click", () => {
            item.parentElement
                ?.querySelectorAll(":scope > *")
                .forEach((sibling) => sibling.classList.remove("active"));
            item.classList.add("active");
            onSelect?.(item.getAttribute(dataAttribute) ?? "");
        });
    });
}

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
getModules()
    .then((modules) => {
        renderEntities(
            "modules",
            modules.items.sort((a, b) => a.name.localeCompare(b.name)),
            moduleToView,
        );
        displayTree(modules.items, 1);
        displayTree(modules.items, 2);
    })
    .catch((error) => {
        console.error("Failed to fetch modules:", error);
    });

getCourses()
    .then((courses) => {
        renderEntities(
            "courses",
            courses.items.sort((a, b) => a.name.localeCompare(b.name)),
            courseToView,
        );
    })
    .catch((error) => {
        console.error("Failed to fetch courses:", error);
    });

getExams()
    .then((exams) => {
        renderEntities(
            "exams",
            exams.items.sort((a, b) => a.name.localeCompare(b.name)),
            examToView,
        );
    })
    .catch((error) => {
        console.error("Failed to fetch exams:", error);
    });

getEvents()
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
    });

getStaff()
    .then((staff) => {
        renderEntities(
            "staff",
            staff.items.sort((a, b) => a.name.localeCompare(b.name)),
            staffToView,
        );
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
