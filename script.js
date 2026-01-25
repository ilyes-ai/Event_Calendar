// ------------------ LOGIN FEATURE ------------------

// Supabase client for login + calendar
const SUPABASE_URL = "https://nyzxuzcdaukftswvirog.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55enh1emNkYXVrZnRzd3Zpcm9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTI1ODUsImV4cCI6MjA4MjkyODU4NX0.gKdPojZMgMivc1mhx06NvziK8VJ656obwxM3W6rmDbU";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let allowedClubs = [];
let selectedEvent = null; // 🔹 FOR MODAL

// ------------------ ACCESS RULES ------------------
const CLUB_ACCESS = {
  shaima: ["ISET-SFAX", "fss"],
  ibrahim: ["isgis"],
  zaineb: ["fseg", "issis"],
  oumaima: ["ihec"],
  arij: ["isbs"],
  hajer: ["ipsas"],

  ilyes: "ALL",
  farah: "ALL",
  hayder: "ALL",
  hassen: "ALL",
  anas: "ALL",
  soulene: "ALL",
  barhoum: "ALL",
  oussema: "ALL",
  malek: "ALL",
  baya: "ALL"
};
const READ_ONLY_COORDINATORS = [
  "soulene",
  "anas",
  "barhoum",
  "oussema",
  "malek",
  "baya"
];

// ------------------ LOGIN ------------------

async function checkUsername() {
  const username = document.getElementById("username").value.trim().toLowerCase();

  const { data } = await client
    .from("users")
    .select("*")
    .eq("username", username)
    .limit(1);

  if (!data || !data.length) {
    document.getElementById("username-error").innerText = "Username not found.";
    return;
  }

  currentUser = data[0];
  const access = CLUB_ACCESS[username];
  allowedClubs = access === "ALL" ? "ALL" : access || [];

  document.getElementById("username-step").style.display = "none";
  document.getElementById("password-step").style.display = "block";
}

function checkPassword() {
  const passwordInput = document.getElementById("password").value.trim();

  if (currentUser.password !== passwordInput) {
    document.getElementById("password-error").innerText = "Incorrect password.";
    return;
  }

  document.getElementById("login-container").style.display = "none";
  document.getElementById("calendar-filters").style.display = "block";
  document.getElementById("calendar").style.display = "block";

  initializeCalendar();
  enableAddEventIfAllowed();

}

// ------------------ MODAL LOGIC ------------------
const modal = document.getElementById("event-modal");
const modalTitle = document.getElementById("modal-event-title");
const name = document.getElementById("club_name"); 

document.getElementById("close-modal").onclick = () => {
  modal.style.display = "none";
  selectedEvent = null;
};

document.getElementById("mark-done").onclick = async () => {
  if (!selectedEvent) return;

  await updateEventColor(selectedEvent.id, "#dc2626");
  selectedEvent.setProp("backgroundColor", "#dc2626");

  modal.style.display = "none";
  selectedEvent = null;
};

document.getElementById("mark-not-done").onclick = async () => {
  if (!selectedEvent) return;

  const originalColor = selectedEvent.extendedProps.originalColor;
  await updateEventColor(selectedEvent.id, originalColor);
  selectedEvent.setProp("backgroundColor", originalColor);

  modal.style.display = "none";
  selectedEvent = null;
};

// ------------------ CALENDAR ------------------
document.addEventListener("DOMContentLoaded", async () => {
  const calendarEl = document.getElementById("calendar");
  const clubSelect = document.getElementById("club-select");

  let { data: allEvents } = await client
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  const mapEvents = (events) =>
    events.map(ev => ({
      id: ev.id,
      title: ev.title,
      start: ev.start_date,
      end: ev.end_date || ev.start_date,
      backgroundColor: ev.color,
      extendedProps: {
        club_code: ev.club_code,
        originalColor: ev.color
      }
    }));

  window.initializeCalendar = function () {

    let visibleEvents =
      allowedClubs === "ALL"
        ? allEvents
        : allEvents.filter(ev => allowedClubs.includes(ev.club_code));

    const uniqueClubs = [...new Set(visibleEvents.map(ev => ev.club_code))];

    clubSelect.innerHTML = `<option value="">All Clubs</option>`;
    uniqueClubs.forEach(club => {
      const opt = document.createElement("option");
      opt.value = club;
      opt.textContent = club.toUpperCase();
      clubSelect.appendChild(opt);
    });

    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      initialDate: "2025-09-01",
      validRange: { start: "2025-09-01", end: "2026-12-31" },
      height: "auto",
      events: mapEvents(visibleEvents),

      eventClick: (info) => {
        const { club_code } = info.event.extendedProps;

        // 🔒 Permission check for modification
if (
  allowedClubs !== "ALL" &&
  !allowedClubs.includes(club_code) ||
  READ_ONLY_COORDINATORS.includes(currentUser.username)
) {
  alert("You don't have permission to modify this event.");
  return;
}
if (READ_ONLY_COORDINATORS.includes(currentUser.username)) {
  calendarEl.style.cursor = "default"; // not clickable
} else {
  calendarEl.style.cursor = "pointer";
}



        // 🔹 OPEN MODAL INSTEAD OF confirm()
        selectedEvent = info.event;
        modalTitle.textContent = info.event.title;
        name.textContent = ev.club_code;
        modal.style.display = "flex";
      }
    });

    calendar.render();

    clubSelect.addEventListener("change", () => {
      const selectedClub = clubSelect.value;

      let filtered = selectedClub
        ? visibleEvents.filter(ev => ev.club_code === selectedClub)
        : visibleEvents;

      calendar.removeAllEvents();
      calendar.addEventSource(mapEvents(filtered));
    });
  };
});

