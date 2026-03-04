# Tablica informacyjna — Uniwersytet Jagielloński (ISI UJ)

Interaktywna tablica kioskowa wyświetlająca komunikaty dla studentów Instytutu Studiów Interkulturowych UJ.

## Funkcje

- **Pogoda** — aktualne warunki dla Krakowa (Open-Meteo API)
- **Godzina i data** — zegar w strefie Europe/Warsaw
- **Komunikaty studenckie** — scrapowane z [isi.uj.edu.pl/studenci/news/komunikaty](https://isi.uj.edu.pl/studenci/news/komunikaty)
- **Odjazdy MPK** — najbliższe tramwaje i autobusy z przystanków Kampus UJ i Norymberska (TTSS Kraków)
- **Kalendarz wydarzeń** — wczytywanie pliku `.ics` z własnymi wydarzeniami

## Technologia

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Vercel Serverless Functions
- **Styl**: CSS z kolorami UJ (niebieski `#00519E`, czerwony `#A6192E`)

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja dostępna pod `http://localhost:5173`.

## Budowa produkcyjna

```bash
npm run build
```

Pliki wyjściowe w katalogu `dist/`.

## Deployment

Projekt jest gotowy do wdrożenia na Vercel:

1. Połącz repozytorium z Vercel
2. Vercel automatycznie wykryje konfigurację Vite

## Konfiguracja przystanków

Przystanki MPK zdefiniowane są w `src/config/appConfig.ts`. ID przystanków pochodzą z API TTSS Kraków.

Aby zweryfikować lub zmienić ID przystanku:
1. Otwórz `https://ttss.mpk.krakow.pl/internetservice/services/passageInfo/stopPassages/stop?stop=<ID>`
2. Jeśli odpowiedź zawiera odjazdy — ID jest poprawne

## Kalendarz ICS

Użytkownik może wczytać własny plik `.ics` z wydarzeniami. Plik jest przechowywany w `localStorage` przeglądarki.

## Licencja

MIT
