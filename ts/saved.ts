import { getActiveSlot, parseSavedKey, updateState, type SaveSlotEntry } from "./state";

/**
 * Check whether two save slot entries refer to the same entity.
 * @param a - First entry.
 * @param b - Second entry.
 * @returns Whether both entries match.
 */
function matches(a: SaveSlotEntry, b: SaveSlotEntry): boolean {
    return a.kind === b.kind && a.ref === b.ref;
}

/**
 * Check whether a data point is saved in the active save slot.
 * @param key - Data point key such as `module:2011`.
 * @returns Whether the data point is saved.
 */
export function isSaved(key: string): boolean {
    const entry = parseSavedKey(key);
    if (entry === null) {
        return false;
    }
    const slot = getActiveSlot();
    return slot ? slot.entries.some((item) => matches(item, entry)) : false;
}

/** Outcome of toggling a data point in the active save slot. */
export type SaveToggleResult = "saved" | "removed" | "unavailable";

/**
 * Toggle the saved state of a data point inside the active save slot.
 *
 * Saving a data point adds it to the entries of the currently active save slot
 * instead of a flat list, so switching slots changes what is reported as saved.
 * @param key - Data point key such as `module:2011`.
 * @returns Whether the data point was saved, removed, or no slot was available.
 */
export function toggleSaved(key: string): SaveToggleResult {
    const entry = parseSavedKey(key);
    if (entry === null) {
        return "unavailable";
    }
    let result: SaveToggleResult = "unavailable";
    updateState((state) => {
        const slot = state.slots.items.find((item) => item.id === state.slots.active);
        if (!slot) {
            // No active slot: the caller reports this to the user.
            return;
        }
        const index = slot.entries.findIndex((item) => matches(item, entry));
        if (index >= 0) {
            slot.entries.splice(index, 1);
            result = "removed";
        } else {
            slot.entries.push(entry);
            result = "saved";
        }
    });
    return result;
}
