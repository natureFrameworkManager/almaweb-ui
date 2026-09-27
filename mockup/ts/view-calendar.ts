// ==========================================================================
// mockup/ts/view-calendar.ts — Kalender (Section 9.4, threshold rule Q8)
// ==========================================================================

import { store } from "./store";
import type { EntityType } from "./store";
import { MOCK_EVENTS, MOCK_EXAMS } from "./data";

/** Maximum number of events/exams rendered inside the calendar (Q8 / TBD-3). */
export const CALENDAR_MAX_ITEMS = 500;

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"] as const;
const DAY_DATES = ["12.10.", "13.10.", "14.10.", "15.10.", "16.10."];
const FIRST_HOUR = 8;
const LAST_HOUR = 18;
const TODAY_INDEX = 2;

/** Mockup-only counter so the Q8 threshold state is demonstrable. */
let filteredCount = 4812;

export function setCalendarFilteredCount(count: number): void {
    filteredCount = count;
}

export function renderCalendarView(container: HTMLElement, entity: EntityType): void {
    const { savedItems } = store.getState();
    const savedEventCount = MOCK_EVENTS.filter((e) => savedItems.has(e.courseId)).length;
    const tooMany = filteredCount > CALENDAR_MAX_ITEMS;

    // Saved items are always plotted, even above the threshold (Q8 point 4)
    if (tooMany && savedEventCount === 0) {
        container.innerHTML = blockedMarkup();
        bindBlockedActions(container, entity);
        return;
    }

    container.innerHTML = calendarMarkup(tooMany);
    bindCalendarInteractions(container);
}

function calendarMarkup(tooMany: boolean): string {
    let headers = `<div class="week-corner">Zeit</div>`;
    DAYS.forEach((day, index) => {
        const isToday = index === TODAY_INDEX;
        headers += `
            <div class="week-day${isToday ? " is-today" : ""}">
                <span>${day}${isToday ? " · heute" : ""}</span>
                <span class="week-day-date">${DAY_DATES[index]}</span>
            </div>`;
    });

    let background = "";
    for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
        const row = hour - FIRST_HOUR + 2;
        background += `<div class="week-time" style="grid-row:${row};">${String(hour).padStart(2, "0")}:00</div>`;
        DAYS.forEach((_day, dayIndex) => {
            const isToday = dayIndex === TODAY_INDEX;
            background += `<div class="week-cell${isToday ? " is-today" : ""}" style="grid-column:${dayIndex + 2};grid-row:${row};"></div>`;
        });
    }

    const { savedItems } = store.getState();
    let events = "";
    for (const event of MOCK_EVENTS) {
        const dayIndex = DAYS.indexOf(event.day);
        if (dayIndex < 0) continue;
        const row = event.startHour - FIRST_HOUR + 2;
        const isSaved = savedItems.has(event.courseId);
        const isConflict = event.id === "ev-3";
        events += `
            <button class="week-event is-event${isSaved ? " is-saved" : ""}${isConflict ? " is-conflict" : ""}"
                    style="grid-column:${dayIndex + 2};grid-row:${row} / span ${event.durationHours};"
                    data-event="${event.courseId}"
                    title="${event.title} · ${event.time} · ${event.room}">
                <span class="week-event-title">${isSaved ? "★ " : ""}${event.title}</span>
                <span class="week-event-meta">${event.time} · ${event.room}</span>
            </button>`;
    }

    return `
        <div class="week-wrap">
            <div class="week-toolbar">
                <div class="week-range">
                    KW 42 · 12.–16. Oktober 2026
                    <span class="week-range-sub">Europe/Berlin · WiSe 2025/26</span>
                </div>
                <div class="week-legend">
                    <span class="legend-item"><span class="legend-swatch" style="background: var(--color-type-course);"></span>Kurs</span>
                    <span class="legend-item"><span class="legend-swatch" style="background: var(--color-type-event);"></span>Veranstaltung</span>
                    <span class="legend-item"><span class="legend-swatch is-saved"></span>Meine Liste ★</span>
                    <span class="legend-item"><span class="legend-swatch is-conflict"></span>Konflikt</span>
                </div>
            </div>
            ${
                tooMany
                    ? `<div class="threshold-note">
                           <strong>${CALENDAR_MAX_ITEMS} von ${filteredCount.toLocaleString("de-DE")} Terminen</strong>
                           — Filter einschränken für mehr. Gemerkte Termine werden immer gezeigt.
                       </div>`
                    : ""
            }
            ${allDayStripMarkup()}
            <div class="week-scroll">
                <div class="week-grid">
                    ${headers}
                    ${background}
                    ${events}
                </div>
            </div>
        </div>`;
}

/** Exam dates without a time are plotted as all-day events (Section 9.4). */
function allDayStripMarkup(): string {
    if (MOCK_EXAMS.length === 0) return "";
    return `
        <div class="allday-strip">
            <span class="allday-label">Ganztägig</span>
            ${MOCK_EXAMS.slice(0, 2)
                .map(
                    (exam) => `
                <button class="allday-chip" data-exam="${exam.id}" title="${exam.name}">
                    ◈ ${exam.date} · ${exam.name} · Keine Zeitangabe
                </button>`,
                )
                .join("")}
        </div>`;
}

function blockedMarkup(): string {
    return `
        <div class="week-blocked">
            <div class="week-blocked-title">
                Zu viele Termine für den Kalender (${filteredCount.toLocaleString("de-DE")})
            </div>
            <p class="week-blocked-text">
                Die Kalenderansicht zeichnet höchstens ${CALENDAR_MAX_ITEMS} Termine gleichzeitig, damit sie schnell bleibt.
                Bitte die Filter einschränken — oder die Terminliste als iCal exportieren.
            </p>
            <div class="week-blocked-actions">
                <button class="btn btn-primary" id="btn-threshold-filter">Filter einschränken</button>
                <button class="btn btn-secondary" id="btn-threshold-ical">iCal herunterladen</button>
            </div>
        </div>`;
}

function bindBlockedActions(container: HTMLElement, entity: EntityType): void {
    container.querySelector("#btn-threshold-filter")?.addEventListener("click", () => {
        // Narrowing the filter drops the count below CALENDAR_MAX_ITEMS (Q8 point 3)
        filteredCount = 312;
        renderCalendarView(container, entity);
    });
    container.querySelector("#btn-threshold-ical")?.addEventListener("click", () => {
        store.setExportModalOpen(true);
    });
}

function bindCalendarInteractions(container: HTMLElement): void {
    container.querySelectorAll<HTMLElement>("[data-event]").forEach((el) => {
        el.addEventListener("click", () => {
            const courseId = el.getAttribute("data-event");
            if (courseId) store.setDetail(courseId, "course");
        });
    });
    container.querySelectorAll<HTMLElement>("[data-exam]").forEach((el) => {
        el.addEventListener("click", () => {
            const examId = el.getAttribute("data-exam");
            if (examId) store.setDetail(examId, "exam");
        });
    });
}
