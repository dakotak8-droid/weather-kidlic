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

    // Dynamic month-based date format to avoid timezone shifts
    const today = new Date();
    const yearStr = today.getFullYear().toString();
    const formattedDate = lang === "es" ? "ese día memorable" : "that unforgettable day";

    if (lang === "es") {
      if (isRainy) {
        let story = "";
        let theme = "Recibidos por la Lluvia";
        let quote = "Bajo el repiqueteo de las gotas, tu calor llenó nuestra vida de un brillo infinito.";

        if (isNY) {
          story = `La mañana comenzó con lloviznas suaves sobre New York. Los taxis amarillos esquivaban charcos a lo largo de Broadway, la bruma matinal se asentaba entre los rascacielos y el vapor trepaba de las rejillas del metro. Las nubes cubrían el cielo húmedo de la metrópoli, marcando una temperatura templada de ${tempC}°C (${tempF}°F). Nos encontrábamos flotando en un remanso de tranquilidad en el hospital. Sostener de pronto tu cuerpo tibio con el sonido lejano de los limpiaparabrisas rítmicos fue de una belleza abrumadora. Nos abrazamos, sabiendo que este gélido día lluvioso pasaría a la historia de nuestro hogar como el portal hacia la felicidad más pura.`;
        } else if (isChicago) {
          story = `El viento característico soplaba a ${windKn} km/h (${windMph} mph) agitando con ímpetu la lluvia fría directo desde las aguas profundas del Chicago Lake Michigan. Los transeúntes agachaban el torso con abrigos oscuros sobre el asfalto mojado de la Magnificent Mile. Dentro del hospital, cobijados por un silencio reconfortante, aguardábamos con el corazón latiendo a mil por hora. Al recibirte en nuestros brazos, tu pequeña respiración ahogó el llanto en un gemido tierno. Aquella tempestad invernal de Chicago se transformó instantáneamente en el entorno más dulce y memorable de nuestras vidas, colmándonos de calma.`;
        } else if (isWarsaw) {
          story = `Una lluvia fresca y persistente lavaba los adoquines medievales del Old Town en Varsovia, deslizándose sigilosamente hacia las orillas tranquilas del río Vístula. El amanecer gris se asomó a las ${sunrise} envolviendo la ciudad en un murmullo pasivo y otoñal de ${tempC}°C (${tempF}°F). En el hospital, las voces se silenciaron cuando tu llanto inaugural rompió el aire fresco de la habitación. Miramos tu carita tan perfecta, acariciando tus dedos diminutos. Varsovia despertaba bajo la llovizna, pero para nosotros se levantaba un reino de luz imperecedera que abrigaría todos nuestros inviernos futuros.`;
        } else if (isParis) {
          story = `Un manto plomizo cubría los tejados de zinc y las elegantes cafeterías de París mientras la lluvia repiqueteaba con timidez en las orillas del río Sena. Se sentía un aire sereno a ${tempC}°C (${tempF}°F) con una brisa mansa de ${windKn} km/h (${windMph} mph). El milagro de tu nacimiento cubrió de una paz mística nuestra pequeña estancia. Cuando la enfermera te colocó sobre mi pecho por primera vez, un sol invisible pareció encenderse entre nosotros. Ese París húmedo y gris se grabó eternamente en nuestra memoria como el decorado más sublime de nuestra vida familiar.`;
        } else if (isLondon) {
          story = `Una húmeda neblina londinense flotaba sobre el curso del río Támesis, mientras una llovizna clásica empapaba las cabinas telefónicas rojas y las aceras de la capital inglesa. El amanecer llegó a las ${sunrise} cubriendo Londres con nubes cargadas y bajas a ${tempC}°C (${tempF}°F). En nuestra habitación abrigada la calma era absoluta. Al sostenerte y arrullarte con asombro, el frío clima de la metrópoli dio paso a un nido de amor indestructible. Ese día lluvioso de Londres se convirtió en el inicio solemne de nuestra pequeña y hermosa dinastía.`;
        } else if (isToronto) {
          story = `La lluvia fresca empapaba los tranquilos vecindarios residenciales, descendiendo suavemente hacia las orillas de Lake Ontario en Toronto bajo un cielo encapotado de ${tempC}°C (${tempF}°F). Con el viento que soplaba a ${windKn} km/h (${windMph} mph), las calles lucían desiertas y calmas. Sin embargo, nuestra mente estaba enteramente enfocada en el milagro que ocurría en la habitación. Cuando sentimos tu primer suspiro, una profunda sensación de gratitud nos invadió de pies a cabeza. Este día gris en Toronto cobró para siempre los colores más hermosos de nuestra memoria.`;
        } else {
          story = `La mañana de tu nacimiento llegó a ${city} a las ${sunrise}, presentándose con un cielo cubierto de lluvia y una temperatura templada de ${tempC}°C (${tempF}°F). El viento de ${windKn} km/h (${windMph} mph) arrojaba las gotas con fuerza contra los cristales, empañando el panorama exterior. En el hospital, estábamos absortos en la majestuosidad de tu llegada. Sostener tu pequeño cuerpo recién nacido disipó por completo la aspereza de la atmósfera. El temporal en ${city} sirvió como el humilde testigo de un amor eterno que hoy guía cada uno de nuestros pasos.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSnowy) {
        let story = "";
        let theme = "Un Manto de Nieve";
        let quote = "Hacía un frío helador afuera, pero tu pequeño calor encendió un fuego tierno que nunca se apagará.";

        if (isNY) {
          story = `El manto blanco cubría los escapes de incendios de ladrillo rojo en New York en la mañana de tu llegada. Un copioso copo de nieve caía silenciosamente sobre Central Park, acallando la bocina habitual de la gran ciudad bajo una atmósfera helada de ${tempC}°C (${tempF}°F). En la calidez de nuestra habitación, el aire se detuvo el segundo en que abriste tus grandes ojos oscuros. Estrechándote contra el pecho, contemplamos el Manhattan nevado desde el ventanal. Aquel invierno neoyorquino nos regaló para siempre el recuerdo del día en que el cielo se vistió de gala para recibirte.`;
        } else if (isChicago) {
          story = `Un frío polar se extendía desde Lake Michigan con vientos cortantes de ${windKn} km/h (${windMph} mph) soplando nieve fresca por calles y rascacielos de Chicago. La ciudad entera parecía congelada en el tiempo bajo un cielo gélido de ${tempC}°C (${tempF}°F). Dentro de nuestra pequeña sala del hospital, reinaba una atmósfera sumamente apacible. En el instante preciso en que tu piel tocó la nuestra, el invierno Chicagoense perdió toda su severidad. Habíamos recibido el mayor milagro de nuestras vidas, un fuego de pura dicha que nos cobijaría eternamente.`;
        } else if (isWarsaw) {
          story = `La escarcha ártica decoraba las fachadas del Old Town de Varsovia y una hermosa sábana blanca cubría las orillas silenciosas del río Vístula. El amanecer nevado se instalaba a las ${sunrise} bajo una temperatura de ${tempC}°C (${tempF}°F). Las calles polacas lucían despobladas y místicas en el corazón del invierno. En cuanto oímos tu primera respiración débil, el tiempo adquirió un valor eterno. Acurrucados en el abrigo de la habitación, supimos que Varsovia nos había coronado con la joya más hermosa de nuestra existencia.`;
        } else {
          story = `Un hermoso velo helado se posó en ${city} alrededor de las ${sunrise}, cayendo en copos densos de nieve pura con el termómetro en ${tempC}°C (${tempF}°F). Mientras el viento soplaba a ${windKn} km/h (${windMph} mph) levantando torbellinos blancos afuera, nuestra estancia era un refugio cálido. Al estrecharte por primera vez y besar tu frente suave, nos inundó una paz maravillosa. La gélida bienvenida celestial de ${city} esculpió un día imborrable para nuestra alma.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSunny) {
        let story = "";
        let theme = "Lienzo de Luz Dorada";
        let quote = "El sol resplandecía en lo alto de los cielos, pero el verdadero amanecer brotó de tu mirada.";

        if (isNY) {
          story = `La luz brillante y radiante de la mañana encendía las fachadas acristaladas de New York en la fecha de tu llegada. Los taxis amarillos brillaban bajo el cielo de cobalto y Central Park se mecía bajo un aire templado de ${tempC}°C (${tempF}°F). Los transeúntes recorrían con prisa la gran urbe, ajenos a la hermosa revolución interna que se vivía en nuestra alcoba de hospital. El instante en que la luz de la tarde iluminó tu carita durmiente quedará grabado por siempre en el fondo de nuestro corazón. Nos fundimos en un abrazo lleno de asombro sobre esta hermosa isla de Manhattan, bautizados por el sol neoyorquino.`;
        } else if (isChicago) {
          story = `Un cielo impecable se extendía en la mañana sobre Chicago. Un viento sereno acariciaba el parque mientras un sol radiante brillaba sobre las aguas de Lake Michigan a unos agradables ${tempC}°C (${tempF}°F). Al nacer, el imponente horizonte y la silueta de los rascacielos cobraron un aire amigable. Acariciar tus deditos mientras la calidez de Chicago entraba por el cristal nos llenó de una esperanza insondable. Tu luz había llegado para ser el faro eterno que guiará el rumbo de nuestra familia.`;
        } else if (isWarsaw) {
          story = `Un sol vivificante iluminaba la arquitectura clásica del Old Town de Varsovia, proyectándose con hermosos destellos en las aguas calmas del Vístula. El amanecer radiante despuntó a las ${sunrise} tiñendo de carmín el aire templado de ${tempC}°C (${tempF}°F). En el hospital reinaba un silencio casi solemne. Cuando pudimos arrullarte cara a cara, una alegría celestial impregnó nuestras almas. Te contemplamos en paz, sabiendo que este espléndido día soleado en Varsovia era el portal de una vida llena de promesas compartidas.`;
        } else {
          story = `Un día resplandeciente abrazó a ${city}, regalándonos cielos despejados e iluminados y una brisa templada a ${windKn} km/h (${windMph} mph) con una temperatura de ${tempC}°C (${tempF}°F). Las calles locales lucían hermosas y jubilosas. Para nosotros ordinarios mortales, el mayor regalo yacía custodiado en la habitación. Estrecharte contra nuestra mejilla y oír tu dulce gemido iluminó eternamente nuestro ser. ${city} era un cuadro de luz, pero tú eras la verdadera claridad de nuestro porvenir.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      // Default Cloudy
      let story = "";
      let theme = "Atmósfera Serena";
      let quote = "En medio de nubes y vientos suaves, tu llegada encendió la claridad definitiva en nuestro camino.";

      if (isNY) {
        story = `Un cielo grisáceo y calmo envolvía la isla de Manhattan, silenciando suavemente la ruidosa coreografía del asfalto de New York. Vapor húmedo trepaba de las calles con una temperatura templada de ${tempC}°C (${tempF}°F). Dentro de nuestra habitación, la prisa de la gran manzana se redujo a la nada absoluta. Cuando abriste levemente tus ojos, un sentimiento sobrecogedor invadió nuestras almas. Nos acurrucamos con paciencia a observarte respirar. New York seguía latiendo afuera en su neblina, pero nuestro universo entero ya cabía entre nuestros brazos cansados.`;
      } else if (isChicago) {
        story = `Nubes densas y templadas cubrían el skyline de Chicago, empujadas por ráfagas de aire de ${windKn} km/h (${windMph} mph) procedentes de Lake Michigan. El día transcurría plácido y asordinado a ${tempC}°C (${tempF}°F) con transeúntes caminando alertas en el centro. Sostener de pronto tu cuerpo ligero desató una calidez profunda en nuestro pecho que erradicó toda penumbra exterior. Ese firmamento gris se convirtió en el fondo poético del día en que nuestra familia descubrió su rumbo más glorioso.`;
      } else if (isWarsaw) {
        story = `Un cielo nuboso y templado cobijaba las orillas tranquilas del río Vístula y las viejas murallas de ladrillo en Varsovia. El amanecer silencioso inició a las ${sunrise} bajo una brisa calma de ${windKn} km/h. En nuestra cálida habitación de hospital, las mentes y las manos temblorosas se sincronizaron al verte aparecer. Qué momento de emoción tan dulce. Este apacible día gris polaco se instaló en el fondo de nuestra alma como el paisaje idílico de tu primer suspiro en el mundo.`;
      } else {
        story = `Un manto nuboso y templado cobijaba el cielo de ${city}, con una brisa tranquila que soplaba a ${windKn} km/h (${windMph} mph) y una temperatura agradable de ${tempC}°C (${tempF}°F). El exterior invitaba al descanso y la calma, mientras puertas adentro aguardábamos con anhelo infinito. El asombro nos embargó al acunarte y sentir tu sutil aroma a vida nueva. El gris místico de las nubes sobre ${city} cobró para siempre el brillo dorado del día en que naciste para iluminarnos.`;
      }

      return { theme, quote, story, metricLabel: "", metricValue: "" };
    } else {
      // English
      if (isRainy) {
        let story = "";
        let theme = "Welcomed by Raindrops";
        let quote = "As rain drummed softly on the glass, your first soft breath filled our world with infinite light.";

        if (isNY) {
          story = `The morning carried a gentle drizzle over New York. Yellow cabs dodged rain puddles along Broadway, a soft morning mist settled between skyscrapers, and steam rose quietly from subway grates. The damp sky draped the metropolis at a mild ${tempC}°C (${tempF}°F). For us, the hospital room became a haven of absolute quiet. Cradling your tiny body with the rhythm of distant windshield wipers in the background felt incredibly sacred. We realized this rainy New York day was now the beautiful beginning of our family story.`;
        } else if (isChicago) {
          story = `The city's iconic wind swept off Lake Michigan at ${windKn} km/h (${windMph} mph), pushing heavy cold rain across the Magnificent Mile. Pedestrians on Michigan Avenue pulled their dark coats close against the chill. Indoors, shielded from the elements, we waited with racing hearts. The moment we cuddled you, your tiny breathing quieted down in a tender sigh. That stormy Chicago weather faded into deep serenity, leaving us with an unforgettable memory of warmth.`;
        } else if (isWarsaw) {
          story = `A steady rain washed the cobblestones of the Warsaw Old Town, flowing gently toward the quiet banks of the Vistula River. Dawn arrived at ${sunrise}, wrapping the ancient streets in a calm autumn mood of ${tempC}°C (${tempF}°F). In the hospital, our room fell completely silent as your soft voice of new life broke through. We touched your perfect little fingers in wonder. Warsaw woke up in grey rain, but for us, a brilliant light had started to warm all our years to come.`;
        } else if (isParis) {
          story = `A soft grey rain fell over Paris, splashing on the classic zinc rooftops and green café awnings along the historic River Seine. The air felt mild at ${tempC}°C (${tempF}°F) with a gentle breeze of ${windKn} km/h (${windMph} mph). Cradling you for the very first time, a wave of sweet peace settled over our small hospital room. The rainy Parisian afternoon gave way to a lifetime of love, marking this wet day as the most cherished memory we will carry.`;
        } else if (isLondon) {
          story = `A quiet, classic drizzle drifted across London, misting over the banks of the River Thames and slicking the red double-decker buses on the street. Outside, commuters rushed through the damp chill, but inside our cozy room, time had stopped. Holding you close and whispering reassurance felt inordinately sweet. The historic London streetscape outside was just a backdrop to the quiet start of our family's greatest adventure.`;
        } else if (isToronto) {
          story = `Cool lakeside rain fell over Toronto's residential neighborhoods, trickling down toward the shores of Lake Ontario under an overcast sky of ${tempC}°C (${tempF}°F). The wind rustled branches at ${windKn} km/h (${windMph} mph). Our thoughts were completely consumed by the tiny miracle resting on our chest. Feeling your warm chest rise and fall filled us with immense gratitude, transforming a dreary lakeside afternoon into our family's brightest milestone.`;
        } else {
          story = `The morning of your birth arrived in ${city} at ${sunrise} under a rain-streaked sky with a mild temperature of ${tempC}°C (${tempF}°F). Brisk wind currents blowing at ${windKn} km/h (${windMph} mph) rattled the panes, but inside, we were lost in the majesty of holding you. Feeling your skin against ours made the storm lose all its coldness. The damp weather in ${city} served as a humble witness to the beginning of a love story we will treasure forever.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSnowy) {
        let story = "";
        let theme = "A Blanket of Silent Snow";
        let quote = "It was freezing cold outside, but your tiny weight in our arms kindled a fire that will never fade.";

        if (isNY) {
          story = `A fresh coat of white snow covered the fire escapes of New York on the morning of your birth. Flurries fell over Central Park, quietening the relentless hum of the city under a chilly winter sky of ${tempC}°C (${tempF}°F). Inside our warm room, the entire world stood completely still. In the moment you opened your eyes and grabbed our finger, we looked out at the snowy Manhattan skyline in awe, deeply thankful for the day winter dressed the city in white to welcome you.`;
        } else if (isChicago) {
          story = `A biting winter wind blew off Lake Michigan at ${windKn} km/h (${windMph} mph), swirling snow between Chicago's skyscrapers and quiet plazas. The city was bundled up in a deep freeze of ${tempC}°C (${tempF}°F). Inside the hospital, our small namespace was peaceful and warm. The moment your tiny skin touched ours, the Chicago cold lost all power. We had received our greatest gift, starting a fire of gratitude that will keep us warm forever.`;
        } else if (isWarsaw) {
          story = `Winter frost clung to the brick fortifications of the Warsaw Old Town, and a fresh white blanket of snow lined the banks of the Vistula River. Dawn broke at ${sunrise}, quiet and cold at ${tempC}°C (${tempF}°F). Inside, we gathered to greet you. The second your voice echoed in the room, everything felt complete. Warsaw was blanketed in Polish winter, but for us, the warmest chapter of our lives had officially begun.`;
        } else {
          story = `A pristine blanket of snow settled over ${city} around ${sunrise} as the thermometer hovered at ${tempC}°C (${tempF}°F). While the wind blew at ${windKn} km/h (${windMph} mph), creating white whirlwinds outside, our room was a serene haven. cradling your tiny shoulders and kissing your forehead brought a wave of absolute peace. The snowy skies of ${city} framed a moment we will protect forever.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      if (isSunny) {
        let story = "";
        let theme = "A Canvas of Golden Light";
        let quote = "The sun shone brightly over the streets, but the true daybreak was the light in your eyes.";

        if (isNY) {
          story = `Brilliant morning sunlight reflected off the glass towers of New York on the day you arrived. Yellow cabs caught the golden beams, Central Park was bright and lush under a mild sky of ${tempC}°C (${tempF}°F), and the streets hummed with life. While commuters hurried below, the greatest change of our lives occurred in our hospital room. Sostening you while afternoon sunbeams danced across your tiny hand filled us with an overwhelming joy. We were holding our whole future, right here under the New York sky.`;
        } else if (isChicago) {
          story = `Clear, bright skies welcomed you to Chicago. Crisp lake air swept off Lake Michigan at ${windKn} km/h (${windMph} mph), and a beautiful sun gleamed off the high-rises at a comfortable ${tempC}°C (${tempF}°F). When you arrived, the windy city's vast skyline seemed friendly and quiet. Holding you close as the sunlight poured in of Chicago's skyline brought an incredible sense of hope. You became our steady anchor on that perfect, sunny afternoon.`;
        } else if (isWarsaw) {
          story = `Beautiful sunshine bathed the historic pastel facades of the Warsaw Old Town, glittering off the waters of the Vistula River. Dawn appeared at ${sunrise}, warming the air to a pleasant ${tempC}°C (${tempF}°F). Inside, a sleepy quietness was broken by your tiny newborn sighs. Cradling you for the first time while Warsaw basked in the golden daylight filled us with a sense of wonder, making that sunny day our family's most sacred milestone.`;
        } else {
          story = `A gorgeous, sun-drenched day embraced ${city}, gifting us with clear blue skies and a soft breeze of ${windKn} km/h (${windMph} mph) with the temperature reaching ${tempC}°C (${tempF}°F). The municipal parks were lively and bright, but for us, the real sunlight was cradled in our arms. Feeling your steady breathing next to our heart brought a wave of serene happiness. ${city} was a picture of light, but you were our true sunrise.`;
        }

        return { theme, quote, story, metricLabel: "", metricValue: "" };
      }

      // Default Cloudy
      let story = "";
      let theme = "A Overcast Sky of Peace";
      let quote = "Under a calm, quiet sky, your arrival brought the ultimate clarity to our lives.";

      if (isNY) {
        story = `A calm, grey sky hung low over Manhattan, softening the energetic rush of New York. Damp steam rose from the pavement below with a mild temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, the haste of the city slowed to an absolute standstill. The second your eyes opened and met ours, all of the noisy Manhattan bustle disappeared into a quiet, comforting peace. We sat holding you, deeply grateful that you were finally resting in our arms.`;
      } else if (isChicago) {
        story = `Soft, overcast clouds blanketed the Chicago skyline, carried by a steady wind of ${windKn} km/h (${windMph} mph) from Lake Michigan. The day felt calm and peaceful at ${tempC}°C (${tempF}°F). The minute we held you in our arms for the first time, all the chill in the air dissolved. Looking down at your small features brought an immediate, overwhelming warmth that we'll guard forever, turning a simple grey Chicago day into our family's most sacred memory.`;
      } else if (isWarsaw) {
        story = `Quiet clouds draped the banks of the Vistula River and the old brick walls of Warsaw. Dawn arrived silently around ${sunrise} under a calm breeze of ${windKn} km/h. Inside our hospital room, tension melted as we saw you for the first time. Holding you close as Warsaw rested under the serene, overcast sky became a memory of pure happiness, sealing that simple autumn morning as the day our lives truly felt complete.`;
      } else {
        story = `A peaceful overcast sky covered ${city}, with a soft wind sweeping through the streets at ${windKn} km/h (${windMph} mph) and the temperature resting at a pleasant ${tempC}°C (${tempF}°F). Outside, the world was slow and quiet, but inside, we were preparing for a lifetime of love. When we first cradled you close, a deep sense of bliss filled our hearts, marking this grey day in ${city} as the most beautiful dawn of our existence.`;
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
