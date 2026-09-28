import type { Location } from "../api/types";
import { addInfoIfPresent, type EntityView, type InfoSpec } from "./entity-view";

/**
 * Build location information for list or card display.
 * @param location - Location record.
 * @param includeDetails - Whether to include detailed location information.
 * @returns Location information.
 */
function getLocationInfos(location: Location, includeDetails: boolean): InfoSpec[] {
    const infos: InfoSpec[] = [];
    addInfoIfPresent(infos, "location-type", location.type);
    addInfoIfPresent(infos, "location-seats", location.seats ? `${location.seats} Plätze` : "");
    if (includeDetails) {
        addInfoIfPresent(infos, "location-accessibility", location.accessibility);
        addInfoIfPresent(
            infos,
            "location-building",
            location.building.name
                ? `${location.building.name} - ${location.building.address}`
                : "",
        );
    }
    return infos;
}

/**
 * Convert a location record into the shared entity view model.
 * @param location - Location record.
 * @returns Entity view data.
 */
export function locationToView(location: Location): EntityView {
    return {
        name: location.name,
        number: location.external_id,
        listInfos: getLocationInfos(location, true),
        cardInfos: getLocationInfos(location, false),
        detailsId: String(location.id),
        detailsKind: "location",
    };
}
