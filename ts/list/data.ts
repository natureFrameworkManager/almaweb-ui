import type { Module } from "../api/types.ts";
import { getModules } from "../api/api.ts";
import { displayList, type ListDataItem } from "./list-html.ts";

/**
 * Transform
 * @param module - The module to transform into a list item
 * @returns The transformed list item representing the module
 */
function transformModuleToListItem(module: Module): ListDataItem {
    return {
        id: module.id,
        type: "module",
        name: module.name,
        number: module.number,
        facultyName: module.faculty.name,
        credits: module.credits,
        durationSemester: module.duration_semesters,
        frequency: module.frequency,
        courses:
            module.courses.map((course) => ({
                id: 0,
                name: "",
                type: course.type.name,
                events: [],
            })) || [],
        exams: module.exams.map((exam) => ({ id: 0, name: "", type: exam.name })) || [],
    };
}

let pageNum: number = 1;
/**
 * Fetch the modules and display them in the list view
 * @param initial - Indicates whether this is the initial load of modules
 * @returns An object indicating whether the list should be expanded and if there is more data to load
 */
export async function loadModules(initial: boolean = false) {
    const newModules = await getModules({ page: pageNum++, pageSize: 100, sort: "name" });
    console.log(newModules);
    const transformedModules = newModules.items.map(transformModuleToListItem);
    displayList(transformedModules, "#module-list1", !initial);
    return { expanded: true, moreData: newModules.page < newModules.total_pages };
}
