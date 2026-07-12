"use client";

import { Cloud, CloudRain, CloudSnow, CloudSun, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";

/** Өмнөговь — Цагаан хад */
const LAT = 43.25;
const LNG = 106.52;

type WeatherState = {
  temp: number;
  wind: number;
  code: number;
} | null;

function weatherLabel(code: number) {
  if (code === 0) return "Цэлмэг";
  if (code <= 3) return "Үүлэрхэг";
  if (code <= 67) return "Бороотой";
  if (code <= 77) return "Цастай";
  if (code <= 82) return "Шороон шуурга";
  return "Цаг агаар";
}

function WeatherIcon({ code }: { code: number }) {
  const cls = "size-7 shrink-0 text-primary";
  if (code === 0) return <Sun className={cls} />;
  if (code <= 3) return <CloudSun className={cls} />;
  if (code <= 67) return <CloudRain className={cls} />;
  if (code <= 77) return <CloudSnow className={cls} />;
  return <Cloud className={cls} />;
}

export function WeatherCard() {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${LAT}&longitude=${LNG}` +
          `&current=temperature_2m,weather_code,wind_speed_10m` +
          `&timezone=Asia%2FUlaanbaatar`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("weather fetch failed");
        const data = await res.json();
        if (cancelled) return;
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          wind: Math.round(data.current.wind_speed_10m),
          code: data.current.weather_code,
        });
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex h-full min-h-17 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      {weather ? (
        <WeatherIcon code={weather.code} />
      ) : (
        <Cloud className="size-7 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">Өмнөговь · Цагаан хад</p>
        {weather ? (
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums leading-none">
              {weather.temp > 0 ? `+${weather.temp}` : weather.temp}°C
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {weatherLabel(weather.code)}
            </span>
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {error ? "Ачаалж чадсангүй" : "Ачаалж байна…"}
          </p>
        )}
      </div>
      {weather && (
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Wind className="size-3.5" />
          <span className="tabular-nums">{weather.wind} км/ц</span>
        </div>
      )}
    </div>
  );
}
