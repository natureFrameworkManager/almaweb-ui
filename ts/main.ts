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

function createInfoSpan(spec: InfoSpec): HTMLSpanElement {
    const span = document.createElement("span");
    span.className = `info ${spec.className}`;
    span.textContent = spec.text;
    return span;
}

function createListItem(view: EntityView): HTMLLIElement {
    const item = document.createElement("li");
    item.className = "list-item";

    const name = document.createElement("h1");
    name.textContent = view.name;
    item.appendChild(name);
    if (view.number) {
        const number = document.createElement("h2");
        number.textContent = view.number;
        item.appendChild(number);
    }
    const infoContainer = document.createElement("div");
    infoContainer.className = "info-container";
    view.listInfos.forEach(info => infoContainer.appendChild(createInfoSpan(info)));
    item.appendChild(infoContainer);

    const saveButton = document.createElement("button");
    saveButton.className = "btn material-symbols";
    saveButton.textContent = "save";
    item.appendChild(saveButton);

    return item;
}

function createCard(view: EntityView): HTMLDivElement {
    const card = document.createElement("div");
    card.className = "card";

    const name = document.createElement("h1");
    name.textContent = view.name;
    card.appendChild(name);
    if (view.number) {
        const number = document.createElement("h2");
        number.textContent = view.number;
        card.appendChild(number);
    }
    const infoContainer = document.createElement("div");
    infoContainer.className = "info-container";
    view.cardInfos.forEach(info => infoContainer.appendChild(createInfoSpan(info)));
    card.appendChild(infoContainer);

    const btnCon = document.createElement("div");
    btnCon.className = "btn-con";
    const detailButton = document.createElement("button");
    detailButton.className = "btn";
    detailButton.textContent = "Mehr Details";
    btnCon.appendChild(detailButton);
    const saveButton = document.createElement("button");
    saveButton.className = "btn material-symbols";
    saveButton.textContent = "save";
    btnCon.appendChild(saveButton);
    card.appendChild(btnCon);

    return card;
}

// Renders items into every pane's list/card-grid for the given type (both list-card-view1 and list-card-view2)
function renderEntities<T>(type: string, items: T[], toView: (item: T) => EntityView) {
    const views = items.map(toView);

    document.querySelectorAll(`.type-content[data-type="${type}"] > ul.list`).forEach(listEl => {
        listEl.innerHTML = "";
        views.forEach(view => listEl.appendChild(createListItem(view)));
    });
    document.querySelectorAll(`.type-content[data-type="${type}"] > div.card-grid`).forEach(gridEl => {
        gridEl.innerHTML = "";
        views.forEach(view => gridEl.appendChild(createCard(view)));
    });
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("de-DE");
}

function formatTimeRange(start: string, end: string): string {
    return `${start.slice(0, 5)} - ${end.slice(0, 5)}`;
}

function moduleToView(module: Module): EntityView {
    const listInfos: InfoSpec[] = [{ className: "module-credits", text: `${module.credits ? module.credits : "?"} LP` }];
    if (module.duration_semesters) {
        listInfos.push({ className: "module-duration", text: `${module.duration_semesters} Semester` });
    }
    if (module.frequency) {
        listInfos.push({ className: "module-frequency", text: module.frequency });
    }
    if (module.language) {
        listInfos.push({ className: "module-language", text: module.language });
    }
    listInfos.push({ className: "module-faculty", text: module.faculty.name });
    if (module.path.length > 0) {
        listInfos.push({ className: "module-path", text: normalizePath(module.path, module.faculty.name).map(el => el.join(" > ")).join(" / ") });
    }
    if (module.courses.length > 0) {
        listInfos.push({ className: "module-course-types", text: [...new Set(module.courses.map(course => course.type.name))].join(", ") });
    }
    if (module.exams.length > 0) {
        listInfos.push({ className: "module-exam-types", text: [...new Set(module.exams.map(exam => exam.name))].join(", ") });
    }

    const cardInfos: InfoSpec[] = [{ className: "module-credits", text: `${module.credits ? module.credits : "?"} LP` }];
    if (module.duration_semesters) {
        cardInfos.push({ className: "module-duration", text: `${module.duration_semesters} Semester` });
    }
    cardInfos.push({ className: "module-faculty", text: module.faculty.name });
    if (module.path.length > 0) {
        cardInfos.push({ className: "module-path", text: [...new Set(normalizePath(module.path, module.faculty.name).map(el => el[el.length - 1]))].join(" / ") });
    }

    return { name: module.name, number: module.number, listInfos, cardInfos };
}

