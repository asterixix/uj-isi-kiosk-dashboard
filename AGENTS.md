# AGENTS.md — Wskazówki dla agentów AI

Ten dokument zawiera kluczowe informacje dla agentów AI (np. Claude, GPT-4) pracujących nad tym kodem.

## Architektura

```
uj-kiosk-dashboard/
├── api/                    # Vercel Serverless Functions
│   ├── departures.ts       # TTSS Kraków API — odjazdy MPK
│   └── student-news.ts     # Scraper komunikatów z isi.uj.edu.pl
├── src/
│   ├── components/         # React components + CSS modules
│   ├── config/appConfig.ts # Konfiguracja przystanków i interwałów
│   ├── hooks/              # Custom React hooks (data fetching)
│   ├── utils/              # Narzędzia (weather, icsParser)
│   ├── types.ts            # TypeScript type definitions
│   └── main.tsx            # Entry point
└── vercel.json             # Konfiguracja deploymentu
```

## Konwencje kodu

### TypeScript
- `verbatimModuleSyntax: true` — importy typów: `import type { X } from 'y'`
- **BEZ** `import React from 'react'` — używaj `import { useState } from 'react'`
- **BEZ** `as any`, `@ts-ignore`, `@ts-expect-error`

### Komentarze
Tylko gdy absolutnie konieczne:
- złożone algorytmy
- wzorce regex
- optymalizacje wydajnościowe
- formuły matematyczne

### Kolorystyka UJ
- Primary blue: `#00519E` (Pantone 2945)
- Accent red: `#A6192E` (Pantone 187)
- Używaj zmiennych CSS: `var(--uj-primary)`, `var(--uj-accent)`

## API endpoints

### GET /api/departures?stopId=XXX
Zwraca nadchodzące odjazdy z przystanku TTSS.

**Parametry:**
- `stopId` — TTSS numeric ID (np. `234361` dla Kampus UJ)

**Response:**
```json
[
  {
    "routeShortName": "8",
    "headsign": "Cichy Kącik",
    "plannedDeparture": "2025-01-15T10:30:00.000Z",
    "expectedDeparture": "2025-01-15T10:32:00.000Z",
    "delaySeconds": 120,
    "vehicleType": "tram",
    "minutesAway": 5
  }
]
```

### GET /api/student-news
Scrapuje komunikaty z isi.uj.edu.pl.

**Response:**
```json
[
  { "id": "news-0", "text": "Dyżur dr hab. Kowalskiej..." }
]
```

## Znane problemy

1. **GTFS-RT nie działa** — ID przystanków w statycznym GTFS (`stops.txt`) są w formacie `stop_1132_268803`, podczas gdy GTFS-RT używa zupełnie innej przestrzeni nazw (7-cyfrowe numery). Rozwiązanie: używamy API TTSS Kraków.

2. **Scraper komunikatów** — Selektor `.article__content p` jest wrażliwy na zmiany CMS UJ. Jeśli przestanie działać, sprawdź strukturę HTML strony `isi.uj.edu.pl/studenci/news/komunikaty`.

3. **CORS** — API endpoints ustawiają `Access-Control-Allow-Origin: *`. Przy deploy na własną domenę, rozważ ograniczenie.

## Testowanie lokalne

```bash
npm run dev     # Frontend
vercel dev      # Frontend + API functions
```

## Deployment

Push do `main` automatycznie deployuje na Vercel (jeśli skonfigurowane).

## Przydatne linki

- [TTSS API docs](https://ttss.mpk.krakow.pl/internetservice/help)
- [Open-Meteo API](https://open-meteo.com/en/docs)
- [UJ Brandbook](https://www.uj.edu.pl/identyfikacja-wizualna)
