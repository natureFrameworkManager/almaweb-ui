import type { Course } from "../api/types";
import type { EntityView, InfoSpec } from "./entity-view";

/**
 * Convert a course record into the shared entity view model.
 * @param course - Course record.
 * @returns Entity view data.
 */
export function courseToView(course: Course): EntityView {
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
