import { useTimeWeather } from '../hooks/useTimeWeather';
import { getWeatherInfo } from '../utils/weather';
import './TimeWeatherWidget.css';

export function TimeWeatherWidget() {
  const { clock, weather, weatherError } = useTimeWeather();

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
    </div>
  );
}
