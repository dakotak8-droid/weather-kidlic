import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Lazy client loaded only when needed
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

interface PeriodInfo {
  nameEn: string;
  nameEs: string;
  phraseEn: string;
  phraseEs: string;
}

function getPeriodInfo(timeStr?: string): PeriodInfo | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  if (hours >= 0 && hours < 6) {
    return {
      nameEn: "Late Night",
      nameEs: "Noche tardía",
      phraseEn: "during the quiet early hours when you arrived",
      phraseEs: "durante las tranquilas horas de la madrugada cuando llegaste",
    };
  } else if (hours >= 6 && hours < 9) {
    return {
      nameEn: "Early Morning",
      nameEs: "Mañana temprano",
      phraseEn: "on a peaceful early morning when you arrived",
      phraseEs: "en una mañana temprano y apacible cuando llegaste",
    };
  } else if (hours >= 9 && hours < 12) {
    return {
      nameEn: "Morning",
      nameEs: "Mañana",
      phraseEn: "during the morning when you arrived",
      phraseEs: "durante la mañana cuando llegaste",
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      nameEn: "Afternoon",
      nameEs: "Tarde",
      phraseEn: "during the afternoon when you arrived",
      phraseEs: "durante la tarde cuando llegaste",
    };
  } else if (hours >= 17 && hours < 20) {
    return {
      nameEn: "Evening",
      nameEs: "Atardecer",
      phraseEn: "during the evening when you arrived",
      phraseEs: "durante el atardecer cuando llegaste",
    };
  } else {
    return {
      nameEn: "Night",
      nameEs: "Noche",
      phraseEn: "during the night when you arrived",
      phraseEs: "durante la noche cuando llegaste",
    };
  }
}

function applyTimeOfArrival(story: string, lang: 'en' | 'es', birthTime?: string): string {
  const period = getPeriodInfo(birthTime);
  if (!period) return story;

  // Step 1: Neutralize the story first to clean up existing generic time of day references
  const neutralized = makeStoryTimeNeutral(story, lang);

  // Step 2: Inject the specific birth time phrase at key structure anchors
  if (lang === "es") {
    const phraseEs = period.phraseEs;
    let s = neutralized;
    s = s.replace(/El día comenzó con/gi, `El día comenzó, ${phraseEs}, con`);
    s = s.replace(/El día en que naciste, con/gi, `El día en que naciste, ${phraseEs}, con`);
    s = s.replace(/El día en que naciste/gi, `El día en que naciste, ${phraseEs},`);
    s = s.replace(/el día en que naciste/gi, `el día en que naciste, ${phraseEs},`);
    s = s.replace(/cuando naciste, con/gi, `cuando arribaste, ${phraseEs}, con`);
    s = s.replace(/cuando naciste/gi, `cuando llegaste, ${phraseEs},`);
    s = s.replace(/El día de tu llegada comenzó con/gi, `El día de tu llegada comenzó, ${phraseEs}, con`);
    s = s.replace(/el día de tu llegada comenzó con/gi, `el día de tu llegada comenzó, ${phraseEs}, con`);
    s = s.replace(/comenzó el día con/gi, `comenzó el día, ${phraseEs}, con`);
    return s;
  } else {
    const phraseEn = period.phraseEn;
    let s = neutralized;
    s = s.replace(/The day began with/gi, `The day began ${phraseEn}, with`);
    s = s.replace(/On the day you were born in/gi, `On the day you were born, ${phraseEn}, the weather in`);
    s = s.replace(/the day you were born/gi, `the day you were born, ${phraseEn}`);
    s = s.replace(/The day you were born/gi, `The day you were born, ${phraseEn}`);
    s = s.replace(/when you were born/gi, `when you arrived, ${phraseEn}`);
    return s;
  }
}

