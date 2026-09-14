// Local persistence shim plus robust Schedule drag-and-drop and Calendar sync.
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
const PUBLISH_DAYS = [1, 3, 5];

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

function getScheduleRows(root) {
  if (!root) return [];
  const candidates = [...root.querySelectorAll("div")].filter((el) => {
    const label = el.querySelector(":scope > span")?.textContent?.trim();
    return DND_DAYS.includes(label);
  });
  return candidates.filter((el, index) => {
    const label = el.querySelector(":scope > span")?.textContent?.trim();
    const parentHasDay = el.parentElement?.querySelectorAll?.(":scope > div")?.length > 1;
    return Boolean(label) && (parentHasDay || index >= 0);
  });
}

function guest(row) {
  const spans = [...row.querySelectorAll("span")];
  return spans.find((s) => s.style.flex)?.textContent?.replace(/^★\s*/, "").trim() || "";
}

function applyDnD() {
  const root = findSchedule();
  if (!root) return;
  const rows = getScheduleRows(root);
  if (!rows.length) return;

  rows.forEach((row, index) => {
    if (row.dataset.dndBound === "1") return;
    row.dataset.dndBound = "1";
    row.dataset.scheduleIndex = String(index);
    const date = addDays(monday(new Date()), Math.floor(index / 3) * 7 + PUBLISH_DAYS[index % 3] - 1);
    row.dataset.scheduleDate = iso(date);
    if (!guest(row)) return;
    row.draggable = true;
    row.style.cursor = "grab";
    row.addEventListener("dragstart", (event) => {
      window.__wtfDraggedDate = row.dataset.scheduleDate;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", row.dataset.scheduleDate);
      row.style.opacity = "0.45";
    });
    row.addEventListener("dragend", () => {
      window.__wtfDraggedDate = null;
      row.style.opacity = "";
      root.querySelectorAll("[data-wtf-drop]").forEach((r) => { r.style.outline = ""; delete r.dataset.wtfDrop; });
    });
  });

  if (root.dataset.dndRootBound === "1") return;
  root.dataset.dndRootBound = "1";
  root.addEventListener("dragover", (event) => {
    const row = event.target.closest?.("[data-schedule-date]");
    if (!row || !window.__wtfDraggedDate) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    row.dataset.wtfDrop = "1";
    row.style.outline = "2px solid #F5C542";
  });

  root.addEventListener("dragleave", (event) => {
    const row = event.target.closest?.("[data-schedule-date]");
    if (!row) return;
    row.style.outline = "";
    delete row.dataset.wtfDrop;
  });

  root.addEventListener("drop", (event) => {
    const row = event.target.closest?.("[data-schedule-date]");
    const fromDate = window.__wtfDraggedDate || event.dataTransfer.getData("text/plain");
    if (!row || !fromDate) return;
    event.preventDefault();
    root.querySelectorAll("[data-wtf-drop]").forEach((r) => { r.style.outline = ""; delete r.dataset.wtfDrop; });
    const toDate = row.dataset.scheduleDate;
    if (!toDate || toDate === fromDate) return;

    try {
      const raw = localStorage.getItem(DND_KEY);
      const data = raw ? JSON.parse(raw) : null;
      if (!data?.episodes) return;
      const source = data.episodes.find((e) => e.publish === fromDate);
      if (!source) return;
      const target = data.episodes.find((e) => e.publish === toDate);
      if (target && target.id !== source.id) target.publish = fromDate;
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

function scheduleSlots(fromDate, count = 30) {
  const out = [];
  let cursor = monday(fromDate);
  for (let week = 0; week < 10 && out.length < count; week += 1) {
    for (const dayOffset of [0, 2, 4]) out.push(iso(addDays(cursor, week * 7 + dayOffset)));
  }
  return out;
}

async function syncCalendarDirect() {
  if (window.__wtfCalendarSyncing) return;
  window.__wtfCalendarSyncing = true;
  try {
    const response = await fetch("/api/calendar", { cache: "no-store", credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) throw new Error(payload.error || `Calendar sync failed (${response.status})`);
    const raw = localStorage.getItem(DND_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const next = {
      ...data,
      guests: [...(data.guests || [])],
      episodes: [...(data.episodes || [])],
      subs: [...(data.subs || [])],
      views: [...(data.views || [])],
    };
    let changed = false;
    let sequence = 0;
    for (const ev of payload.events || []) {
      if (!ev.guest || !ev.date) continue;
      let g = next.guests.find((x) => x.name?.trim().toLowerCase() === ev.guest.trim().toLowerCase());
      if (!g) {
        g = { id: `g${Date.now()}${sequence++}`, name: ev.guest, email: ev.email || "", org: "" };
        next.guests.push(g);
        changed = true;
      } else if (ev.email && !g.email) {
        g.email = ev.email;
        changed = true;
      }
      let ep = next.episodes.find((e) => ev.externalId && e.calendarEventId === ev.externalId);
      if (!ep) ep = next.episodes.find((e) => e.guestId === g.id && e.record === ev.date);
      if (ep) {
        const before = JSON.stringify([ep.record, ep.link, ep.guestId]);
        ep.record = ev.date;
        ep.link = ev.link || ep.link || "";
        ep.guestId = g.id;
        ep.calendarEventId = ev.externalId || ep.calendarEventId || "";
        if (JSON.stringify([ep.record, ep.link, ep.guestId]) !== before) changed = true;
      } else {
        next.episodes.push({ id: `s${Date.now()}${sequence++}`, calendarEventId: ev.externalId || "", guestId: g.id, record: ev.date, publish: "", status: "Scheduled", link: ev.link || "", priority: false, views: null, prep: "", notes: "" });
        changed = true;
      }
    }

    // Give newly imported episodes the earliest genuinely open publish slots.
    const occupied = new Set(next.episodes.map((e) => e.publish).filter(Boolean));
    const slots = scheduleSlots(new Date());
    for (const ep of next.episodes.filter((e) => e.record && !e.publish && e.status !== "Published")) {
      const preferred = slots.find((slot) => !occupied.has(slot) && slot >= ep.record);
      if (preferred) { ep.publish = preferred; occupied.add(preferred); changed = true; }
    }

    if (changed) {
      localStorage.setItem(DND_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("wtf-calendar-updated"));
      window.location.reload();
    }
    window.__wtfCalendarLastSync = Date.now();
  } catch (error) {
    console.warn("WTFinance Calendar sync unavailable", error);
  } finally {
    window.__wtfCalendarSyncing = false;
  }
}

setTimeout(syncCalendarDirect, 1200);
setInterval(syncCalendarDirect, 5 * 60 * 1000);
window.addEventListener("focus", syncCalendarDirect);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") syncCalendarDirect(); });
