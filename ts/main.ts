import "../css/main.css";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

import "./theme.ts";
import { attachViewChanger, attachDatatypeChanger, attachViewModeSwitcher } from "./layout.ts";

import "./state/data.ts";
import "./state/save.ts";

import "./filter/data.ts";
import "./filter/prefill-html.ts";
import "./filter/event-handler.ts";

import "./list/data.ts";
import { displayList, type ListDataItem } from "./list/list-html.ts";
import "./list/card-html.ts";

import "./calendar/compute.ts";
import "./calendar/render.ts";

import "./tree/compute.ts";
import "./tree/tree-html.ts";

import "./detail/dialog.ts";

import "./export/ical.ts";
import "./export/print.ts";
import "./export/share.ts";

// Layout changes
attachViewChanger();
attachDatatypeChanger();
attachViewModeSwitcher();

/**
 * Computes the scroll progress of an element.
 * If the element has no scrollable content, it is considered fully scrolled (returns 1).
 * @param element - The HTML element to compute scroll progress for.
 * @returns A floating-point number between 0 and 1 representing the scroll progress.
 */
function getElementScrollProgress(element: HTMLElement): number {
    // If there is no scrollable content, consider it fully scrolled
    if (element.scrollHeight <= element.clientHeight) {
        return 1;
    }
    // Compute scroll progress for scrollable content
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    return scrollHeight > 0 ? scrollTop / scrollHeight : 0;
}

document.querySelector("#module-list1")?.addEventListener("scroll", (event) => {
    const element = event.target as HTMLElement;
    const progress = getElementScrollProgress(element);
    console.log("Scroll progress:", progress);
});

console.log(`Baseline progress: ${getElementScrollProgress(document.querySelector("#module-list1") as HTMLElement)}`);

const sampleData: ListDataItem[] = [
    {
        id: 1,
        type: "module",
        name: "Sample Module",
        number: "12345",
        facultyName: "Sample Faculty",
        credits: 6,
        durationSemester: 2,
        frequency: "SoSe",
        courses: [
            {
                id: 1,
                name: "Sample Course",
                type: "Seminar",
                events: [
                    {
                        id: 1,
                        day: "Mo",
                        startTime: "10:00",
                        endTime: "12:00",
                        location: "Room 101",
                        instructor: "Dr. Max Mustermann",
                        daterange: "01.04.2024-30.06.2024"
                    },
                    {
                        id: 2,
                        day: "Mi",
                        startTime: "14:00",
                        endTime: "16:00",
                        location: "Room 102",
                        instructor: "Dr. Max Mustermann",
                        daterange: "01.04.2024-30.06.2024"
                    },
                    {
                        id: 3,
                        day: "Fr",
                        startTime: "08:00",
                        endTime: "10:00",
                        location: "Room 103",
                        instructor: "Dr. Max Mustermann",
                        daterange: "01.04.2024-30.06.2024"
                    },
                    {
                        id: 4,
                        day: "Tu",
                        startTime: "10:00",
                        endTime: "12:00",
                        location: "Room 104",
                        instructor: "Dr. Max Mustermann",
                        daterange: "01.04.2024-30.06.2024"
                    }
                ]
            },
            {
                id: 2,
                name: "Another Sample Course",
                type: "Lecture",
                events: [
                    {
                        id: 5,
                        day: "We",
                        startTime: "09:00",
                        endTime: "11:00",
                        location: "Room 105",
                        instructor: "Dr. Max Mustermann",
                        daterange: "01.04.2024-30.06.2024"
                    }
                ]
            }
        ],
        exams: [
            {
                id: 1,
                type: "Mündliche Prüfung (20 Min)"
            }
        ]
    }
];
displayList(sampleData, "#module-list1");