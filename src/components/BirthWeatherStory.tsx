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
    exampleCity: "Austin, Texas",
    exampleCountrySub: "United States • Atmosphere and stars mapped",
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
    exampleCity: "Austin, Texas",
    exampleCountrySub: "United States • Atmósfera y estrellas mapeadas",
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

    const profile = isCuratedProfile(city, region, country);

    const isNY = profile === "nyc";
    const isChicago = profile === "chicago";
    const isWarsaw = profile === "warsaw";
    const isToronto = profile === "toronto";
    const isLondon = profile === "london";
    const isParis = profile === "paris";

    if (lang === "es") {
      if (isRainy) {
        let storyText = "";
        if (isNY) {
          storyText = `Era una típica mañana húmeda en New York, con taxis amarillos salpicando los charcos de las calles y vapor subiendo de las rejillas del metro. Los viajeros de la mañana se apresuraban por las calles bajo sus paraguas. Pero dentro de nuestra tranquila habitación de hospital, nada de ese ajetreo importaba ya. En el momento en que te sostuvimos por primera vez, la agitada ciudad afuera se desvaneció en el fondo. Era difícil creer que finalmente estábamos sosteniendo a nuestro propio bebé. Ese frío y lluvioso día de New York se convirtió en el comienzo silencioso de todo para nosotros.`;
        } else if (isChicago) {
          storyText = `Un viento frío soplaba desde Lake Michigan, barriendo una intensa lluvia por las calles del centro de Chicago. La gente en las aceras se abrigaba bien con sus impermeables para mantenerse caliente. Adentro, estábamos completamente protegidos del clima, esperando para conocerte. En el segundo en que te sostuvimos en nuestros brazos, el ajetreo de la ciudad se calmó por completo. Trajiste un calor a nuestras vidas que ninguna tormenta fría del lago podía tocar, y ese día lluvioso en Chicago se convirtió en uno de nuestros recuerdos favoritos.`;
        } else if (isToronto) {
          storyText = `Una lluvia fresca caía sobre los vecindarios, golpeando suavemente las ventanas de las casas. Abajo, a lo largo de la costa de Lake Ontario, la ciudad se sentía tranquila y lenta. Nuestras mentes estaban completamente concentradas en la habitación del hospital donde te esperábamos. Cuando finalmente te sostuvimos por primera vez, la tarde lluviosa afuera pareció no importar en absoluto. Tu llegada trajo una maravillosa sensación de paz a nuestra familia, convirtiendo una tarde gris junto al lago en un recuerdo indefinido.`;
        } else if (isWarsaw) {
          storyText = `Una lluvia constante caía sobre los adoquines del Old Town, goteando hacia las orillas del Vistula River. Afuera, Warsaw seguía su rutina otoñal habitual, pero en nuestra habitación de hospital, la historia de nuestra propia familia apenas comenzaba. En el momento en que te abrazamos, los siglos de historia de afuera se desvanecieron en el fondo. Te sostuvimos fuerte, sabiendo que comenzábamos un nuevo y hermoso capítulo de nuestras vidas juntos.`;
        } else if (isLondon) {
          storyText = `Una llovizna densa y clásica caía sobre London, mojando las calles históricas y haciendo que los transeúntes corrieran hacia la estación de metro más cercana. Afuera, una neblina húmeda avanzaba sobre el River Thames. Dentro de nuestra cálida habitación, estábamos a un millón de millas de distancia de la ciudad húmeda. Sostenerte por primera vez fue un momento increíblemente emotivo del que todavía hablamos hoy. Finalmente estabas aquí, y la historia de nuestra propia familia apenas comenzaba.`;
        } else if (isParis) {
          storyText = `La lluvia golpeaba suavemente los tejados de zinc y lavaba los tranquilos adoquines de Paris. Cerca del River Seine, la gente se refugiaba bajo los toldos verdes de los cafés en las esquinas. Pero nuestra atención estaba por completo dentro de nuestra cálida habitación. Cuando te abrazamos por primera vez, la tarde gris parisina afuera se desvaneció por completo. Tu respiración suave era el único sonido que nos importaba, y ese día húmedo se convirtió en el recuerdo más preciado de nuestras vidas.`;
        } else {
          const tempF = Math.round((tempMax * 9) / 5 + 32);
          const tempC = Math.round(tempMax);
          storyText = `El amanecer llegó a ${city}, ${country} alrededor de las ${sunrise}, trayendo una lluvia constante y una temperatura fresca de ${tempC}°C (${tempF}°F). Afuera, un viento fresco de ${Math.round(windSpeed)} km/h soplaba gotas contra la ventana del hospital. Pero en el momento en que te tomamos en nuestros brazos por primera vez, las calles mojadas afuera se borraron por completo de nuestras mentes. La mañana fría y húmeda fue solo el telón de fondo para la increíble calidez de sostenerte por primera vez, un momento que cambió nuestras vidas para siempre.`;
        }

        return {
          theme: "Una llegada lluviosa",
          quote: "La lluvia seguía cayendo afuera, pero adentro teníamos todo lo que necesitábamos.",
          story: storyText,
          metricLabel: "",
          metricValue: ""
        };
      } else if (isSnowy) {
        let storyText = "";
        if (isNY) {
          storyText = `La nieve caía suavemente sobre la ciudad, cubriendo las salidas de emergencia de los edificios y amortiguando el zumbido habitual de las calles. Los transeúntes caminaban fatigados sobre la nieve fresca con el Manhattan skyline alzándose en lo alto. En nuestra cálida habitación, solo te esperábamos. Cuando finalmente te sostuvimos en nuestros brazos y sentimos tu suave calidez, la ajetreada ciudad afuera desapareció. Hacía un frío helador afuera, pero adentro nos llenaba una felicidad que nunca olvidaremos.`;
        } else if (isChicago) {
          storyText = `Un viento helado soplaba desde Lake Michigan, arremolinando nieve fresca alrededor de los rascacielos y plazas del centro de Chicago. La gente en las calles estaba abrigada con abrigos pesados, transitando por las aceras congeladas. Adentro, nuestro mundo era cálido y silencioso. En el segundo en que te sostuvimos contra nuestra piel, el frío invernal de afuera perdió todo su poder. Ese gélido día de invierno en Chicago se convirtió en el momento más cálido y hermoso de nuestras vidas.`;
        } else if (isToronto) {
          storyText = `Una nieve suave y densa cubría los árboles de los parques y pintaba de blanco las orillas de Lake Ontario. Las calles de los alrededores se sentían acogedoras y excepcionalmente tranquilas. Dentro del hospital, esperábamos con una mezcla de emoción y nerviosismo. En el momento exacto en que llegaste, el frío de invierno afuera se olvidó por completo. Te sostuvimos cerca y te vimos dormir, increíblemente agradecidos de darte la bienvenida a nuestra familia.`;
        } else if (isWarsaw) {
          storyText = `La escarcha de invierno se adhería a las antiguas murallas del Old Town y un manto fresco de nieve se asentaba a lo largo de las orillas del Vistula River. La ciudad estaba en silencio, envuelta en la quietud de un invierno polaco. Adentro, nos reunimos para darte la bienvenida. En el segundo en que tu voz resonó en la habitación, todo se sintió completo. Te sostuvimos fuerte, mirando tu carita y sintiendo una profunda conexión con la historia familiar que estábamos construyendo juntos.`;
        } else if (isLondon) {
          storyText = `Una inusual nieve de invierno cubría los autobuses rojos de dos pisos y las calles de London. El lodo se acumulaba cerca de las orillas del River Thames, y la antigua ciudad se sentía extraordinariamente silenciosa. Nuestros pensamientos estaban completamente enfocados en la calidez de tu habitación. En el segundo en que te sostuvimos por primera vez, el gélido invierno de afuera desapareció de nuestra mente. Miramos tus pequeños dedos, dándonos cuenta de que nuestras vidas acababan de cambiar de la forma más maravillosa.`;
        } else if (isParis) {
          storyText = `Una nieve de invierno se asentaba silenciosamente sobre los tejados de pizarra de Paris, cubriendo los árboles a lo largo del River Seine. La ciudad estaba en calma, con el humo de las chimeneas subiendo al aire frío. Dentro de nuestra acogedora habitación, nuestros corazones latían con fuerza mientras esperábamos conocerte. En el momento en que llegaste y te sostuvimos por primera vez, el frío exterior dejó de existir. En tu carita encontramos una calidez que ningún frío invernal podía tocar, comenzando nuestro viaje familiar en esta histórica ciudad.`;
        } else {
          const tempF = Math.round((tempMax * 9) / 5 + 32);
          const tempC = Math.round(tempMax);
          storyText = `Poco después de que el sol saliera a las ${sunrise} en ${city}, ${country}, la nieve comenzó a caer con una temperatura fría de ${tempC}°C (${tempF}°F). Un viento mordaz de ${Math.round(windSpeed)} km/h recorría las calles, pero nuestra habitación era un refugio tranquilo. Todo se volvió claro cuando te acunamos cerca por primera vez. El gélido clima invernal de afuera desapareció de nuestros pensamientos mientras nos concentrábamos en tu carita y tu suave respiración, un recuerdo que guardaremos con cariño para siempre.`;
        }

        return {
          theme: "Una bienvenida con nieve",
          quote: "Hacía un frío helador afuera, pero nuestra habitación era el lugar más cálido del mundo.",
          story: storyText,
          metricLabel: "",
          metricValue: ""
        };
      } else if (isSunny) {
        let storyText = "";
        if (isNY) {
          storyText = `La brillante luz del sol de la mañana iluminaba las torres de cristal del Manhattan skyline, y las calles de abajo estaban concurridas con taxis amarillos y viajeros apresurados. New York se movía a su ritmo implacable de siempre, pero en nuestra habitación de hospital el reloj pareció detenerse. Cuando llegaste en esa cálida tarde, el bullicio de la ciudad se desvaneció. Al sostenerte por primera vez, miramos hacia las calles iluminadas por el sol y nos didos cuenta de que la mayor aventura de nuestras vidas estaba comenzando justo allí en nuestros brazos.`
        } else if (isChicago) {
          storyText = `Un aire claro y fresco soplaba desde Lake Michigan, y un sol brillante relucía en las altas torres del centro de Chicago. Las calles de abajo estaban llenas de compradores y multitudes, pero nuestras mentes estaban totalmente enfocadas en el interior. En el momento en que llegaste, la gigantesca ciudad junto al lago pareció desvanecerse en el fondo. Te sostuvimos cerca y sentimos tu suave calidez, mientras el horizonte iluminado por el sol observaba desde la ventana. Te convertiste en nuestra ancla en ese hermoso día soleado.`;
        } else if (isToronto) {
          storyText = `La luz brillante del sol centelleaba sobre Lake Ontario, iluminando los parques del vecindario donde los niños jugaban bajo la calidez de la tarde. La ciudad se sentía excepcionalmente alegre, pero todo nuestro mundo estaba allí mismo en nuestros brazos. En el momento en que te sostuvimos por primera vez, nos llenó una ola de pura gratitud. Miramos la costa de Toronto bañada por el sol, sabiendo que nuestra familia finalmente estaba completa.`;
        } else if (isWarsaw) {
          storyText = `Un sol radiante bañaba las fachadas históricas del Old Town, reflejándose en las aguas del Vistula River, donde las familias paseaban juntas en el aire cálido de la tarde. Warsaw se sentía brillante y acogedora, pero nuestros pensamientos estaban completamente en el interior. En el momento en que finalmente te sostuvimos cerca, sentimos una esperanza increíble para el futuro. Fuiste nuestra felicidad tan esperada, y tu llegada hizo de esa tarde soleada el día más importante de nuestras vidas.`;
        } else if (isLondon) {
          storyText = `Un sol inusualmente cálido se abrió paso entre las nubes, iluminando las antiguas fachadas de ladrillo y las concurridas calles de London. El River Thames centelleaba bajo la luz de la tarde, y los parques locales estaban llenos de personas disfrutando del sol. Sin embargo, dentro de nuestra habitación, lo único que nos importaba eras tú. Cuando finalmente te sostuvimos, la ciudad iluminada por el sol se convirtió en un telón de fondo silencioso. Cambiaste nuestras vidas para siempre en ese día brillante.`;
        } else if (isParis) {
          storyText = `Un cálido sol bañaba las avenidas de Paris y brillaba en el River Seine, donde las parejas paseaban cerca de los viejos puestos de libros. La ciudad estaba luminosa y llena de energía, pero nuestro mundo se enfocaba por completo en una sola habitación. Cuando te tomamos en brazos por primera vez, el hermoso día afuera se convirtió en un susurro lejano. Al mirar tu carita, supimos que nuestra mayor alegría estaba justo aquí con nosotros.`;
        } else {
          const tempF = Math.round((tempMax * 9) / 5 + 32);
          const tempC = Math.round(tempMax);
          storyText = `El día que naciste comenzó con un amanecer despejado a las ${sunrise} en ${city}, ${country}, dando paso a una tarde brillante y soleada. Una suave brisa de ${Math.round(windSpeed)} km/h agitaba el aire, y la temperatura alcanzó unos agradables ${tempC}°C (${tempF}°F). Pero nuestra atención estaba por completo en el pequeño bebé que descansaba en nuestras manos. En el momento en que te sostuvimos contra nuestro pecho, el hermoso clima de afuera pasó a un segundo plano ante la increíble alegría de verte por primera vez.`;
        }

        return {
          theme: "Un comienzo soleado",
          quote: "El sol brillaba, pero tú eras la verdadera luz en nuestras vidas.",
          story: storyText,
          metricLabel: "",
          metricValue: ""
        };
      } else {
        let storyText = "";
        if (isNY) {
          storyText = `Un cielo gris y tranquilo colgaba bajo sobre la isla, con vapor subiendo de las calles y viajeros bajando en las entradas del metro. La intensa energía de la ciudad estaba en pleno apogeo, pero nuestra atención estaba por completo dentro de nuestra habitación. En el momento en que abriste los ojos por primera vez, todo el ruidoso bullicio de la ciudad se disolvió en un silencio profundo y reconfortante. Nos sentamos juntos, abrazándote, sintiéndonos increíblemente agradecidos de que por fin estuvieras aquí.`;
        } else if (isChicago) {
          storyText = `Un cielo fresco y nublado cubría la ciudad, con una brisa constante que soplaba desde Lake Michigan y agitaba los árboles a lo largo de la orilla. Los viajeros en el centro de Chicago caminaban a paso ligero bajo el aire fresco, pero nuestro mundo se había detenido por completo. Cuando te sostuvimos en nuestros brazos por primera vez, todo el frío del aire se desvaneció. Al mirar tus manos pequeñitas, sentimos una calidez inmediata y abrumadora que siempre recordaremos.`;
        } else if (isWarsaw) {
          storyText = `Un tranquilo cielo gris se extendía sobre la ciudad, proyectando una luz calma sobre los muros de ladrillo del Old Town. A lo largo del Vistula River, Warsaw se movía a su ritmo constante de siempre. Pero dentro de nuestra habitación de hospital, un nuevo capítulo estaba comenzando. Cuando se abrieron tus ojos y te abrazamos de cerca por primera vez, una profunda sensación de gratitud llenó la habitación. Miramos tus pequeños rasgos de recién nacido, sabiendo que nuestras vidas nunca volverían a ser las mismas.`;
        } else if (isToronto) {
          storyText = `Un cielo tranquilo y nublado se asentaba sobre los vecindarios, trayendo aire templado del lago y una atmósfera de calma a las calles de la ciudad. A lo largo de la costa de Lake Ontario, la gente pasaba y compartía sonrisas discretas, pero adentro nos preparábamos para una vida de amor. Cuando finalmente llegaste, la tarde gris de afuera se desvaneció por completo. Te sostuvimos cerca y escuchamos tu pequeña respiración, absolutamente cautivados por ti.`;
        } else if (isLondon) {
          storyText = `Un cielo gris pesado y clásico se asentaba sobre London, proyectando una luz suave sobre las calles y edificios históricos. El River Thames fluía silenciosamente debajo de los puentes, constante y tranquilo. Dentro de nuestra habitación de hospital, estábamos completamente absortos en tu llegada. En el momento en que te sostuvimos por primera vez, el día nublado de afuera se olvidó por completo. Te sostuvimos cerca, escuchando tu respiración suave, sabiendo que la mayor aventura de nuestra familia acababa de comenzar.`;
        } else if (isParis) {
          storyText = `Un cielo gris delicado colgaba sobre los tejados históricos, proyectando una luz calma a través de las avenidas de Paris. Cerca del River Seine, el día estaba nublado y templado, pero dentro de nuestra habitación todo se sentía luminoso y cálido. En el segundo en que tus ojos se abrieron levemente y te abrazamos de cerca, la tarde nublada de afuera desapareció de nuestras mentes. Nos sentamos en el silencio, abrazándote con fuerza, dándonu cuenta de lo afortunados que éramos de tenerte.`;
        } else {
          const tempF = Math.round((tempMax * 9) / 5 + 32);
          const tempC = Math.round(tempMax);
          storyText = `Un cielo nublado cubría el firmamento sobre ${city}, ${country} mientras la luz del día entraba alrededor de las ${sunrise}. Un viento fresco a ${Math.round(windSpeed)} km/h resonaba por las calles, y era un día templado de ${tempC}°C (${tempF}°F). Sin embargo, dentro de nuestra tranquila habitación de hospital, el clima gris del exterior quedó completamente olvidado. En el instante en que te acunamos en nuestros brazos y miramos tus pequeños dedos, nos llenamos de una calidez profunda y duradera. Tu llegada convirtió un día gris cualquiera en el momento más inolvidable de nuestras vidas.`;
        }

        return {
          theme: "Una bienvenida serena",
          quote: "Afuera había un día nublado y tranquilo, pero nuestro mundo nunca había brillado tanto.",
          story: storyText,
          metricLabel: "",
          metricValue: ""
        };
      }
    }

    if (isRainy) {
      let storyText = "";
      if (isNY) {
        storyText = `It was a typical wet morning in New York, with yellow cabs splashing through street puddles and steam rising from the subway grates. Early morning commuters were rushing through the streets under their umbrellas. But inside our quiet hospital room, none of that busyness mattered anymore. The moment we first held you, the hectic city outside faded into the background. It was hard to believe we were finally holding our own baby. That cold, rainy New York day became the quiet beginning of everything for us.`;
      } else if (isChicago) {
        storyText = `A cold wind was sweeping off Lake Michigan, blowing a heavy rain across the downtown streets of Chicago. People on the sidewalks were pulling their raincoats tight to stay warm. Indoors, we were completely shielded from the weather, just waiting to meet you. The second we held you in our arms, the rush of the city completely quieted down. You brought a warmth into our lives that no cold lake storm could touch, and that rainy day in Chicago became one of our favorite memories.`;
      } else if (isToronto) {
        storyText = `A cool rain was falling over the neighborhoods, tapping against the windows of the houses. Down along the Lake Ontario waterfront, the city felt quiet and slow. Our minds were completely focused on the hospital room where we were waiting for you. When we finally held you for the first time, the rainy afternoon outside didn't seem to matter at all. Your arrival brought a wonderful sense of peace to our family, turning a grey lakeside afternoon into an unforgettable memory.`;
      } else if (isWarsaw) {
        storyText = `A steady rain was falling onto the cobblestones of the Old Town, trickling down toward the banks of the Vistula River. Outside, Warsaw moved through its usual autumn routine, but in our hospital room, our own family's history was just starting. The moment we held you close, the centuries of history outside faded into the background. We held you tight, knowing we were beginning a beautiful new chapter of our lives together.`;
      } else if (isLondon) {
        storyText = `A classic heavy drizzle was falling over London, slicking the historic streets and sending commuters scurrying toward the nearest tube station. Outside, a damp mist rolled across the River Thames. Inside our warm room, we were a million miles away from the damp city. Holding you for the first time was an incredibly emotional moment that we still talk about today. You were finally here, and our family's own history was just beginning.`;
      } else if (isParis) {
        storyText = `Rain splattered softly on the zinc rooftops and washed over the quiet cobblestones of Paris. Down by the River Seine, people sought shelter under the green awnings of the corner cafés. But our focus was entirely inside our warm room. When we held you close for the very first time, the grey Parisian afternoon outside completely slipped away. Your soft breathing was the only sound we cared about, and that wet day became the most cherished memory of our lives.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `Dawn arrived in ${city}, ${country} around ${sunrise}, bringing a steady rain and a cool temperature of ${tempC}°C (${tempF}°F). Outside, a brisk wind of ${Math.round(windSpeed)} km/h blew droplets against the hospital window. But the moment we first held you in our arms, the wet streets outside completely slipped from our minds. The chilly, damp morning was just a backdrop to the incredible warmth of holding you for the first time, a moment that changed our lives forever.`;
      }

      return {
        theme: "A Rainy Arrival",
        quote: "The rain kept falling outside, but inside, we had everything we needed.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
    } else if (isSnowy) {
      let storyText = "";
      if (isNY) {
        storyText = `Snow was falling softly over the city, dusting the fire escapes and muffling the normal hum of the streets. Commuters trudged through the fresh snow with the Manhattan skyline towering overhead. In our warm room, we were just waiting for you. When we finally held you in our arms and felt your soft warmth, the busy city outside disappeared. It was freezing cold outside, but inside, we were filled with a happiness we'll never forget.`;
      } else if (isChicago) {
        storyText = `A freezing wind was blowing off Lake Michigan, swirling fresh snow around the skyscrapers and plazas of downtown Chicago. People on the streets were bundled up in heavy coats, navigating the frosty sidewalks. Indoors, our world was warm and quiet. The second we held you against our skin, the winter cold outside lost all its power. That chilly Chicago winter day became the warmest, most beautiful moment of our lives.`;
      } else if (isToronto) {
        storyText = `A soft, heavy snow dusted the trees in the parks and lined the shores of Lake Ontario with white. The surrounding streets felt cozy and exceptionally quiet. Inside the hospital, we were waiting with a mix of nervous excitement. The very moment you arrived, the winter chill outside was completely forgotten. We held you close and watched you sleep, so incredibly grateful to welcome you into our family.`;
      } else if (isWarsaw) {
        storyText = `Winter frost clung to the ancient walls of the Old Town and a fresh blanket of snow settled along the banks of the Vistula River. The city was quiet, wrapped in the stillness of a Polish winter. Indoors, we gathered to welcome you. The second your voice echoed in the room, everything felt complete. We held you tight, looking down at your tiny face and feeling a deep connection to the family history we were building together.`;
      } else if (isLondon) {
        storyText = `A rare winter snow dusted the red double-decker buses and streets of London. Slush gathered near the banks of the River Thames, and the old city felt unusually quiet. Our thoughts were entirely set on the warmth of your room. The second we held you for the first time, the chilly winter outside vanished from our thoughts. We looked down at your tiny fingers, realizing our lives had just changed in the most wonderful way.`;
      } else if (isParis) {
        storyText = `A winter snow settled quietly over the slate rooftops of Paris, dusting the trees along the River Seine. The city was calm, with chimney smoke rising into the cold air. Inside our cozy room, our hearts raced as we waited to meet you. The moment you arrived and we held you for the first time, the outdoor freeze ceased to exist. In your tiny face, we found a warmth that no winter cold could touch, beginning our family's journey in this historic city.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `Shortly after the sun rose at ${sunrise} in ${city}, ${country}, snow began falling with a cold temperature of ${tempC}°C (${tempF}°F). A biting wind of ${Math.round(windSpeed)} km/h swept down the streets, but our room was a quiet haven. Everything became clear when we cradled you close for the very first time. The chilly winter weather outside vanished from our thoughts as we focused on your tiny face and soft breathing, a memory we will hold dear forever.`;
      }

      return {
        theme: "A Snowy Welcome",
        quote: "It was freezing cold outside, but our room was the warmest place in the world.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
    } else if (isSunny) {
      let storyText = "";
      if (isNY) {
        storyText = `Bright morning sunlight lit up the glass towers of the Manhattan skyline, and the streets below were busy with yellow cabs and rushing commuters. New York was moving at its usual relentless pace, but in our hospital room, the clock seemed to stop. When you arrived on that warm afternoon, the city's bustle faded away. Holding you for the first time, we looked out at the sunlit streets and realized that our life's greatest adventure was starting right there in our arms.`;
      } else if (isChicago) {
        storyText = `Clear, crisp air swept off Lake Michigan, and a bright sun gleamed off the tall towers of downtown Chicago. The streets below were busy with shoppers and crowds, but our minds were entirely focused inside. The moment you arrived, the giant lakeside city seemed to fade into the background. We held you close and felt your soft warmth, while the sunlit skyline watched from the window. You became our anchor on that beautiful, sunny day.`;
      } else if (isToronto) {
        storyText = `Bright sunshine sparkled on Lake Ontario, lighting up the neighborhood parks where kids played in the afternoon warmth. The city felt exceptionally cheerful, but our entire world was right there in our arms. The moment we held you for the first time, we were filled with a wave of pure gratitude. We looked out at the sun-drenched Toronto waterfront, knowing that our family was finally complete.`;
      } else if (isWarsaw) {
        storyText = `Brilliant sunshine bathed the historic facades of the Old Town, reflecting off the waters of the Vistula River where families strolled together in the warm afternoon air. Warsaw felt bright and welcoming, but our thoughts were entirely inside. The moment we finally held you close, we felt an incredible hope for the future. You were our long-awaited happiness, and your arrival made that sunny afternoon the most important day of our lives.`;
      } else if (isLondon) {
        storyText = `An unusually warm sunshine broke through the clouds, lighting up the old brick facades and busy streets of London. The River Thames was sparkling in the afternoon light, and local parks were filled with people soaking up the sun. Yet inside our room, the only thing we cared about was you. When we finally held you, the sunlit city outside became a quiet backdrop. You changed our lives forever on that bright day.`
      } else if (isParis) {
        storyText = `Warm sunlight bathed the avenues of Paris and gleamed off the River Seine where couples strolled near old bookstalls. The city was bright and full of energy, but our world was focused entirely on a single room. When we first held you in our arms, the beautiful day outside became a distant whisper. Looking at your tiny face, we knew that our greatest joy was right here with us.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `The day you were born began with a clear sunrise at ${sunrise} in ${city}, ${country}, leading into a bright, sun-drenched afternoon. A mild breeze of ${Math.round(windSpeed)} km/h stirred the air, and the temperature reached a pleasant ${tempC}°C (${tempF}°F). But our focus was entirely on the tiny baby resting in our hands. The moment we held you to our chests, the beautiful weather outside became secondary to the incredible joy of seeing you for the first time.`;
      }

      return {
        theme: "A Sunny Beginning",
        quote: "The sun was shining, but you were the real light in our lives.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
    } else {
      let storyText = "";
      if (isNY) {
        storyText = `A calm, grey sky hung low over the island, with steam rising from the streets and commuters heading down into the subway entrances. The city's busy energy was in full swing, but our focus was entirely inside our room. The moment you opened your eyes for the first time, all of the noisy city bustle dissolved into a deep, comforting quiet. We sat together, holding you close, feeling incredibly grateful that you were finally here.`;
      } else if (isChicago) {
        storyText = `A cool, overcast sky hung over the city, with a stiff breeze blowing off Lake Michigan and rustling the trees along the shore. Commuters in downtown Chicago walked briskly through the cool air, but our world had slowed to a complete pause. When we held you in our arms for the first time, all the chill in the air vanished. Looking down at your tiny hands, we felt an immediate, overwhelming warmth that we'll always remember.`;
      } else if (isWarsaw) {
        storyText = `A quiet grey sky stretched over the city, casting a calm light over the brick walls of the Old Town. Along the Vistula River, Warsaw moved at its usual steady pace. But inside our hospital room, a new chapter was beginning. When your eyes opened and we first held you close, a deep feeling of gratitude filled the room. We looked at your tiny newborn features, knowing our lives would never be the same.`;
      } else if (isToronto) {
        storyText = `A quiet, cloudy sky settled over the neighborhoods, bringing mild lake air and a calm atmosphere to the city streets. Along the Lake Ontario waterfront, people walked by and shared quiet smiles, but inside, we were preparing for a lifetime of love. When you finally arrived, the grey afternoon outside completely faded. We held you close and listened to your tiny breath, absolutely captivated by you.`;
      } else if (isLondon) {
        storyText = `A heavy, classic grey sky settled over London, casting a soft light down upon the historic streets and buildings. The River Thames flowed quietly beneath the bridges, steady and calm. Inside our hospital room, we were entirely swept up in your arrival. The moment we held you for the very first time, the overcast day outside was completely forgotten. We held you close, listening to your soft breathing, knowing our family's greatest adventure had just begun.`;
      } else if (isParis) {
        storyText = `A soft, grey sky hung over the historic rooftops, casting a calm light across the avenues of Paris. Along the River Seine, the day was overcast and mild, but inside our room, everything felt bright and warm. The second your eyes fluttered open and we held you close, the cloudy afternoon outside vanished from our minds. We sat in the quiet, holding you tight, realizing how lucky we were to have you.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `An overcast sky covered the sky over ${city}, ${country} as the daylight came in around ${sunrise}. A cool wind at ${Math.round(windSpeed)} km/h hummed through the streets, and it was a mild day of ${tempC}°C (${tempF}°F). Yet inside our quiet hospital room, the grey weather outdoor was completely forgotten. The instant we cradled you in our arms and looked at your tiny fingers, we were filled with a deep, lasting warmth. Your arrival turned an ordinary grey day into the most unforgettable moment of our lives.`;
      }

      return {
        theme: "A Calm Welcome",
        quote: "It was a quiet, cloudy day outside, but our world had never been brighter.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
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

      const generatedStory = generateBirthStory(finalWeatherCode, tempMax, rainSum > 0 ? 80 : 0, cityName, countryName, windSpeed, sunrise, admin1Name, lang);

      // Save formatted readable representation (e.g. Sep 2, 2026) instead of numeric representation
      const formattedDate = `${t.months[monthNum - 1]} ${dayNum}, ${yearStr}`;

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
                          Austin, Texas
                        </h3>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
                          United States • Atmosphere and stars mapped
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
