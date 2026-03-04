import { useState, useEffect, useRef } from 'react';
import type { WeatherData } from '../types';
import { appConfig } from '../config/appConfig';

interface TimeState {
  time: string;
  date: string;
  seconds: string;
}

function formatWarsawTime(): TimeState {
  const now = new Date();
  const opts = { timeZone: appConfig.location.timezone } as const;

  const time = now.toLocaleTimeString('pl-PL', { ...opts, hour: '2-digit', minute: '2-digit', hour12: false });
  const seconds = now.toLocaleTimeString('pl-PL', { ...opts, second: '2-digit' }).slice(-2);
  const date = now.toLocaleDateString('pl-PL', { ...opts, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return { time, date, seconds };
}

export function useTimeWeather() {
  const [clock, setClock] = useState<TimeState>(formatWarsawTime);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const lastFetchRef = useRef<string>('');

  useEffect(() => {
    const id = setInterval(() => setClock(formatWarsawTime()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { lat, lon } = appConfig.location;
        const url = `${appConfig.weather.baseUrl}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const current = data.current;
        setWeather({
          temperature: current.temperature_2m,
          weatherCode: current.weather_code,
          windSpeed: current.wind_speed_10m,
          time: current.time,
        });
        lastFetchRef.current = new Date().toLocaleTimeString('pl-PL', { timeZone: appConfig.location.timezone });
        setWeatherError(false);
      } catch {
        setWeatherError(true);
      }
    };

    fetchWeather();
    const id = setInterval(fetchWeather, appConfig.weather.refreshIntervalMs);
    return () => clearInterval(id);
  }, []);

  return { clock, weather, weatherError, lastWeatherFetch: lastFetchRef.current };
}
