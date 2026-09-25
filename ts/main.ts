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

import type { Module } from "./api/types";
import { getModules } from "./api/api";

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

function displayModuleList(modules: Module[]) {
    const moduleListElement = document.querySelector("#module-list") as HTMLElement | null;
    if (!moduleListElement) {
        throw new Error(`Module list element with ID "module-list" not found.`);
    }

    moduleListElement.innerHTML = "";
    modules.sort((a, b) => a.name.localeCompare(b.name));
    modules.forEach(module => {
        const moduleItem = document.createElement("li");

        const moduleName = document.createElement("h1");
        moduleName.textContent = module.name;
        moduleItem.appendChild(moduleName);
        const moduleNumber = document.createElement("h2");
        moduleNumber.textContent = module.number;
        moduleItem.appendChild(moduleNumber);
        const moduleInfo1 = document.createElement("div");
        moduleInfo1.className = "module-info-container";
        const moduleCredits = document.createElement("span");
        moduleCredits.className = "module-info module-credits";
        moduleCredits.textContent = `${module.credits ? module.credits : "?"} LP`;
        moduleInfo1.appendChild(moduleCredits);
        if (module.duration_semesters) {
            const moduleDuration = document.createElement("span");
            moduleDuration.className = "module-info module-duration";
            moduleDuration.textContent = `${module.duration_semesters} Semester`;
            moduleInfo1.appendChild(moduleDuration);
        }
        if (module.frequency) {
            const moduleFrequency = document.createElement("span");
            moduleFrequency.className = "module-info module-frequency";
            moduleFrequency.textContent = module.frequency;
            moduleInfo1.appendChild(moduleFrequency);
        }
        if (module.language) {
            const moduleLanguage = document.createElement("span");
            moduleLanguage.className = "module-info module-language";
            moduleLanguage.textContent = module.language;
            moduleInfo1.appendChild(moduleLanguage);
        }
        if (module.courses.length > 0) {
            const moduleCourseTypes = document.createElement("span");
            moduleCourseTypes.className = "module-info module-course-types";
            moduleCourseTypes.textContent = [...new Set(module.courses.map(course => course.type.name))].join(", ");
            moduleInfo1.appendChild(moduleCourseTypes);
        }
        moduleItem.appendChild(moduleInfo1);
        
        const moduleInfo2 = document.createElement("div");
        moduleInfo2.className = "module-info-container";
        const moduleFaculty = document.createElement("span");
        moduleFaculty.className = "module-info module-faculty";
        moduleFaculty.textContent = String(module.faculty.name);
        moduleInfo2.appendChild(moduleFaculty);
        if (module.path.length > 0) {
            const modulePath = document.createElement("span");
            modulePath.className = "module-info module-path";
            modulePath.textContent = normalizePath(module.path, module.faculty.name).map(el => el.join(" > ")).join(" / ");
            moduleInfo2.appendChild(modulePath);
        }
        if (module.exams.length > 0) {
            const moduleExamTypes = document.createElement("span");
            moduleExamTypes.className = "module-info module-exam-types";
            moduleExamTypes.textContent = [...new Set(module.exams)].map(exam => exam.name).join(", ");
            moduleInfo2.appendChild(moduleExamTypes);
        }
        moduleItem.appendChild(moduleInfo2);
        
        const saveButton = document.createElement("button");
        saveButton.className = "btn material-symbols";
        saveButton.textContent = "save";
        moduleItem.appendChild(saveButton);

        moduleListElement.appendChild(moduleItem);
    });
}

function displayModuleCards(modules: Module[]) {
    const moduleListElement = document.querySelector("#module-card-grid") as HTMLElement | null;
    if (!moduleListElement) {
        throw new Error(`Module list element with ID "module-card-grid" not found.`);
    }

    moduleListElement.innerHTML = "";
    modules.sort((a, b) => a.name.localeCompare(b.name));
    modules.forEach(module => {
        const moduleItem = document.createElement("div");
        moduleItem.className = "card";

        const moduleName = document.createElement("h1");
        moduleName.textContent = module.name;
        moduleItem.appendChild(moduleName);
        const moduleNumber = document.createElement("h2");
        moduleNumber.textContent = module.number;
        moduleItem.appendChild(moduleNumber);
        const moduleCredits = document.createElement("span");
        moduleCredits.className = "module-info module-credits";
        moduleCredits.textContent = `${module.credits ? module.credits : "?"} LP`;
        moduleItem.appendChild(moduleCredits);
        if (module.duration_semesters) {
            const moduleDuration = document.createElement("span");
            moduleDuration.className = "module-info module-duration";
            moduleDuration.textContent = `${module.duration_semesters} Semester`;
            moduleItem.appendChild(moduleDuration);
        }
        const moduleFaculty = document.createElement("span");
        moduleFaculty.className = "module-info module-faculty";
        moduleFaculty.textContent = String(module.faculty.name);
        moduleItem.appendChild(moduleFaculty);
        if (module.path.length > 0) {
            const modulePath = document.createElement("span");
            modulePath.className = "module-info module-path";
            modulePath.textContent = [...new Set(normalizePath(module.path, module.faculty.name).map(el => el[el.length - 1]))].join(" / ");
            moduleItem.appendChild(modulePath);
        }

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "module-btn-con";
        const detailButton = document.createElement("button");
        detailButton.className = "btn";
        detailButton.textContent = "Mehr Details";
        buttonContainer.appendChild(detailButton);
        const saveButton = document.createElement("button");
        saveButton.className = "btn material-symbols";
        saveButton.textContent = "save";
        buttonContainer.appendChild(saveButton);
        moduleItem.appendChild(buttonContainer);

        moduleListElement.appendChild(moduleItem);
    });
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

function switchView(view: "list" | "cards" | "calendar" | "tree") {
    const listView = document.querySelector("ul#module-list") as HTMLUListElement;
    const cardView = document.querySelector("div#module-card-grid") as HTMLDivElement;
    const calendarView = document.querySelector("main#calendar") as HTMLElement;
    const treeView = document.querySelector("main#tree") as HTMLElement;

    if (!listView || !cardView || !calendarView || !treeView) {
        console.error("One or more view elements are missing.");
        return;
    }

    listView.style.display = view === "list" ? "" : "none";
    cardView.style.display = view === "cards" ? "" : "none";
    calendarView.style.display = view === "calendar" ? "" : "none";
    treeView.style.display = view === "tree" ? "" : "none";

    const mainContainer = document.querySelector("main:not(#calendar):not(#tree)") as HTMLElement;
    if (view !== "list" && view !== "cards" && mainContainer) {
        mainContainer.style.display = "none";
    } else if (mainContainer) {
        mainContainer.style.display = "";
    }
}

document.querySelectorAll("body > header > nav.display-changer1 item").forEach(item => {
    item.addEventListener("click", () => {
        const view = item.getAttribute("data-view") as "list" | "cards" | "calendar" | "tree";
        item.parentElement?.querySelectorAll("item").forEach(sibling => sibling.classList.remove("active"));
        item.classList.add("active");
        switchView(view);
    });
});

// initCal();
getModules().then(modules => {
    console.log(modules);
    displayModuleList(modules.items);
    displayModuleCards(modules.items);
}).catch(error => {
    console.error("Failed to fetch modules:", error);
});

