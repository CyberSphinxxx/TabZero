import { NextResponse } from "next/server";

// Cagayan de Oro coordinates
const LAT = 8.4772;
const LON = 124.6459;

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface WeatherCache {
  data: WeatherResponse;
  timestamp: number;
}

interface WeatherResponse {
  temp: number;
  description: string;
  icon: string;
  updatedAt: number;
}

let cache: WeatherCache | null = null;

export async function GET() {
  try {
    // Return cached data if still fresh
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION_MS) {
      return NextResponse.json(cache.data);
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey || apiKey.length === 0) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`OpenWeatherMap API error: ${response.status}`);
      // If we have stale cache, serve it rather than erroring
      if (cache) {
        return NextResponse.json(cache.data);
      }
      return NextResponse.json(
        { error: "Weather service temporarily unavailable" },
        { status: 503 },
      );
    }

    const data = await response.json();

    const weather: WeatherResponse = {
      temp: Math.round(data.main?.temp ?? 0),
      description: data.weather?.[0]?.description ?? "Unknown",
      icon: data.weather?.[0]?.icon ?? "01d",
      updatedAt: Date.now(),
    };

    // Update cache
    cache = { data: weather, timestamp: Date.now() };

    return NextResponse.json(weather);
  } catch (error) {
    console.error("Weather fetch error:", error);
    if (cache) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