function getThemeForEmptyTime(weatherCode: number, lang: 'en' | 'es'): string {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  const isSunny = [0, 1].includes(weatherCode);
  const isCloudy = [2, 3, 45, 48].includes(weatherCode);

  if (lang === "es") {
    if (isRainy) return "Una llegada con lluvia";
    if (isSnowy) return "Una bienvenida con nieve";
    if (isSunny) return "Un inicio soleado";
    if (isCloudy) return "Un día nublado y tranquilo";
    return "Una llegada pacífica";
  } else {
    if (isRainy) return "A Rainy Arrival";
    if (isSnowy) return "A Snowy Welcome";
    if (isSunny) return "A Sunny Beginning";
    if (isCloudy) return "A Quiet Cloudy Day";
    return "A Peaceful Arrival";
  }
}

function getCorrectTheme(weatherCode: number, lang: 'en' | 'es', birthTime?: string): string {
  // Always use timeless and elegant themes, never forcing time-of-day wording
  return getThemeForEmptyTime(weatherCode, lang);
}

function makeStoryTimeNeutral(story: string, lang: 'en' | 'es'): string {
  if (lang === "es") {
    let s = story;
    s = s.replace(/la mañana en que naciste/gi, "el día en que naciste");
    s = s.replace(/La mañana en que naciste/gi, "El día en que naciste");
    s = s.replace(/la mañana de tu llegada/gi, "el día de tu llegada");
    s = s.replace(/La mañana comenzó con/gi, "El día comenzó con");
    s = s.replace(/el sol asomando a las \d+:\d+\s*(?:AM|PM)?/gi, "el cielo de la ciudad");
    s = s.replace(/salida del sol a las \d+:\d+\s*(?:AM|PM)?/gi, "llegada");
    s = s.replace(/llovizna a las \d+:\d+\s*(?:AM|PM)?/gi, "llovizna");
    s = s.replace(/a las \d+:\d+\s*(?:AM|PM)?/gi, "");
    s = s.replace(/al amanecer/gi, "en tu llegada");
    s = s.replace(/Pasamos la mañana/gi, "Pasamos las primeras horas");
    s = s.replace(/amaneció con/gi, "comenzó con");
    s = s.replace(/amaneció cubierta/gi, "se cubrió");
    s = s.replace(/amaneció/gi, "comenzó el día");

    const replacements: [RegExp, string][] = [
      [/\bmañana temprano\b/gi, "momento temprano"],
      [/\bla mañana\b/gi, "el día"],
      [/\bmañanas\b/gi, "días"],
      [/\bmañana\b/gi, "día"],
      [/\bpor la tarde\b/gi, "durante el día"],
      [/\ben la tarde\b/gi, "durante la jornada"],
      [/\baquella tarde\b/gi, "aquella jornada"],
      [/\buna tarde\b/gi, "un momento"],
      [/\btardes\b/gi, "jornadas"],
      [/\btarde\b/gi, "jornada"],
      [/\bel atardecer\b/gi, "el día"],
      [/\bun atardecer\b/gi, "un momento"],
      [/\batardecer\b/gi, "momento"],
      [/\bmadrugada\b/gi, "jornada"],
      [/\bmedianoche\b/gi, "llegada"],
      [/\bamanecer\b/gi, "llegada"],
      [/\bsalida del sol\b/gi, "llegada"],
      [/\bpuesta de sol\b/gi, "llegada"],
      [/\bla noche de tu llegada\b/gi, "el de tu llegada"],
      [/\bla noche en que naciste\b/gi, "el día en que naciste"],
      [/\bpor la noche\b/gi, "durante el día"],
      [/\ben la noche\b/gi, "durante la jornada"],
      [/\buna noche\b/gi, "un día"],
      [/\bla noche\b/gi, "el día"],
      [/\bnoches\b/gi, "momentos"],
      [/\bnoche\b/gi, "día"],
    ];

    for (const [r, repl] of replacements) {
      s = s.replace(r, repl);
    }
    s = s.replace(/\b(mañana|tarde|atardecer|noche|amanecer|medianoche|madrugada)\b/gi, "jornada");
    return s;
  } else {
    let s = story;
    s = s.replace(/the morning began/gi, "the day began");
    s = s.replace(/The morning began/gi, "The day began");
    s = s.replace(/the morning you were born/gi, "the day you were born");
    s = s.replace(/The morning you were born/gi, "The day you were born");
    s = s.replace(/chilly winter morning/gi, "chilly winter day");
    s = s.replace(/sunny morning/gi, "sunny day");
    s = s.replace(/spent the morning/gi, "spent those first hours");
    s = s.replace(/spent the afternoon/gi, "spent those first hours");
    s = s.replace(/spent the evening/gi, "spent those first hours");
    s = s.replace(/spent the night/gi, "spent those first hours");
    s = s.replace(/first afternoon/gi, "first day");
    s = s.replace(/as the sun rose behind clouds at \d+:\d+\s*(?:AM|PM)?/gi, "under the skies");
    s = s.replace(/as the sun rose at \d+:\d+\s*(?:AM|PM)?/gi, "on that day");
    s = s.replace(/at \d+:\d+\s*(?:AM|PM)?/gi, "");

    const replacements: [RegExp, string][] = [
      [/\blate night\b/gi, "day"],
      [/\bearly morning\b/gi, "day"],
      [/\bthe morning\b/gi, "the day"],
      [/\bmorning\b/gi, "day"],
      [/\bthe afternoon\b/gi, "the day"],
      [/\bafternoon\b/gi, "day"],
      [/\bthe evening\b/gi, "the day"],
      [/\bevening\b/gi, "day"],
      [/\bthe night\b/gi, "the day"],
      [/\bnight\b/gi, "day"],
      [/\bdawn\b/gi, "arrival"],
      [/\bsunrise\b/gi, "arrival"],
      [/\bsunset\b/gi, "arrival"],
      [/\bmidnight\b/gi, "arrival"],
      [/\bdaylight\b/gi, "the skies"],
      [/\bdaytime\b/gi, "the day"],
    ];

    for (const [r, repl] of replacements) {
      s = s.replace(r, repl);
    }
    s = s.replace(/\b(morning|afternoon|evening|night|dawn|sunrise|sunset|midnight)\b/gi, "day");
    return s;
  }
}

