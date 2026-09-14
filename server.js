import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const ICAL_URL = process.env.GOOGLE_CALENDAR_ICAL_URL || '';

function unfoldIcal(text) {
  return text.replace(/\r?\n[ \t]/g, '').replace(/\r?\n/g, '\n');
}

function unescapeIcal(value = '') {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function decodeDate(raw = '') {
  const value = raw.split(':').slice(1).join(':').trim();
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

function decodeDateTime(raw = '') {
  const value = raw.split(':').slice(1).join(':').trim();
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`;
}

function parseIcal(text) {
  const lines = unfoldIcal(text).split('\n');
  const events = [];
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = []; continue; }
    if (line === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (current) current.push(line);
  }

  return events.map((lines) => {
    const get = (prefix) => lines.find((x) => x.toUpperCase().startsWith(prefix));
    const summaryLine = get('SUMMARY');
    const startLine = get('DTSTART');
    const summary = unescapeIcal(summaryLine?.split(':').slice(1).join(':') || '');
    const startAt = startLine ? decodeDateTime(startLine) : '';
    const date = startLine ? decodeDate(startLine) : '';
    const attendees = lines
      .filter((x) => /^ATTENDEE/i.test(x))
      .map((x) => {
        const mail = x.match(/mailto:([^;:]+)/i)?.[1] || '';
        const cn = x.match(/(?:^|;)CN=([^;:]+)/i)?.[1] || '';
        return { email: mail, name: unescapeIcal(cn) };
      });
    const blob = lines.join('\n');
    const streamyard = blob.match(/https?:\\?\/\\?\/streamyard\.com\/[^^\s\\<>\"]+/i)?.[0] || '';
    const externalId = unescapeIcal(get('UID')?.split(':').slice(1).join(':') || '');
    return { summary, date, startAt, attendees, link: streamyard.replace(/\\/g, ''), externalId };
  }).filter((e) => /WTFinance Interview\s*$/i.test(e.summary));
}

function interviewPayload(events) {
  return events
    .filter((e) => e.date)
    .map((e) => {
      const guest = e.summary.replace(/WTFinance Interview\s*$/i, '').trim();
      const attendee = e.attendees.find((a) => a.email) || {};
      return {
        externalId: e.externalId || `${guest}|${e.date}`,
        guest,
        email: attendee.email || '',
        date: e.date,
        startAt: e.startAt || '',
        link: e.link || '',
      };
    })
    .filter((e) => e.guest);
}

async function calendarHandler(res) {
  if (!ICAL_URL) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'GOOGLE_CALENDAR_ICAL_URL is not configured on the server.' }));
    return;
  }
  try {
    const upstream = await fetch(ICAL_URL, { headers: { 'User-Agent': 'WTFinance-Dashboard/0.2' } });
    if (!upstream.ok) throw new Error(`Google Calendar feed returned ${upstream.status}`);
    const text = await upstream.text();
    const events = interviewPayload(parseIcal(text));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ ok: true, source: 'google-calendar-ical', fetchedAt: new Date().toISOString(), events }));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
}

function serveStatic(req, res) {
  const dist = path.join(__dirname, 'dist');
  let pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (pathname === '/') pathname = '/index.html';
  const file = path.join(dist, pathname.replace(/^\//, ''));
  if (!file.startsWith(dist)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, (err, data) => {
    if (err) {
      if (pathname !== '/index.html') return fs.readFile(path.join(dist, 'index.html'), (e, d) => {
        if (e) { res.writeHead(404); res.end('Not found'); } else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(d); }
      });
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(file);
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/calendar') return calendarHandler(res);
  if (url.pathname === '/api/calendar/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: Boolean(ICAL_URL), mode: 'ical', message: ICAL_URL ? 'Google Calendar iCal feed configured' : 'Calendar feed not configured' }));
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => console.log(`WTFinance dashboard listening on http://localhost:${PORT}`));
