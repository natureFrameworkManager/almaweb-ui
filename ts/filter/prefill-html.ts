import { getFaculties, getDegrees, getEventTypes, getStaff, getBuildings, getExamTypes, getSemesters } from "../api/api.ts";

/**
 * Prefills the faculty filter with available faculties from the API.
 */
async function prefillFaculty() {
    const faculties = (await getFaculties()).items.sort((a, b) => a.prefix - b.prefix);
    const optionsHtml = faculties.map(el => [el.id, el.name.split("-")[1]]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="faculty-${el[0]}"><input type="checkbox" id="faculty-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-faculty-alle" ><input type="checkbox" id="filter-faculty-alle" value=""/><span>Alle Fakultäten</span></label>`, ...optionsHtml].join("");
}

async function prefillDegrees() {
    const degrees = (await getDegrees()).items.sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = degrees.map(el => [el.id, el.name]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="degree-${el[0]}"><input type="checkbox" id="degree-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-degree-alle" ><input type="checkbox" id="filter-degree-alle" value=""/><span>Alle Studiengänge</span></label>`, ...optionsHtml].join("");
}

async function prefillFinalDegrees() {
    const degrees = (await getDegrees()).items.sort((a, b) => a.degree.localeCompare(b.degree));
    const optionsHtml = [...new Set(degrees.map(el => el.degree))].filter(el => el && el !== undefined).map(el => [el, el]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="final-degree-${el[0]}"><input type="checkbox" id="final-degree-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-final-degree-alle" ><input type="checkbox" id="filter-final-degree-alle" value=""/><span>Alle Abschlüsse</span></label>`, ...optionsHtml].join("");
}

async function prefillEventTypes() {
    const eventTypes = (await getEventTypes()).items.sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = eventTypes.map(el => [el.id, el.name]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="event-type-${el[0]}"><input type="checkbox" id="event-type-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-event-type-alle" ><input type="checkbox" id="filter-event-type-alle" value=""/><span>Alle Veranstaltungstypen</span></label>`, ...optionsHtml].join("");
}

async function prefillStaff() {
    const staff = (await getStaff()).items.sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = staff.map(el => [el.id, el.name]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="staff-${el[0]}"><input type="checkbox" id="staff-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-staff-alle" ><input type="checkbox" id="filter-staff-alle" value=""/><span>Alle Mitarbeiter</span></label>`, ...optionsHtml].join("");
}

async function prefillBuildings() {
    const buildings = (await getBuildings()).items.sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = buildings.map(el => [el.id, el.name]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="building-${el[0]}"><input type="checkbox" id="building-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-building-alle" ><input type="checkbox" id="filter-building-alle" value=""/><span>Alle Gebäude</span></label>`, ...optionsHtml].join("");
}

async function prefillExamTypes() {
    const examTypes = (await getExamTypes()).items.sort((a, b) => a.name.localeCompare(b.name));
    const optionsHtml = examTypes.map(el => [el.id, el.name?.replace(/^\s*[0-9]*\s*/g, "").replace(/\(Wdh\.?\)/g, "").trim()]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="examtype-${el[0]}"><input type="checkbox" id="examtype-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-examtype-alle" ><input type="checkbox" id="filter-examtype-alle" value=""/><span>Alle Prüfungstypen</span></label>`, ...optionsHtml].join("");
}

async function prefillSemesters() {
    const semesters = (await getSemesters()).items.sort((a, b) => (b.year - a.year === 0 ? b.term.localeCompare(a.term) : b.year - a.year));
    const optionsHtml = semesters.map(el => [el.id, el.name]).filter(el => el && el[1] !== undefined).map(el => [el[0], el[1].trim()]).map(el => `<label class="checkbox-item" for="semester-${el[0]}"><input type="checkbox" id="semester-${el[0]}" value="${el[0]}"><span>${el[1]}</span></label>`);
    return [`<label class="checkbox-item" for="filter-semester-alle" ><input type="checkbox" id="filter-semester-alle" value=""/><span>Alle Semester</span></label>`, ...optionsHtml].join("");
}

document.querySelector("#filter-faculty")!.innerHTML = await prefillFaculty();
document.querySelector("#filter-degree")!.innerHTML = await prefillDegrees();
const eventTypesHtml = await prefillEventTypes();
const staffHtml = await prefillStaff();
document.querySelector("#filter-instructors")!.innerHTML = staffHtml;
document.querySelector("#filter-event-staff")!.innerHTML = staffHtml;
document.querySelector("#filter-staff")!.innerHTML = staffHtml;
document.querySelector("#filter-type")!.innerHTML = eventTypesHtml;
document.querySelector("#filter-event-types")!.innerHTML = eventTypesHtml;
document.querySelector("#filter-event-buildings")!.innerHTML = await prefillBuildings();
document.querySelector("#filter-examtypes")!.innerHTML = await prefillExamTypes();
document.querySelector("#filter-semester")!.innerHTML = await prefillSemesters();
document.querySelector("#filter-degree-types")!.innerHTML = await prefillFinalDegrees();