// ------------------ UPDATE EVENT COLOR ------------------
async function updateEventColor(eventId, newColor) {
  const { error } = await client
    .from("events")
    .update({ color: newColor })
    .eq("id", eventId);

  if (error) {
    console.error("Failed to update event color:", error);
    alert("Error updating event.");
  }
}

let currentUsername = null;

function afterLogin(username) {
  

  currentUsername = currentUser.username;
  alert(currentUsername)
  console.log("Logged in as:", currentUsername);

  document.getElementById("news-board").style.display = "block";
  document.getElementById("calendar").style.display = "block";
  document.getElementById("calendar-filters").style.display = "block";

  if (currentUsername === "farah") {
    document.getElementById("news-editor").style.display = "block";
    alert("watafk")
  }
  loadNews();
}

async function loadNews() {
  const { data, error } = await client
    .from("news")
    .select("content")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading news:", error);
    return;
  }

  const list = document.getElementById("news-list");
  list.innerHTML = "";

  data.forEach(item => {
    const p = document.createElement("p");
    p.innerText = item.content;
    list.appendChild(p);
  });
}


async function updateNews() {
  const input = document.getElementById("news-content");
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  // 1️⃣ Insert news
  const { error } = await client
    .from("news")
    .insert({
      content: content,
      created_by: "farah"
    });

  if (error) {
    console.error("Insert error:", error);
    return;
  }

  // 2️⃣ Trigger notification
const res = await fetch(
  "https://nyzxuzcdaukftswvirog.supabase.co/functions/v1/super-endpoint",
  { method: "POST" }
);

const text = await res.text();
console.log("RAW RESPONSE:", text);


  input.value = "";
  loadNews();
}
// ------------------ ADD EVENT LOGIC ------------------

const ADD_EVENT_ADMINS = ["farah", "ilyes"];

const addEventBtn = document.getElementById("add-event-btn");
const addEventModal = document.getElementById("add-event-modal");

const clubSelect = document.getElementById("event-club");
const newClubInput = document.getElementById("new-club");
const colorInput = document.getElementById("event-color");

const titleInput = document.getElementById("event-title");
const startInput = document.getElementById("event-start");
const endInput = document.getElementById("event-end");

// Show button only for admins
function enableAddEventIfAllowed() {
  if (ADD_EVENT_ADMINS.includes(currentUser.username)) {
    addEventBtn.style.display = "inline-block";
  }
}

// Open modal
addEventBtn.onclick = async () => {
  addEventModal.style.display = "flex";
  await loadClubCodes();
};

// Close modal
document.getElementById("cancel-event").onclick = () => {
  addEventModal.style.display = "none";
  clearEventForm();
};

// Load club codes from DB
async function loadClubCodes() {
  const { data, error } = await client
    .from("events")
    .select("club_code,color");

  if (error) {
    console.error(error);
    return;
  }

  const clubs = {};
  data.forEach(ev => {
    if (!clubs[ev.club_code]) {
      clubs[ev.club_code] = ev.color;
    }
  });

  clubSelect.innerHTML = `<option value="">Select club</option>`;
  Object.keys(clubs).forEach(code => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code.toUpperCase();
    opt.dataset.color = clubs[code];
    clubSelect.appendChild(opt);
  });
}

// When selecting existing club → auto color
clubSelect.onchange = () => {
  const selected = clubSelect.options[clubSelect.selectedIndex];
  const color = selected.dataset.color;

  if (color) {
    colorInput.value = color;
    newClubInput.value = "";
    newClubInput.disabled = true;
  } else {
    newClubInput.disabled = false;
  }
};

// Save event
document.getElementById("save-event").onclick = async () => {
  const title = titleInput.value.trim();
  const clubCode =
    newClubInput.value.trim() || clubSelect.value;

  const color = colorInput.value;
  const startDate = startInput.value;
  const endDate = endInput.value || startDate;

  if (!title || !clubCode || !startDate || !color) {
    alert("Fill all required fields.");
    return;
  }

  const { error } = await client.from("events").insert({
    title,
    club_code: clubCode,
    start_date: startDate,
    end_date: endDate,
    color
  });

  if (error) {
    console.error(error);
    alert("Failed to add event");
    return;
  }

  addEventModal.style.display = "none";
  clearEventForm();
  location.reload(); // reload calendar cleanly
};

// Reset form
function clearEventForm() {
  titleInput.value = "";
  clubSelect.value = "";
  newClubInput.value = "";
  newClubInput.disabled = false;
  startInput.value = "";
  endInput.value = "";
  colorInput.value = "#2563eb";
}







