/**
 * Central UI state layer.
 *
 * Every user-facing setting is kept in a single {@link UIState} document that can
 * be persisted to local storage and encoded into the URL to build a share link.
 * The shape mirrors `datasave.json` in the project root.
 */

/** Version of the share-link state document. */
export const STATE_VERSION = 1;

/** Local storage key holding the complete serialised UI state. */
const STATE_STORAGE_KEY = "almaweb.state";

/** Legacy local storage key holding the flat set of saved data point keys. */
const LEGACY_SAVED_KEY = "almaweb.saved";

/** Legacy local storage key holding the selected theme. */
const LEGACY_THEME_KEY = "almaweb-theme";

/** Query parameter holding the base64url encoded state. */
const QUERY_STATE_PARAM = "d";

/** Query parameter holding the state document version. */
const QUERY_VERSION_PARAM = "v";

/** Identifier of the save slot selected by default. */
export const DEFAULT_SLOT_ID = "slot-1";

/** Default number of credit points a save slot targets. */
const DEFAULT_TOTAL_LP = 30;

/** The three-state value used by tri-state filters such as "Prüfung erforderlich". */
export type TriState = "neutral" | "selected" | "hidden";

/** Selectable theme modes. */
export type ThemeMode = "system" | "dark" | "light";

/** Selectable interface languages. */
export type Language = "de" | "en";

/** Top level layout modes. */
export type ViewMode = "single" | "split" | "compare";

/** Identifier of a layout pane. */
export type PaneId = 1 | 2;

/** Main views a pane can show. */
export type MainView = "list" | "cards" | "calendar" | "tree";

/** Entity types switchable inside a pane. */
export type EntityType = "modules" | "courses" | "events" | "exams" | "staff" | "locations";

/** Views offered by the FullCalendar instance. */
export type CalendarView =
    "listWeek" | "listMonth" | "dayGridMonth" | "timeGridWeek" | "timeGridDay";

/** Colour mapping strategies for calendar events. */
export type CalendarColorMode = "type" | "module" | "course" | "staff" | "location";

/** Kinds of entities that can be stored in a save slot. */
export type EntryKind = "module" | "course" | "event" | "exam";

/** An inclusive filter range; an empty string means "no bound". */
export type Range = { min: string; max: string };

/** Filters applied across every entity type. */
export type GlobalFilters = { semester: number[] };

/** Filters applied to modules. */
export type ModuleFilters = {
    name: string;
    number: string;
    faculty: number[];
    responsiblePerson: string;
    credits: Range;
    duration: Range;
    languages: string[];
};

/** Filters applied to courses. */
export type CourseFilters = {
    name: string;
    number: string;
    types: number[];
    instructors: number[];
    weeklyHours: Range;
};

/** Filters applied to events. */
export type EventFilters = {
    startTime: Range;
    endTime: Range;
    dates: Range;
    buildings: string;
};

/** Filters applied to exams. */
export type ExamFilters = {
    types: string[];
    startTime: Range;
    endTime: Range;
    dates: Range;
    buildings: number[];
    required: TriState;
    staff: number[];
};

/** The complete filter section of the state document. */
export type Filters = {
    global: GlobalFilters;
    module: ModuleFilters;
    course: CourseFilters;
    event: EventFilters;
    exam: ExamFilters;
};

/** View and display settings of a single pane. */
export type PaneSettings = {
    mainView: MainView;
    type: EntityType;
    sort: string[];
};

/** View and display settings of the whole layout. */
export type Display = {
    viewMode: ViewMode;
    panes: Record<PaneId, PaneSettings>;
};

/** Calendar specific display settings. */
export type Calendar = {
    view: CalendarView;
    colorMode: CalendarColorMode;
    customMap: Record<string, string>;
    pinnedEvents: number[];
};

/** A single saved data point inside a save slot. */
export type SaveSlotEntry = {
    kind: EntryKind;
    ref: number;
};

/** A required module of a save slot together with its progress. */
export type RequirementModule = {
    ref: number;
    lp: number;
    done: boolean;
};

/** Progress information of the required modules of a save slot. */
export type SaveSlotRequirements = {
    totalLp: number;
    modules: RequirementModule[];
};

/** A named save slot holding saved data points and required modules. */
export type SaveSlot = {
    id: string;
    name: string;
    entries: SaveSlotEntry[];
    requirements: SaveSlotRequirements;
};

