import type { Staff } from "../api/types";
import type { EntityView } from "./entity-view";

/**
 * Convert a staff record into the shared entity view model.
 * @param staff - Staff record.
 * @returns Entity view data.
 */
export function staffToView(staff: Staff): EntityView {
    return {
        name: staff.name,
        number: null,
        listInfos: [],
        cardInfos: [],
        entityKind: "staff",
        entityId: staff.id,
    };
}
