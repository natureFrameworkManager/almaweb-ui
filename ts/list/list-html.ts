export type ListDataItem = {
    id: number;
    type: string;
    name: string;
    number: string;
    facultyName: string;
    credits: number;
    durationSemester: number;
    frequency: string;
    courses: Course[];
    exams: Exam[];
};

type Course = {
    id: number;
    name: string;
    type: string;
    events: Event[];
};

type Event = {
    id: number;
    day: string;
    startTime: string;
    endTime: string;
    location: string;
    instructor: string;
    daterange: string;
};

type Exam = {
    id: number;
    type: string;
};

function listItemHTML(item: ListDataItem): string {
    return `<li class="list-item">
        <div class="side-con">
            <button
                class="btn material-symbols save-toggle"
                data-save-kind="module"
                data-save-ref="${item.id}"
            >
                bookmark_add
            </button>
            <span class="module-credits">${item.credits} LP</span>
        </div>
        <div class="main-con">
            <div class="header-con">
                <h1>${item.name}</h1>
                <h2>
                    ${item.number}
                    <span class="module-faculty">
                        ${item.facultyName}
                    </span>
                </h2>
            </div>
            <div class="info-container">
                <span class="info module-duration"
                    ><span class="material-symbols">av_timer</span>${item.durationSemester} Semester</span
                >
                <span class="info module-course-types"
                    ><span class="material-symbols">person_raised_hand</span
                    >${item.courses.map((course) => course.type).join(", ")}</span
                >
                <span class="info module-frequency"
                    ><span class="material-symbols">repeat</span>${item.frequency}</span
                >
                <span class="info module-exam-types">
                    <span class="material-symbols">history_edu</span>
                    ${item.exams.map((exam) => exam.type).join(", ")}
                </span>
            </div>
            <button
                class="btn detail-btn"
                data-details-id="${item.id}"
                data-details-kind="module"
                popovertarget="detail-dialog"
                popovertargetaction="toggle"
            >
                Mehr Details
            </button>
        </div>
        <div class="more-con">
            ${item.courses
                .map(
                    (course) => `
                <span class="course-title" style="grid-row: span ${course.events.length + 1}">${course.name}</span>
                ${course.events
                    .map(
                        (event) => `
                    <span class="course-day">${event.day}</span>
                    <span class="course-time">${event.startTime}-${event.endTime}</span>
                    <span class="course-staff">${event.instructor}</span>
                    <span class="course-location">${event.location}</span>
                    <span class="course-daterange">${event.daterange}</span>
                `,
                    )
                    .join("")}
            `,
                )
                .join("")}
        </div>
    </li>`;
}

export function displayList(data: ListDataItem[], selector: string) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = data.map(listItemHTML).join("");
}