/** The save slot section of the state document. */
export type Slots = {
    active: string;
    items: SaveSlot[];
};

/** The complete, JSON serialisable UI state document. */
export type UIState = {
    theme: ThemeMode;
    language: Language;
    display: Display;
    calendar: Calendar;
    filters: Filters;
    slots: Slots;
};

/** Entity kinds that are valid in a saved data point key. */
const ENTRY_KINDS: EntryKind[] = ["module", "course", "event", "exam"];

/**
 * Create an empty filter range.
 * @returns A range without any bound.
 */
function emptyRange(): Range {
    return { min: "", max: "" };
}

/**
 * Create an empty save slot.
 * @param id - Slot identifier.
 * @param name - Human readable slot name.
 * @returns The created save slot.
 */
function createSlot(id: string, name: string): SaveSlot {
    return { id, name, entries: [], requirements: { totalLp: DEFAULT_TOTAL_LP, modules: [] } };
}

/**
 * Create a fresh state document populated with every default setting.
 * @returns The default UI state.
 */
export function defaultState(): UIState {
    return {
        theme: "system",
        language: "de",
        display: {
            viewMode: "single",
            panes: {
                1: { mainView: "list", type: "modules", sort: [] },
                2: { mainView: "list", type: "modules", sort: [] },
            },
        },
        calendar: {
            view: "listMonth",
            colorMode: "type",
            customMap: {},
            pinnedEvents: [],
        },
        filters: {
            global: { semester: [] },
            module: {
                name: "",
                number: "",
                faculty: [],
                responsiblePerson: "",
                credits: emptyRange(),
                duration: emptyRange(),
                languages: [],
            },
            course: {
                name: "",
                number: "",
                types: [],
                instructors: [],
                weeklyHours: emptyRange(),
            },
            event: {
                startTime: emptyRange(),
                endTime: emptyRange(),
                dates: emptyRange(),
                buildings: "",
            },
            exam: {
                types: [],
                startTime: emptyRange(),
                endTime: emptyRange(),
                dates: emptyRange(),
                buildings: [],
                required: "neutral",
                staff: [],
            },
        },
        slots: {
            active: DEFAULT_SLOT_ID,
            items: [
                createSlot(DEFAULT_SLOT_ID, "Mein Studienplan"),
                createSlot("slot-2", "Save-Slot 2"),
                createSlot("slot-3", "Save-Slot 3"),
            ],
        },
    };
}

/**
 * Check whether a stored value is a supported theme mode.
 * @param value - Stored theme value.
 * @returns Whether the value is a supported theme mode.
 */
function isThemeMode(value: string | null): value is ThemeMode {
    return value === "system" || value === "dark" || value === "light";
}

/**
 * Merge a partial state into a base state, keeping base values for missing keys.
 *
 * Objects are merged recursively, arrays are replaced as a whole and primitives
 * from the override win whenever they are defined.
 * @param base - Complete state providing the defaults.
 * @param override - Partial state that wins where it is defined.
 * @returns The merged state.
 */
function mergeState<T>(base: T, override: unknown): T {
    if (Array.isArray(base)) {
        return (Array.isArray(override) ? override : base) as T;
    }
    if (base !== null && typeof base === "object") {
        const baseRecord = base as Record<string, unknown>;
        const source =
            override !== null && typeof override === "object"
                ? (override as Record<string, unknown>)
                : {};
        const keys = new Set([...Object.keys(baseRecord), ...Object.keys(source)]);
        const merged = Array.from(keys).reduce<Record<string, unknown>>((accumulator, key) => {
            accumulator[key] = mergeState(baseRecord[key], source[key]);
            return accumulator;
        }, {});
        return merged as T;
    }
    return (override === undefined ? base : override) as T;
}

/**
 * Parse a saved data point key such as `module:2011` into a save slot entry.
 * @param key - Saved data point key.
 * @returns The parsed entry, or null when the key is malformed.
 */
export function parseSavedKey(key: string): SaveSlotEntry | null {
    const [rawKind, rawRef] = key.split(":");
    const ref = Number(rawRef);
    if (!ENTRY_KINDS.includes(rawKind as EntryKind) || !Number.isFinite(ref)) {
        return null;
    }
    return { kind: rawKind as EntryKind, ref };
}

