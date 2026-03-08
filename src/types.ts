export interface CalendarEvent {
  id: string;
  summary: string;
  subject: string;
  location: string;
  description: string;
  courseType: string;
  lecturer: string;
  program: string;
  studyDegree: string;
  studyYear: number | null;
  groupLabel: string;
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
  isScheduled?: boolean;
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

export interface UJNewsItem {
  id: string;
  title: string;
  date: string;
  url: string;
}

export interface AirQualityData {
  pm10: number;
  pm25: number;
  europeanAqi: number;
}