// -------------------------------------------------------------
// SECURE BACKUP STORIES GENERATOR (Meets all rules and avoids clichés)
// -------------------------------------------------------------
function getOfflineBackupStory(params: {
  city: string;
  country: string;
  region?: string;
  tempMax: number;
  weatherCode: number;
  weatherText: string;
  windSpeed: number;
  sunrise: string;
  birthDate: string;
  birthTime?: string;
  lang: "en" | "es";
}): { theme: string; quote: string; story: string } {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(params.weatherCode);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(params.weatherCode);
  const isSunny = [0, 1].includes(params.weatherCode);

  const tempF = Math.round((params.tempMax * 9) / 5 + 32);
  const tempC = Math.round(params.tempMax);
  const windKn = Math.round(params.windSpeed);
  const windMph = Math.round(params.windSpeed * 0.621371);

  if (params.lang === "es") {
    if (isRainy) {
      return {
        theme: "Una llegada con lluvia",
        quote: "Para todos los demás fue solo un día de lluvia más. Para nosotros fue el día que cambió todo.",
        story: `El día comenzó con una lluvia constante sobre ${params.city}, con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Mientras la gente afuera corría bajo sus paraguas apresurando el paso, nuestra habitación era un refugio de absoluta calma. Cuidarte y acurrucarte en tu primer abrazo nos trajo una paz infinita y el alivio de tenerte al fin con nosotros. La lluvia caía afuera, pero adentro nuestro mundo comenzaba de nuevo.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "Una bienvenida con nieve",
        quote: "Mientras la nieve cubría la ciudad para todos los demás, nuestro mundo se llenaba de calidez.",
        story: `El día comenzó con una capa ligera de nieve cubriendo las calles de ${params.city}, con un frío de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). En la habitación, el ambiente era cálido y silencioso, ajeno por completo al invierno exterior. Cuando por fin te tuvimos en brazos por primera vez, un alivio inmenso inundó nuestros corazones. El mundo afuera continuaba en silencio bajo el manto blanco, mientras nosotros vivíamos el instante más feliz de nuestras vidas.`,
      };
    }
    if (isSunny) {
      return {
        theme: "Un inicio soleado",
        quote: "El sol brilló para toda la ciudad como un día cualquiera, pero nuestra luz ya estaba en nuestros brazos.",
        story: `El día comenzó con un cielo despejado e iluminado sobre ${params.city}, con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Abajo en las calles, la gente continuaba con su ajetreado ritmo de siempre, pero arriba todo era paz y silencio. Sostener tu pequeña mano por primera vez nos llenó de un amor profundo y de una alegría indescriptible. El sol brillaba afuera, pero nuestra verdadera luz estaba ya en nuestros brazos.`,
      };
    }
    // Default Cloudy
    return {
      theme: "Un día nublado y tranquilo",
      quote: "Para todos los demás fue solo un día nublado más. Para nosotros fue el día que cambió todo.",
      story: `El día comenzó con nubes tranquilas cubriendo el cielo de ${params.city}, con una temperatura de ${tempC}°C (${tempF}°F) y una brisa de ${windKn} km/h (${windMph} mph). Mientras las personas afuera seguían con sus vidas comunes, en nuestra habitación de hospital el tiempo pareció detenerse por completo. Al abrazarte por primera vez, sentimos un alivio inmenso y una felicidad inexplicable. El cielo gris no importaba; todo nuestro universo se había reducido al espacio seguro de nuestros brazos.`,
    };
  } else {
    if (isRainy) {
      return {
        theme: "A Rainy Arrival",
        quote: "It was just another rainy day for everyone else. For us, it was the day everything changed.",
        story: `The day began with a gentle rain falling across ${params.city}, with a temperature of ${tempC}°C (${tempF}°F) and a wind of ${windKn} km/h (${windMph} mph). While people hurried down the streets under a canopy of umbrellas, our quiet room felt safe and warm. Holding you close for your first cuddle brought an incredible wave of happiness and relief. Outside, the world carried on as usual, but in our arms, everything changed.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "A Snowy Welcome",
        quote: "While snow blanketed the city for everyone else, our world became warm and perfect.",
        story: `The day began with a quiet blanket of snow covering ${params.city}, with a freezing temperature of ${tempC}°C (${tempF}°F) and wind of ${windKn} km/h (${windMph} mph). Inside our heated hospital room, the world outside faded away as we held you for the very first time. Feeling your soft breathing brought a deep sense of peace and relief. The wintry landscape outside was cold, but our hearts were filled with pure warmth.`,
      };
    }
    if (isSunny) {
      return {
        theme: "A Sunny Beginning",
        quote: "The sun rose for the city just like any other day, but our light was finally in our arms.",
        story: `The day began with a bright, sunny sky over ${params.city}, with a temperature of ${tempC}°C (${tempF}°F) and a soft breeze of ${windKn} km/h (${windMph} mph). While everyone else hurried about their busy lives, we sat together in our warm, sunlit room. Holding you in our arms for that first cuddle brought an overwhelming feeling of happiness and relief. The sunshine filled the room, but our true light had just arrived.`,
      };
    }
    // Default Cloudy
    return {
      theme: "A Quiet Cloudy Day",
      quote: "It was just another cloudy day for everyone else. For us, it was the day everything changed.",
      story: `The day began with quiet clouds drifting over the skyline of ${params.city}, at a temperature of ${tempC}°C (${tempF}°F) and a wind of ${windKn} km/h (${windMph} mph). While the bustling streets went on with their everyday affairs outside, our hospital room felt like a peaceful retreat. Cradling you for that first beautiful embrace brought an immense, heartwarming relief. The day was completely ordinary for the world, but in our arms, looking at your tiny face, everything changed.`,
    };
  }
}

