// mockup-v2/ts/fuehrer.ts — Interactive Miller columns for Studienführer
import { store } from "./store";

interface MillerNode {
    id: string;
    title: string;
    children?: MillerNode[];
    count?: number;
}

const MILLER_TREE: MillerNode[] = [
    {
        id: "sem-wise25",
        title: "WiSe 2025/26",
        children: [
            {
                id: "fak-10",
                title: "10 Fak. Mathematik & Info",
                children: [
                    {
                        id: "fach-inf",
                        title: "Informatik",
                        children: [
                            {
                                id: "sg-bsc-inf",
                                title: "Informatik (B.Sc.)",
                                children: [
                                    { id: "ber-pflicht", title: "Kernfächer / Pflicht", count: 6 },
                                    { id: "ber-wp", title: "Wahlpflicht Vertiefung", count: 14 }
                                ]
                            },
                            {
                                id: "sg-msc-inf",
                                title: "Informatik (M.Sc.)",
                                children: [
                                    { id: "ber-msc-wp", title: "Wahlbereich Master", count: 18 }
                                ]
                            }
                        ]
                    },
                    {
                        id: "fach-math",
                        title: "Mathematik",
                        children: [
                            {
                                id: "sg-bsc-math",
                                title: "Mathematik (B.Sc.)",
                                children: [
                                    { id: "ber-math-p", title: "Grundlagen Analysis/Lineare Alg.", count: 4 }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "fak-09",
                title: "09 Wirtschaftswissenschaften",
                children: [
                    {
                        id: "fach-wiwi",
                        title: "Wirtschaftsinformatik",
                        children: [
                            {
                                id: "sg-bsc-winf",
                                title: "Wirtschaftsinformatik (B.Sc.)",
                                children: [
                                    { id: "ber-winf-p", title: "Pflichtmodule WiWi & Info", count: 8 }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        id: "sem-sose26",
        title: "SoSe 2026",
        children: [
            {
                id: "fak-10-sose",
                title: "10 Fak. Mathematik & Info",
                children: []
            }
        ]
    }
];

export function initStudienfuehrer() {
    const container = document.getElementById("studienfuehrer-columns");
    if (!container) return;

    let selectedPath: MillerNode[] = [MILLER_TREE[0]];

    function renderColumns() {
        container!.innerHTML = "";

        // Column 1: Semester
        renderCol("Semester", MILLER_TREE, selectedPath[0], (node) => {
            selectedPath = [node];
            renderColumns();
        });

        // Column 2: Fakultät
        if (selectedPath[0]?.children) {
            renderCol("Fakultät", selectedPath[0].children, selectedPath[1], (node) => {
                selectedPath = [selectedPath[0], node];
                renderColumns();
            });
        }

        // Column 3: Fach
        if (selectedPath[1]?.children) {
            renderCol("Fachgebiet", selectedPath[1].children, selectedPath[2], (node) => {
                selectedPath = [selectedPath[0], selectedPath[1], node];
                renderColumns();
            });
        }

        // Column 4: Studiengang
        if (selectedPath[2]?.children) {
            renderCol("Studiengang", selectedPath[2].children, selectedPath[3], (node) => {
                selectedPath = [selectedPath[0], selectedPath[1], selectedPath[2], node];
                renderColumns();
            });
        }

        // Column 5: Bereich
        if (selectedPath[3]?.children) {
            renderCol("Bereich", selectedPath[3].children, selectedPath[4], (node) => {
                selectedPath = [selectedPath[0], selectedPath[1], selectedPath[2], selectedPath[3], node];
                renderColumns();
                // Switch to browse results
                store.setActiveView("blaettern");
            });
        }
    }

    function renderCol(title: string, nodes: MillerNode[], currentSelected: MillerNode | undefined, onSelect: (node: MillerNode) => void) {
        const col = document.createElement("div");
        col.className = "miller-col";

        const header = document.createElement("div");
        header.className = "miller-col-header";
        header.textContent = title;
        col.appendChild(header);

        const list = document.createElement("ul");
        list.className = "miller-col-list";

        nodes.forEach((node) => {
            const li = document.createElement("li");
            const isSelected = currentSelected?.id === node.id;
            li.className = `miller-item ${isSelected ? "selected" : ""}`;
            li.innerHTML = `
                <span>${node.title}</span>
                <span style="font-size: 0.75rem; color: var(--ink-subtle);">
                    ${node.count ? `${node.count} Mod.` : "▸"}
                </span>
            `;

            li.onclick = () => onSelect(node);
            list.appendChild(li);
        });

        col.appendChild(list);
        container!.appendChild(col);
    }

    renderColumns();
}
