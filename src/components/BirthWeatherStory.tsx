import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, ChevronRight, Sparkles, RefreshCw, X, Heart, Baby, BookOpen, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeocodingResult } from "../types";
import WeatherIcon from "./WeatherIcon";

const MONTHS_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

interface Dictionary {
  certificateHeader: string;
  weatherOnArrival: string;
  conditionHeader: string;
  temperatureHeader: string;
  windSpeedHeader: string;
  sunriseHeader: string;
  skysWelcome: string;
  themeLabel: string;
  dateLabel: string;
  authenticKeepsake: string;
  referenceIdea: string;
  downloadButton: string;
  downloadButtonLoading: string;
  downloadOptimized: string;
  months: string[];
  weatherConditions: { [key: number]: string };
  defaultCondition: string;

  // Form strings
  tinyTag: string;
  formTitle: string;
  formSubtitle: string;
  fieldLanguage: string;
  fieldBirthDate: string;
  fieldBirthCity: string;
  cityPlaceholder: string;
  cityHelper: string;
  btnRevealLoading: string;
  btnRevealNormal: string;
  trustLine: string;

  // Errors
  errNoDate: string;
  errFutureDate: string;
  errYearLimit: string;
  errNoCity: string;
  errMultipleMatches: string;
  errEmptyCity: string;
  errApiRecovery: string;

  // Example Card details
  exampleCity: string;
  exampleCountrySub: string;
  exampleTemp: string;
  exampleCondition: string;
  exampleWind: string;
  exampleSunrise: string;
  exampleTheme: string;
  exampleDate: string;
  exampleStory: string;
  exampleQuote: string;
}

const LOCALES: { [key: string]: Dictionary } = {
  en: {
    certificateHeader: "WEATHER KEEPSAKE CERTIFICATE",
    weatherOnArrival: "WEATHER ON YOUR ARRIVAL",
    conditionHeader: "CONDITION",
    temperatureHeader: "TEMPERATURE",
    windSpeedHeader: "MAX WIND SPEED",
    sunriseHeader: "SUNRISE TIME",
    skysWelcome: "THE SKY'S WELCOME",
    themeLabel: "Theme",
    dateLabel: "Date",
    authenticKeepsake: "Your Authentic Weather Keepsake",
    referenceIdea: "Reference Idea",
    downloadButton: "Download Keepsake",
    downloadButtonLoading: "Crafting Keepsake...",
    downloadOptimized: "Optimized for Instagram (4:5 vertical), Facebook, and baby memory albums",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    weatherConditions: {
      0: "Clear Skies",
      1: "Soft Sunshine",
      2: "Partly Cloudy",
      3: "Overcast",
      45: "Morning Mist",
      48: "Morning Mist",
      51: "Light Rain",
      53: "Light Rain",
      55: "Light Rain",
      61: "Spring Showers",
      63: "Spring Showers",
      65: "Spring Showers",
      80: "Spring Showers",
      81: "Spring Showers",
      82: "Spring Showers",
      71: "Snowfall",
      73: "Snowfall",
      75: "Snowfall",
      77: "Snowfall",
      85: "Snowfall",
      86: "Snowfall",
      95: "Stormy Skies",
      96: "Stormy Skies",
      99: "Stormy Skies",
    },
    defaultCondition: "Calm Breeze",

    // Form
    tinyTag: "Tiny Date. Big Memory.",
    formTitle: "What was the weather when your baby was born?",
    formSubtitle: "Before the sleepless nights, snack negotiations, and mysterious sticky fingerprints, there was a single day. Discover the weather that welcomed your child into the world.",
    fieldLanguage: "Language / Idioma",
    fieldBirthDate: "Birth Date (MM/DD/YYYY)",
    fieldBirthCity: "Birth City & Country (in English)",
    cityPlaceholder: "Examples: New York, United States • Warsaw, Poland • Paris, France",
    cityHelper: "Please enter city and country names in English. Local spellings such as Polska, Deutschland, España, or Italia may not be recognized.",
    btnRevealLoading: "Scanning the heavens...",
    btnRevealNormal: "Reveal the weather story",
    trustLine: "Powered by historical weather archives and location data.",

    // Errors
    errNoDate: "Please select a valid birth date.",
    errFutureDate: "Are they a time traveler? The birth date cannot be in the future!",
    errYearLimit: "Alas! Historical weather archives are only available back to 1940. Please enter a birth date from 1940 onwards.",
    errNoCity: "We couldn't find that city. Please enter the city and country in English (for example: Warsaw, Poland or Munich, Germany).",
    errMultipleMatches: "Multiple matches found for \"{city}\". Please select your specific birth city from the suggestions list below to continue.",
    errEmptyCity: "Please specify a birth city & country.",
    errApiRecovery: "Open-Meteo archive is recovering state. Please check your network and retry in a few moments!",

    // Example
    exampleCity: "Austin",
    exampleCountrySub: "Texas, United States",
    exampleTemp: "21°C / 70°F",
    exampleCondition: "Gentle Sunshine",
    exampleWind: "12 km/h / 7 mph",
    exampleSunrise: "7:28 AM",
    exampleTheme: "Wrapped in Warmth",
    exampleDate: "Oct 14, 2021",
    exampleStory: "Bright afternoon sunshine spread across Austin, lighting up the neighborhood and casting yellow beams across the limestone ridges. It was a warm day outside, but our focus was entirely in our arms. The moment we cradled you, we felt an immense sense of gratitude that filled our hearts. The sunny day was beautiful, but you were the real daylight in our lives, bringing a warmth we will carry forever.",
    exampleQuote: "Among clouds, rain, and sunlight, you were always the brightest part of the day.",
  },

  es: {
    certificateHeader: "CERTIFICADO DE RECUERDO DEL CLIMA",
    weatherOnArrival: "EL CLIMA EN TU LLEGADA",
    conditionHeader: "CONDICIÓN",
    temperatureHeader: "TEMPERATURA",
    windSpeedHeader: "VELOCIDAD MÁXIMA DEL VIENTO",
    sunriseHeader: "HORA DEL AMANECER",
    skysWelcome: "LA BIENVENIDA DEL CIELO",
    themeLabel: "Tema",
    dateLabel: "Fecha",
    authenticKeepsake: "Tu Recuerdo del Clima Auténtico",
    referenceIdea: "Idea de Referencia",
    downloadButton: "Descargar Recuerdo",
    downloadButtonLoading: "Creando Recuerdo...",
    downloadOptimized: "Optimizado para Instagram (4:5 vertical), Facebook y álbumes de recuerdos de bebés",
    months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    weatherConditions: {
      0: "Cielos Despejados",
      1: "Brillo Solar Suave",
      2: "Parcialmente Nublado",
      3: "Cubierto",
      45: "Niebla Matutina",
      48: "Niebla Matutina",
      51: "Lluvia Ligera",
      53: "Lluvia Ligera",
      55: "Lluvia Ligera",
      61: "Lloviznas de Primavera",
      63: "Lloviznas de Primavera",
      65: "Lloviznas de Primavera",
      80: "Lloviznas de Primavera",
      81: "Lloviznas de Primavera",
      82: "Lloviznas de Primavera",
      71: "Nevada",
      73: "Nevada",
      75: "Nevada",
      77: "Nevada",
      85: "Nevada",
      86: "Nevada",
      95: "Cielos Tormentosos",
      96: "Cielos Tormentosos",
      99: "Cielos Tormentosos",
    },
    defaultCondition: "Brisa Calma",

    // Form
    tinyTag: "Fecha pequeña. Gran recuerdo.",
    formTitle: "¿Cómo era el clima cuando nació tu bebé?",
    formSubtitle: "Antes de las noches de desvelo, las negociaciones de refrigerios y las misteriosas huellas pegajosas, hubo un solo día. Descubre el clima que le dio la bienvenida a tu hijo al mundo.",
    fieldLanguage: "Idioma / Language",
    fieldBirthDate: "Fecha de nacimiento (MM/DD/AAAA)",
    fieldBirthCity: "Ciudad y país de nacimiento (en inglés)",
    cityPlaceholder: "Ejemplos: New York, United States • Warsaw, Poland • Paris, France",
    cityHelper: "Por favor, ingresa los nombres de la ciudad y el país en inglés. Es posible que no se reconozcan las grafías locales como Polska, Deutschland, España o Italia.",
    btnRevealLoading: "Escaneando los cielos...",
    btnRevealNormal: "Descubrir la historia del clima",
    trustLine: "Desarrollado con archivos climáticos históricos y datos de ubicación.",

    // Errors
    errNoDate: "Por favor, selecciona una fecha de nacimiento válida.",
    errFutureDate: "¿Acaso viajan en el tiempo? ¡La fecha de nacimiento no puede ser en el futuro!",
    errYearLimit: "¡Vaya! Los archivos meteorológicos históricos solo están disponibles desde 1940. Por favor, ingresa una fecha de nacimiento a partir de 1940.",
    errNoCity: "No pudimos encontrar esa ciudad. Por favor, ingresa la ciudad y el país en inglés (por ejemplo: Warsaw, Poland o Munich, Germany).",
    errMultipleMatches: "Se encontraron múltiples coincidencias para \"{city}\". Por favor, selecciona tu ciudad de nacimiento específica de la lista de sugerencias a continuación para continuar.",
    errEmptyCity: "Por favor, especifica una ciudad y un país de nacimiento.",
    errApiRecovery: "El archivo de Open-Meteo se está recuperando. ¡Por favor, verifica tu conexión e inténtalo de nuevo en unos momentos!",

    // Example
    exampleCity: "Austin",
    exampleCountrySub: "Texas, Estados Unidos",
    exampleTemp: "21°C / 70°F",
    exampleCondition: "Brillo Solar Suave",
    exampleWind: "12 km/h / 7 mph",
    exampleSunrise: "7:28 AM",
    exampleTheme: "Cubierto de Calidez",
    exampleDate: "Oct 14, 2021",
    exampleStory: "Un brillante sol de la tarde se extendía sobre Austin, iluminando el vecindario y proyectando rayos amarillos a lo largo de las colinas de piedra caliza. Hacía un día cálido afuera, pero nuestra atención estaba por completo en nuestros brazos. En el momento en que te acunamos, sentimos una inmensa sensación de gratitud que llenó nuestros corazones. El día soleado era hermoso, pero tú eras la verdadera luz del día en nuestras vidas, trayendo una calidez que llevaremos para siempre.",
    exampleQuote: "Entre las nubes, la lluvia y la luz del sol, siempre fuiste la parte más brillante del día.",
  }
};

const PROFILE_KEYS = {
  NYC: "new york|new york|united states",
  CHICAGO: "chicago|illinois|united states",
  TORONTO: "toronto|ontario|canada",
  LONDON: "london|england|united kingdom",
  PARIS: "paris|île-de-france|france",
  WARSAW: "warsaw|mazovia|poland"
};

