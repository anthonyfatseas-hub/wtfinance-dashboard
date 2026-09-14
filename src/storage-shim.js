// Local persistence shim plus lightweight Schedule drag-and-drop.
// Schedule DnD updates the same localStorage record used by the dashboard.
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

function monday(date) {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1));
  return x;
}
function addDays(date, n) {
  const x = new Date(date);
  x.setDate(x.getDate() + n);
  return x;
}
function iso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function dayOffset(label) {
  return DND_DAYS.indexOf(label);
}

function getScheduleRoot() {
  const marker = [...document.querySelectorAll("div")].find((el) => el.textContent?.trim() === "Monday, Wednesday, Friday. Ten weeks out.");
  return marker?.parentElement || null;
}

function scheduleRows(root) {
  if (!root) return [];
  return [...root.children].flatMap((week) => {
    const slotColumn = [...week.children].find((child) => child.children?.length === 3);
    return slotColumn ? [...slotColumn.children] : [];
  });
}

function rowDate(row, root) {
  const week = row.parentElement?.parentElement;
  if (!week) return null;
  const weekIndex = [...root.children].indexOf(week) - 1;
  if (weekIndex < 0) return null;
  const label = row.querySelector("span")?.textContent?.trim();
  const offset = dayOffset(label);
  if (offset < 0) return null;
  return iso(addDays(monday(new Date()), weekIndex * 7 + offset));
}

function guestFromRow(row) {
  const spans = [...row.querySelectorAll("span")];
  const guest = spans.find((s) => s.style.flex?.includes("1"));
  return guest?.textContent?.replace(/^★\s*/, "").trim() || "";
}

function enableScheduleDnD() {
  const root = getScheduleRoot();
  if (!root || root.dataset.dndReady === "1") return;
  root.dataset.dndReady = "1";
  const rows = scheduleRows(root);
  rows.forEach((row) => {
    const date = rowDate(row, root);
    if (!date) return;
    row.dataset.scheduleDate = date;
    row.draggable = Boolean(guestFromRow(row));
    row.style.transition = "opacity .12s, outline .12s, background .12s";
    row.addEventListener("dragstart", (event) => {
      if (!guestFromRow(row)) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", date);
      row.style.opacity = "0.45";
    });
    row.addEventListener("dragend", () => { row.style.opacity = ""; });
    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      row.style.outline = "2px solid #F5C542";
    });
    row.addEventListener("dragleave", () => { row.style.outline = ""; });
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.style.outline = "";
      const fromDate = event.dataTransfer.getData("text/plain");
      const toDate = row.dataset.scheduleDate;
      if (!fromDate || !toDate || fromDate === toDate) return;
      try {
        const raw = localStorage.getItem(DND_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        const source = data.episodes?.find((e) => e.publish === fromDate);
        if (!source) return;
        const target = data.episodes?.find((e) => e.publish === toDate);
        if (target && target.id !== source.id) target.publish = fromDate;
        source.publish = toDate;
        localStorage.setItem(DND_KEY, JSON.stringify(data));
        window.location.reload();
      } catch (error) {
        console.error("Schedule drag-and-drop failed", error);
      }
    });
  });
}

const observer = new MutationObserver(() => enableScheduleDnD());
observer.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(enableScheduleDnD, 300);
