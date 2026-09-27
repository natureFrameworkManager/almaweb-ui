// mockup-v2/ts/store.ts — Reactive state management for V2 mockup

export interface MappeState {
    activeScenario: "A" | "B" | "C";
    markedItems: {
        A: string[];
        B: string[];
        C: string[];
    };
    notes: Record<string, string>;
    targetLp: number;
}

export interface AppSettings {
    theme: "papier" | "nacht" | "tinte";
    density: "dicht" | "bequem";
    lang: "de" | "en";
}

class Store {
    private state: {
        activeTab: string;
        openTabs: { id: string; title: string; view: string }[];
        activeView: string;
        filterText: string;
        filterFaculty: string;
        filterLp: string;
        filterSemester: string;
        mappe: MappeState;
        settings: AppSettings;
        quickPeekId: string | null;
        blattId: string | null;
    };

    private listeners: Set<() => void> = new Set();

    constructor() {
        this.state = {
            activeTab: "heute",
            openTabs: [
                { id: "heute", title: "Heute", view: "heute" },
                { id: "suche", title: "Suche: Informatik", view: "blaettern" },
                { id: "fuehrer", title: "Studienführer", view: "fuehrer" }
            ],
            activeView: "heute",
            filterText: "",
            filterFaculty: "Alle Fakultäten",
            filterLp: "Alle LP",
            filterSemester: "WiSe 2025/26",
            mappe: {
                activeScenario: "A",
                markedItems: {
                    A: ["mod-1", "mod-2", "mod-3"],
                    B: ["mod-1", "mod-4"],
                    C: ["mod-5"]
                },
                notes: {
                    "mod-1": "Wichtig: Übungsgruppe Do 11:15 wählen!"
                },
                targetLp: 30
            },
            settings: {
                theme: (localStorage.getItem("almanach.theme") as any) || "papier",
                density: "dicht",
                lang: "de"
            },
            quickPeekId: null,
            blattId: null
        };
    }

    getState() {
        return this.state;
    }

    subscribe(fn: () => void) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    private notify() {
        this.listeners.forEach((l) => l());
    }

    setActiveView(view: string) {
        this.state.activeView = view;
        this.notify();
    }

    setActiveTab(tabId: string) {
        this.state.activeTab = tabId;
        const tab = this.state.openTabs.find((t) => t.id === tabId);
        if (tab) {
            this.state.activeView = tab.view;
        }
        this.notify();
    }

    closeTab(tabId: string) {
        if (this.state.openTabs.length <= 1) return;
        this.state.openTabs = this.state.openTabs.filter((t) => t.id !== tabId);
        if (this.state.activeTab === tabId) {
            this.setActiveTab(this.state.openTabs[this.state.openTabs.length - 1].id);
        } else {
            this.notify();
        }
    }

    openTab(tab: { id: string; title: string; view: string }) {
        if (!this.state.openTabs.some((t) => t.id === tab.id)) {
            this.state.openTabs.push(tab);
        }
        this.setActiveTab(tab.id);
    }

    toggleMarkItem(id: string) {
        const sc = this.state.mappe.activeScenario;
        const list = this.state.mappe.markedItems[sc];
        if (list.includes(id)) {
            this.state.mappe.markedItems[sc] = list.filter((item) => item !== id);
        } else {
            this.state.mappe.markedItems[sc] = [...list, id];
        }
        this.notify();
    }

    isItemMarked(id: string): boolean {
        const sc = this.state.mappe.activeScenario;
        return this.state.mappe.markedItems[sc].includes(id);
    }

    setActiveScenario(sc: "A" | "B" | "C") {
        this.state.mappe.activeScenario = sc;
        this.notify();
    }

    setFilterText(text: string) {
        this.state.filterText = text;
        this.notify();
    }

    setFilterFaculty(faculty: string) {
        this.state.filterFaculty = faculty;
        this.notify();
    }

    setFilterLp(lp: string) {
        this.state.filterLp = lp;
        this.notify();
    }

    setFilterSemester(sem: string) {
        this.state.filterSemester = sem;
        this.notify();
    }

    setQuickPeek(id: string | null) {
        this.state.quickPeekId = id;
        this.notify();
    }

    setBlatt(id: string | null) {
        this.state.blattId = id;
        this.notify();
    }

    setTheme(theme: "papier" | "nacht" | "tinte") {
        this.state.settings.theme = theme;
        localStorage.setItem("almanach.theme", theme);
        document.documentElement.dataset.theme = theme;
        this.notify();
    }

    setDensity(density: "dicht" | "bequem") {
        this.state.settings.density = density;
        document.documentElement.dataset.density = density;
        this.notify();
    }
}

export const store = new Store();
