// mockup-v2/ts/main.ts — Application entry point for V2 Mockup
import { store } from "./store";
import { showToast } from "./ui-toast";
import { renderWorkspaceTabs } from "./ui-tabs";
import { renderMappe } from "./ui-mappe";
import { renderActiveView } from "./ui-views";
import { renderPeekDrawer } from "./ui-peek";
import { renderBlattDialog } from "./ui-blatt";
import { initOmnibox } from "./omnibox";
import { initSatzfilter } from "./satzfilter";
import { initStudienfuehrer } from "./fuehrer";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialise theme & density
    const curTheme = store.getState().settings.theme;
    document.documentElement.dataset.theme = curTheme;
    document.documentElement.dataset.density = store.getState().settings.density;

    // 2. Initialise components
    initOmnibox();
    initSatzfilter();
    initStudienfuehrer();

    // 3. Bind UI renders on store changes
    store.subscribe(() => {
        renderWorkspaceTabs();
        renderMappe();
        renderActiveView();
        renderPeekDrawer();
        renderBlattDialog();
    });

    // Initial render
    renderWorkspaceTabs();
    renderMappe();
    renderActiveView();

    // 4. Bind Global Header Actions
    document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
        const nextTheme = store.getState().settings.theme === "papier" ? "nacht" : "papier";
        store.setTheme(nextTheme);
        showToast(`Design gewechselt auf: ${nextTheme === "papier" ? "Papier (Hell)" : "Nacht (Dunkel)"}`);
    });

    document.getElementById("btn-density-toggle")?.addEventListener("click", () => {
        const nextDensity = store.getState().settings.density === "dicht" ? "bequem" : "dicht";
        store.setDensity(nextDensity);
        showToast(`Dichte: ${nextDensity === "dicht" ? "Dicht (Kompakt)" : "Bequem (Groß)"}`);
    });

    // 5. Bind Rail Buttons
    document.querySelectorAll(".rail-btn[data-view]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const view = btn.getAttribute("data-view");
            if (view) {
                store.setActiveView(view);
            }
        });
    });

    // 6. Bind Mappe Scenario Tabs
    document.querySelectorAll(".register-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            const sc = tab.getAttribute("data-sc") as "A" | "B" | "C";
            if (sc) {
                store.setActiveScenario(sc);
                showToast(`Szenario ${sc} aktiviert.`);
            }
        });
    });

    // 7. Global Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            store.setQuickPeek(null);
            store.setBlatt(null);
        }
    });

    // Export Plan-Link mock
    document.getElementById("btn-export-plan")?.addEventListener("click", () => {
        const url = `${window.location.origin}/#/plan/szenario-a-demo-compressed`;
        navigator.clipboard?.writeText(url);
        showToast("Plan-Link in Zwischenablage kopiert! (248 Zeichen)");
    });
});
