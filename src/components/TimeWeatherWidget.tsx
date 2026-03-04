import type { AirQualityData } from '../types';
import { useTimeWeather } from '../hooks/useTimeWeather';
import { getWeatherInfo } from '../utils/weather';
import './TimeWeatherWidget.css';

function aqiLevel(eaqi: number): { label: string; color: string } {
  if (eaqi <= 20) return { label: 'Bardzo dobra', color: 'var(--aqi-good)' };
  if (eaqi <= 40) return { label: 'Dobra', color: 'var(--aqi-fair)' };
  if (eaqi <= 60) return { label: 'Umiarkowana', color: 'var(--aqi-moderate)' };
  if (eaqi <= 80) return { label: 'Zła', color: 'var(--aqi-poor)' };
  if (eaqi <= 100) return { label: 'Bardzo zła', color: 'var(--aqi-very-poor)' };
  return { label: 'Skrajnie zła', color: 'var(--aqi-extremely-poor)' };
}

function AirQualitySection({ data }: { data: AirQualityData }) {
  const level = aqiLevel(data.europeanAqi);
  return (
    <div className="air-quality-section">
      <div className="air-quality-header">
        <span className="air-quality-icon">🌫</span>
        <span className="air-quality-label" style={{ color: level.color }}>{level.label}</span>
        <span className="air-quality-eaqi" style={{ background: level.color }}>EAQI {data.europeanAqi}</span>
      </div>
      <div className="air-quality-values">
        <span className="air-quality-pm">PM2.5 <b>{data.pm25}</b> µg/m³</span>
        <span className="air-quality-pm">PM10 <b>{data.pm10}</b> µg/m³</span>
      </div>
    </div>
  );
}

export function TimeWeatherWidget() {
  const { clock, weather, weatherError, airQuality } = useTimeWeather();
  const weatherInfo = weather ? getWeatherInfo(weather.weatherCode) : null;

  return (
    <div className="time-weather-widget">
      <div className="clock-section">
        <div className="time-display">
          <span className="time-main">{clock.time}</span>
          <span className="time-seconds">:{clock.seconds}</span>
        </div>
        <div className="date-display">{clock.date}</div>
      </div>

      <div className="weather-section">
        {weatherError && <div className="weather-error">⚠ Weather unavailable</div>}
        {weather && weatherInfo && (
          <>
            <div className="weather-main">
              <span className="weather-icon">{weatherInfo.icon}</span>
              <span className="weather-temp">{Math.round(weather.temperature)}°C</span>
            </div>
            <div className="weather-details">
              <span className="weather-label">{weatherInfo.label}</span>
              <span className="weather-wind">💨 {Math.round(weather.windSpeed)} km/h</span>
            </div>
          </>
        )}
        {!weather && !weatherError && <div className="weather-loading">Loading weather…</div>}
      </div>

      {airQuality && <AirQualitySection data={airQuality} />}

      <div className="logos-section">
        <img
          src="/images/isi.png"
          alt="ISI UJ"
          className="logo-img"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <img
          src="/images/knzi.png"
          alt="KNZI"
          className="logo-img"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    </div>
  );
}
