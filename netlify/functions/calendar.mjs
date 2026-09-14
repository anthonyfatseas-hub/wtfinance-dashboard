function unfoldIcal(text) {
  return text.replace(/\r?\n[ \t]/g, '').replace(/\r?\n/g, '\n');
}

function unescapeIcal(value = '') {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function valueAfterColon(line = '') {
  return line.split(':').slice(1).join(':').trim();
}

function decodeDate(raw = '') {
  const value = valueAfterColon(raw);
  const m = value.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

function decodeDateTime(raw = '') {
  const value = valueAfterColon(raw);
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (!m) return '';
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7] ? 'Z' : ''}`;
}

function parseIcal(text) {
  const lines = unfoldIcal(text).split('\n');
  const rawEvents = [];
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { current = []; continue; }
    if (line === 'END:VEVENT') {
      if (current) rawEvents.push(current);
      current = null;
      continue;
    }
    if (current) current.push(line);
  }

  return rawEvents.map((lines) => {
    const get = (prefix) => lines.find((x) => x.toUpperCase().startsWith(prefix));
    const summaryLine = get('SUMMARY');
    const startLine = get('DTSTART');
    const summary = unescapeIcal(valueAfterColon(summaryLine || ''));
    const attendees = lines
      .filter((x) => /^ATTENDEE/i.test(x))
      .map((x) => ({
        email: x.match(/mailto:([^;:]+)/i)?.[1] || '',
        name: unescapeIcal(x.match(/(?:^|;)CN=([^;:]+)/i)?.[1] || ''),
      }));
    const blob = lines.join('\n');
    const streamyard = blob.match(/https?:\\?\/\\?\/streamyard\.com\/[^^\s\\<>"']+/i)?.[0] || '';
    return {
      summary,
      date: startLine ? decodeDate(startLine) : '',
      startAt: startLine ? decodeDateTime(startLine) : '',
      attendees,
      link: streamyard.replace(/\\/g, ''),
      externalId: unescapeIcal(valueAfterColon(get('UID') || '')),
    };
  }).filter((e) => /WTFinance Interview\s*$/i.test(e.summary));
}

function interviewPayload(events) {
  return events.filter((e) => e.date).map((e) => {
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
  }).filter((e) => e.guest);
}

export default async (request) => {
  const url = new URL(request.url);
  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL || '';

  if (url.pathname.endsWith('/health')) {
    return Response.json({
      ok: Boolean(icalUrl),
      mode: 'ical',
      message: icalUrl ? 'Google Calendar iCal feed configured' : 'Calendar feed not configured',
    });
  }

  if (!icalUrl) {
    return Response.json({ ok: false, error: 'GOOGLE_CALENDAR_ICAL_URL is not configured on the server.' }, { status: 503 });
  }

  try {
    const upstream = await fetch(icalUrl, { headers: { 'User-Agent': 'WTFinance-Dashboard/0.4' } });
    if (!upstream.ok) throw new Error(`Google Calendar feed returned ${upstream.status}`);
    const text = await upstream.text();
    return Response.json({
      ok: true,
      source: 'google-calendar-ical',
      fetchedAt: new Date().toISOString(),
      events: interviewPayload(parseIcal(text)),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Calendar fetch failed' }, { status: 502 });
  }
};