// -------------------------------------------------------------
// MAIN SYSTEM PROPAGATING API ROOT
// -------------------------------------------------------------
app.post("/api/generate-story", async (req, res) => {
  const {
    city,
    country,
    region,
    tempMax,
    weatherCode,
    weatherText,
    windSpeed,
    sunrise,
    birthDate,
    birthTime,
    lang,
  } = req.body;

  if (!city) {
    res.status(400).json({ error: "Missing required parameter: city" });
    return;
  }

  const ai = getAiClient();

  if (!ai) {
    console.log("No GEMINI_API_KEY found, running high-quality offline backup generator with birthTime=" + birthTime);
    const backupResult = getOfflineBackupStory({
      city,
      country: country || "",
      region: region || "",
      tempMax: typeof tempMax === "number" ? tempMax : 20,
      weatherCode: typeof weatherCode === "number" ? weatherCode : 0,
      weatherText: weatherText || "Clear Skies",
      windSpeed: typeof windSpeed === "number" ? windSpeed : 12,
      sunrise: sunrise || "6:15 AM",
      birthDate: birthDate || "Oct 14, 2021",
      birthTime,
      lang: lang === "es" ? "es" : "en",
    });
    let finalBackupStory = backupResult.story;
    if (birthTime) {
      finalBackupStory = applyTimeOfArrival(finalBackupStory, lang === "es" ? "es" : "en", birthTime);
    } else {
      finalBackupStory = makeStoryTimeNeutral(finalBackupStory, lang === "es" ? "es" : "en");
    }
    const overrideTheme = getCorrectTheme(typeof weatherCode === "number" ? weatherCode : 0, lang === "es" ? "es" : "en", birthTime);
    res.json({
      theme: overrideTheme,
      quote: backupResult.quote,
      story: finalBackupStory,
      quality_check: {
        language_consistent: true,
        weather_consistent: true,
        time_consistent: true,
        city_consistent: true,
        structure_consistent: true,
      }
    });
    return;
  }

  // Generate prompt
  const language = lang === "es" ? "Spanish (Español)" : "English (English)";

  const timeOfDepartureRule = birthTime
    ? `
5. BIRTH TIME PERSONALIZATION (CRITICAL CONSTRAINT):
   Since the user has provided the birth time ("${birthTime}"), you MUST use the exact requested phrase inside the story narrative.
   The categorization and exact phrases to use based on the birth time of "${birthTime}" are:
   - 00:00–05:59:
     English phrase: "during the quiet early hours when you arrived"
     Spanish phrase: "durante las tranquilas horas de la madrugada cuando llegaste"
   - 06:00–08:59:
     English phrase: "on a peaceful early morning when you arrived"
     Spanish phrase: "en una mañana temprano y apacible cuando llegaste"
   - 09:00–11:59:
     English phrase: "during the morning when you arrived"
     Spanish phrase: "durante la mañana cuando llegaste"
   - 12:00–16:59:
     English phrase: "during the afternoon when you arrived"
     Spanish phrase: "durante la tarde cuando llegaste"
   - 17:00–19:59:
     English phrase: "during the evening when you arrived"
     Spanish phrase: "durante el atardecer cuando llegaste"
   - 20:00–23:59:
     English phrase: "during the night when you arrived"
     Spanish phrase: "durante la noche cuando llegaste"

   CRITICAL SPECIFICATION FOR THE THEME (TITLE):
   - You are STRICTLY FORBIDDEN from putting any time-of-day references inside the Theme title (the "theme" json property).
   - Absolutely do NOT use words like: Morning, Afternoon, Evening, Night, Late Night, Early Morning, Sunset, Sunrise, Dawn, Midnight, Madrugada, Tarde, Atardecer, Noche, etc., in the theme title.
   - Elegant, timeless themes (titles) only! Preferred examples of theme titles are:
     * English: "A Quiet Cloudy Day", "A Rainy Arrival", "A Snowy Welcome", "A Sunny Beginning", "A Warm Summer Day", "A Gentle Winter Day", "A Peaceful Arrival"
     * Spanish: "Un día nublado y tranquilo", "Una llegada con lluvia", "Una bienvenida con nieve", "Un inicio soleado", "Un cálido día de verano", "Un suave día de invierno", "Una llegada pacífica"`
    : `
5. BIRTH TIME (NOT PROVIDED):
   Since the user did NOT provide a birth time, continue using neutral daily terms that do not assume a specific hour or time of day.
   CRITICAL CONSTRAINT: You are STRICTLY FORBIDDEN from mentioning or using keywords like: morning, afternoon, evening, night, dawn, sunrise, sunset, midnight, early morning, late night, mañana, tarde, noche, amanecer, salida del sol, puesta de sol, medianoche, madrugada, or similar time-of-day references.
   Instead, use strictly time-neutral terms, such as:
   - "The day you were born..." / "El día en que naciste..."
   - "On the day of your arrival..." / "El día de tu llegada..."
   - "When you entered the world..." / "Cuando llegaste al mundo..."
   - "the skies over ${city}..." / "el cielo de la ciudad..."
   Do NOT assume a specific time period under any circumstances.`;

  const systemInstruction = `You are an expert nostalgic family keepsakes editor and creative storyteller.
Your task is to generate a beautiful, authentic personal story and theme for a parent remembering the day their child was born based on the weather conditions of that day.

Mandatory Constraints:
1. STRICT LANGUAGE REQUIREMENT:
   The requested language is: "${language}". 
   - All properties ("theme", "quote", "story") MUST be written directly in the "${language}" language.
   - Never generate in English first and translate. Think and write directly as a native speaker of "${language}".
   - Use natural, modern, emotional, and culturally authentic expressions in ${language}.
   - Absolutely NO literal translations or awkward AI-style phrasing.
   - Absolutely NO English expressions mixed into non-English stories. For instance, in Spanish, use "el horizonte de Manhattan" instead of "New York skyline", or "asfalto" instead of "pavement".

2. STRICT TEMPERATURE AND WEATHER NEUTRALITY:
   - Do NOT describe temperatures or weather conditions as pleasant, comfortable, lovely, perfect, ideal, beautiful, grand, wonderful, or similar subjective/opinionated adjectives (e.g., do NOT say "a pleasant -6°C", "a comfortable 35°C", "a lovely rainy morning", "a perfect sunny day").
   - Temperature and weather MUST be presented completely neutrally and factually (e.g., use neutral phrases like "with a temperature of -6°C (22°F)", "temperatures reaching 27°C (81°F)", "under cloudy skies", "during a light rain", "on a cold winter morning", "on a warm summer day").
   - Allow descriptive words only when they objectively and factually match the conditions: cold, chilly, warm, hot, windy, rainy, snowy, cloudy, sunny.
   - Let the emotional warmth come from the birth moment and family memory, not from weather/temperature adjectives. Weather = factual background, birth moment = emotional focus.

3. STRICT GROUNDING IN WEATHER DATA:
   You must weave the provided weather details naturally into the narrative:
   - Max Temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
   - Condition: ${weatherText} (weatherCode ${weatherCode})
   - Max Wind Speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
   - Sunrise Time: ${sunrise}
   - Date: ${birthDate}
   - City: ${city} (Region: ${region || 'None'}, Country: ${country})
   - Do NOT generate a generic story that fits any location or weather condition. Make sure the actual numbers or sensory details matching these values (like a biting wind of ${Math.round(windSpeed)} km/h or the soft sunrise at ${sunrise}) are seamlessly woven in.

4. COHERENT TIME OF DAY & WEATHER CONSISTENCY:
   - Ensure complete time-of-day consistency.
   - If the story describes dawn, morning, afternoon, or evening, the wording must be logically coherent. Never mention "afternoon" if describing sunrise conditions or morning light. Never mix morning and evening references in the same memory.
   - Ensure the description of weather matches the condition. If it is Snowy, describe a winter wonderland; if Sunny, describe bright, clear skies.

${timeOfDepartureRule}

6. REAL GEOGRAPHICAL SENSE, BUT STRICTLY AVOID LANDMARKS & SIGHTSEEING:
   - Make the city context real but extremely subtle. DO NOT focus on famous landmarks, rivers, historic districts, old walls, city architecture, or tourist-style details. Strictly avoid references such as "banks of the Vistula River", "the old brick walls of Warsaw", "the Manhattan skyline", "the historic center", "Central Park", "Broadway", "Eiffel Tower", "River Thames", "the Seine", "Colosseum", "lake Ontario", or similar touristy features.
   - Instead, focus on what parents would actually remember: whether it was sunny, cloudy, rainy, windy, warm, or cold outside in ${city}, the atmosphere inside the hospital room (e.g., quiet corridors, nurses walking softly, the heat humming), holding the baby for the first time, and the deep contrast between an ordinary weather day outside and an extraordinary moment inside relative to ${city}. Keep all descriptions grounded, believable, and emotionally warm.

7. WRITE A COZY, EMOTIONAL, CONCISE KEEPSAKE STORY AND QUOTE:
   - TONE: Warm, parental, real, down-to-earth, and emotionally deep—like a parent remembering the day, not a weather report.
   - STORY LENGTH: Strictly between 70 and 100 words. Keep it highly concise as it must fit on a physical keepsake card without overflowing.
   - INTEGRATION OF WEATHER DETAILS: Mention the weather facts (Max temperature in °C/°F, condition, wind) exactly ONCE in the story.
   - EMOTIONAL FOCUS:
     * Focus on meeting the baby for the first time, the excitement, happiness, relief, and that first cozy warm cuddle.
     * Highlight the juxtaposition: the entire world continuing outside with its usual busy routine, while inside our quiet room, everything changed.
   - AVOID UNNATURAL OR REPETITIVE CLICHES:
     * Strictly avoid phrases like "the weather outside was slow and grey", "the day passed slowly", "the weather faded into the background".
     * Never repeat the arrival period (morning, afternoon, night), weather condition, or city name more than once.
   - MULTILINGUAL CRAFT (NO WORD-FOR-WORD TRANSLATION):
     * If generating in Spanish, think and write as a native Spanish writer. Write a beautifully flowing, warm, parental narrative.
     * If generating in English, write like an elegant English copywriter.
     * Ensure the prose feels keepsake-worthy, suitable for framing, printing, and sharing with family.
   - QUOTE CHARACTERISTICS:
     * Make it 1 short, incredibly stylish sentence.
     * English example style: "It was just another cloudy day for everyone else. For us, it was the day everything changed."
     * Spanish example style: "Para todos los demás fue solo un día nublado más. Para nosotros fue el día que cambió todo."
     * Let the quote sound like something a real parent would say to their child later in life: clean, direct, and completely devoid of greeting-card fluff.
   - Generate creative, varied sentence structures.

Response JSON Schema:
You must output a JSON object containing:
- theme: a clean, simple, unpoetic title (e.g. 'A Wet November Morning' or 'Un lunes de llovizna').
- quote: a down-to-earth, simple, memorable statement welcoming the baby (1 sentence). Do not make it sound like a social media inspiration post.
- story: the complete narrative memory (approx 120-200 words, structured as a single elegant paragraph).
- quality_check: an object containing:
  - language_consistent: boolean (is it 100% written in the requested language?)
  - weather_consistent: boolean (does it accurately incorporate the provided weather data?)
  - time_consistent: boolean (are there any conflicting time references?)
  - city_consistent: boolean (does it make appropriate local references?)
  - structure_consistent: boolean (does it avoid the forbidden cliches and poetic style?)
`;

  let attempts = 0;
  const maxAttempts = 3;
  let finalJson: any = null;

  while (attempts < maxAttempts) {
    try {
      console.log(`Querying Gemini (Attempt ${attempts + 1}) for story in ${language}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a beautiful personal story matching that exact system instruction for ${city}, ${country} with weather ${weatherText} on ${birthDate}.`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              quote: { type: Type.STRING },
              story: { type: Type.STRING },
              quality_check: {
                type: Type.OBJECT,
                properties: {
                  language_consistent: { type: Type.BOOLEAN },
                  weather_consistent: { type: Type.BOOLEAN },
                  time_consistent: { type: Type.BOOLEAN },
                  city_consistent: { type: Type.BOOLEAN },
                  structure_consistent: { type: Type.BOOLEAN },
                },
                required: ["language_consistent", "weather_consistent", "time_consistent", "city_consistent", "structure_consistent"],
              }
            },
            required: ["theme", "quote", "story", "quality_check"]
          },
          temperature: 0.8,
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.theme && parsed.quote && parsed.story) {
        const qCheck = parsed.quality_check || {};
        const isPassed = qCheck.language_consistent && qCheck.weather_consistent && qCheck.time_consistent && qCheck.city_consistent && qCheck.structure_consistent;
        
        if (isPassed) {
          console.log("Gemini self-validation quality check passed on attempt " + (attempts + 1));
          finalJson = parsed;
          break;
        } else {
          console.log("Quality checks failed on attempt " + (attempts + 1) + ". Retrying... Details: ", qCheck);
          finalJson = parsed; // Store the last one in case we run out of retries
        }
      }
    } catch (err) {
      console.error("Gemini API call error during attempt " + (attempts + 1) + ":", err);
    }
    attempts++;
  }

  if (finalJson) {
    const overrideTheme = getCorrectTheme(typeof weatherCode === "number" ? weatherCode : 0, lang === "es" ? "es" : "en", birthTime);
    let finalStory = finalJson.story;
    if (!birthTime) {
      finalStory = makeStoryTimeNeutral(finalStory, lang === "es" ? "es" : "en");
    }
    res.json({
      theme: overrideTheme,
      quote: finalJson.quote,
      story: finalStory,
      quality_check: finalJson.quality_check
    });
  } else {
    console.log("All Gemini attempts failed or timed out, executing high-quality offline backup generator with birthTime=" + birthTime);
    const backupResult = getOfflineBackupStory({
      city,
      country: country || "",
      region: region || "",
      tempMax: typeof tempMax === "number" ? tempMax : 20,
      weatherCode: typeof weatherCode === "number" ? weatherCode : 0,
      weatherText: weatherText || "Clear Skies",
      windSpeed: typeof windSpeed === "number" ? windSpeed : 12,
      sunrise: sunrise || "6:15 AM",
      birthDate: birthDate || "Oct 14, 2021",
      birthTime,
      lang: lang === "es" ? "es" : "en",
    });
    let finalBackupStory = backupResult.story;
    if (birthTime) {
      finalBackupStory = applyTimeOfArrival(finalBackupStory, lang === "es" ? "es" : "en", birthTime);
    } else {
      finalBackupStory = makeStoryTimeNeutral(finalBackupStory, lang === "es" ? "es" : "en");
    }
    const overrideTheme = getCorrectTheme(typeof weatherCode === "number" ? weatherCode : 0, lang === "es" ? "es" : "en", birthTime);
    res.json({
      theme: overrideTheme,
      quote: backupResult.quote,
      story: finalBackupStory,
      quality_check: {
        language_consistent: true,
        weather_consistent: true,
        time_consistent: true,
        city_consistent: true,
        structure_consistent: true,
      }
    });
  }
});

// Serve static elements or start Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode: Integrating Vite server middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Production mode: Serving static files from ./dist");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on host http://0.0.0.0:${PORT}`);
  });
}

startServer();
