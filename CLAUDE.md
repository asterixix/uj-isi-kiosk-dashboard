# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read `AGENTS.md` too — it holds code conventions (TS rules, comment policy, UJ colors), API response shapes and known issues. Not repeated here.

## Commands

```bash
npm run dev      # Vite frontend only (/api/* not served)
vercel dev       # frontend + serverless functions
npm run build    # prebuild (generate-ics) -> tsc -b -> vite build
npm run lint     # eslint
npx tsx scripts/generate-ics.ts   # regenerate public/calendar.ics alone
```

No test suite exists.

## Architecture

Kiosk dashboard for ISI UJ. React 19 + Vite SPA, Vercel serverless functions in `api/`. UI text is Polish.

- **Several pages, one bundle.** `src/main.tsx` picks a page by path prefix (`ROUTES`): `/targi` (open-day variant, components in `components/targi/`), `/inauguracja` (event dashboard), `/inauguracja/infografika` (auto-rotating slides for a second monitor), `/inauguracja/zadania` (the only clickable page: OSINT tasks for visitors), `/inauguracja/sciagawka` (printable answers); everything else renders `App`. Inauguracja content lives in `pages/inauguracjaData.ts`. `vercel.json` rewrites all non-API paths to `index.html`.
- **Data flow.** Each panel has a polling hook in `src/hooks/` (`useDepartures`, `useStudentNews`, `useUJNews`, `useCalendar`, `useTimeWeather`). Intervals, stop IDs and coordinates live in `src/config/appConfig.ts`. Weather/air quality hit Open-Meteo directly from the browser; everything else goes through `/api/*`.
- **News scraping.** `api/_news-scraper.ts` / `api/_uj-news-scraper.ts` (underscore = shared module, not an endpoint) scrape with cheerio. `api/student-news.ts` and `api/uj-news.ts` read `@vercel/kv` first, scrape on miss. `api/cron/*` (daily 02:00 via `vercel.json` crons, guarded by `CRON_SECRET` bearer) refresh KV. API imports use `.js` extensions.
- **Calendar pipeline.** `scripts/generate-ics.ts` runs as `prebuild`: parses timetable JSON from `public/plans/{winter,summer}/*.json` into `public/calendar.ics` (semester dates, time slots, OCR-typo-tolerant course-type regexes hardcoded at top of script). If no plan files exist it skips and keeps the committed `calendar.ics`. Frontend fetches static `/calendar.ics` hourly, parses with `src/utils/icsParser.ts` (ical.js); `useEventNotifications` fires sound/banner before events. `api/calendar.ts` just serves the same file.
- **Departures.** `api/departures.ts` proxies TTSS Kraków (not GTFS-RT — see AGENTS.md known issues).
