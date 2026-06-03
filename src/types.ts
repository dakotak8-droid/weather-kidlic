export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherText: string;
  precipitation: number;
  city: string;
  country: string;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
  rainProb: number;
}

export interface DailyForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainProb: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

export interface GeocodingResult {
  name: string;
  country: string;
  admin1?: string; // State / Region
  latitude: number;
  longitude: number;
}
