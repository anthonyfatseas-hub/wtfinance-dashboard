// Local persistence shim plus robust Schedule drag-and-drop.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value == null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { ok: true };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { ok: true };
    },
  };
}

const DND_KEY = "wtf_pipeline_v8";
const DND_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const monday = (date) => {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  return x;
};
const addDays = (date, n) => { const x = new Date(date); x.setDate(x.getDate() + n); return x; };
const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function findSchedule() {
  const marker = [...document.querySelectorAll("div")].find((el) => el.textContent?.trim() === "Monday, Wednesday, Friday. Ten weeks out.");
  return marker?.parentElement || null;
}

function getRows(root) {
  if (!root) return [];
  return [...root.querySelectorAll("div")].filter((el) => {
    if (el.parentElement?.parentElement?.parentElement !== root) return false;
    const first = el.querySelector(":scope > span");
    return first && DND_DAYS.includes(first.textContent?.trim());
  });
}

function getDate(row) {
  const week = row.parentElement?.parentElement;
  if (!week) return null;
  const root = week.parentElement;
  const weeks = [...root.children].filter((el) => [...el.children].some((c) => [...c.children].some((x) => DND_DAYS.includes(x.querySelector?.(":scope > span")?.textContent?.trim()))));
  const weekIndex = weeks.indexOf(week);
  if (weekIndex < 0) return null;
  const label = row.querySelector(":scope > span")?.textContent?.trim();
  const dayOffset = DND_DAYS.indexOf(label);
  return dayOffset < 0 ? null : iso(addDays(monday(new Date()), weekIndex * 7 + dayOffset));
}

function guest(row) {
  const spans = [...row.querySelectorAll("span")];
  return spans.find((s) => s.style.flex)?.textContent?.replace(/^★\s*/, "").trim() || "";
}

function applyDnD() {
  const root = findSchedule();
  if (!root || root.dataset.dndReady === "1") return;
  const rows = getRows(root);
  if (!rows.length) return;
  root.dataset.dndReady = "1";
  let draggedDate = null;

  rows.forEach((row) => {
    const date = getDate(row);
    if (!date) return;
    row.dataset.scheduleDate = date;
    const hasGuest = Boolean(guest(row));
    if (!hasGuest) return;
    row.draggable = true;
    row.style.cursor = "grab";
    row.addEventListener("dragstart", (event) => {
      draggedDate = row.dataset.scheduleDate;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedDate);
      row.style.opacity = "0.45";
    });
    row.addEventListener("dragend", () => {
      draggedDate = null;
      row.style.opacity = "";
      rows.forEach((r) => { r.style.outline = ""; });
    });
  });

  root.addEventListener("dragover", (event) => {
    const row = event.target.closest?.("[data-schedule-date]");
    if (!row || !draggedDate) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    row.style.outline = "2px solid #F5C542";
  });

  root.addEventListener("drop", (event) => {
    const row = event.target.closest?.("[data-schedule-date]");
    if (!row || !draggedDate) return;
    event.preventDefault();
    rows.forEach((r) => { r.style.outline = ""; });
    const toDate = row.dataset.scheduleDate;
    if (!toDate || toDate === draggedDate) return;
    try {
      const raw = localStorage.getItem(DND_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (!data?.episodes) return;
      const source = data.episodes.find((e) => e.publish === draggedDate);
      if (!source) return;
      const target = data.episodes.find((e) => e.publish === toDate);
      if (target && target.id !== source.id) target.publish = draggedDate;
      source.publish = toDate;
      localStorage.setItem(DND_KEY, JSON.stringify(data));
      window.location.reload();
    } catch (error) {
      console.error("Schedule drag-and-drop failed", error);
    }
  });
}

const observer = new MutationObserver(applyDnD);
observer.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(applyDnD, 500);

// Calendar stays current without requiring a manual button press. This is a UI-level
// bridge for the current app architecture: it invokes the existing server-side sync
// every 10 minutes and when the tab becomes active.
let lastCalendarTrigger = 0;
function triggerCalendarSync(force = false) {
  const now = Date.now();
  if (!force && now - lastCalendarTrigger < 9 * 60 * 1000) return;
  const button = [...document.querySelectorAll("button")].find((b) => /^(Update Now|Sync Calendar)$/.test(b.textContent?.trim()));
  if (!button || button.disabled) return;
  lastCalendarTrigger = now;
  button.click();
}

const calendarSyncObserver = new MutationObserver(() => {
  if (document.visibilityState === "visible") triggerCalendarSync();
});
calendarSyncObserver.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(() => triggerCalendarSync(true), 2500);
window.addEventListener("focus", () => triggerCalendarSync(true));
