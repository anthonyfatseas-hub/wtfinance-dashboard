export const integrationConfig = {
  calendar: {
    label: 'Google Calendar',
    endpoint: import.meta.env.VITE_CALENDAR_SYNC_URL || '/api/calendar',
    healthEndpoint: '/api/calendar/health',
    mode: 'server-side iCal feed',
  },
  opus: {
    label: 'OpusClip',
    endpoint: import.meta.env.VITE_OPUS_SYNC_URL || '',
    connected: Boolean(import.meta.env.VITE_OPUS_SYNC_URL),
  },
};

export async function calendarHealth() {
  try {
    const res = await fetch(integrationConfig.calendar.healthEndpoint, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return { ok: false, message: `Calendar health check failed (${res.status})` };
    return res.json();
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

export async function fetchCalendarInterviews() {
  const res = await fetch(integrationConfig.calendar.endpoint, { credentials: 'include', cache: 'no-store' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) throw new Error(body.error || `Calendar sync failed (${res.status})`);
  return body;
}

export async function fetchOpusWorkspace() {
  if (!integrationConfig.opus.endpoint) {
    throw new Error('Opus is not connected yet. Add VITE_OPUS_SYNC_URL after MCP/backend setup.');
  }
  const res = await fetch(integrationConfig.opus.endpoint, { credentials: 'include' });
  if (!res.ok) throw new Error(`Opus sync failed (${res.status})`);
  return res.json();
}

export async function generatePrep(payload) {
  const res = await fetch('/api/prep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) throw new Error(body.error || `Preparation generation failed (${res.status})`);
  return body.text || '';
}
