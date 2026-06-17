import { GridCell } from "@/components/dashboard/grid-cell";
import { WeatherClient } from "./weather-client";

export function TimeWeather() {
  return (
    <GridCell className="flex flex-col">
      <WeatherClient />
    </GridCell>
  );
}
