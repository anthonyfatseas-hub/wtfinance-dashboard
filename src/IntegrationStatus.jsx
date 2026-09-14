import React, { useEffect, useState } from 'react';

const STATUS_URL = '/api/status';
const CALENDAR_HEALTH_URL = '/api/calendar/health';

export default function IntegrationStatus() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ loading: true, integrations: null, calendarHealth: null, error: '' });

  const refresh = async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const [statusRes, calendarRes] = await Promise.all([
        fetch(`${STATUS_URL}?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`${CALENDAR_HEALTH_URL}?t=${Date.now()}`, { cache: 'no-store' }),
      ]);
      const status = await statusRes.json().catch(() => ({}));
      const calendarHealth = await calendarRes.json().catch(() => ({ ok: false }));
      if (!statusRes.ok) throw new Error(status?.error || `Integration status failed (${statusRes.status})`);
      setState({ loading: false, integrations: status.integrations || {}, calendarHealth, error: '' });
    } catch (error) {
      setState({ loading: false, integrations: null, calendarHealth: null, error: error?.message || 'Unable to check integrations' });
    }
  };

  useEffect(() => { refresh(); }, []);

  const items = [
    {
      key: 'calendar',
      label: 'Google Calendar',
      detail: state.calendarHealth?.ok
        ? `${state.calendarHealth.interviewCount ?? 0} WTFinance interviews found`
        : state.integrations?.calendar?.configured
          ? (state.calendarHealth?.message || 'Configured, health check failed')
          : 'Not configured in Netlify',
      ok: Boolean(state.calendarHealth?.ok),
    },
    {
      key: 'openai',
      label: 'OpenAI / Terra',
      detail: state.integrations?.openai?.configured
        ? `Configured · ${state.integrations.openai.model || 'prep model'}`
        : 'OPENAI_API_KEY not configured in Netlify',
      ok: Boolean(state.integrations?.openai?.configured),
    },
    {
      key: 'vidiq',
      label: 'vidIQ',
      detail: state.integrations?.vidiq?.mode || 'Backend integration pending',
      ok: Boolean(state.integrations?.vidiq?.configured),
    },
    {
      key: 'opus',
      label: 'OpusClip',
      detail: state.integrations?.opus?.mode || 'Backend integration pending',
      ok: Boolean(state.integrations?.opus?.configured),
    },
  ];

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Integration status"
        aria-label="Integration status"
        style={{
          position: 'fixed', right: 18, bottom: 18, zIndex: 100,
          width: 42, height: 42, borderRadius: 999, border: '1px solid #254273',
          background: '#122444', color: '#DCE4F2', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0,0,0,.28)', fontSize: 18,
        }}
      >{state.loading ? '…' : items.every((x) => x.ok) ? '✓' : '!'}</button>

      {open && (
        <div style={{
          position: 'fixed', right: 18, bottom: 68, zIndex: 99, width: 330,
          background: '#122444', border: '1px solid #254273', borderRadius: 8,
          padding: 14, color: '#DCE4F2', boxShadow: '0 18px 45px rgba(0,0,0,.35)',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>Integrations</strong>
            <button onClick={refresh} style={{ background: 'transparent', border: 0, color: '#F5C542', cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
          </div>
          {state.error && <div style={{ fontSize: 11.5, color: '#F0855C', marginBottom: 8 }}>{state.error}</div>}
          {items.map((item) => (
            <div key={item.key} style={{ padding: '9px 0', borderTop: '1px solid #254273' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 650 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: item.ok ? '#5FC58D' : '#F0855C' }} />
                {item.label}
              </div>
              <div style={{ marginTop: 3, paddingLeft: 15, color: '#8296B8', fontSize: 11 }}>{item.detail}</div>
            </div>
          ))}
          <div style={{ marginTop: 9, color: '#8296B8', fontSize: 10.5, lineHeight: 1.45 }}>
            Calendar and OpenAI use server-side Netlify secrets. Nothing sensitive is exposed to the browser.
          </div>
        </div>
      )}
    </>
  );
}
