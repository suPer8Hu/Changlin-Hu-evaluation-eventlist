const eventListAPIs = (function () {
    const API_URL = "http://localhost:3000/events";

    async function getEvent() {
        return fetch(API_URL).then(res => res.json());
    }

    async function addEvent(newEvent) {
        return fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            // body: JSON.stringify({
            //     eventName: "LOL Mid Level Competition"
            // })
            body: JSON.stringify(newEvent),
        }).then((res) => res.json());
    }

    async function deleteEvent(id) {
        return fetch(`${API_URL}/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    }


    async function updateEvent(id, updatedEvent) {
        return fetch(`${API_URL}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedEvent),
        }).then(res => res.json());
    }

    return {
        getEvent,
        addEvent,
        deleteEvent,
        updateEvent,
    }
})();




class EventListModel {
    #events;
    constructor(events = []) {
        this.#events = events;
    }

    getEvents() {
        return this.#events;
    }
    setEvents(events) {
        this.#events = events;
    }
    addEvent(event) {
        this.#events.push(event);
    }
    deleteEvent(id) {
        this.#events = this.#events.filter((ev) => ev.id !== id);
    }
}

class EventListView {
    constructor() {
        this.addEventBtn = document.getElementById("add-event-btn");
        this.eventTableBody = document.getElementById("event-tbody");
    }

    renderEvents(events) {
        this.eventTableBody.innerHTML = "";
        events.forEach((ev) => this.renderNewEvent(ev));
    }

    renderNewEvent(event) {
        this.eventTableBody.appendChild(this.createEventRow(event));
    }


    createEventRow(event) {
        const tr = document.createElement("tr");
        tr.setAttribute("id", event.id);
        tr.innerHTML = `
            <td>${event.title}</td>
            <td>${event.start}</td>
            <td>${event.end}</td>
            <td>
                <button class="event__edit-btn" data-id="${event.id}">✏️</button>
                <button class="event__del-btn"  data-id="${event.id}">🗑️</button>
            </td>`;
        return tr;
    }

    createEditRow() {
        if (this.eventTableBody.querySelector(".editor-row")) return null;

        const tr = document.createElement("tr");
        tr.classList.add("editor-row");
        tr.innerHTML = `
            <td><input type="text"  id="edit-title"  placeholder="Event name"></td>
            <td><input type="date"  id="edit-start"></td>
            <td><input type="date"  id="edit-end"></td>
            <td>
                <button id="save-btn">➕</button>
                <button id="cancel-btn">❌</button>
            </td>`;
        this.eventTableBody.appendChild(tr);
        return tr;
    }

    removeEditRow() {
        const r = this.eventTableBody.querySelector(".editor-row");
        r && r.remove();
    }

    removeDataRow(id) {
        const r = document.getElementById(id);
        r && r.remove();
    }


    editEvent(tr) {
        const id = tr.getAttribute("id");
        const title = tr.children[0].textContent;
        const start = tr.children[1].textContent;
        const end = tr.children[2].textContent;
        tr.classList.add("editor-row");
        tr.innerHTML = `
            <td><input type="text"  id="edit-title"  value="${title}"></td>
            <td><input type="date"  id="edit-start" value="${start}"></td>
            <td><input type="date"  id="edit-end"   value="${end}"></td>
            <td>
            <button class="save-btn"    data-id="${id}">💾</button>
            <button class="cancel-btn"  data-id="${id}">❌</button>
            </td>`;
    }
}

class EventListController {
    constructor(view, model) {
        this.view = view;
        this.model = model;
        this.init();
    }

    init() {
        this.setUpEvents();
        this.fetchEvents();
    }

    setUpEvents() {
        this.setUpAddEvent();
        this.setUpDeleteEvent();
        this.setUpEditEvent();
    }

    // fetch the data from backend
    async fetchEvents() {
        const events = await eventListAPIs.getEvent();
        this.model.setEvents(events);
        this.view.renderEvents(events);
    }

    setUpAddEvent() {
        this.view.addEventBtn.addEventListener("click", async () => {
            const editRow = this.view.createEditRow();
            if (!editRow) return;

            const saveBtn = editRow.querySelector("#save-btn");
            const cancelBtn = editRow.querySelector("#cancel-btn");
            const titleInp = editRow.querySelector("#edit-title");
            const startInp = editRow.querySelector("#edit-start");
            const endInp = editRow.querySelector("#edit-end");

            saveBtn.addEventListener("click", async () => {
                const title = titleInp.value.trim();
                const start = startInp.value;
                const end = endInp.value;

                if (!title || !start || !end) {
                    return alert("All fields required");
                }

                const newEvent = await eventListAPIs.addEvent({ title, start, end });
                this.model.addEvent(newEvent);
                this.view.removeEditRow();
                this.view.renderNewEvent(newEvent);
            });

            cancelBtn.addEventListener("click", () => {
                this.view.removeEditRow();
            });
        });
    }

    setUpDeleteEvent() {
        this.view.eventTableBody.addEventListener("click", async (e) => {
            const elem = e.target;
            if (elem.classList.contains("event__del-btn")) {
                const deleteId = elem.dataset.id;
                await eventListAPIs.deleteEvent(deleteId);
                this.model.deleteEvent(deleteId);
                this.view.removeDataRow(deleteId);
            }
        });
    }

    setUpEditEvent() {
        this.view.eventTableBody.addEventListener("click", async (e) => {
            const elem = e.target;
            const id = elem.dataset.id;

            if (elem.classList.contains("event__edit-btn")) {
                const r = document.getElementById(id);
                this.view.editEvent(r);
                return;
            }

            if (elem.classList.contains("save-btn")) {
                const row = document.getElementById(id);
                const title = row.querySelector("#edit-title").value.trim();
                const start = row.querySelector("#edit-start").value;
                const end   = row.querySelector("#edit-end").value;
                if (!title || !start || !end) {
                    return alert("All fields required");
                }

                const updated = await eventListAPIs.updateEvent(id, {title, start, end});
                this.model.deleteEvent();
                this.model.addEvent(updated);

                this.view.removeDataRow(id);
                this.view.renderNewEvent(updated);
                return;
            }

            if (elem.classList.contains("cancel-btn")) {
                let originData = null;
                for(const eve of this.model.getEvents()) {
                    if (eve.id == id) {
                        originData = eve;
                        break;
                    }
                }

                this.view.removeDataRow(id);
                this.view.renderNewEvent(originData);
            }
        });
    }
}

const eventListView = new EventListView();
const eventListModel = new EventListModel();
const eventListController = new EventListController(eventListView, eventListModel);


