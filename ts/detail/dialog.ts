import { getModuleDetail } from "../api/api.ts";

/**
 * Removes "Root" and semester information from the navigation path
 * @param path - The navigation path as an array of string arrays.
 * @returns The simplified navigation path with "Root" and semester information removed.
 */
function simplifyPath(path: string[][]) {
    return path.map((el) =>
        el.filter((el) => el !== "Root" && !/(SoSe|WiSe)\s*[0-9]{4}(\/[0-9]{2})?/.test(el)),
    );
}

/**
 * Populates the module detail dialog.
 * @param moduleId - The ID of the module to fetch details for.
 * @returns A promise that resolves when the module detail dialog has been populated.
 */
export async function openModuleDetail(moduleId: string) {
    const moduleDetail = await getModuleDetail(moduleId);
    const dialog = document.querySelector("#detail-dialog");
    if (!dialog) {
        return;
    }

    dialog.querySelector(".dialog-title")!.textContent = "Modul-Details";
    dialog.querySelector(".detail-name")!.textContent = moduleDetail.name;
    dialog.querySelector(".detail-number")!.textContent = moduleDetail.number;

    dialog.querySelectorAll(".dialog-body .tab-content")?.forEach((el) => el.remove());

    const detailsContent = document.createElement("div");
    detailsContent.classList.add("tab-content");
    detailsContent.dataset["tab"] = "details";
    const detailsAngabenSection = document.createElement("section");
    detailsAngabenSection.classList.add("dialog-section");
    const angabenTitle = document.createElement("h2");
    angabenTitle.textContent = "Angaben";
    detailsAngabenSection.appendChild(angabenTitle);
    const angabenGrid = document.createElement("dl");
    angabenGrid.classList.add("attr-grid");
    [
        { key: "number", label: "Modulnummer" },
        { key: "credits", label: "Leistungspunkte" },
        { key: "duration_semesters", label: "Dauer" },
        { key: "frequency", label: "Häufigkeit" },
        { key: "language", label: "Sprache" },
        { key: "faculty.name", label: "Fakultät" },
    ].forEach(({ key, label }) => {
        const container = document.createElement("div");
        container.classList.add("attr");
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = key.includes(".")
            ? key.split(".").reduce((o, i) => o[i], moduleDetail)
            : moduleDetail[key];
        dd.textContent += key === "credits" ? " LP" : "";
        container.appendChild(dt);
        container.appendChild(dd);
        angabenGrid.appendChild(container);
    });
    detailsAngabenSection.appendChild(angabenGrid);
    detailsContent.appendChild(detailsAngabenSection);
    const detailsContentSection = document.createElement("section");
    detailsContentSection.classList.add("dialog-section");
    detailsContentSection.appendChild(detailsAngabenSection);
    const detailsContentSectionTitle = document.createElement("h2");
    detailsContentSectionTitle.textContent = "Inhalte & Voraussetzungen";
    detailsContentSection.appendChild(detailsContentSectionTitle);
    const contentTableCon = document.createElement("div");
    contentTableCon.classList.add("table-wrap");
    const contentTable = document.createElement("dl");
    contentTable.classList.add("attr-table");
    [
        { key: "path", label: "Navigationspfad" },
        { key: "content", label: "Inhalte" },
        { key: "goals", label: "Qulifikationsziele" },
        { key: "exam_prerequisites", label: "Prüfungsvorleistungen" },
    ].forEach(({ key, label }) => {
        const container = document.createElement("div");
        container.classList.add("attr-row");
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent =
            key === "path"
                ? simplifyPath(moduleDetail[key])
                      .map((el) => el.join(" > "))
                      .join(" / ")
                : moduleDetail[key];
        dd.textContent = (dd.textContent || "-").trim();
        container.appendChild(dt);
        container.appendChild(dd);
        contentTable.appendChild(container);
    });
    if (moduleDetail.prerequisites && Object.keys(moduleDetail.prerequisites).length > 0) {
        Object.entries(moduleDetail.prerequisites).forEach(([key, value]) => {
            const container = document.createElement("div");
            container.classList.add("attr-row");
            const dt = document.createElement("dt");
            dt.textContent = `Prüfungsvorleistungen - ${key}`;
            const dd = document.createElement("dd");
            dd.textContent = value;
            container.appendChild(dt);
            container.appendChild(dd);
            contentTable.appendChild(container);
        });
    }
    contentTableCon.appendChild(contentTable);
    detailsContentSection.appendChild(contentTableCon);
    detailsContent.appendChild(detailsContentSection);
    dialog.querySelector(".dialog-body")!.appendChild(detailsContent);
    console.log(moduleDetail);
}
