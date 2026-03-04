export const appConfig = {
  location: {
    lat: 50.0614,
    lon: 19.9366,
    timezone: 'Europe/Warsaw',
    cityName: 'Kraków',
  },

  weather: {
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
    refreshIntervalMs: 600_000,
  },

  airQuality: {
    baseUrl: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    refreshIntervalMs: 1_800_000,
  },

  stops: [
    {
      id: 'kampus-uj',
      label: 'Kampus UJ',
      stopIds: ['234361'],
    },
    {
      id: 'norymberska',
      label: 'Norymberska',
      // TODO: verify via https://ttss.mpk.krakow.pl/internetservice/services/passageInfo/stopPassages/stop?stop=<id>
      stopIds: ['234363'],
    },
  ],

  departures: {
    refreshIntervalMs: 15_000,
    maxDepartures: 15,
  },

  news: {
    refreshIntervalMs: 86_400_000,
  },

  notifications: {
    checkIntervalMs: 30_000,
    alertBeforeMinutes: 5,
  },
} as const;