/**
 * Check whether a save slot already contains an entry.
 * @param slot - Save slot to inspect.
 * @param entry - Entry to look for.
 * @returns Whether the entry is present.
 */
export function hasEntry(slot: SaveSlot, entry: SaveSlotEntry): boolean {
    return slot.entries.some((item) => item.kind === entry.kind && item.ref === entry.ref);
}

/**
 * Read the parsed state document from local storage.
 * @returns The parsed document, or null when nothing valid is stored.
 */
function readStoredState(): unknown | null {
    try {
        const raw = localStorage.getItem(STATE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Failed to read UI state:", error);
        return null;
    }
}

/**
 * Read the legacy flat list of saved data point keys.
 * @returns The legacy saved data point keys.
 */
function readLegacySavedKeys(): string[] {
    try {
        const raw = localStorage.getItem(LEGACY_SAVED_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch (error) {
        console.error("Failed to read legacy saved state:", error);
        return [];
    }
}

/**
 * Build the partial state that migrates the legacy local storage keys.
 *
 * Saved data points used to live in a flat set under `almaweb.saved`; they are
 * moved into the entries of the active save slot. The legacy keys are left in
 * place so no data is destroyed during the migration.
 * @returns The migrated partial state.
 */
function migrateLegacy(): Partial<UIState> {
    const legacy: Partial<UIState> = {};
    const theme = localStorage.getItem(LEGACY_THEME_KEY);
    if (isThemeMode(theme)) {
        legacy.theme = theme;
    }
    const entries = readLegacySavedKeys()
        .map(parseSavedKey)
        .filter((entry): entry is SaveSlotEntry => entry !== null);
    if (entries.length > 0) {
        legacy.slots = {
            active: DEFAULT_SLOT_ID,
            items: [
                {
                    id: DEFAULT_SLOT_ID,
                    name: "Mein Studienplan",
                    entries,
                    requirements: { totalLp: DEFAULT_TOTAL_LP, modules: [] },
                },
                createSlot("slot-2", "Save-Slot 2"),
                createSlot("slot-3", "Save-Slot 3"),
            ],
        };
    }
    return legacy;
}

/**
 * Load the UI state from local storage, migrating legacy keys on first run.
 * @returns The loaded UI state.
 */
export function loadState(): UIState {
    const defaults = defaultState();
    const stored = readStoredState();
    if (stored === null) {
        return mergeState(defaults, migrateLegacy());
    }
    // TODO: run version migrations here once STATE_VERSION is bumped.
    return mergeState(defaults, stored);
}

/**
 * Persist a UI state document to local storage.
 * @param state - State to store.
 */
export function saveState(state: UIState): void {
    try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Failed to write UI state:", error);
    }
}

/** In-memory state document shared across the application. */
let currentState: UIState | null = null;

/**
 * Return the shared state document, loading it lazily on first access.
 * @returns The current UI state.
 */
export function getState(): UIState {
    if (currentState === null) {
        currentState = loadState();
    }
    return currentState;
}

/**
 * Replace the shared state document and persist it.
 * @param next - State document to activate.
 * @returns The activated state.
 */
export function setState(next: UIState): UIState {
    currentState = next;
    saveState(next);
    return next;
}

/**
 * Mutate the shared state document and persist the result.
 * @param mutator - Callback that receives the state to modify.
 * @returns The updated state.
 */
export function updateState(mutator: (state: UIState) => void): UIState {
    const state = getState();
    mutator(state);
    saveState(state);
    return state;
}

/**
 * Return the save slot currently selected in the state.
 * @param state - State to inspect, defaulting to the shared state.
 * @returns The active save slot, or undefined when the id is unknown.
 */
export function getActiveSlot(state: UIState = getState()): SaveSlot | undefined {
    return state.slots.items.find((slot) => slot.id === state.slots.active);
}

/**
 * Encode a UTF-8 string as base64url.
 * @param value - Text to encode.
 * @returns The base64url encoded value.
 */
function encodeBase64Url(value: string): string {
    const bytes = new TextEncoder().encode(value);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode a base64url value back into a UTF-8 string.
 * @param value - Base64url encoded value.
 * @returns The decoded text.
 */
function decodeBase64Url(value: string): string {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

/**
 * Drop every value that equals its default so share links stay short.
 * @param state - Value to prune.
 * @param defaults - Matching default value.
 * @returns The pruned value, or undefined when it matches the default.
 */
function pruneDefaults(state: unknown, defaults: unknown): unknown {
    if (Array.isArray(state)) {
        return state.length > 0 ? state : undefined;
    }
    if (state !== null && typeof state === "object") {
        const record = state as Record<string, unknown>;
        const defaultRecord =
            defaults !== null && typeof defaults === "object"
                ? (defaults as Record<string, unknown>)
                : {};
        const pruned = Object.entries(record).reduce<Record<string, unknown>>(
            (accumulator, [key, value]) => {
                const kept = pruneDefaults(value, defaultRecord[key]);
                if (kept !== undefined) {
                    accumulator[key] = kept;
                }
                return accumulator;
            },
            {},
        );
        return Object.keys(pruned).length > 0 ? pruned : undefined;
    }
    return state === defaults ? undefined : state;
}

/**
 * Encode the state into a share link.
 * @param state - State to encode, defaulting to the shared state.
 * @param base - Base URL to extend, defaulting to the current location.
 * @returns The share link containing the encoded state.
 */
export function writeStateToQuery(state: UIState = getState(), base?: string): string {
    const pruned = pruneDefaults(state, defaultState()) ?? {};
    const url = new URL(base ?? "", globalThis.location?.href ?? "http://localhost/");
    url.searchParams.set(QUERY_VERSION_PARAM, String(STATE_VERSION));
    url.searchParams.set(QUERY_STATE_PARAM, encodeBase64Url(JSON.stringify(pruned)));
    return url.toString();
}

/**
 * Decode a state document from a query string.
 * @param search - Query string to read, defaulting to the current location.
 * @returns The decoded partial state, or null when the query has no state.
 */
export function readStateFromQuery(search?: string): Partial<UIState> | null {
    const params = new URLSearchParams(search ?? globalThis.location?.search ?? "");
    const raw = params.get(QUERY_STATE_PARAM);
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(decodeBase64Url(raw)) as Partial<UIState>;
    } catch (error) {
        console.error("Failed to decode shared UI state:", error);
        return null;
    }
}

/**
 * Merge a shared state from the query string into the current state.
 * @param search - Query string to read, defaulting to the current location.
 * @returns Whether a shared state was found and applied.
 */
export function applyShareState(search?: string): boolean {
    const partial = readStateFromQuery(search);
    if (partial === null) {
        return false;
    }
    setState(mergeState(defaultState(), partial));
    return true;
}

/**
 * Apply the layout, pane and calendar display settings to the live UI.
 * @param state - State to read from.
 */
export function applyDisplayState(state: UIState): void {
    void state;
    // TODO: switchViewMode(state.display.viewMode);
    // TODO: per pane: switchMainView(paneId, state.display.panes[paneId].mainView) and
    //       setActiveType(paneId, state.display.panes[paneId].type).
    // TODO: apply state.calendar.view, colorMode and customMap to the FullCalendar instances.
}

/**
 * Hydrate the filter DOM controls from the state.
 * @param state - State to read from.
 */
export function applyFilterState(state: UIState): void {
    void state;
    // TODO: write state.filters back into #search-input-*, #filter-*, and the
    //       labelled range inputs, then trigger the existing debounced re-query.
}

/**
 * Hydrate the save-slot selector and dialog from the state.
 * @param state - State to read from.
 */
export function applySlotState(state: UIState): void {
    void state;
    // TODO: populate .save-slot-selector from state.slots.items, select state.slots.active,
    //       render the entries and required modules of the active slot in #save-slot-dialog.
}

/**
 * Apply every section of a state document to the live UI.
 * @param state - State to apply.
 */
export function applyState(state: UIState): void {
    // TODO: call applyDisplayState/applyFilterState/applySlotState once the bindings exist.
    void state;
}

/**
 * Read the current UI controls back into a state document.
 *
 * Stub: the display, filter and save-slot controls are not bound to the state
 * yet, so this currently returns an unchanged copy of the shared state.
 * @returns The captured state document.
 */
export function captureState(): UIState {
    // TODO: mirror applyState and read every control back into the state.
    return getState();
}

/**
 * Initialise the shared state and persist it, applying migrated legacy keys.
 * @returns The initialised state.
 */
export function initState(): UIState {
    const state = setState(loadState());
    // TODO: applyState(state) once the display, filter and save-slot bindings are implemented.
    return state;
}