const POLISH_CITIES_REGISTRY: {
  [key: string]: { name: string; admin1: string; country: string; latitude: number; longitude: number };
} = {
  "warszawa": { name: "Warsaw", admin1: "Mazovia", country: "Poland", latitude: 52.2298, longitude: 21.0118 },
  "warsaw": { name: "Warsaw", admin1: "Mazovia", country: "Poland", latitude: 52.2298, longitude: 21.0118 },
  "kraków": { name: "Krakow", admin1: "Lesser Poland", country: "Poland", latitude: 50.0647, longitude: 19.9450 },
  "krakow": { name: "Krakow", admin1: "Lesser Poland", country: "Poland", latitude: 50.0647, longitude: 19.9450 },
  "łódź": { name: "Lodz", admin1: "Lodz Voivodeship", country: "Poland", latitude: 51.7592, longitude: 19.4560 },
  "lodz": { name: "Lodz", admin1: "Lodz Voivodeship", country: "Poland", latitude: 51.7592, longitude: 19.4560 },
  "wrocław": { name: "Wroclaw", admin1: "Lower Silesia", country: "Poland", latitude: 51.1079, longitude: 17.0385 },
  "wroclaw": { name: "Wroclaw", admin1: "Lower Silesia", country: "Poland", latitude: 51.1079, longitude: 17.0385 },
  "gdańsk": { name: "Gdansk", admin1: "Pomerania", country: "Poland", latitude: 54.3520, longitude: 18.6466 },
  "gdansk": { name: "Gdansk", admin1: "Pomerania", country: "Poland", latitude: 54.3520, longitude: 18.6466 },
  "poznań": { name: "Poznan", admin1: "Greater Poland", country: "Poland", latitude: 52.4064, longitude: 16.9252 },
  "poznan": { name: "Poznan", admin1: "Greater Poland", country: "Poland", latitude: 52.4064, longitude: 16.9252 },
};

const SPECIAL_MAPPINGS: {
  [key: string]: { name: string; admin1: string; country: string; latitude: number; longitude: number };
} = {
  "warszawa": { name: "Warsaw", admin1: "Mazovia", country: "Poland", latitude: 52.2298, longitude: 21.0118 },
  "warsaw": { name: "Warsaw", admin1: "Mazovia", country: "Poland", latitude: 52.2298, longitude: 21.0118 },
  "warsawpoland": { name: "Warsaw", admin1: "Mazovia", country: "Poland", latitude: 52.2298, longitude: 21.0118 },
  "warszawapoland": { name: "Warsaw", admin1: "Mazovia", country: "Poland", latitude: 52.2298, longitude: 21.0118 },
  "krakow": { name: "Krakow", admin1: "Lesser Poland", country: "Poland", latitude: 50.0647, longitude: 19.9450 },
  "kraków": { name: "Krakow", admin1: "Lesser Poland", country: "Poland", latitude: 50.0647, longitude: 19.9450 },
  "lodz": { name: "Lodz", admin1: "Lodz Voivodeship", country: "Poland", latitude: 51.7592, longitude: 19.4560 },
  "łódź": { name: "Lodz", admin1: "Lodz Voivodeship", country: "Poland", latitude: 51.7592, longitude: 19.4560 },
  "wroclaw": { name: "Wroclaw", admin1: "Lower Silesia", country: "Poland", latitude: 51.1079, longitude: 17.0385 },
  "wrocław": { name: "Wroclaw", admin1: "Lower Silesia", country: "Poland", latitude: 51.1079, longitude: 17.0385 },
  "gdansk": { name: "Gdansk", admin1: "Pomerania", country: "Poland", latitude: 54.3520, longitude: 18.6466 },
  "gdańsk": { name: "Gdansk", admin1: "Pomerania", country: "Poland", latitude: 54.3520, longitude: 18.6466 },
  "poznan": { name: "Poznan", admin1: "Greater Poland", country: "Poland", latitude: 52.4064, longitude: 16.9252 },
  "poznań": { name: "Poznan", admin1: "Greater Poland", country: "Poland", latitude: 52.4064, longitude: 16.9252 },
  "hamiltoncanada": { name: "Hamilton", admin1: "Ontario", country: "Canada", latitude: 43.2501, longitude: -79.8496 },
  "hamiltonontario": { name: "Hamilton", admin1: "Ontario", country: "Canada", latitude: 43.2501, longitude: -79.8496 },
  "hamiltonontariocanada": { name: "Hamilton", admin1: "Ontario", country: "Canada", latitude: 43.2501, longitude: -79.8496 },
  "londoncanada": { name: "London", admin1: "Ontario", country: "Canada", latitude: 42.9849, longitude: -81.2453 },
  "londonontario": { name: "London", admin1: "Ontario", country: "Canada", latitude: 42.9849, longitude: -81.2453 },
  "londonontariocanada": { name: "London", admin1: "Ontario", country: "Canada", latitude: 42.9849, longitude: -81.2453 },
  "parisfrance": { name: "Paris", admin1: "Île-de-France", country: "France", latitude: 48.8566, longitude: 2.3522 },
  "paristexas": { name: "Paris", admin1: "Texas", country: "United States", latitude: 33.6609, longitude: -95.5555 },
};

