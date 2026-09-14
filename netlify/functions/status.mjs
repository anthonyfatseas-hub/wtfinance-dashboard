export default async () => {
  const calendarConfigured = Boolean(process.env.GOOGLE_CALENDAR_ICAL_URL);
  const openAIConfigured = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_PREP_MODEL || 'gpt-5.6-terra';

  return Response.json({
    ok: true,
    integrations: {
      calendar: { configured: calendarConfigured, mode: 'server-side iCal feed' },
      openai: { configured: openAIConfigured, model },
      vidiq: { configured: false, mode: 'pending server-side integration' },
      opus: { configured: false, mode: 'pending backend integration' },
    },
    checkedAt: new Date().toISOString(),
  }, { headers: { 'Cache-Control': 'no-store' } });
};
