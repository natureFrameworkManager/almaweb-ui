import type { Degree } from "../api/types";
import { addInfoIfPresent, type EntityView, type InfoSpec } from "./entity-view";

/**
 * Build the detailed information shown in the degree list.
 * @param degree - Degree record.
 * @returns Degree list information.
 */
function getDegreeListInfos(degree: Degree): InfoSpec[] {
    const infos: InfoSpec[] = [];
    addInfoIfPresent(infos, "degree-subject", degree.subject ?? "");
    addInfoIfPresent(infos, "degree-type", degree.degree ?? "");
    addInfoIfPresent(infos, "degree-school-type", degree.school_type ?? "");
    addInfoIfPresent(infos, "degree-ects", degree.ects ? `${degree.ects} LP` : "");
    addInfoIfPresent(infos, "degree-version", degree.version ?? "");
    return infos;
}

/**
 * Build the compact information shown in a degree card.
 * @param degree - Degree record.
 * @returns Degree card information.
 */
function getDegreeCardInfos(degree: Degree): InfoSpec[] {
    const infos: InfoSpec[] = [];
    addInfoIfPresent(infos, "degree-subject", degree.subject ?? "");
    addInfoIfPresent(infos, "degree-type", degree.degree ?? "");
    return infos;
}

/**
 * Convert a degree record into the shared entity view model.
 * @param degree - Degree record.
 * @returns Entity view data.
 */
export function degreeToView(degree: Degree): EntityView {
    return {
        name: degree.name,
        number: degree.degree || null,
        listInfos: getDegreeListInfos(degree),
        cardInfos: getDegreeCardInfos(degree),
        detailsId: String(degree.id),
        detailsKind: "degree",
    };
}
