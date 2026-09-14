# WTFinance Content OS - v0.6

Standalone WTFinance content dashboard. Podcast preparation runs through a server-side Netlify Function using the OpenAI Responses API with web search. The default preparation model is `gpt-5.6-terra`.

## Current state

- Podcast Schedule, Pipeline, Prior Guests and Targets
- Episode and guest editing
- AI interview preparation and revision
- Google Calendar and Opus integrations are present architecturally but intentionally not connected yet
- Server-side environment variables for future integrations

## Environment variables

Keep secrets server-side. Do not commit `.env`.

```bash
OPENAI_API_KEY=""
OPENAI_PREP_MODEL="gpt-5.6-terra"
GOOGLE_CALENDAR_ICAL_URL=""
```

## Run locally

```bash
npm install
npm run dev
```

## Netlify

Build command: `npm run build`

Publish directory: `dist`

Functions directory: `netlify/functions`
