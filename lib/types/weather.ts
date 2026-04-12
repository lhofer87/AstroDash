export interface HourlyForecastPoint {
  time: string; // ISO
  cloudCover: number; // 0-100
  cloudLow: number;
  cloudMid: number;
  cloudHigh: number;
  temp: number;
  humidity: number;
  windSpeed: number;
}

/** Denní řada ze stejného Open-Meteo dotazu (timezone=auto u bodu). */
export interface OpenMeteoDailySun {
  time: string[];
  sunset: string[];
}

export interface OpenMeteoForecast {
  hourly: HourlyForecastPoint[];
  timezone: string;
  /** Seconds east of UTC from Open-Meteo (optional, for future use). */
  utcOffsetSeconds?: number;
  daily?: OpenMeteoDailySun;
}

export interface SevenTimerPoint {
  /** YYYYMMDDHH local; API may return string or number in JSON. */
  timepoint: string | number;
  cloudcover: number;
  seeing: number;
  transparency: number;
  lifted_index: number;
  rh2m: number;
  wind10m: { direction: string; speed: number };
  temp2m: number;
  prec_type: string;
}

export interface SevenTimerResponse {
  dataseries: SevenTimerPoint[];
  init: string;
}
