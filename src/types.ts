export interface CalendarEvent {
  id: string;
  summary: string;
  location: string;
  description: string;
  courseType: string;
  lecturer: string;
  start: Date;
  end: Date;
}

export interface Departure {
  routeShortName: string;
  headsign: string;
  plannedDeparture: string;
  expectedDeparture: string;
  delaySeconds: number;
  vehicleType: 'tram' | 'bus';
  minutesAway: number;
}

export interface NewsItem {
  id: string;
  text: string;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  time: string;
}
