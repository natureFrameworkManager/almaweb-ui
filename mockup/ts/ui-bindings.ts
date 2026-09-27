// ==========================================================================
// mockup/ts/ui-bindings.ts — Global shell event wiring
// ==========================================================================

import { store } from "./store";
import type { EntityType, LayoutMode, SplitMode } from "./store";
import { showToast } from "./ui-toast";

export interface ShellElements {
    paletteBackdrop: HTMLElement | null;
    exportModal: HTMLElement | null;
    aboutModal: HTMLElement | null;
}

export function bindUserInteractions(shell: ShellElements): void {
    // Search field acts as the palette trigger (Section 1.1)
    document.getElementById("search-input-trigger")?.addEventListener("click", () => {
        store.setPaletteOpen(true);
    });

    // Global shortcuts: ⌘/Ctrl+K, Esc
    document.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            store.setPaletteOpen(!store.getState().paletteOpen);
            return;
        }
        if (e.key === "Escape") {
            store.setPaletteOpen(false);
            store.setExportModalOpen(false);
            store.setAboutModalOpen(false);
            store.setDetail(null, null);
        }
    });

    // Theme toggle
    document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
        const next = store.getState().theme === "light" ? "dark" : "light";
        store.setTheme(next);
        showToast(`Farbschema: ${next === "light" ? "Hell" : "Dunkel"}`);
    });

    // Density toggle
    document.getElementById("btn-density-toggle")?.addEventListener("click", () => {
        const next = store.getState().density === "normal" ? "compact" : "normal";
        store.setDensity(next);
        showToast(`Dichte: ${next === "normal" ? "Komfort" : "Kompakt"}`);
    });

    // Entity tabs
    document.querySelectorAll(".entity-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            const entity = tab.getAttribute("data-entity") as EntityType | null;
            if (entity) store.setActiveEntity(entity);
        });
    });

    // Layout switcher
    document.querySelectorAll(".segmented-item[data-layout]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const layout = btn.getAttribute("data-layout") as LayoutMode | null;
            if (layout) {
                store.setActiveLayout(layout);
                if (store.getState().splitMode === "compare") store.setSplitMode("single");
            }
        });
    });

    // Split mode switcher
    document.querySelectorAll(".segmented-item[data-split]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const mode = btn.getAttribute("data-split") as SplitMode | null;
            if (mode) store.setSplitMode(mode);
        });
    });

    // Filter rail
    const facultySelect = document.getElementById("select-faculty") as HTMLSelectElement | null;
    facultySelect?.addEventListener("change", () => {
        store.setFacultyFilter(facultySelect.value);
        showToast(`Fakultät: ${facultySelect.value === "all" ? "Alle" : facultySelect.value}`);
    });

    const semesterSelect = document.getElementById("select-semester") as HTMLSelectElement | null;
    semesterSelect?.addEventListener("change", () => {
        store.setSemesterFilter(semesterSelect.value);
        showToast(`Semester: ${semesterSelect.value === "2025w" ? "WiSe 2025/26" : "SoSe 2025"}`);
    });

    document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
        store.setFacultyFilter("all");
        store.setSearchQuery("");
        store.clearSelection();
        showToast("Filter zurückgesetzt");
    });

    // Modals
    document.getElementById("btn-open-about")?.addEventListener("click", () => store.setAboutModalOpen(true));
    document.getElementById("btn-close-about")?.addEventListener("click", () => store.setAboutModalOpen(false));
    document.getElementById("btn-close-about-footer")?.addEventListener("click", () => store.setAboutModalOpen(false));

    document.getElementById("btn-open-export")?.addEventListener("click", () => store.setExportModalOpen(true));
    document.getElementById("btn-close-export")?.addEventListener("click", () => store.setExportModalOpen(false));
    document.getElementById("btn-cancel-export")?.addEventListener("click", () => store.setExportModalOpen(false));
    document.getElementById("btn-do-export")?.addEventListener("click", () => {
        store.setExportModalOpen(false);
        showToast("Export vorbereitet (Mockup ohne Datei-Download)");
    });

    // Backdrop click dismiss
    shell.paletteBackdrop?.addEventListener("click", (e) => {
        if (e.target === shell.paletteBackdrop) store.setPaletteOpen(false);
    });
    shell.exportModal?.addEventListener("click", (e) => {
        if (e.target === shell.exportModal) store.setExportModalOpen(false);
    });
    shell.aboutModal?.addEventListener("click", (e) => {
        if (e.target === shell.aboutModal) store.setAboutModalOpen(false);
    });
}