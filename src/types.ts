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
  moodLabel: string; // Humorous parenting label (e.g. "Playground Goldmines", "Blanket Fort Critical")
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

export interface ClothingSuggestion {
  baby: string;
  toddler: string;
  parent: string;
}

export interface SurvivalForecastItem {
  id: string;
  metric: string; // Action / Negotiation type
  probability: number; // Percentage
  funnyComment: string;
  iconName: string; // Standard matching icon name
}

export interface ParentContext {
  moodSentence: string;
  survivalForecast: SurvivalForecastItem[];
  clothing: ClothingSuggestion;
  quoteCard: {
    quote: string;
    hashtag: string;
  };
}
