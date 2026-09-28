import type { Exam } from "../api/types";
import type { EntityView, InfoSpec } from "./entity-view";
import { formatDate, formatTimeRange } from "./formatters";

/**
 * Convert an exam record into the shared entity view model.
 * @param exam - Exam record.
 * @returns Entity view data.
 */
export function examToView(exam: Exam): EntityView {
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

    return {
        name: exam.name,
        number: null,
        listInfos,
        cardInfos: baseInfos(),
        detailsId: String(exam.id),
        detailsKind: "exam",
        entityKind: "exam",
        entityId: exam.id,
    };
}
