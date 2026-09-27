// mockup-v2/ts/ui-tabs.ts
import { store } from "./store";

export function renderWorkspaceTabs() {
    const container = document.getElementById("workspace-tabs");
    if (!container) return;

    const state = store.getState();
    container.innerHTML = "";

    state.openTabs.forEach((tab) => {
        const tabEl = document.createElement("div");
        tabEl.className = `tab-item ${tab.id === state.activeTab ? "active" : ""}`;
        tabEl.innerHTML = `
            <span>${tab.title}</span>
            ${state.openTabs.length > 1 ? `<span class="tab-close" data-id="${tab.id}">×</span>` : ""}
        `;

        tabEl.onclick = (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains("tab-close")) {
                e.stopPropagation();
                store.closeTab(tab.id);
            } else {
                store.setActiveTab(tab.id);
            }
        };

        container.appendChild(tabEl);
    });
}