function courseToView(course: Course): EntityView {
    const staffNames = course.staff.map(staff => staff.name).join(", ");
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

    return { name: `${course.name} - ${course.type.name}`, number: course.number, listInfos, cardInfos: baseInfos() };
}

function eventToView(event: Event): EntityView {
    const staffNames = event.staff.map(staff => staff.name).join(", ");
    const listInfos: InfoSpec[] = [
        { className: "event-date", text: formatDate(event.event_date) },
        { className: "event-time", text: formatTimeRange(event.start_time, event.end_time) },
        { className: "event-location", text: `${event.location.name} (${event.location.building.name})` },
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

function examToView(exam: Exam): EntityView {
    const staffNames = exam.staff.map(staff => staff.name).join(", ");
    const baseInfos = (): InfoSpec[] => [
        { className: "exam-date", text: exam.exam_date ? formatDate(exam.exam_date) : "Kein Datum" },
        { className: "exam-time", text: exam.start_time && exam.end_time ? formatTimeRange(exam.start_time, exam.end_time) : "Kein Zeitangabe" },
        { className: "exam-required", text: exam.required ? "Erforderlich" : "Nicht erforderlich" },
    ];

    const listInfos = baseInfos();
    if (staffNames) {
        listInfos.push({ className: "exam-staff", text: staffNames });
    }

    return { name: exam.name, number: null, listInfos, cardInfos: baseInfos() };
}

function staffToView(staff: Staff): EntityView {
    return { name: staff.name, number: null, listInfos: [], cardInfos: [] };
}

function locationToView(location: Location): EntityView {
    const listInfos: InfoSpec[] = [
        location.type ? { className: "location-type", text: location.type } : null,
        location.seats ? { className: "location-seats", text: `${location.seats ?? "?"} Plätze` } : null,
        location.accessibility ? { className: "location-accessibility", text: location.accessibility } : null,
        location.building.name ? { className: "location-building", text: `${location.building.name} - ${location.building.address}` } : null,
    ].filter(info => info !== null);
    const cardInfos: InfoSpec[] = [
        location.type ? { className: "location-type", text: location.type } : null,
        location.seats ? { className: "location-seats", text: `${location.seats ?? "?"} Plätze` } : null,
    ].filter(info => info !== null);

    return { name: location.name, number: location.external_id, listInfos, cardInfos };
}

function displayTree(modules: Module[]) {
    const treeContainer = document.querySelector("main.tree") as HTMLElement;
    if (!treeContainer) {
        console.error("Tree view container is missing.");
        return;
    }
    const treeData = computeTreeData(modules);
    console.log(treeData);
    
    treeContainer.innerHTML = "";

    // show opened levels
    // Fallback:
    const openedLevels = ["Root", "SoSe 2025", "01 - Theologische Fakultät"];
    const level = getTreeLevel(treeData, openedLevels);

    const openedLevelsContainer = document.createElement("div");
    openedLevelsContainer.id = "opened-levels";
    openedLevels.forEach(level => {
        const levelElement = document.createElement("div");
        levelElement.className = "opened-level";
        const levelElementTitle = document.createElement("span");
        levelElementTitle.textContent = level === "Root" ? "Wurzel" : level;
        levelElement.appendChild(levelElementTitle);
        const levelButton = document.createElement("button");
        levelButton.className = "btn slim material-symbols";
        levelButton.textContent = "reply_all";
        levelElement.appendChild(levelButton);
        openedLevelsContainer.appendChild(levelElement);
    });
    treeContainer.appendChild(openedLevelsContainer);

    const levelsContainer = document.createElement("div");
    levelsContainer.id = "levels";
    // Display the current tree level based on the opened levels
    // Case 1: Object keys represent sub-levels in the tree
    // Case 2: Leaf nodes contain module IDs
    if (Object.keys(level).includes("_modules")) {
        const moduleIds = level._modules ?? [];
        console.log("Modules at this level:", moduleIds);
    } else {
        const subLevels = Object.keys(level).filter(key => key !== "_modules");
        const subLevelElements = subLevels.map(subLevel => {
            const subLevelElement = document.createElement("div");
            subLevelElement.className = "level";
            const subLevelTitle = document.createElement("span");
            subLevelTitle.textContent = subLevel;
            subLevelElement.appendChild(subLevelTitle);
            const subLevelButton = document.createElement("button");
            subLevelButton.className = "btn slim material-symbols";
            subLevelButton.textContent = "keyboard_double_arrow_right";
            subLevelElement.appendChild(subLevelButton);
            return subLevelElement;
        });
        subLevelElements.forEach(el => levelsContainer.appendChild(el));
    }
    treeContainer.appendChild(levelsContainer);
}

function normalizePath(path: string[][], faculty: string): string[][] {
    return path.map(el => {
        if (el.find(segment => segment === faculty)) {
            el = el.slice(el.indexOf(faculty));
        }
        if (el.find(segment => segment === "Root")) {
            el = el.slice(el.indexOf("Root") + 1);
        }
        return el;
    });
}

function getTreeLevel(tree: Record<string, TreeNode>, path: string[]): Record<string, TreeNode> {
    return path.reduce<Record<string, TreeNode>>((currentLevel, segment) => {
        if (!currentLevel[segment]) {
            currentLevel[segment] = {};
        }
        return currentLevel[segment] as TreeNode;
    }, tree);
}

type TreeNode = {
    [key: string]: TreeNode | Module["id"][];
    _modules?: Module["id"][];
};

function computeTreeData(modules: Module[]): Record<string, TreeNode> {
    const tree: Record<string, TreeNode> = {};
    modules.forEach(module => {
        module.path.forEach(path => {
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
function switchMainView(paneId: 1 | 2, view: string) {
    const listCardView = document.querySelector(`#list-card-view${paneId}`) as HTMLElement | null;
    const calendarView = document.querySelector(`#calendar${paneId}`) as HTMLElement | null;
    const treeView = document.querySelector(`#tree${paneId}`) as HTMLElement | null;

    if (!listCardView || !calendarView || !treeView) {
        console.error("One or more view elements are missing.");
        return;
    }

    activeMainViews[paneId] = view;
    const viewMode = document.body.dataset.viewMode ?? "single";
    const paneIsVisible = paneId === 1 ? viewMode !== "compare" : viewMode === "split";

    listCardView.style.display = paneIsVisible && (view === "list" || view === "cards") ? "" : "none";
    calendarView.style.display = paneIsVisible && view === "calendar" ? "" : "none";
    treeView.style.display = paneIsVisible && view === "tree" ? "" : "none";
}

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
function wireSwitcher(navSelector: string, onSelect?: (view: string) => void) {
    document.querySelectorAll(`${navSelector} > *`).forEach(item => {
        item.addEventListener("click", () => {
            item.parentElement?.querySelectorAll(":scope > *").forEach(sibling => sibling.classList.remove("active"));
            item.classList.add("active");
            onSelect?.(item.getAttribute("data-view") ?? "");
        });
    });
}

wireSwitcher("#display-changer1", view => switchMainView(1, view));
wireSwitcher("#display-changer2", view => switchMainView(2, view));
wireSwitcher("#view-switcher", view => {
    if (view === "single" || view === "split" || view === "compare") {
        switchViewMode(view);
    }
});
wireSwitcher("#type-switcher1");
wireSwitcher("#type-switcher2");
switchViewMode("single");
switchMainView(1, "list");
switchMainView(2, "list");

// initCal();
getModules().then(modules => {
    renderEntities("modules", modules.items.sort((a, b) => a.name.localeCompare(b.name)), moduleToView);
    displayTree(modules.items);
}).catch(error => {
    console.error("Failed to fetch modules:", error);
});

getCourses().then(courses => {
    renderEntities("courses", courses.items.sort((a, b) => a.name.localeCompare(b.name)), courseToView);
}).catch(error => {
    console.error("Failed to fetch courses:", error);
});

getExams().then(exams => {
    renderEntities("exams", exams.items.sort((a, b) => a.name.localeCompare(b.name)), examToView);
}).catch(error => {
    console.error("Failed to fetch exams:", error);
});

// getEvents().then(events => {
//     renderEntities("events", events.items.sort((a, b) => a.event_date.localeCompare(b.event_date)), eventToView);
// }).catch(error => {
//     console.error("Failed to fetch events:", error);
// });

getStaff().then(staff => {
    renderEntities("staff", staff.items.sort((a, b) => a.name.localeCompare(b.name)), staffToView);
}).catch(error => {
    console.error("Failed to fetch staff:", error);
});

getLocations().then(locations => {
    renderEntities("locations", locations.items.sort((a, b) => a.name.localeCompare(b.name)), locationToView);
}).catch(error => {
    console.error("Failed to fetch locations:", error);
});