const getNormalizedMappingKey = (str: string): string => {
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

interface ParsedQuery {
  city: string;
  countryOrRegion?: string;
}

const parseTypedCity = (input: string): ParsedQuery => {
  const clean = input.trim().replace(/\s+/g, " ");
  
  // Try comma splitting
  const parts = clean.split(",");
  if (parts.length > 1) {
    return {
      city: parts[0].trim(),
      countryOrRegion: parts.slice(1).join(",").trim()
    };
  }
  
  // Try space-split heuristics (e.g. "Hamilton Canada" or "Paris Texas")
  const words = clean.split(" ");
  if (words.length > 1) {
    const lastWord = words[words.length - 1].toLowerCase();
    const commonEntities = [
      "canada", "usa", "us", "uk", "poland", "france", "polska", "germany", "texas",
      "ontario", "england", "texas", "california", "illinois", "massachusetts"
    ];
    if (commonEntities.includes(lastWord)) {
      return {
        city: words.slice(0, words.length - 1).join(" ").trim(),
        countryOrRegion: words[words.length - 1].trim()
      };
    }
  }
  
  return {
    city: clean
  };
};

const findSpecialMapping = (typed: string): typeof SPECIAL_MAPPINGS[string] | null => {
  const normKey = getNormalizedMappingKey(typed);
  
  if (SPECIAL_MAPPINGS[normKey]) {
    return SPECIAL_MAPPINGS[normKey];
  }
  
  const parsed = parseTypedCity(typed);
  const cityKey = getNormalizedMappingKey(parsed.city);
  if (SPECIAL_MAPPINGS[cityKey]) {
    const mapped = SPECIAL_MAPPINGS[cityKey];
    if (!parsed.countryOrRegion) {
      return mapped;
    }
    
    const cleanFilter = getNormalizedMappingKey(parsed.countryOrRegion);
    const mCountry = getNormalizedMappingKey(mapped.country);
    const mAdmin = getNormalizedMappingKey(mapped.admin1);
    if (mCountry.includes(cleanFilter) || cleanFilter.includes(mCountry) || mAdmin.includes(cleanFilter) || cleanFilter.includes(mAdmin)) {
      return mapped;
    }
  }
  
  return null;
};

const scoreGeocodingResult = (r: any, typedQuery: string): number => {
  let score = 0;
  const nameLower = (r.name || "").trim().toLowerCase();
  const countryLower = (r.country || "").trim().toLowerCase();
  const adminLower = (r.admin1 || "").trim().toLowerCase();
  
  const parsed = parseTypedCity(typedQuery);
  const cityQueryLower = parsed.city.toLowerCase();
  
  // Exact or prefix name match boosts
  if (nameLower === cityQueryLower) {
    score += 150000;
  } else if (nameLower.startsWith(cityQueryLower)) {
    score += 50000;
  } else if (nameLower.includes(cityQueryLower)) {
    score += 20000;
  } else {
    score -= 100000; // Giant penalty for names that don't match the query string at all
  }
  
  // Population size priority
  if (r.population && typeof r.population === "number") {
    score += Math.min(r.population / 10, 50000);
  } else {
    score -= 15000;
  }
  
  // Recognize town/capital type
  if (r.feature_code === "PPLC") {
    score += 40000;
  } else if (r.feature_code === "PPLA" || r.feature_code === "PPLA2") {
    score += 25000;
  } else if (r.feature_code === "PPL") {
    score += 10000;
  } else if (r.feature_code === "PPLX") {
    score -= 30000; // Penalize neighborhoods & suburbs heavily
  } else if (r.feature_code) {
    score -= 20000;
  }
  
  // Country filter weight
  if (parsed.countryOrRegion) {
    const filterLower = parsed.countryOrRegion.toLowerCase();
    const matchesCountry = countryLower.includes(filterLower) || filterLower.includes(countryLower);
    const matchesAdmin = adminLower.includes(filterLower) || filterLower.includes(adminLower);
    
    if (matchesCountry && matchesAdmin) {
      score += 100000;
    } else if (matchesCountry) {
      score += 80000;
    } else if (matchesAdmin) {
      score += 60000;
    } else {
      score -= 80000;
    }
  }
  
  const normKey = buildNormalizedKey(r.name, r.admin1, r.country);
  if (Object.values(PROFILE_KEYS).includes(normKey)) {
    score += 50000;
  }
  
  return score;
};

const normalizePolishCityInput = (typed: string): string => {
  const clean = typed.trim().toLowerCase();
  if (clean === "warszawa" || clean === "warszawy" || clean === "warsaw") return "Warsaw";
  if (clean === "kraków" || clean === "krakow") return "Krakow";
  if (clean === "łódź" || clean === "lodz") return "Lodz";
  if (clean === "wrocław" || clean === "wroclaw") return "Wroclaw";
  if (clean === "gdańsk" || clean === "gdansk") return "Gdansk";
  if (clean === "poznań" || clean === "poznan") return "Poznan";
  
  const commaIndex = typed.indexOf(",");
  if (commaIndex !== -1) {
    const mainCity = typed.substring(0, commaIndex).trim().toLowerCase();
    const rest = typed.substring(commaIndex).trim();
    if (mainCity === "warszawa" || mainCity === "warsaw") return `Warsaw${rest}`;
    if (mainCity === "kraków" || mainCity === "krakow") return `Krakow${rest}`;
    if (mainCity === "łódź" || mainCity === "lodz") return `Lodz${rest}`;
    if (mainCity === "wrocław" || mainCity === "wroclaw") return `Wroclaw${rest}`;
    if (mainCity === "gdańsk" || mainCity === "gdansk") return `Gdansk${rest}`;
    if (mainCity === "poznań" || mainCity === "poznan") return `Poznan${rest}`;
  }
  
  return typed;
};

const getCityIdentityKey = (city: string, region: string = "", country: string = ""): string => {
  return [city.trim(), region.trim(), country.trim()].join("|");
};

const buildNormalizedKey = (city: string, region: string = "", country: string = ""): string => {
  let c = city.trim().toLowerCase();
  let r = region.trim().toLowerCase();
  let co = country.trim().toLowerCase();
  
  // Normalize Country equivalents
  if (co === "united states of america" || co === "usa" || co === "us") co = "united states";
  if (co === "united kingdom" || co === "uk" || co === "gb" || co === "great britain" || co === "england") co = "united kingdom";
  if (co === "polska") co = "poland";
  
  // Normalize Region & City equivalents
  if (c === "new york" || c === "new york city" || c === "nyc") {
    c = "new york";
    if (r === "ny" || r === "new york state" || r === "new york" || r === "") {
      r = "new york";
    }
  } else if (c === "chicago") {
    if (r === "il" || r === "illinois" || r === "") {
      r = "illinois";
    }
  } else if (c === "toronto") {
    if (r === "on" || r === "ontario" || r === "") {
      r = "ontario";
    }
  } else if (c === "london") {
    if (r === "england" || r === "london" || r === "greater london" || r === "") {
      r = "england";
    }
  } else if (c === "paris") {
    if (r === "ile de france" || r === "ile-de-france" || r === "île-de-france" || r === "") {
      r = "île-de-france";
    }
  } else if (c === "warsaw" || c === "warszawa") {
    c = "warsaw";
    if (r === "masovia" || r === "mazovia" || r === "masovian voivodeship" || r === "mazowieckie" || r === "wojewodztwo mazowieckie" || r === "") {
      r = "mazovia";
    }
  }
  
  return `${c}|${r}|${co}`;
};

const isCuratedProfile = (city: string, region: string = "", country: string = ""): "nyc" | "chicago" | "toronto" | "london" | "paris" | "warsaw" | null => {
  const normKey = buildNormalizedKey(city, region, country);
  if (normKey === PROFILE_KEYS.NYC) return "nyc";
  if (normKey === PROFILE_KEYS.CHICAGO) return "chicago";
  if (normKey === PROFILE_KEYS.TORONTO) return "toronto";
  if (normKey === PROFILE_KEYS.LONDON) return "london";
  if (normKey === PROFILE_KEYS.PARIS) return "paris";
  if (normKey === PROFILE_KEYS.WARSAW) return "warsaw";
  return null;
};

const getCityLandmarks = (city: string, region: string = "", country: string = ""): string[] => {
  const profile = isCuratedProfile(city, region, country);
  
  // Safety check: verify selected city key === profile city key before returning any landmarks
  let profileKey = "";
  if (profile === "nyc") profileKey = PROFILE_KEYS.NYC;
  else if (profile === "chicago") profileKey = PROFILE_KEYS.CHICAGO;
  else if (profile === "toronto") profileKey = PROFILE_KEYS.TORONTO;
  else if (profile === "london") profileKey = PROFILE_KEYS.LONDON;
  else if (profile === "paris") profileKey = PROFILE_KEYS.PARIS;
  else if (profile === "warsaw") profileKey = PROFILE_KEYS.WARSAW;
  
  if (!profileKey) return [];
  
  const selectedKey = buildNormalizedKey(city, region, country);
  if (selectedKey !== profileKey) {
    return [];
  }
  
  if (profile === "nyc") {
    return ["Manhattan skyline", "New York Harbor", "Central Park"];
  }
  if (profile === "chicago") {
    return ["Lake Michigan", "the Chicago skyline"];
  }
  if (profile === "warsaw") {
    return ["the Vistula River", "Old Town", "the Royal Route"];
  }
  if (profile === "london") {
    return ["the River Thames", "historic London streets"];
  }
  if (profile === "toronto") {
    return ["Lake Ontario", "the Toronto waterfront"];
  }
  if (profile === "paris") {
    return ["the River Seine", "the Eiffel Tower gardens"];
  }
  
  return [];
};

const getWeatherConditionText = (code: number, lang: "en" | "es" = "en"): string => {
  const dictionary = LOCALES[lang] || LOCALES.en;
  return dictionary.weatherConditions[code] || dictionary.defaultCondition;
};

const parseSunriseTime = (sunriseStr?: string): string => {
  if (!sunriseStr) return "6:15 AM";
  try {
    const timePart = sunriseStr.split("T")[1];
    if (!timePart) return "6:15 AM";
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return "6:15 AM";
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const mPad = String(m).padStart(2, "0");
    return `${h}:${mPad} ${ampm}`;
  } catch {
    return "6:15 AM";
  }
};

interface HistoricalStory {
  theme: string;
  story: string;
  quote: string;
  metricLabel: string;
  metricValue: string;
}

export default function BirthWeatherStory() {
  const [lang, setLang] = useState<"en" | "es">(() => {
    const saved = localStorage.getItem("parent_weather_lang");
    return (saved as "en" | "es") || "en";
  });

  const t = LOCALES[lang] || LOCALES.en;

  // Input fields state
  const [typedCity, setTypedCity] = useState("");
  const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(null);
  const [birthDate, setBirthDate] = useState(""); // "YYYY-MM-DD"
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Result state
  const [revealResult, setRevealResult] = useState<{
    city: string;
    country: string;
    region?: string;
    date: string; // formatted
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    rainProb: number;
    windSpeed: number;
    sunrise: string;
    story: HistoricalStory;
  } | null>(null);

  // Auto-suggestion dropdown click-outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for city suggestions when user types in the Birth City input
  useEffect(() => {
    if (typedCity.trim().length < 3 || selectedCity?.name === typedCity) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCity(true);
      try {
        // 1. Check if there is an exact Special Mapping or Polish City Registry shortcut
        const specialMatch = findSpecialMapping(typedCity);
        if (specialMatch) {
          console.log(`Using exact special mapping for suggestion: ${specialMatch.name}, ${specialMatch.admin1}, ${specialMatch.country}`);
          setSuggestions([{
            name: specialMatch.name,
            country: specialMatch.country,
            admin1: specialMatch.admin1,
            latitude: specialMatch.latitude,
            longitude: specialMatch.longitude
          }]);
          setShowDropdown(true);
          setIsSearchingCity(false);
          return;
        }

        // 2. Fetch wider pool from Open-Meteo Geocoding with normalized polish input (e.g. Warszawa -> Warsaw)
        const parsed = parseTypedCity(typedCity);
        const normalizedQuery = normalizePolishCityInput(parsed.city);
        console.log(`Suggestion search for "${typedCity}" - normalized query: "${normalizedQuery}"`);
        
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            normalizedQuery
          )}&count=40&language=en&format=json`
        );
        const data = await response.json();
        
        if (data.results) {
          // Score and rank all of them
          const scoredResults = data.results.map((r: any) => {
            return {
              r,
              score: scoreGeocodingResult(r, typedCity)
            };
          });

          // Filter out completely unrelated fuzzy matches
          const queryLower = normalizePolishCityInput(parsed.city).toLowerCase();
          const filtered = scoredResults.filter((item: any) => {
            const nameLower = (item.r.name || "").toLowerCase();
            return nameLower.includes(queryLower) || queryLower.includes(nameLower);
          });

          // Sort by descending score
          filtered.sort((a: any, b: any) => b.score - a.score);

          // Collapse region/country level duplicates to keep user choices clear & diverse
          const uniqueMatches: GeocodingResult[] = [];
          const seenKeys = new Set<string>();
          for (const item of filtered) {
            const result = item.r;
            const locKey = `${result.name.toLowerCase()}|${(result.admin1 || "").toLowerCase()}|${(result.country || "").toLowerCase()}`;
            if (!seenKeys.has(locKey)) {
              seenKeys.add(locKey);
              uniqueMatches.push({
                name: result.name,
                country: result.country || "",
                admin1: result.admin1 || "",
                latitude: result.latitude,
                longitude: result.longitude
              });
            }
          }

          setSuggestions(uniqueMatches.slice(0, 5));
          setShowDropdown(true);
        } else {
          // Try local fallback to Polish registry if API returned nothing
          const queryPart = typedCity.split(",")[0].trim().toLowerCase();
          const registryMatch = POLISH_CITIES_REGISTRY[queryPart];
          if (registryMatch) {
            setSuggestions([{
              name: registryMatch.name,
              country: registryMatch.country,
              admin1: registryMatch.admin1,
              latitude: registryMatch.latitude,
              longitude: registryMatch.longitude
            }]);
            setShowDropdown(true);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.error("Geocoding suggestions failed inside BirthWeatherStory", err);
      } finally {
        setIsSearchingCity(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [typedCity, selectedCity]);

  // Handle suggestion pick
  const handleSelectSuggestion = (city: GeocodingResult) => {
    setSelectedCity(city);
    setTypedCity(`${city.name}${city.admin1 ? `, ${city.admin1}` : ""}, ${city.country}`);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Human storytelling generator based on weather parameters and city geography
  const generateBirthStory = (
    weatherCode: number,
    tempMax: number,
    rainProb: number,
    city: string,
    country: string = "",
    windSpeed: number = 12,
    sunrise: string = "6:15 AM",
    region: string = "",
    lang: "en" | "es" = "en"
  ): HistoricalStory => {
    const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);
    const isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
    const isSunny = [0, 1].includes(weatherCode);

    const cityLower = city.toLowerCase();
    const isNY = cityLower.includes("new york") || cityLower.includes("nyc");
    const isChicago = cityLower.includes("chicago");
    const isWarsaw = cityLower.includes("warsaw") || cityLower.includes("warszawa");
    const isToronto = cityLower.includes("toronto");
    const isLondon = cityLower.includes("london");
    const isParis = cityLower.includes("paris");

    const tempF = Math.round((tempMax * 9) / 5 + 32);
    const tempC = Math.round(tempMax);
    const windKn = Math.round(windSpeed);
    const windMph = Math.round(windSpeed * 0.621371);

    // Dynamic month-based date format
    const formattedDate = lang === "es" ? "el día en que naciste" : "the day you were born";

    if (lang === "es") {
      if (isRainy) {
        let story = "";
        let theme = "Un día de lluvia";
        let quote = "Afuera llovía de manera constante, pero apenas nos fijamos en el clima. Estábamos concentrados en conocerte.";

        if (isNY) {
          story = `La mañana comenzó con lloviznas suaves sobre Nueva York. Afuera paraban los taxis amarillos esquivando charcos en Broadway y la bruma flotaba entre los rascacielos. Hacía una temperatura de ${tempC}°C (${tempF}°F), pero adentro en la habitación del hospital apenas lo registramos. Estábamos totalmente enfocados en verte y tenerte en brazos por primera vez. Esa mañana de lluvia limpia en Nueva York se convirtió en un momento increíble que nunca vamos a olvidar.`;
        } else if (isChicago) {
          story = `Llovía bastante sobre Chicago, con un viento frío de ${windKn} km/h (${windMph} mph) soplando desde el lago. Los autos pasaban despacio por las calles mojadas, pero adentro en el hospital todo era tranquilidad. Cuando por fin te tuvimos en brazos por primera vez, nos olvidamos por completo del mal clima. Fue un día lluvioso afuera, pero en esa habitación solo sentimos un alivio y una paz enorme al ver tu carita por primera vez.`;
        } else if (isWarsaw) {
          story = `Varsovia amaneció con una llovizna constante que mojaba los adoquines del centro histórico. Hacía un poco de frío, con ${tempC}°C (${tempF}°F) de temperatura, y el sol salió tras nubes grises a las ${sunrise}. En nuestra habitación, en cambio, todo era calidez y calma. Pasamos esas primeras horas simplemente abrazándote y contando tus pequeños dedos, mientras la ciudad seguía su curso habitual bajo la lluvia de otoño.`;
        } else if (isParis) {
          story = `Una llovizna ligera caía sobre París, mojando los tejados de zinc y las aceras junto al Sena. Hacía un clima de ${tempC}°C (${tempF}°F) con una brisa mansa. Sentimos un alivio inmenso cuando por fin te pusieron en nuestros brazos. Al abrazarte por primera vez nos olvidamos por completo del día gris y húmedo afuera. Esa tarde tranquila y lluviosa en París siempre será uno de nuestros recuerdos más sencillos y queridos.`;
        } else if (isLondon) {
          story = `Una llovizna clásica londinense caía afuera, dejando las calles mojadas y tranquilas. El sol salió a las ${sunrise} detrás de nubes pesadas con una temperatura de ${tempC}°C (${tempF}°F). Mientras la ciudad seguía con su rutina húmeda de siempre, nuestro mundo se detuvo un momento dentro de esa habitación. Te sostuvimos muy cerca, escuchando tus respiraciones de recién nacido, con la certeza de que nunca habíamos estado tan felices.`;
        } else if (isToronto) {
          story = `Una lluvia fresca caía sobre Toronto, bajando hacia las orillas del lago Ontario bajo un cielo nublado de ${tempC}°C (${tempF}°F). El viento soplaba a ${windKn} km/h (${windMph} mph), pero la habitación del hospital se sentía segura y muy cómoda. Nos distrajimos por completo del clima gris de afuera, ocupados en abrazarte y mirar cada detalle de tu carita. Siempre que recordamos ese día lluvioso, pensamos en esa primera tarde juntos.`;
        } else {
          story = `La mañana en que naciste en ${city} fue bastante húmeda y lluviosa, con una temperatura de ${tempC}°C (${tempF}°F) y un viento de ${windKn} km/h (${windMph} mph). Pero adentro del hospital solo estábamos concentrados en tenerte en nuestros brazos. La lluvia de afuera no nos importó en lo absoluto; conocerte fue el único momento que realmente ocupó nuestras mentes.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSnowy) {
        let story = "";
        let theme = "Un día de nieve";
        let quote = "Hacía muchísimo frío afuera, pero de la puerta para adentro solo estábamos felices de tenerte al fin con nosotros.";

        if (isNY) {
          story = `Nueva York estaba cubierta por una capa gruesa de nieve la mañana en que naciste. La nieve caía sin hacer ruido sobre Central Park, silenciando el tráfico habitual de la gran ciudad en un día frío de invierno a ${tempC}°C (${tempF}°F). En la calidez de la habitación nos quedamos muy abrigados, simplemente mimándote y mirando cómo abrías los ojos por primera vez. Fue un día muy blanco y silencioso afuera, pero para nosotros estuvo lleno de calma.`;
        } else if (isChicago) {
          story = `El viento soplaba muy frío desde el lago Míchigan a ${windKn} km/h (${windMph} mph), acumulando nieve entre los edificios de Chicago con una temperatura de ${tempC}°C (${tempF}°F). Pero adentro de la habitación del hospital todo era tranquilidad. En el momento exacto en que te tuvimos en brazos por primera vez, nos olvidamos por completo del frío del invierno exterior. Estábamos increíblemente contentos de tener por fin a nuestro bebé.`;
        } else if (isWarsaw) {
          story = `Una nieve fresca cubría por completo las calles históricas de Varsovia y el río Vístula. El sol asomó tras nubes frías a las ${sunrise} con una temperatura gélida de ${tempC}°C (${tempF}°F). Adentro, nuestra atención estaba puesta solo en ti. Escuchar tus primeros murmullos y sostenerte contra nuestro pecho nos dio todo el abrigo que necesitábamos en un día de invierno tan callado en Polonia.`;
        } else {
          story = `Una capa de nieve limpia cubría ${city} la mañana en que naciste, con una temperatura gélida de ${tempC}°C (${tempF}°F) y un viento soplando la nieve afuera a ${windKn} km/h (${windMph} mph). Pero nuestra habitación del hospital era un refugio templado y tranquilo. Al tenerte en brazos por primera vez, nos invadió un alivio inmenso y el clima helado de afuera pasó a segundo plano.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSunny) {
        let story = "";
        let theme = "Un día soleado";
        let quote = "El clima afuera estaba hermoso y despejado, pero la mejor parte del día fue sostenerte en brazos por primera vez.";

        if (isNY) {
          story = `Nueva York disfrutaba de un día hermoso, brillante y soleado cuando llegaste al mundo. El sol de la mañana se reflejaba en los edificios de cristal de Manhattan, los taxis amarillos recorrían Broadway bajo un cielo azul y hacía una temperatura de ${tempC}°C (${tempF}°F). Mientras la gran ciudad seguía con su rutina apresurada de siempre allá abajo, nosotros pasamos la tarde mirándote, contándote los deditos y disfrutando este primer momento juntos.`;
        } else if (isChicago) {
          story = `El clima afuera en Chicago era agradable y muy despejado, con un sol brillante que se reflejaba en el lago Míchigan y una suave brisa de ${windKn} km/h (${windMph} mph). Hacía unos templados ${tempC}°C (${tempF}°F), pero apenas nos fijamos en eso. Estábamos ocupados dándote la bienvenida y pasándote de brazo en brazo en la habitación. Tomar tu pequeña mano mientras entraba la luz del sol por la ventana fue inolvidable.`;
        } else if (isWarsaw) {
          story = `Varsovia estaba iluminada por un sol brillante y despejado el día en que naciste. El sol de la mañana salió a las ${sunrise} sobre los edificios históricos y brillaba en el río Vístula a unos templados ${tempC}°C (${tempF}°F). En el hospital todo era paz y silencio mientras te abrazábamos por primera vez. Esa tarde luminosa siempre nos recordará el día en que por fin fuimos una familia.`;
        } else {
          story = `Un día despejado y lleno de sol nos recibió en ${city} cuando naciste, con cielos abiertos y una suave brisa soplando a ${windKn} km/h (${windMph} mph). La temperatura máxima subió a unos agradables ${tempC}°C (${tempF}°F). Pero la mejor parte, por mucho, fue tenerte entre nuestros brazos por primera vez en esa habitación tranquila de hospital.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      // Default Cloudy
      let story = "";
      let theme = "Un día nublado";
      let quote = "Bajo un cielo gris y muy tranquilo, todo cambió en el momento en que te vimos por primera vez.";

      if (isNY) {
        story = `El cielo sobre Manhattan estaba completamente tranquilo y gris, suavizando el ruido y el movimiento habitual de Nueva York. Hacía un clima templado de ${tempC}°C (${tempF}°F) afuera, pero dentro de nuestra habitación el tiempo pareció ir más despacio. En el segundo en que abriste los ojos y nos miraste, todo el bullicio de la ciudad desapareció de nuestra cabeza. Nos quedamos callados abrazándote con una inmensa tranquilidad.`;
      } else if (isChicago) {
        story = `Unas nubes grises cubrían los edificios de Chicago, empujadas por un viento constante de ${windKn} km/h (${windMph} mph) que venía del lago Míchigan. El día se sentía muy callado a unos ${tempC}°C (${tempF}°F), y toda nuestra atención estaba enfocada en conocerte. Al sostenerte en brazos y sentir tu pequeña mano rodando nuestro dedo, cualquier preocupación desapareció de inmediato.`;
      } else if (isWarsaw) {
        story = `Un cielo cubierto y pacífico cobijaba las orillas del río Vístula y las viejas murallas de Varsovia la mañana en que naciste. El sol salió tras las nubes grises a las ${sunrise} con una brisa muy suave. Estábamos demasiado ocupados abrazándote por primera vez en el hospital como para pensar en el clima de afuera. Sostener tu cuerpo ligero nos dio una sensación de alivio indescriptible.`;
      } else {
        story = `Un cielo gris y tranquilo cubría ${city} el día en que naciste, con una suave brisa soplando a ${windKn} km/h (${windMph} mph) y una temperatura de ${tempC}°C (${tempF}°F). Afuera el día transcurría despacio, mientras que adentro vivíamos el momento más emocionante al tenerte por fin con nosotros. Ese día nublado en ${city} siempre será nuestro recuerdo preferido.`;
      }

      return { theme, quote, story, metricLabel: "", metricValue: "" };
    } else {
      // English
      if (isRainy) {
        let story = "";
        let theme = "A Rainy Morning";
        let quote = "Outside, it was raining steadily, but we barely noticed. We were focused on meeting you for the first time.";

        if (isNY) {
          story = `New York was waking up under a gentle morning drizzle on ${formattedDate}. Outside, yellow cabs were dodging puddles on Broadway, and a soft mist rested between the skyscrapers. It was a mild ${tempC}°C (${tempF}°F), but inside the hospital room, we barely noticed the damp weather. We were too focused on meeting you for the first time and holding your tiny, warm body in our arms. That wet morning became a moment we will never forget.`;
        } else if (isChicago) {
          story = `A cold rain was falling across Chicago, with the wind blowing off Lake Michigan at ${windKn} km/h (${windMph} mph). People on the streets below were bundled up in dark coats, but our attention was completely focused on finally meeting you. When we first held you in our arms, your soft breathing was the only sound in the room. The cold, wet Chicago weather outside didn't matter at all—we were just so incredibly happy to have you with us.`;
        } else if (isWarsaw) {
          story = `Warsaw was quiet and damp, with a steady rain washing the cobblestone streets of the Old Town. It was on the cooler side at ${tempC}°C (${tempF}°F), and the sun rose behind grey clouds at ${sunrise}. But inside our room, everything was warm and calm. We spent those first hours holding you, staring at your face, and counting your tiny fingers. Warsaw carried on under the autumn rain, but our family's world started right there.`;
        } else if (isParis) {
          story = `A soft grey rain was falling over Paris, wetting the zinc rooftops and quiet cafes along the Seine. The temperature was quite mild at ${tempC}°C (${tempF}°F) with a light breeze of ${windKn} km/h (${windMph} mph). We were so happy and relieved when the nurse finally placed you in our arms. Cradling you for the first time, we completely forgot about the damp weather outside. That quiet, rainy Parisian afternoon will always be one of our favorite memories.`;
        } else if (isLondon) {
          story = `A classic London drizzle was falling outside, leaving the streets wet and quiet. The morning sun rose at ${sunrise} behind heavy, damp clouds with a temperature of ${tempC}°C (${tempF}°F). While the city carried on with its usual wet routine, our world stopped inside that hospital room. We held you close, listening to your faint newborn sounds, and felt an incredible sense of relief.`;
        } else if (isToronto) {
          story = `Cool lakeside rain fell over Toronto's residential neighborhoods, trickling down toward the shores of Lake Ontario under an overcast sky of ${tempC}°C (${tempF}°F). The wind was blowing at ${windKn} km/h (${windMph} mph), but the hospital room felt like a warm, safe haven. We were completely distracted from the dreary weather outside, busy holding you and taking in every single detail. That rainy lakeside day is now the most beautiful memory we share.`;
        } else {
          story = `The morning you were born in ${city} was wet and rainy, with the thermometer showing a mild ${tempC}°C (${tempF}°F) and a wind of ${windKn} km/h (${windMph} mph) softly blowing outside. But inside, we were in our own quiet world. Holding your little body for the first time made us forget all about the storm outside. The rainy day in ${city} is forever marked as the happiest moment of our lives.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSnowy) {
        let story = "";
        let theme = "Snow Outside";
        let quote = "It was freezing cold outside, but holding you close brought all the warmth we could ever need.";

        if (isNY) {
          story = `A fresh coat of white snow was covering the streets and rooftops of New York on the morning you were born. Flurries fell silently over Central Park, quietening the usual busy hum of the city on a chilly winter day of ${tempC}°C (${tempF}°F). We stayed warm in our hospital room, holding you close and watching your beautiful eyes look around. Looking out at the quiet, snowy Manhattan skyline, we had never felt so much warmth in our hearts.`;
        } else if (isChicago) {
          story = `The wind was blowing cold off Lake Michigan at ${windKn} km/h (${windMph} mph), swirling fresh snow down between Chicago's high-rises with a temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, though, it was wonderfully warm. The exact moment we held you close, all the freezing Chicago winter outside was completely forgotten. We were just incredibly grateful to finally have our beautiful baby in our arms.`;
        } else if (isWarsaw) {
          story = `A fresh, quiet snow blanketed the historic streets of Warsaw, and frost lined the banks of the Vistula River. The sun rose behind cold clouds at ${sunrise} with a chilly temperature of ${tempC}°C (${tempF}°F). Inside, our attention was focused entirely on you. Hearing your first little sounds and holding you against our chest kept us completely warm. Warsaw was quiet under the Polish winter, but our hearts were absolutely full.`;
        } else {
          story = `A clean blanket of snow was settling over ${city} on the morning you were born, with the temperature hovering at ${tempC}°C (${tempF}°F) and the wind blowing snow outside at ${windKn} km/h (${windMph} mph). But our hospital room was a warm, peaceful space. Cradling your tiny shoulders and kissing your forehead, we felt an incredible sense of peace. The snowy day in ${city} will always be the warmest, happiest memory in our hearts.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSunny) {
        let story = "";
        let theme = "A Sunny Day";
        let quote = "The weather outside was beautiful and bright, but the happiest part of the day was holding you for the first time.";

        if (isNY) {
          story = `New York was enjoying a beautiful, bright sunny day when you arrived. The morning sun was reflecting off the glass towers of Manhattan, yellow cabs were driving along Broadway under a clear blue sky, and it was a comfortable ${tempC}°C (${tempF}°F). While the busy city carried on with its normal routine below, our focus was entirely on holding you, counting your tiny fingers, and taking in this wonderful moment. That sunny New York day will always be our absolute favorite.`;
        } else if (isChicago) {
          story = `The weather outside in Chicago was pleasant and bright, with a clear sky reflecting off Lake Michigan and a mild breeze of ${windKn} km/h (${windMph} mph) rolling off the water. It was a lovely ${tempC}°C (${tempF}°F), but we barely noticed it. We were far too busy holding you close and welcoming you into the world. Holding your tiny hand as the warm Chicago sunshine poured into our hospital room was the absolute happiest moment of our lives.`;
        } else if (isWarsaw) {
          story = `Warsaw was bathed in beautiful, clear sunshine on the day you were born. The morning sun rose at ${sunrise} over the historic buildings of the Old Town and glistened off the Vistula River at a pleasant ${tempC}°C (${tempF}°F). In our hospital room, everything was peaceful and quiet as we held you for the very first time. That bright, sunny Warsaw morning will always remind us of the perfect day we finally became a family.`;
        } else {
          story = `A beautiful, sun-drenched day welcomed us in ${city} when you were born, with clear skies and a gentle breeze blowing at ${windKn} km/h (${windMph} mph). The temperature reached a comfortable ${tempC}°C (${tempF}°F), making for a lovely day outside. But the happiest part of it by far was holding you in our arms for the first time. The bright, sunny weather in ${city} made everything feel incredibly special as we welcomed you to our family.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      // Default Cloudy
      let story = "";
      let theme = "A Quiet Cloudy Day";
      let quote = "Under a quiet, peaceful sky, our world changed completely the moment we finally met you.";

      if (isNY) {
        story = `The sky over Manhattan was calm and grey, softening the noisy, busy rush of New York. It was a mild ${tempC}°C (${tempF}°F) outside, but inside our hospital room, the haste of the city slowed to an absolute standstill. The second you opened your eyes and stared at us, all the bustle of New York completely faded away. We sat holding you, feeling incredibly happy and grateful that you were finally here.`;
      } else if (isChicago) {
        story = `Overcast clouds blanketed the Chicago skyline, carried by a steady wind of ${windKn} km/h (${windMph} mph) off Lake Michigan. The day was calm and quiet around ${tempC}°C (${tempF}°F), but our focus was entirely on meeting you. When we first held you, your tiny hand wrapped around our finger and all our worries disappeared. That simple, quiet grey day in Chicago will always be the day our lives changed for the better.`;
      } else if (isWarsaw) {
        story = `A quiet, cloudy sky draped the banks of the Vistula River and the old brick walls of Warsaw on the morning you were born. The sun rose behind the grey clouds at ${sunrise} with a calm breeze. In our hospital room, we were too busy cradling you for the first time to think about the weather. Holding you close while Warsaw rested under that serene sky was a moment of pure, quiet happiness we will keep forever.`;
      } else {
        story = `A quiet, overcast sky covered ${city} on the day you were born, with a calm breeze blowing at ${windKn} km/h (${windMph} mph) and the temperature at a pleasant ${tempC}°C (${tempF}°F). The weather outside was slow and peaceful, but inside we were experiencing the most exciting moment of our lives. When we first held you close to our chest, we felt a deep sense of warmth and relief. That gentle grey day in ${city} is forever our favorite memory.`;
      }

      return { theme, quote, story, metricLabel: "", metricValue: "" };
    }
  };

  // Reveal birth weather story
  const handleRevealStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!birthDate) {
      setErrorMessage(t.errNoDate);
      return;
    }

    // Direct string extraction to avoid JavaScript local timezone offset shifts
    const segments = birthDate.split("-");
    if (segments.length !== 3) {
      setErrorMessage(t.errNoDate);
      return;
    }

    const yearNum = parseInt(segments[0], 10);
    const monthNum = parseInt(segments[1], 10);
    const dayNum = parseInt(segments[2], 10);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      setErrorMessage(t.errNoDate);
      return;
    }

    // Compare with today's local date boundaries in a timezone-robust way
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    if (
      yearNum > currentYear ||
      (yearNum === currentYear && monthNum > currentMonth) ||
      (yearNum === currentYear && monthNum === currentMonth && dayNum > currentDay)
    ) {
      setErrorMessage(t.errFutureDate);
      return;
    }

    if (yearNum < 1940) {
      setErrorMessage(t.errYearLimit);
      return;
    }

    setIsLoadingStory(true);

    try {
      let lat: number;
      let lon: number;
      let cityName: string;
      let countryName: string;
      let admin1Name: string = "";

      const typedClean = typedCity.trim().toLowerCase();
      const cityPartClean = typedClean.split(",")[0].trim();
      const registryMatch = POLISH_CITIES_REGISTRY[cityPartClean] || POLISH_CITIES_REGISTRY[typedClean];

      if (selectedCity) {
        lat = selectedCity.latitude;
        lon = selectedCity.longitude;
        cityName = selectedCity.name;
        countryName = selectedCity.country || "";
        admin1Name = selectedCity.admin1 || "";
      } else {
        const specialMatch = findSpecialMapping(typedCity);
        if (specialMatch) {
          // Highlight direct shortcut resolutions
          lat = specialMatch.latitude;
          lon = specialMatch.longitude;
          cityName = specialMatch.name;
          countryName = specialMatch.country;
          admin1Name = specialMatch.admin1;
          console.log(`Auto-resolved typed input "${typedCity}" direct to special match: ${cityName}, ${admin1Name}, ${countryName} at Lat: ${lat}, Lon: ${lon}`);
        } else if (typedCity.trim().length > 0) {
          // Attempt immediate geocode search on typing fallback
          const parsed = parseTypedCity(typedCity);
          const normalizedQuery = normalizePolishCityInput(parsed.city);
          console.log(`Searching Open-Meteo Geocoding API for city input: "${typedCity}" (normalized query: "${normalizedQuery}")...`);
          const geoResp = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              normalizedQuery
            )}&count=40&language=en&format=json`
          );
          
          if (!geoResp.ok) {
            console.error(`Geocoding request failed with status: ${geoResp.status}`);
            setErrorMessage(t.errNoCity);
            setIsLoadingStory(false);
            return;
          }

          const geoData = await geoResp.json();
          if (geoData.results && geoData.results.length > 0) {
            // Score and sort all results to prioritize national capitals, major cities, and Polish cities appropriately
            const scoredResults = geoData.results.map((r: any) => {
              return {
                r,
                score: scoreGeocodingResult(r, typedCity)
              };
            });

            // Filter out completely unrelated fuzzy matches
            const queryLower = normalizePolishCityInput(parsed.city).toLowerCase();
            const filtered = scoredResults.filter((item: any) => {
              const nameLower = (item.r.name || "").toLowerCase();
              return nameLower.includes(queryLower) || queryLower.includes(nameLower);
            });

            // Sort by descending score
            filtered.sort((a: any, b: any) => b.score - a.score);

            // Collapse region/country level duplicates to keep user choices clear & diverse
            const uniqueMatches: GeocodingResult[] = [];
            const seenKeys = new Set<string>();
            for (const item of filtered) {
              const result = item.r;
              const locKey = `${result.name.toLowerCase()}|${(result.admin1 || "").toLowerCase()}|${(result.country || "").toLowerCase()}`;
              if (!seenKeys.has(locKey)) {
                seenKeys.add(locKey);
                uniqueMatches.push({
                  name: result.name,
                  country: result.country || "",
                  admin1: result.admin1 || "",
                  latitude: result.latitude,
                  longitude: result.longitude
                });
              }
            }

            if (uniqueMatches.length === 0) {
              console.warn(`Geocoding search returned no names matching query for input: "${typedCity}"`);
              setErrorMessage(t.errNoCity);
              setIsLoadingStory(false);
              return;
            }

            // Ambiguity decision tree (Requirement #7)
            if (uniqueMatches.length === 1) {
              const first = uniqueMatches[0];
              lat = first.latitude;
              lon = first.longitude;
              cityName = first.name;
              countryName = first.country || "";
              admin1Name = first.admin1 || "";
              console.log(`Successfully located unambiguous city: "${cityName}" in "${countryName}" at Lat: ${lat}, Lon: ${lon}`);
            } else {
              // Ambiguity found! Set the suggestions, show the dropdown so the user can see options, and show an error prompt.
              setSuggestions(uniqueMatches.slice(0, 5));
              setShowDropdown(true);
              setErrorMessage(t.errMultipleMatches.replace("{city}", typedCity));
              setIsLoadingStory(false);
              return;
            }
          } else {
            console.warn(`Geocoding search returned no results for input: "${typedCity}"`);
            setErrorMessage(t.errNoCity);
            setIsLoadingStory(false);
            return;
          }
        } else {
          setErrorMessage(t.errEmptyCity);
          setIsLoadingStory(false);
          return;
        }
      }
      
      // Log the final resolved city, region, and country used for weather query so incorrect fallbacks can be detected
      console.log(`[CITY RESOLVED FOR WEATHER QUERY] City: "${cityName}", Region/Admin1: "${admin1Name}", Country: "${countryName}" (Lat: ${lat}, Lon: ${lon})`);

      // Format pieces cleanly without timezone shifts
      const yearStr = String(yearNum);
      const monthStr = String(monthNum).padStart(2, "0");
      const dayStr = String(dayNum).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      // Call Open-Meteo Archive public API
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max,sunrise&timezone=auto`;
      const response = await fetch(archiveUrl);
      
      if (!response.ok) {
        throw new Error("Unable to retrieve weather archives from Open-Meteo.");
      }

      const data = await response.json();
      
      let finalWeatherCode = 0; // Default sunny
      let tempMax = 20; // Default pleasant
      let tempMin = 10;
      let rainSum = 0;
      let windSpeed = 12; // Default wind km/h
      let sunrise = "6:15 AM"; // Default sunrise

      if (data.daily) {
        finalWeatherCode = data.daily.weather_code?.[0] ?? 0;
        tempMax = data.daily.temperature_2m_max?.[0] ?? 20;
        tempMin = data.daily.temperature_2m_min?.[0] ?? 10;
        rainSum = data.daily.precipitation_sum?.[0] ?? 0;
        
        // Extract wind speed & fallback
        if (data.daily.wind_speed_10m_max?.[0] !== undefined && data.daily.wind_speed_10m_max?.[0] !== null) {
          windSpeed = data.daily.wind_speed_10m_max[0];
        } else {
          // Generate realistic deterministic wind speed based on weatherCode and tempMax
          windSpeed = 8 + (finalWeatherCode % 5) * 3 + Math.round(Math.abs(tempMax) % 4);
        }
        
        // Extract sunrise & fallback
        if (data.daily.sunrise?.[0]) {
          sunrise = parseSunriseTime(data.daily.sunrise[0]);
        } else {
          // Seasonal deterministic sunrise estimation without timezone shifts
          const monthNumVal = monthNum;
          const hour = monthNumVal >= 5 && monthNumVal <= 8 ? 5 : (monthNumVal >= 11 || monthNumVal <= 2 ? 7 : 6);
          const minute = 10 + (monthNumVal * 4) % 40;
          sunrise = `${hour}:${String(minute).padStart(2, "0")} AM`;
        }
      }

      // Get human-readable weather text for this weatherCode
      const weatherText = t.weatherConditions[finalWeatherCode] || t.defaultCondition;

      // Save formatted readable representation (e.g. Sep 2, 2026) instead of numeric representation
      const formattedDate = `${t.months[monthNum - 1]} ${dayNum}, ${yearStr}`;

      // Ask server to generate the birth story (with fallback to the custom backup generator)
      let generatedStory;
      try {
        console.log(`Fetching generated story from API route for ${cityName}, ${admin1Name}, ${countryName}...`);
        const storyResponse = await fetch("/api/generate-story", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            city: cityName,
            country: countryName,
            region: admin1Name,
            tempMax,
            weatherCode: finalWeatherCode,
            weatherText,
            windSpeed,
            sunrise,
            birthDate: formattedDate,
            lang: lang,
          }),
        });

        if (storyResponse.ok) {
          const storyData = await storyResponse.json();
          generatedStory = {
            theme: storyData.theme,
            quote: storyData.quote,
            story: storyData.story,
            metricLabel: "",
            metricValue: ""
          };
          console.log("Successfully loaded Gemini-generated story.");
        } else {
          console.warn(`API story generate returned status ${storyResponse.status}, falling back to local generator`);
          generatedStory = generateBirthStory(finalWeatherCode, tempMax, rainSum > 0 ? 80 : 0, cityName, countryName, windSpeed, sunrise, admin1Name, lang);
        }
      } catch (apiErr) {
        console.error("API story generate fetch error, falling back to local generator:", apiErr);
        generatedStory = generateBirthStory(finalWeatherCode, tempMax, rainSum > 0 ? 80 : 0, cityName, countryName, windSpeed, sunrise, admin1Name, lang);
      }

      setRevealResult({
        city: cityName,
        country: countryName,
        region: admin1Name,
        date: formattedDate,
        tempMax,
        tempMin,
        weatherCode: finalWeatherCode,
        windSpeed,
        sunrise,
        rainProb: rainSum > 0 ? Math.min(100, Math.round(rainSum * 10)) : 0,
        story: generatedStory
      });

    } catch (err) {
      console.error(err);
      setErrorMessage(t.errApiRecovery);
    } finally {
      setIsLoadingStory(false);
    }
  };

  // High-resolution Instagram-safe Canvas download (1080x1350, 4:5 aspect ratio or taller if height is exceeded)
  const handleDownloadKeepsake = () => {
    if (!revealResult) return;
    setIsGeneratingImage(true);

    // Let React update the loading spinner state before starting heavy canvas matrix draw blocking
    setTimeout(() => {
      try {
        // Create an offscreen canvas to perform precise text measurements and height calculations
        const testCanvas = document.createElement("canvas");
        const testCtx = testCanvas.getContext("2d");
        if (!testCtx) {
          setIsGeneratingImage(false);
          return;
        }

        const width = 1080;
        const baseHeight = 1350;

        // 1. Calculate height of Story Paragraph
        testCtx.font = "34px 'Inter', 'system-ui', sans-serif";
        const storyLines = getWrappedLines(testCtx, revealResult.story.story, 820);
        const storyLineHeight = 56;
        const storyStartY = 620;
        const storyEndY = storyStartY + (storyLines.length * storyLineHeight);

        // 2. Calculate height and position of Memorable Quote Box
        testCtx.font = "italic 34px 'Georgia', 'Times New Roman', serif";
        const quoteLines = getWrappedLines(testCtx, `“${revealResult.story.quote}”`, 750);
        const quoteLineHeight = 46;
        
        // Inside the quote box we draw "MEMORABLE OUTLOOK" header at quoteBoxY + 50,
        // and the quote text lines start writing at quoteBoxY + 110.
        // The bottom of drawn text is quoteBoxY + 110 + (quoteLines.length * 46) + 50 (for bottom padding).
        const finalQuoteBoxHeight = 110 + (quoteLines.length * quoteLineHeight) + 50;

        // Position of Quote Box (60px of spacing below Story Paragraph)
        const quoteBoxY = storyEndY + 60;
        const quoteBoxEndY = quoteBoxY + finalQuoteBoxHeight;

        // 3. Spacing between Quote Box and the Footer row (Must be at least 36px, we use 60px for premium elegance)
        const quoteToFooterSpacing = 60;

        // Position of the centered website domain name 'domainY'.
        // It should be at least at Y=1180 on a standard 1350px height,
        // but pushes down dynamically if the quote elements extend further.
        const domainY = Math.max(1180, quoteBoxEndY + quoteToFooterSpacing);

        // Ensure we have an elegant buffer at the bottom (140px from domain text to the outer canvas bottom edge)
        // Which translates to 140 - 70 = 70px padding from the domain text to the inner borders.
        const totalRequiredHeight = domainY + 140;

        // 4. Dynamic expansion rule: automatic increase card height if content overflows standard 1350px
        const finalCanvasHeight = Math.max(baseHeight, totalRequiredHeight);

        // Create the actual rendering canvas with calculated height
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = finalCanvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsGeneratingImage(false);
          return;
        }

        // Enable high-fidelity anti-aliasing configurations
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 1. Cozy atmospheric background (Deep Slate Blue/Midnight gradient covering full height)
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, finalCanvasHeight);
        bgGrad.addColorStop(0, "#0E1321"); // premium slate-midnight
        bgGrad.addColorStop(0.5, "#0A0D18"); // deep galaxy cosmic navy
        bgGrad.addColorStop(1, "#05070B"); // solid bottom black
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, finalCanvasHeight);

        // Draw glowing golden baby-light cosmic orb from upper right corner
        const sunGlow = ctx.createRadialGradient(900, 160, 50, 900, 160, 500);
        sunGlow.addColorStop(0, "rgba(232, 158, 130, 0.08)"); // cozy gold atmospheric mist
        sunGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, 1080, finalCanvasHeight);

        // Draw cool calming water-light cosmic orb from lower left corner
        const oceanGlow = ctx.createRadialGradient(180, finalCanvasHeight - 200, 40, 180, finalCanvasHeight - 200, 450);
        oceanGlow.addColorStop(0, "rgba(129, 140, 248, 0.05)"); // calming indigo mist
        oceanGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = oceanGlow;
        ctx.fillRect(0, 0, 1080, finalCanvasHeight);

        // 2. Linear matrix dots overlay styled for actual height
        ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
        ctx.lineWidth = 1;
        for (let x = 80; x < 1000; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 80);
          ctx.lineTo(x, finalCanvasHeight - 80);
          ctx.stroke();
        }
        for (let y = 80; y < finalCanvasHeight - 80; y += 32) {
          ctx.beginPath();
          ctx.moveTo(80, y);
          ctx.lineTo(1000, y);
          ctx.stroke();
        }

        // 3. Elegant double-bounding borders mapping dynamically to actual scale
        // Outer glow path
        ctx.strokeStyle = "rgba(232, 158, 130, 0.14)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, 60, 60, 960, finalCanvasHeight - 120, 42);
        ctx.stroke();

        // Inner solid rule
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundRect(ctx, 70, 70, 940, finalCanvasHeight - 140, 36);
        ctx.stroke();

        // Celestial four-point corner star ornaments positioned at dynamic boundaries
        drawFourPointStar(ctx, 84, 84, 10, "#E89E82");
        drawFourPointStar(ctx, 996, 84, 10, "#E89E82");
        drawFourPointStar(ctx, 84, finalCanvasHeight - 84, 10, "#E89E82");
        drawFourPointStar(ctx, 996, finalCanvasHeight - 84, 10, "#E89E82");

        // 4. Certificate Header Labels
        drawFourPointStar(ctx, 132, 160, 12, "#E89E82");
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 18px 'JetBrains Mono', 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(t.certificateHeader.toUpperCase(), 160, 160);

        // City Name Title (Georgia bold italic)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "italic bold 64px 'Georgia', 'Times New Roman', serif";
        ctx.fillText(revealResult.city, 130, 240);

        // Subheader Atmosphere Text
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "600 22px 'Inter', 'system-ui', sans-serif";
        const locDesc = revealResult.region ? `${revealResult.region}, ${revealResult.country}` : (revealResult.country || "");
        ctx.fillText(locDesc, 130, 300);

        // Draw a beautiful golden celestial seal in the upper-right (very luxurious)
        drawFourPointStar(ctx, 800, 210, 24, "#E89E82");
        ctx.strokeStyle = "rgba(232, 158, 130, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(800, 210, 38, 0, Math.PI * 2);
        ctx.stroke();

        // 6. Pill Tag Registry (Theme badge & dynamic birthday date width)
        ctx.fillStyle = "rgba(232, 158, 130, 0.12)";
        ctx.strokeStyle = "rgba(232, 158, 130, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const themeText = `${t.themeLabel.toUpperCase()}: ${revealResult.story.theme.toUpperCase()}`;
        ctx.font = "bold 18px 'JetBrains Mono', 'Courier New', monospace";
        const themeWidth = ctx.measureText(themeText).width + 30;
        drawRoundRect(ctx, 130, 350, themeWidth, 44, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#E89E82";
        ctx.fillText(themeText, 145, 372);

        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "bold 20px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(`${t.dateLabel.toUpperCase()}: ${revealResult.date}`, 130 + themeWidth + 24, 372);

        // 5. CENTERED PETIT WEATHER SNAPSHOT TRAY (Replacing upper-right box with full-width luxury snapshot)
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundRect(ctx, 130, 430, 820, 130, 24);
        ctx.fill();
        ctx.stroke();

        // Snapshot vertical divider lines
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(335, 450);
        ctx.lineTo(335, 540);
        ctx.moveTo(540, 450);
        ctx.lineTo(540, 540);
        ctx.moveTo(745, 450);
        ctx.lineTo(745, 540);
        ctx.stroke();

        // Set alignment to middle center
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Column 1: Condition
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(t.conditionHeader.toUpperCase(), 232, 465);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 19px 'Inter', 'system-ui', sans-serif";
        ctx.fillText(getWeatherConditionText(revealResult.weatherCode, lang), 232, 512);

        // Column 2: Temperature (Visually emphasized)
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(t.temperatureHeader.toUpperCase(), 437, 465);
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 30px 'Inter', 'system-ui', sans-serif";
        const tempSnapStr = `${Math.round(revealResult.tempMax)}°C / ${Math.round((revealResult.tempMax * 9) / 5 + 32)}°F`;
        ctx.fillText(tempSnapStr, 437, 512);

        // Column 3: Max Wind Speed
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(t.windSpeedHeader.toUpperCase(), 642, 465);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px 'Inter', 'system-ui', sans-serif";
        const windSnapStr = `${Math.round(revealResult.windSpeed)} km/h / ${Math.round(revealResult.windSpeed * 0.621371)} mph`;
        ctx.fillText(windSnapStr, 642, 512);

        // Column 4: Sunrise
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(t.sunriseHeader.toUpperCase(), 847, 465);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px 'Inter', 'system-ui', sans-serif";
        ctx.fillText(revealResult.sunrise, 847, 512);

        // Reset text alignment defaults to left
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        // 7. STORY PARAGRAPH (Beautifully wrapped and staggered with premium line spacing)
        ctx.fillStyle = "#E2E8F0";
        ctx.font = "34px 'Inter', 'system-ui', sans-serif";
        wrapText(ctx, revealResult.story.story, 130, storyStartY, 820, storyLineHeight);

        // 8. MEMORABLE QUOTE BANNER CONTAINER (Offset dynamically to completely avoid overlaps)
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.beginPath();
        drawRoundRect(ctx, 130, quoteBoxY, 820, finalQuoteBoxHeight, 20);
        ctx.fill();

        // Vertical premium left gold indicator line scaling with quote card
        ctx.fillStyle = "#E89E82";
        ctx.fillRect(132, quoteBoxY + 20, 6, finalQuoteBoxHeight - 40);

        ctx.fillStyle = "#D48D71";
        ctx.font = "bold 15px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(t.skysWelcome.toUpperCase(), 160, quoteBoxY + 50);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "italic 34px 'Georgia', 'Times New Roman', serif";
        wrapText(ctx, `“${revealResult.story.quote}”`, 160, quoteBoxY + 110, 750, quoteLineHeight);

        // 9. BOTTOM BRANDING ONLY (Clean, centered website domain name, subtle muted peach, with generous padding)
        ctx.fillStyle = "rgba(232, 158, 130, 0.55)";
        ctx.font = "bold 16px 'JetBrains Mono', 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillText("weather-kidlic.vercel.app", 540, domainY);
        ctx.textAlign = "left"; // Restore standard alignment default to prevent side effects

        // 10. TRIGGER PNG ANCHOR DOWNLOAD
        const dataUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        const safeCity = revealResult.city.replace(/[^a-zA-Z0-9]/g, "_");
        const safeDate = revealResult.date.replace(/[^a-zA-Z0-9-]/g, "_");
        downloadLink.download = `Keepsake_${safeCity}_${safeDate}.png`;
        downloadLink.href = dataUrl;
        downloadLink.click();
      } catch (err) {
        console.error("Keepsake high-resolution render failed:", err);
      } finally {
        setIsGeneratingImage(false);
      }
    }, 800);
  };

  return (
    <section className="max-w-[1280px] mx-auto px-6 sm:px-8 md:px-12 py-12 select-none border-b border-[#F0E4DA] dark:border-[#3B282A]">
      {/* 50/50 split layout for Desktop/Tablet, stacked for Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start w-full">
        
        {/* LEFT COLUMN: Input Form and Text info */}
        <div className="space-y-6 text-center md:text-left w-full">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D48D71] dark:text-[#E89E82] font-extrabold block mb-1">
              {t.tinyTag}
            </span>
            <h2 className="font-serif italic font-extrabold text-3xl sm:text-4xl leading-tight text-[#3D2C2E] dark:text-[#FEFAF6]">
              {t.formTitle}
            </h2>
            <p className="text-[1.1rem] md:text-[1.15rem] italic text-[#7A6363] dark:text-slate-400 font-serif mt-3 leading-relaxed">
              {t.formSubtitle}
            </p>
          </div>

          {/* Clean White Input Panel Card */}
          <form onSubmit={handleRevealStory} className="bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm space-y-4 text-left relative z-40">
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-sans font-medium flex items-start gap-2 border border-red-100">
                <span className="text-red-500 font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Language Selector */}
              <div className="birth-form-field space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <BookOpen size={12} />
                  <span>{t.fieldLanguage}</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    id="lang-btn-en"
                    onClick={() => {
                      setLang("en");
                      localStorage.setItem("parent_weather_lang", "en");
                    }}
                    className={`flex-1 py-2 text-xs font-mono rounded-xl border font-bold transition cursor-pointer ${
                      lang === "en"
                        ? "bg-[#3D2C2E] text-white border-[#3D2C2E] dark:bg-[#E89E82] dark:text-[#2B1D1F] dark:border-[#E89E82]"
                        : "bg-[#F9F1EB] dark:bg-[#1E1415] text-[#7A6363] dark:text-slate-400 border-transparent hover:bg-[#F0E4DA] dark:hover:bg-[#3B282A]"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    id="lang-btn-es"
                    onClick={() => {
                      setLang("es");
                      localStorage.setItem("parent_weather_lang", "es");
                    }}
                    className={`flex-1 py-2 text-xs font-mono rounded-xl border font-bold transition cursor-pointer ${
                      lang === "es"
                        ? "bg-[#3D2C2E] text-white border-[#3D2C2E] dark:bg-[#E89E82] dark:text-[#2B1D1F] dark:border-[#E89E82]"
                        : "bg-[#F9F1EB] dark:bg-[#1E1415] text-[#7A6363] dark:text-slate-400 border-transparent hover:bg-[#F0E4DA] dark:hover:bg-[#3B282A]"
                    }`}
                  >
                    Español
                  </button>
                </div>
              </div>

              {/* Birth Date Input */}
              <div className="birth-form-field space-y-1.5 focus-within:text-[#D48D71]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{t.fieldBirthDate}</span>
                </label>
                <div className="relative w-full block box-border">
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    min="1940-01-01"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full block box-border px-4 py-3 bg-[#F9F1EB] dark:bg-[#1E1415] rounded-xl text-sm border-none outline-none text-[#3D2C2E] dark:text-[#FEFAF6] placeholder:text-slate-400 transition"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Birth City Autocomplete Input */}
              <div ref={dropdownRef} className="birth-form-field space-y-1.5 focus-within:text-[#D48D71]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <Search size={12} />
                  <span>{t.fieldBirthCity}</span>
                </label>
                <div className="relative w-full block box-border">
                  <input
                    type="text"
                    required
                    placeholder={t.cityPlaceholder}
                    value={typedCity}
                    onChange={(e) => {
                      setTypedCity(e.target.value);
                      setShowDropdown(true);
                      if (selectedCity) setSelectedCity(null);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full block box-border px-4 py-3 bg-[#F9F1EB] dark:bg-[#1E1415] rounded-xl text-sm border-none outline-none text-[#3D2C2E] dark:text-[#FEFAF6] placeholder:text-slate-400 dark:placeholder:text-slate-600 transition"
                    style={{ width: "100%", boxSizing: "border-box" }}
                  />
                  {typedCity && (
                    <button
                      type="button"
                      onClick={() => {
                        setTypedCity("");
                        setSelectedCity(null);
                        setSuggestions([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#F0E4DA] dark:hover:bg-[#3B282A] rounded-lg text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Autocomplete dynamic dropdown overlays */}
                <AnimatePresence>
                  {showDropdown && (suggestions.length > 0 || isSearchingCity) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-xl shadow-lg overflow-hidden text-left z-50 max-h-48 overflow-y-auto"
                    >
                      {isSearchingCity && (
                        <div className="p-3 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                          <RefreshCw className="animate-spin text-[#D48D71]" size={12} /> Locating havenCoordinates...
                        </div>
                      )}
                      {!isSearchingCity && suggestions.map((city, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(city)}
                          className="w-full px-4 py-2.5 text-[#3D2C2E] dark:text-[#FEFAF6] text-xs font-medium hover:bg-[#F9F1EB] dark:hover:bg-[#3B282A] text-left transition flex justify-between items-center"
                        >
                          <span>{city.name}{city.admin1 ? `, ${city.admin1}` : ""}, {city.country}</span>
                          <span className="text-[9px] font-mono text-[#D48D71] bg-[#FDE2D3] dark:bg-[#3B282A] px-1 py-0.2 rounded shrink-0">Select</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-500 font-sans pt-0.5 select-none">
                  {t.cityHelper}
                </p>
              </div>
            </div>

            {/* Submit Button & Trust Line */}
            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={isLoadingStory}
                className="w-full bg-[#3D2C2E] hover:bg-[#261B1C] dark:bg-[#E89E82] dark:hover:bg-[#D48D71] text-white dark:text-[#2B1D1F] py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-sm transition hover:shadow flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
              >
                {isLoadingStory ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-[#D48D71] dark:text-[#2B1D1F]" />
                    <span>{t.btnRevealLoading}</span>
                  </>
                ) : (
                  <>
                    <ChevronRight size={14} />
                    <span>{t.btnRevealNormal}</span>
                  </>
                )}
              </button>

              <p className="text-[10.5px] text-center text-slate-400 dark:text-slate-500 font-sans tracking-wide">
                {t.trustLine}
              </p>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Interactive Keepsake displays (Replaces Example with Real seamlessly) */}
        <div className="w-full flex justify-center items-start lg:sticky lg:top-8">
          <AnimatePresence mode="wait">
            {!revealResult ? (
              <motion.div
                key="example-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-xl relative"
              >
                {/* Ambient cozy background circles */}
                <div className="absolute -top-4 -left-6 w-32 h-32 bg-[#D48D71]/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -right-6 w-32 h-32 bg-[#FFD580]/10 rounded-full blur-3xl"></div>

                <div className="w-full rounded-[36px] p-8 flex flex-col justify-between shadow-xl border border-slate-800 bg-[#0E1321] text-[#FEFAF6] relative overflow-hidden">
                  {/* Premium dark grid pattern decor overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e2439_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

                  <div className="relative z-10 space-y-6">
                    {/* Header: matched to real certificate for zero layout shift */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-[#E89E82] uppercase bg-[#E89E82]/10 border border-[#E89E82]/20 px-2.5 py-0.5 rounded-full font-bold">
                          {t.certificateHeader}
                        </span>
                        <h3 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-white mt-1.5 font-sans leading-tight">
                          {t.exampleCity}
                        </h3>
                        <p className="text-sm font-medium text-slate-300 mt-1 font-sans">
                          {t.exampleCountrySub}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-300 block">{t.weatherOnArrival}</span>
                          <p className="font-serif font-extrabold text-xl sm:text-2xl text-white">
                            21°C / 70°F
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 shrink-0">
                          <WeatherIcon code={0} size={30} />
                        </div>
                      </div>
                    </div>

                    {/* Compact Weather Snapshot Block */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-center my-1 select-none">
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.conditionHeader}</span>
                        <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                          {getWeatherConditionText(0, lang)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.temperatureHeader}</span>
                        <span className="text-[15px] font-extrabold text-[#E89E82] leading-tight">
                          21°C / 70°F
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r text-center">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.windSpeedHeader}</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          12 km/h / 7 mph
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-1">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.sunriseHeader}</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          7:28 AM
                        </span>
                      </div>
                    </div>

                    {/* Theme bar & description layout to match real look */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#E89E82] bg-[#E89E82]/15 px-3 py-1 rounded-full border border-[#E89E82]/25">
                          {t.themeLabel}: {t.exampleTheme}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{t.dateLabel}: {t.months[9]} 14, 2021</span>
                      </div>
                      <p className="text-sm text-slate-300 font-sans leading-relaxed tracking-wide">
                        {t.exampleStory}
                      </p>
                    </div>

                    {/* Short bold Quote */}
                    <div className="bg-white/[0.03] border-l-2 border-[#E89E82] p-4 rounded-r-xl">
                      <p className="text-[10px] font-mono text-[#D48D71] uppercase tracking-widest font-bold mb-1.5">{t.skysWelcome}</p>
                      <p className="font-serif italic text-white text-md sm:text-lg leading-snug">
                        “{t.exampleQuote}”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Example Tag Badge hover overlay */}
                <div className="absolute top-3 -right-3 rotate-6 bg-[#D48D71] text-xs font-mono font-bold text-white px-3 py-1.5 rounded-xl shadow-md border border-white/10 pointer-events-none z-20 flex items-center gap-1 uppercase tracking-wider scale-90">
                  <Baby size={12} />
                  <span>{t.referenceIdea}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="real-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                className="w-full max-w-xl relative"
              >
                {/* Your Authentic Weather Keepsake Badge overlay */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F9F1EB] dark:bg-[#1E1415] border border-[#F0E4DA] dark:border-[#3B282A] px-5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase text-[#D48D71] dark:text-[#E89E82] font-extrabold flex items-center gap-1 z-30 shadow-sm">
                  <BookOpen size={12} />
                  <span>{t.authenticKeepsake}</span>
                </div>

                <div className="w-full rounded-[36px] bg-[#0E1321] text-[#FEFAF6] p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
                  {/* Premium cozy star/cloud grid graphic background overlay */}
                  <div className="absolute inset-0 bg-[#161c2e]/20 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

                  <div className="relative z-10 space-y-6 text-left">
                    {/* Header: Birth Info & Geolocation */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-[#E89E82] uppercase bg-[#E89E82]/10 border border-[#E89E82]/20 px-2.5 py-0.5 rounded-full font-bold">
                          {t.certificateHeader}
                        </span>
                        <h3 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-white mt-1.5 font-sans leading-tight">
                          {revealResult.city}
                        </h3>
                        <p className="text-sm font-medium text-slate-300 mt-1 font-sans">
                          {revealResult.region ? `${revealResult.region}, ${revealResult.country}` : revealResult.country}
                        </p>
                      </div>
                      
                      {/* Meteorological snapshot */}
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-300 block">{t.weatherOnArrival}</span>
                          <p className="font-serif font-extrabold text-xl sm:text-2xl text-white">
                            {Math.round(revealResult.tempMax)}°C / {Math.round((revealResult.tempMax * 9) / 5 + 32)}°F
                          </p>
                        </div>
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 shrink-0">
                          <WeatherIcon code={revealResult.weatherCode} size={30} />
                        </div>
                      </div>
                    </div>

                    {/* Compact Weather Snapshot Block */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-center my-1 select-none">
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.conditionHeader}</span>
                        <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                          {getWeatherConditionText(revealResult.weatherCode, lang)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.temperatureHeader}</span>
                        <span className="text-[15px] font-extrabold text-[#E89E82] leading-tight">
                          {Math.round(revealResult.tempMax)}°C / {Math.round((revealResult.tempMax * 9) / 5 + 32)}°F
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r text-center">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.windSpeedHeader}</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          {Math.round(revealResult.windSpeed)} km/h / {Math.round(revealResult.windSpeed * 0.621371)} mph
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-1">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">{t.sunriseHeader}</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          {revealResult.sunrise}
                        </span>
                      </div>
                    </div>

                    {/* Weather Legend theme title & story copy */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#E89E82] bg-[#E89E82]/15 px-3 py-1 rounded-full border border-[#E89E82]/25">
                          {t.themeLabel}: {revealResult.story.theme}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{t.dateLabel}: {revealResult.date}</span>
                      </div>
                      <p className="text-sm md:text-base text-slate-300 font-sans leading-relaxed tracking-wide">
                        {revealResult.story.story}
                      </p>
                    </div>

                    {/* Full-width Quote banner inside Card container */}
                    <div className="bg-white/[0.03] border-l-2 border-[#E89E82] p-4 rounded-r-xl">
                      <p className="text-[10px] font-mono text-[#D48D71] uppercase tracking-widest font-bold mb-1.5">{t.skysWelcome}</p>
                      <p className="font-serif italic text-white text-md sm:text-lg leading-snug">
                        “{revealResult.story.quote}”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Premium Keepsake Download Controls below card */}
                <div className="flex flex-col items-center gap-3 mt-8">
                  <button
                    type="button"
                    disabled={isGeneratingImage}
                    onClick={handleDownloadKeepsake}
                    className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#D48D71] to-[#E89E82] hover:opacity-95 active:scale-[0.98] text-[#1E1415] font-mono text-xs uppercase tracking-widest font-extrabold px-10 py-4 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-75"
                  >
                    {isGeneratingImage ? (
                      <>
                        <RefreshCw className="animate-spin text-[#1E1415]" size={14} />
                        <span>{t.downloadButtonLoading}</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} className="stroke-[2.5]" />
                        <span>{t.downloadButton}</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase text-center mt-1">
                    {t.downloadOptimized}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

// ==========================================
// HIGH RESOLUTION CANVAS EXPORT GRAPHICS SETUP
// ==========================================

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

function drawFourPointStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}

function drawHeartIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const d = size;
  ctx.moveTo(x, y + d / 4);
  ctx.quadraticCurveTo(x, y, x + d / 2, y);
  ctx.quadraticCurveTo(x + d, y, x + d, y + d / 3);
  ctx.quadraticCurveTo(x + d, y + (d * 5) / 8, x + d / 2, y + d);
  ctx.quadraticCurveTo(x, y + (d * 5) / 8, x, y + d / 3);
  ctx.quadraticCurveTo(x, y, x, y + d / 4);
  ctx.fill();
}

function drawCustomKeepsakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, code: number) {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
  const isSunny = [0, 1].includes(code);

  if (isSunny) {
    // Premium bright golden sun
    ctx.beginPath();
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 24);
    grad.addColorStop(0, "#FEF08A");
    grad.addColorStop(1, "#F59E0B");
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();

    // Golden sunburst rays
    ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = cx + Math.cos(angle) * 26;
      const y1 = cy + Math.sin(angle) * 26;
      const x2 = cx + Math.cos(angle) * 36;
      const y2 = cy + Math.sin(angle) * 36;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (isRainy) {
    // Soft fluffy indigo raining cloud
    drawSingleCloudShape(ctx, cx, cy - 8, "#E2E8F0");
    
    // Glowing diagonal rainfall drops
    ctx.strokeStyle = "#818CF8";
    ctx.lineWidth = 3;
    const dropOffsets = [
      { dx: -12, dy: 14 },
      { dx: 0, dy: 20 },
      { dx: 12, dy: 14 },
    ];
    dropOffsets.forEach(({ dx, dy }) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + dy);
      ctx.lineTo(cx + dx - 4, cy + dy + 10);
      ctx.stroke();
    });
  } else if (isSnowy) {
    // Beautiful winter snowy cloud
    drawSingleCloudShape(ctx, cx, cy - 8, "#FFFFFF");

    // Stellar ice stars
    ctx.strokeStyle = "#93C5FD";
    ctx.lineWidth = 2.5;
    const flakeOffsets = [
      { dx: -10, dy: 18, size: 6 },
      { dx: 10, dy: 18, size: 6 },
      { dx: 0, dy: 24, size: 8 }
    ];
    flakeOffsets.forEach(({ dx, dy, size }) => {
      const scx = cx + dx;
      const scy = cy + dy;
      for (let i = 0; i < 4; i++) {
        const rad = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(scx - Math.cos(rad) * size, scy - Math.sin(rad) * size);
        ctx.lineTo(scx + Math.cos(rad) * size, scy + Math.sin(rad) * size);
        ctx.stroke();
      }
    });
  } else {
    // Soft overcast cloudy sky
    drawSingleCloudShape(ctx, cx + 8, cy - 4, "rgba(255, 255, 255, 0.4)");
    drawSingleCloudShape(ctx, cx - 6, cy + 4, "rgba(255, 255, 255, 0.95)");
  }
}

function drawSingleCloudShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, fillStyle: string) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(cx - 14, cy + 4, 12, 0, Math.PI * 2);
  ctx.arc(cx, cy - 2, 16, 0, Math.PI * 2);
  ctx.arc(cx + 14, cy + 4, 11, 0, Math.PI * 2);
  ctx.rect(cx - 14, cy, 28, 16);
  ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y;
}

function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lines.push(currentLine.trim());
      currentLine = words[n] + " ";
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());
  return lines;
}
