import type { Event } from "../api/types";
import type { EntityView, InfoSpec } from "./entity-view";
import { formatDate, formatTimeRange } from "./formatters";

/**
 * Convert an event record into the shared entity view model.
 * @param event - Event record.
 * @returns Entity view data.
 */
export function eventToView(event: Event): EntityView {
    const staffNames = event.staff.map((staff) => staff.name).join(", ");
    const listInfos: InfoSpec[] = [
        { className: "event-date", text: formatDate(event.event_date) },
        { className: "event-time", text: formatTimeRange(event.start_time, event.end_time) },
        {
            className: "event-location",
            text: event.location
                ? `${event.location.name} (${event.location.building?.name ?? ""})`
                : "",
        },
    ];
    if (staffNames) {
        listInfos.push({ className: "event-staff", text: staffNames });
    }

    const cardInfos: InfoSpec[] = [
        { className: "event-date", text: formatDate(event.event_date) },
        { className: "event-time", text: formatTimeRange(event.start_time, event.end_time) },
        { className: "event-location", text: event.location?.name ?? "" },
    ];

    return {
        name: event.name || (event.courses !== undefined ? (event.courses.map((course) => `${course.type.name  }: ${  course.name}`).join(", ")) : false) || event.location?.name || "",
        number: `Termin ${event.number}`,
        listInfos,
        cardInfos,
        detailsId: String(event.id),
        detailsKind: "event",
        entityKind: "event",
        entityId: event.id,
    };
}
