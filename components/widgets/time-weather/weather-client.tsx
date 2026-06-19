"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  updatedAt: number;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const mm = minutes.toString().padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function WeatherClient() {
  const [time, setTime] = useState<Date>(() => new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Tick the clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Weather fetch failed");
        const data: WeatherData = await res.json();
        if (!cancelled) {
          setWeather(data);
          setWeatherLoading(false);
        }
      } catch {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    }

    fetchWeather();

    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-full flex-col justify-between">
      {/* Label */}
      <p className="text-xs font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
        Time &amp; Weather
      </p>

      {/* Time section — always visible */}
      <div className="mt-2">
        <p className="text-4xl font-light tracking-tight text-[var(--color-text-primary)]">
          {formatTime(time)}
        </p>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{formatDate(time)}</p>
      </div>

      {/* Weather section */}
      <div className="mt-3 flex items-center gap-2">
        {weatherLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />
            <div className="space-y-1">
              <div className="h-5 w-16 animate-pulse rounded bg-[var(--color-surface-hover)]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]/50" />
            </div>
          </div>
        ) : weather ? (
          <>
            <img
              src={getWeatherIconUrl(weather.icon)}
              alt={weather.description}
              className="h-10 w-10"
            />
            <div>
              <p className="text-lg font-medium text-[var(--color-text-primary)]">
                {weather.temp}&deg;
              </p>
              <p className="text-[11px] capitalize text-[var(--color-text-muted)]">
                {weather.description}
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Weather unavailable</p>
        )}
      </div>
    </div>
  );
}
