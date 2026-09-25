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

function displayTree(modules: Module[]) {
    const treeContainer = document.querySelector("main#tree") as HTMLElement;
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
    openedLevelsContainer.className = "opened-levels";
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
    levelsContainer.className = "levels";
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
switchView("list");

// initCal();
getModules().then(modules => {
    console.log(modules);
    displayModuleList(modules.items);
    displayModuleCards(modules.items);
    displayTree(modules.items);
}).catch(error => {
    console.error("Failed to fetch modules:", error);
});

