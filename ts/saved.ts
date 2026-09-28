/** Local storage key under which the saved data point keys are stored. */
const STORAGE_KEY = "almaweb.saved";

/**
 * Read the set of saved data point keys from local storage.
 * @returns The saved data point keys.
 */
function readSaved(): Set<string> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
    } catch (error) {
        console.error("Failed to read saved state:", error);
        return new Set<string>();
    }
}

/**
 * Persist the set of saved data point keys to local storage.
 * @param saved - Saved data point keys to store.
 */
function writeSaved(saved: Set<string>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]));
    } catch (error) {
        console.error("Failed to write saved state:", error);
    }
}

/**
 * Check whether a data point is currently saved.
 * @param key - Data point key.
 * @returns Whether the data point is saved.
 */
export function isSaved(key: string): boolean {
    return readSaved().has(key);
}

/**
 * Toggle the saved state of a data point.
 * @param key - Data point key.
 * @returns Whether the data point is saved after toggling.
 */
export function toggleSaved(key: string): boolean {
    const saved = readSaved();
    const nowSaved = !saved.has(key);
    if (nowSaved) {
        saved.add(key);
    } else {
        saved.delete(key);
    }
    writeSaved(saved);
    return nowSaved;
}
