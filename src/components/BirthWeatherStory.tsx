import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, ChevronRight, Sparkles, RefreshCw, X, Heart, Baby, BookOpen, Download } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeocodingResult } from "../types";
import WeatherIcon from "./WeatherIcon";

const MONTHS_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const PROFILE_KEYS = {
  NYC: "new york|new york|united states",
  CHICAGO: "chicago|illinois|united states",
  TORONTO: "toronto|ontario|canada",
  LONDON: "london|england|united kingdom",
  PARIS: "paris|île-de-france|france",
  WARSAW: "warsaw|mazovia|poland"
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

const getWeatherConditionText = (code: number): string => {
  if (code === 0) return "Clear Skies";
  if (code === 1) return "Soft Sunshine";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Morning Mist";
  if (code === 51 || code === 53 || code === 55) return "Light Rain";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Spring Showers";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snowfall";
  if ([95, 96, 99].includes(code)) return "Stormy Skies";
  return "Calm Breeze";
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
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            typedCity
          )}&count=5&language=en&format=json`
        );
        const data = await response.json();
        if (data.results) {
          const results: GeocodingResult[] = data.results.map((r: any) => ({
            name: r.name,
            country: r.country,
            admin1: r.admin1,
            latitude: r.latitude,
            longitude: r.longitude
          }));
          setSuggestions(results);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Geocoding failed inside BirthWeatherStory", err);
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
    region: string = ""
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

    if (isRainy) {
      let storyText = "";
      if (isNY) {
        storyText = `Yellow cabs splashed through street puddles while subway grates hissed with hot steam. Early morning commuters pressed forward under a dark canopy of umbrellas, rushing through a city that never stops. But inside our hospital room, the hectic New York rush vanished. The moment we first cradled you, the Manhattan skyline in the window seemed to merge into the background. The cold city wind and rain did not matter at all. Our own small family was finally complete, and you were the center of our whole universe from that day onward.`;
      } else if (isChicago) {
        storyText = `A chilly wind swept off Lake Michigan, driving a heavy rain across the downtown streets where crowds rushed between brick buildings. The city's resilient character was in full view as people pulled their raincoats tight. Yet indoors, we were entirely shielded, waiting only to meet you. The instant we held you in our arms, the noisy Chicago wind became nothing but a whisper. You brought a profound warmth into our lives that no cold lake storm could ever diminish, starting the most beautiful chapter of our lives in this bold city.`;
      } else if (isToronto) {
        storyText = `A cool rain fell over the neighborhoods, tapping against the glass of quiet brick homes. Down along the Lake Ontario waterfront, the city moved with a relaxed, friendlier pace. Our minds were completely focused on a single room where we waited to meet you. When we finally held you in our arms, the lakeside rain outside only made our first embrace feel warmer. Your arrival brought a sweet sense of comfort, making that damp afternoon the most treasured memory of our lives and establishing a deep sense of peace within our growing home.`;
      } else if (isWarsaw) {
        storyText = `Rain fell softly onto the historic cobblestones of the Old Town, trickling down toward the banks of the Vistula River. It was a day of quiet heritage, where families walked close together, keeping their deep traditions alive in the autumn air. In our room, a much newer story was beginning. The moment you arrived and we held you close, the centuries of history outside faded. We held you, knowing you were the start of our own family's most sacred legacy, bringing a light to Poland that would guide our steps.`;
      } else if (isLondon) {
        storyText = `A heavy drizzle fell over London, slicking the tarmac of the historic streets and sending commuters scurrying toward the underground. Rain swept across the River Thames, wrapping the old city in a familiar damp mist. Inside our warm room, none of that rain mattered. The raw emotion of holding you for the first time was all we could feel. The vast history outside seemed to bow to this single, timeless moment. You were here, and our own history had just begun, a beautiful new branch on a very deep family tree.`;
      } else if (isParis) {
        storyText = `Rain splattered softly on the zinc rooftops and washed over the cobblestones of the quiet Parisian avenues. Down by the River Seine, people sought refuge under the awnings of local cafés. But our focus was entirely confined to the warm room where we waited to meet you. When we finally held you close to our chests, the damp Parisian day seemed to melt away. Your soft breathing was the only sound that mattered, transforming a grey, wet afternoon into the most intimate and sacred milestone of our lives.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `Dawn arrived in ${city}, ${country} around ${sunrise}, bringing with it a steady rain and a cool temperature of ${tempC}°C (${tempF}°F). Outside, a brisk wind blew at ${Math.round(windSpeed)} km/h, blowing droplets against the windows of our hospital room. But the moment we first held you in our arms, the wet streets outside completely slipped from our minds. The chilly, damp morning of your arrival remains a cherished backdrop, but it was the deep warmth of looking down into your bright new eyes that redefined our lives forever.`;
      }

      return {
        theme: "Rain of Blessings",
        quote: "No storm could compete with the warmth of holding you for the very first time.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
    } else if (isSnowy) {
      let storyText = "";
      if (isNY) {
        storyText = `Flakes drifted over concrete skyscrapers, coating the fire escapes and muffling the endless hum of traffic. The city that never sleeps paused for just a brief heartbeat as commuters trudged through the fresh snow under the towering Manhattan skyline. In our warm hospital room, we waited for your arrival. When we finally cradled you and felt the heat of your newborn skin, the vast metropolis simply faded. Outside, the city was covered in a deep winter freeze, but your first breath brought the warmth of spring into our lives, and we knew we would protect you forever.`;
      } else if (isChicago) {
        storyText = `Chilly winds swept off Lake Michigan, swirling fresh snow around the skyscrapers and empty plazas of downtown Chicago. Commuters pulled their heavy coats tight, navigating the frosty streets with that classic midwestern resilience. Indoors, our world was warm and intensely private. The second we held you against our skin, the freezing winter lost its power. Chicago's cold gale became a distant memory as we cradled you, knowing we were holding everything we would ever need to protect, keeping you secure as our new lives began on that winter day.`;
      } else if (isToronto) {
        storyText = `A soft, heavy snow dusted the trees in the parks and lined the shores of Lake Ontario with white. The surrounding neighborhoods felt cozy and quiet, reflecting Toronto's neighborly warmth. Inside, our hearts were full of nervous excitement. The very moment you arrived, all the cold of the winter afternoon disappeared. We held you close to our chests, watching you sleep. The snow continued to fall along the waterfront, but we were basking in the sweetest, warmest moment we had ever known, feeling incredibly grateful for our precious new baby.`;
      } else if (isWarsaw) {
        storyText = `Winter frost clung to the ancient walls of the Old Town as a fresh snow settled along the banks of the Vistula River. The city was quiet, wrapped in the cozy silence of a Polish winter. Indoors, our family gathered to welcome you. The second your voice echoed in the warmth of the room, our legacy felt complete. We held you tight, looking down at your tiny face and feeling a deep, solid connection to those who came before us. Outer winter had no power over our immense joy as we cradled you.`;
      } else if (isLondon) {
        storyText = `A rare winter snow dusted the red double-decker buses and cold monuments along the historic streets of London. Slush gathered near the banks of the River Thames, and the old city grew deeply quiet. Our world was focused on the warmth of your room. The second we held you against our chests, the chilly winter vanished. We looked down at your tiny fingers, realizing that this grand, ancient city had never witnessed a moment more beautiful or important than the arrival of our precious baby, keeping us warm through the freeze.`;
      } else if (isParis) {
        storyText = `A sudden winter snow settled over the limestone carvings and quiet avenues of Paris, dusting the trees along the River Seine. The city moved under a silent hush, with chimney smoke rising from slate rooftops. Inside our cozy room, our hearts raced with expectation. The moment you arrived and we held you for the joint first time, the outdoor cold ceased to exist. In your tiny face, we found a warmth that no winter freeze could touch, beginning our family's most cherished and beautiful journey in this historic city.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `Shortly after the sun rose at ${sunrise} in ${city}, ${country}, snow began falling under a freezing temperature of ${tempC}°C (${tempF}°F). A biting wind of ${Math.round(windSpeed)} km/h swept across the avenues, but our clinical room was a haven of quiet focus. Everything became clear when we cradled you close for the very first time, feeling the soft warmth of your newborn skin. The frosty landscape and the howling winter air evaporated from our thoughts. You were our hearth and our home, instantly transforming that freezing morning into the brightest memory of our lives.`;
      }

      return {
        theme: "Silver Skies",
        quote: "The weather faded into memory. Holding you never will.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
    } else if (isSunny) {
      let storyText = "";
      if (isNY) {
        storyText = `Early morning light hit the glass towers of the Manhattan skyline, turning the busy avenue below into a gold-lit river of yellow cabs and rushing commuters. New York was moving at its usual relentless pace, but in our room, the clock seemed to stop. When you arrived on that bright, sun-warmed afternoon, the city's infinite bustle became mere background noise. Holding you for the first time, we looked out at the sunlit streets and realized that the greatest story in this city was right here in our arms, making this the start of our journey.`;
      } else if (isChicago) {
        storyText = `Clear, crisp air swept off Lake Michigan, and bright afternoon sun gleamed off the metallic towers of downtown Chicago. The busy streets below were filled with shoppers and professionals, but our minds were entirely elsewhere. The moment you arrived, the vast lakeside city seemed to shrink down to the size of our hands. We held you close, feeling your soft warmth, while the sunlit towers of downtown Chicago watched from the window. You became our anchor, our resilient hope, and the beautiful sun in our sky, guiding our small family forward.`;
      } else if (isToronto) {
        storyText = `Bright sunshine sparkled on Lake Ontario, lighting up the tree-lined neighborhood parks where kids played and neighbors chatted. The city enjoyed a beautiful, warm afternoon, but our entire focus was in our arms. The moment we held you for the first time, a wave of pure gratitude filled our hearts. We looked out at the sun-drenched waterfront of Toronto, realizing your arrival had completed our family. You were our beautiful daylight, bringing a warmth we would carry forever, marking the beautiful beginning of our lives together.`;
      } else if (isWarsaw) {
        storyText = `Brilliant sunshine bathed the historic facades of the Old Town, reflecting off the steady waters of the Vistula River where families strolled together in the afternoon warmth. Warsaw felt bright and grounded, yet our thoughts were entirely inside. Today, you became the center of our world. The moment we cradled you, we felt the rich weight of tradition and the incredible hope of the future. You were our long-awaited joy, a bright summer in our hearts that would illuminate our family for generations, starting right here on this beautiful, historic afternoon.`;
      } else if (isLondon) {
        storyText = `Unusual warm sunshine broke through the heavy clouds, lighting up the ancient brick facades and historic streets of London. The River Thames gleamed in the rare afternoon light while double-decker buses rumbled past parks filled with sunbathers. Yet inside our room, the only light we cared about was in our arms. When we finally held you, we knew that no London summer could ever compare to the radiant joy of your arrival. You instantly became our timeless sun, changing our lives forever, lighting up our path with great brightness.`;
      } else if (isParis) {
        storyText = `Warm sunlight bathed the stone avenues of Paris, gleaming off the water of the River Seine where couples strolled near old bookstalls. The city was glowing and full of life, yet our world was focused entirely on a single cot. When we first cradled you in our arms, the beautiful day outside became a distant whisper. You brought a sudden, perfect clarity to our lives. Looking at your delicate newborn face, we knew that the grandest beauty in this ancient city was right here in our arms.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `The day you were born began with a clear sunrise at ${sunrise} over ${city}, ${country}, paving the way for a bright, sun-drenched afternoon. A mild breeze of ${Math.round(windSpeed)} km/h stirred the air, and the temperature rose to a pleasant ${tempC}°C (${tempF}°F). But our focus was entirely inward, locked on the tiny miracle resting in our hands. The moment we looked at your face and held you to our chests, the glowing weather outside became secondary. Your arrival brought a brilliant, everlasting warmth that will forever outshine even the brightest sun.`;
      }

      return {
        theme: "Wrapped in Warmth",
        quote: "Among clouds, rain, and sunlight, you were always the brightest part of the day.",
        story: storyText,
        metricLabel: "",
        metricValue: ""
      };
    } else {
      let storyText = "";
      if (isNY) {
        storyText = `A heavy slate-colored sky hung low over the island, with steam rising from the streets and commuters disappearing into subway entrances. The city's restless spirit was in full swing, but our focus was entirely inward. The moment your eyes opened for the first time, the dense, noisy energy of New York dissolved into a deep, comforting calm. We held you close, listening to your soft breath as the Manhattan skyline stood in the distance. The vast city outside was sleepless, but in our arms, you were perfectly safe and our lives had found their true home.`;
      } else if (isChicago) {
        storyText = `A cool, overcast sky hung over the Midwest, with stiff winds blowing off Lake Michigan and rustling the trees along the shore. Commuters in downtown Chicago moved with purposeful strides through the cool air, but our world had slowed to a complete pause. When we finally cradled you in our arms, any lingering chill in the air vanished. We looked down at your tiny hands and felt an overwhelming sense of warmth. The windy city outside was strong, but you were our ultimate strength, lighting up that grey afternoon for us.`;
      } else if (isWarsaw) {
        storyText = `A calm, gray sky stretched over the city, casting a quiet, historic mood over the brick walls of the Old Town. Along the Vistula River, Warsaw moved with its steady, resilient pace, but inside, our family stood on the edge of a new beginning. When your eyes opened and we first held you close, a deep sense of calm filled the room. We looked at your tiny newborn features, realizing that our family's future had just arrived, far more beautiful than any sky, beginning our own lasting heritage in this historic place.`;
      } else if (isToronto) {
        storyText = `An overcast sky settled over the neighborhoods, bringing mild lake air and a calm, quiet atmosphere to the city streets. Along the Lake Ontario waterfront, locals walked their dogs and shared quick smiles, but inside, we were preparing for a lifetime of love. When you finally arrived, any grayness outside disappeared from our sight. We held you close, listening to your tiny breath, completely captivated by your presence. The neighborhood outside was calm, but you were our absolute joy, a bright presence that filled our worlds completely under those quiet clouds.`;
      } else if (isLondon) {
        storyText = `A heavy, classic overcast sky settled over London, casting a soft light down upon the historic streets and brick buildings. The River Thames flowed quietly beneath the bridges, a steady symbol of the city's timeless character. Inside, we were entirely swept up in your arrival. The moment we cradled you for the very first time, the gray day outside was completely forgotten. We held you close, listening to your soft snuffles, knowing that our family's greatest adventure was now starting in this ancient city, bringing a glow that outshone the grey.`;
      } else if (isParis) {
        storyText = `A soft, slate-grey sky hung over the historic roofs, casting a calm light across the stone arches of Paris. Along the River Seine, the day was overcast and mild, but inside our room, everything was brilliantly bright. The second your eyes fluttered open and we held you close, the cloudy Parisian afternoon vanished from our minds. We sat in the quiet, holding you tight, realizing that our lives had just been blessed with a timeless beauty that would guide us through every season.`;
      } else {
        const tempF = Math.round((tempMax * 9) / 5 + 32);
        const tempC = Math.round(tempMax);
        storyText = `A grey, overcast canvas covered the sky over ${city}, ${country} as the daylight crept in at ${sunrise}. A cool wind at ${Math.round(windSpeed)} km/h hummed through the streets on a mild day of ${tempC}°C (${tempF}°F). Yet inside the quiet space of our room, all darkness vanished. The instant we cradled you in our arms and looked at your tiny fingers, the dreary weather outdoor was completely forgotten. You were a sudden burst of warmth and light, turning an otherwise grey day into the most unforgettable chapter of our lives.`;
      }

      return {
        theme: "A Fresh Beginning",
        quote: "The sky had its story, but our eyes were only on you.",
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
      setErrorMessage("Please select a valid birth date.");
      return;
    }

    // Direct string extraction to avoid JavaScript local timezone offset shifts
    const segments = birthDate.split("-");
    if (segments.length !== 3) {
      setErrorMessage("Please select a valid birth date.");
      return;
    }

    const yearNum = parseInt(segments[0], 10);
    const monthNum = parseInt(segments[1], 10);
    const dayNum = parseInt(segments[2], 10);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      setErrorMessage("Please enter a valid birth date.");
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
      setErrorMessage("Are they a time traveler? The birth date cannot be in the future!");
      return;
    }

    if (yearNum < 1940) {
      setErrorMessage("Alas! Historical weather archives are only available back to 1940. Please enter a birth date from 1940 onwards.");
      return;
    }

    setIsLoadingStory(true);

    try {
      let lat: number;
      let lon: number;
      let cityName: string;
      let countryName: string;
      let admin1Name: string = "";

      if (selectedCity) {
        lat = selectedCity.latitude;
        lon = selectedCity.longitude;
        cityName = selectedCity.name;
        countryName = selectedCity.country || "";
        admin1Name = selectedCity.admin1 || "";
      } else if (typedCity.trim().length > 0) {
        // Attempt immediate geocode search on typing fallback
        console.log(`Searching Open-Meteo Geocoding API for city input: "${typedCity}"...`);
        const geoResp = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            typedCity
          )}&count=1&language=en&format=json`
        );
        
        if (!geoResp.ok) {
          console.error(`Geocoding request failed with status: ${geoResp.status}`);
          setErrorMessage("We couldn't find that city. Please enter the city and country in English (for example: Warsaw, Poland or Munich, Germany).");
          setIsLoadingStory(false);
          return;
        }

        const geoData = await geoResp.json();
        if (geoData.results && geoData.results[0]) {
          const first = geoData.results[0];
          lat = first.latitude;
          lon = first.longitude;
          cityName = first.name;
          countryName = first.country || "";
          admin1Name = first.admin1 || "";
          console.log(`Successfully located city: "${cityName}" in "${countryName}" at Lat: ${lat}, Lon: ${lon}`);
        } else {
          console.warn(`Geocoding search returned no results for input: "${typedCity}"`);
          setErrorMessage("We couldn't find that city. Please enter the city and country in English (for example: Warsaw, Poland or Munich, Germany).");
          setIsLoadingStory(false);
          return;
        }
      } else {
        setErrorMessage("Please specify a birth city & country.");
        setIsLoadingStory(false);
        return;
      }

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

      const generatedStory = generateBirthStory(finalWeatherCode, tempMax, rainSum > 0 ? 80 : 0, cityName, countryName, windSpeed, sunrise, admin1Name);

      // Save formatted readable representation (e.g. Sep 2, 2026) instead of numeric representation
      const formattedDate = `${MONTHS_ABBR[monthNum - 1]} ${dayNum}, ${yearStr}`;

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
      setErrorMessage("Open-Meteo archive is recovering state. Please check your network and retry in a few moments!");
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
        ctx.fillText("WEATHER KEEPSAKE CERTIFICATE", 160, 160);

        // City Name Title (Georgia bold italic)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "italic bold 64px 'Georgia', 'Times New Roman', serif";
        ctx.fillText(revealResult.city, 130, 240);

        // Subheader Atmosphere Text
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "600 22px 'Inter', 'system-ui', sans-serif";
        const coordDesc = revealResult.country ? `${revealResult.country} • Atmosphere and stars mapped` : "Atmosphere and stars mapped";
        ctx.fillText(coordDesc, 130, 300);

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
        const themeText = `THEME: ${revealResult.story.theme.toUpperCase()}`;
        ctx.font = "bold 18px 'JetBrains Mono', 'Courier New', monospace";
        const themeWidth = ctx.measureText(themeText).width + 30;
        drawRoundRect(ctx, 130, 350, themeWidth, 44, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#E89E82";
        ctx.fillText(themeText, 145, 372);

        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "bold 20px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(`DATE: ${revealResult.date}`, 130 + themeWidth + 24, 372);

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
        ctx.fillText("CONDITION", 232, 465);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 19px 'Inter', 'system-ui', sans-serif";
        ctx.fillText(getWeatherConditionText(revealResult.weatherCode), 232, 512);

        // Column 2: Temperature (Visually emphasized)
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText("TEMPERATURE", 437, 465);
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 30px 'Inter', 'system-ui', sans-serif";
        const tempSnapStr = `${Math.round(revealResult.tempMax)}°C / ${Math.round((revealResult.tempMax * 9) / 5 + 32)}°F`;
        ctx.fillText(tempSnapStr, 437, 512);

        // Column 3: Max Wind Speed
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText("MAX WIND SPEED", 642, 465);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 18px 'Inter', 'system-ui', sans-serif";
        const windSnapStr = `${Math.round(revealResult.windSpeed)} km/h / ${Math.round(revealResult.windSpeed * 0.621371)} mph`;
        ctx.fillText(windSnapStr, 642, 512);

        // Column 4: Sunrise
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 13px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText("SUNRISE TIME", 847, 465);
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
        ctx.fillText("THE SKY'S WELCOME", 160, quoteBoxY + 50);

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
              Tiny Date. Big Memory.
            </span>
            <h2 className="font-serif italic font-extrabold text-3xl sm:text-4xl leading-tight text-[#3D2C2E] dark:text-[#FEFAF6]">
              What was the weather when your baby was born?
            </h2>
            <p className="text-[1.1rem] md:text-[1.15rem] italic text-[#7A6363] dark:text-slate-400 font-serif mt-3 leading-relaxed">
              Before the sleepless nights, snack negotiations, and mysterious sticky fingerprints, there was a single day. Discover the weather that welcomed your child into the world.
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
              {/* Birth Date Input */}
              <div className="birth-form-field space-y-1.5 focus-within:text-[#D48D71]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Birth Date (MM/DD/YYYY)</span>
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
                  <span>Birth City & Country (in English)</span>
                </label>
                <div className="relative w-full block box-border">
                  <input
                    type="text"
                    required
                    placeholder="Examples: New York, United States • Warsaw, Poland • Paris, France"
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
                  Please enter city and country names in English. Local spellings such as Polska, Deutschland, España, or Italia may not be recognized.
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
                    <span>Scanning the heavens...</span>
                  </>
                ) : (
                  <>
                    <ChevronRight size={14} />
                    <span>Reveal the weather story</span>
                  </>
                )}
              </button>

              <p className="text-[10.5px] text-center text-slate-400 dark:text-slate-500 font-sans tracking-wide">
                Powered by historical weather archives and location data.
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
                          Weather Keepsake Certificate
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
                          <span className="text-xs font-mono font-bold text-slate-300 block">WEATHER ON YOUR ARRIVAL</span>
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
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Condition</span>
                        <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                          Gentle Sunshine
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Temperature</span>
                        <span className="text-[15px] font-extrabold text-[#E89E82] leading-tight">
                          21°C / 70°F
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r text-center">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Wind Speed</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          12 km/h / 7 mph
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-1">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Sunrise</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          7:28 AM
                        </span>
                      </div>
                    </div>

                    {/* Theme bar & description layout to match real look */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#E89E82] bg-[#E89E82]/15 px-3 py-1 rounded-full border border-[#E89E82]/25">
                          Theme: Wrapped in Warmth
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Date: Oct 14, 2021</span>
                      </div>
                      <p className="text-sm text-slate-300 font-sans leading-relaxed tracking-wide">
                        Bright afternoon sunshine spread across Austin, lighting up the neighborhood and casting yellow beams across the limestone ridges. It was a warm day outside, but our focus was entirely in our arms. The moment we cradled you, we felt an immense sense of gratitude that filled our hearts. The sunny day was beautiful, but you were the real daylight in our lives, bringing a warmth we will carry forever.
                      </p>
                    </div>

                    {/* Short bold Quote */}
                    <div className="bg-white/[0.03] border-l-2 border-[#E89E82] p-4 rounded-r-xl">
                      <p className="text-[10px] font-mono text-[#D48D71] uppercase tracking-widest font-bold mb-1.5">THE SKY'S WELCOME</p>
                      <p className="font-serif italic text-white text-md sm:text-lg leading-snug">
                        “Among clouds, rain, and sunlight, you were always the brightest part of the day.”
                      </p>
                    </div>
                  </div>
                </div>

                {/* Example Tag Badge hover overlay */}
                <div className="absolute top-3 -right-3 rotate-6 bg-[#D48D71] text-xs font-mono font-bold text-white px-3 py-1.5 rounded-xl shadow-md border border-white/10 pointer-events-none z-20 flex items-center gap-1 uppercase tracking-wider scale-90">
                  <Baby size={12} />
                  <span>Reference Idea</span>
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
                  <span>Your Authentic Weather Keepsake</span>
                </div>

                <div className="w-full rounded-[36px] bg-[#0E1321] text-[#FEFAF6] p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
                  {/* Premium cozy star/cloud grid graphic background overlay */}
                  <div className="absolute inset-0 bg-[#161c2e]/20 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

                  <div className="relative z-10 space-y-6 text-left">
                    {/* Header: Birth Info & Geolocation */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">
                      <div>
                        <span className="text-[9px] font-mono tracking-widest text-[#E89E82] uppercase bg-[#E89E82]/10 border border-[#E89E82]/20 px-2.5 py-0.5 rounded-full font-bold">
                          Weather Keepsake Certificate
                        </span>
                        <h3 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-white mt-1.5 font-sans leading-tight">
                          {revealResult.city}
                        </h3>
                        <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
                          {revealResult.country ? `${revealResult.country} • ` : ""}Atmosphere and stars mapped
                        </p>
                      </div>
                      
                      {/* Meteorological snapshot */}
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 self-start sm:self-center">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-300 block">WEATHER ON YOUR ARRIVAL</span>
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
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Condition</span>
                        <span className="text-[11px] font-bold text-white leading-tight truncate max-w-[110px]">
                          {getWeatherConditionText(revealResult.weatherCode)}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Temperature</span>
                        <span className="text-[15px] font-extrabold text-[#E89E82] leading-tight">
                          {Math.round(revealResult.tempMax)}°C / {Math.round((revealResult.tempMax * 9) / 5 + 32)}°F
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-r border-[#E89E82]/10 py-1 last:border-0 sm:border-r text-center">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Wind Speed</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          {Math.round(revealResult.windSpeed)} km/h / {Math.round(revealResult.windSpeed * 0.621371)} mph
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center py-1">
                        <span className="text-[8px] font-mono tracking-wider text-[#E89E82] uppercase mb-0.5">Sunrise</span>
                        <span className="text-[11px] font-bold text-white leading-tight">
                          {revealResult.sunrise}
                        </span>
                      </div>
                    </div>

                    {/* Weather Legend theme title & story copy */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#E89E82] bg-[#E89E82]/15 px-3 py-1 rounded-full border border-[#E89E82]/25">
                          Theme: {revealResult.story.theme}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Date: {revealResult.date}</span>
                      </div>
                      <p className="text-sm md:text-base text-slate-300 font-sans leading-relaxed tracking-wide">
                        {revealResult.story.story}
                      </p>
                    </div>

                    {/* Full-width Quote banner inside Card container */}
                    <div className="bg-white/[0.03] border-l-2 border-[#E89E82] p-4 rounded-r-xl">
                      <p className="text-[10px] font-mono text-[#D48D71] uppercase tracking-widest font-bold mb-1.5">THE SKY'S WELCOME</p>
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
                        <span>Crafting Keepsake...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} className="stroke-[2.5]" />
                        <span>Download Keepsake</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase text-center mt-1">
                    Optimized for Instagram (4:5 vertical), Facebook, and baby memory albums
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
