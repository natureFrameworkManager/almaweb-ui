import type { Module } from "../api/types";
import { normalizePath } from "../tree";
import { addInfoIfPresent, type EntityView, type InfoSpec } from "./entity-view";

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
export function moduleToView(module: Module): EntityView {
    return {
        name: module.name,
        number: module.number,
        listInfos: getModuleListInfos(module),
        cardInfos: getModuleCardInfos(module),
        detailsId: String(module.id),
    };
}
