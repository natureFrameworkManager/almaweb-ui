// ==========================================================================
// mockup/ts/store.ts — Client State Management for Mockup
// ==========================================================================

export type EntityType = "module" | "course" | "event" | "exam" | "staff" | "location";
export type LayoutMode = "list" | "table" | "cards" | "calendar" | "explorer" | "compare";
export type SplitMode = "single" | "split" | "compare";

export interface MockFilterState {
    semester: string;
    faculty: string;
    lpMin: number;
    lpMax: number;
    searchQuery: string;
}

export interface MockAppState {
    theme: "light" | "dark";
    density: "normal" | "compact";
    splitMode: SplitMode;
    activeEntity: EntityType;
    activeLayout: LayoutMode;
    filters: MockFilterState;
    selectedItems: Set<string>; // ID set
    savedItems: Set<string>;    // "Meine Liste" (Bellis Pink)
    selectedDetailId: string | null;
    selectedDetailType: EntityType | null;
    paletteOpen: boolean;
    exportModalOpen: boolean;
    aboutModalOpen: boolean;
    compareSlots: {
        slotA: string;
        slotB: string;
    };
}

class Store {
    private state: MockAppState = {
        theme: "light",
        density: "normal",
        splitMode: "single",
        activeEntity: "module",
        activeLayout: "list",
        filters: {
            semester: "WiSe 2025/26",
            faculty: "all",
            lpMin: 0,
            lpMax: 30,
            searchQuery: "",
        },
        selectedItems: new Set<string>(),
        savedItems: new Set<string>(["mod-2", "c-3", "ev-3"]), // Pre-saved demo items
        selectedDetailId: "mod-2",
        selectedDetailType: "module",
        paletteOpen: false,
        exportModalOpen: false,
        aboutModalOpen: false,
        compareSlots: {
            slotA: "Plan A (Informatik Kern)",
            slotB: "Plan B (Wirtschaftsinformatik)",
        },
    };

    private listeners: (() => void)[] = [];

    getState(): MockAppState {
        return this.state;
    }

    subscribe(fn: () => void): () => void {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== fn);
        };
    }

    private notify(): void {
        for (const fn of this.listeners) {
            fn();
        }
    }

    setTheme(theme: "light" | "dark"): void {
        this.state.theme = theme;
        document.documentElement.setAttribute("data-theme", theme);
        this.notify();
    }

    setDensity(density: "normal" | "compact"): void {
        this.state.density = density;
        document.documentElement.setAttribute("data-density", density);
        this.notify();
    }

    setSplitMode(mode: SplitMode): void {
        this.state.splitMode = mode;
        this.notify();
    }

    setActiveEntity(entity: EntityType): void {
        this.state.activeEntity = entity;
        this.notify();
    }

    setActiveLayout(layout: LayoutMode): void {
        this.state.activeLayout = layout;
        this.notify();
    }

    setSearchQuery(q: string): void {
        this.state.filters.searchQuery = q;
        this.notify();
    }

    setFacultyFilter(faculty: string): void {
        this.state.filters.faculty = faculty;
        this.notify();
    }

    setSemesterFilter(sem: string): void {
        this.state.filters.semester = sem;
        this.notify();
    }

    toggleSelect(id: string): void {
        if (this.state.selectedItems.has(id)) {
            this.state.selectedItems.delete(id);
        } else {
            this.state.selectedItems.add(id);
        }
        this.notify();
    }

    clearSelection(): void {
        this.state.selectedItems.clear();
        this.notify();
    }

    toggleSave(id: string): void {
        if (this.state.savedItems.has(id)) {
            this.state.savedItems.delete(id);
        } else {
            this.state.savedItems.add(id);
        }
        this.notify();
    }

    setDetail(id: string | null, type: EntityType | null = null): void {
        this.state.selectedDetailId = id;
        this.state.selectedDetailType = type || this.state.activeEntity;
        this.notify();
    }

    setPaletteOpen(open: boolean): void {
        this.state.paletteOpen = open;
        this.notify();
    }

    setExportModalOpen(open: boolean): void {
        this.state.exportModalOpen = open;
        this.notify();
    }

    setAboutModalOpen(open: boolean): void {
        this.state.aboutModalOpen = open;
        this.notify();
    }
}

export const store = new Store();
