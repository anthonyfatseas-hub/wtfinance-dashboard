# WTFinance Content OS - v0.6

Standalone WTFinance content dashboard. Podcast preparation runs through a server-side Netlify Function using the OpenAI Responses API with web search. The default preparation model is `gpt-5.6-terra`.

## Current state

- Podcast Schedule, Pipeline, Prior Guests and Targets
- Episode and guest editing with browser persistence
- AI interview preparation and revision via `/api/prep`
- Google Calendar interview sync via `/api/calendar` and `/api/calendar/health`
- StreamYard links are extracted from matching Google Calendar events
- OpusClip remains a separate integration to be connected later
- vidIQ is being handled as a separate server-side integration so the deployed app does not depend on a ChatGPT-only OAuth session

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

Connect the GitHub repository to Netlify on the `main` branch so every push automatically deploys a new version.
