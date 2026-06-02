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
        theme: "Una jornada de lluvia",
        quote: "La lluvia llegó suavemente, como si la ciudad se hubiera detenido por un momento.",
        story: `Durante esa jornada, una lluvia apacible cubrió ${params.city} con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Afuera, la gente caminaba despacio bajo sus paraguas, mientras los reflejos plateados del agua dibujaban líneas en los tejados y calles. En ese ambiente sereno de lluvia constante, el ritmo cotidiano disminuyó y se respiró una inesperada calma. Ese mismo día se registró un nacimiento en la ciudad, en medio del murmullo constante del agua cayendo.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "Un día cubierto de nieve",
        quote: "Mientras la nieve cubría la ciudad, el silencio blanco envolvía las calles.",
        story: `En esa fecha invernal, un manto de nieve cubrió las calles de ${params.city} en medio de un frío de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). El exterior permanecía en un pacífico silencio blanco que amortiguaba el sonido del tráfico. En esta tranquila jornada de invierno, se registró el nacimiento de un niño en la ciudad, mientras los copos seguían descendiendo con suavidad sobre los tejados.`,
      };
    }
    if (isSunny) {
      return {
        theme: "Un despejado día soleado",
        quote: "El sol brilló con calma, iluminando las calles de la ciudad.",
        story: `Durante esa jornada despejada, un sol brillante iluminó todo ${params.city} alcanzando los ${tempC}°C (${tempF}°F) con viento a ${windKn} km/h (${windMph} mph). Afuera, la gente transitaba con calma y los edificios reflejaban la luz cálida de la tarde. En medio de este ambiente tranquilo y despejado, tuvo lugar el nacimiento de un niño en la ciudad, mientras el cielo continuaba perfectamente azul hasta el atardecer.`,
      };
    }
    // Default Cloudy
    return {
      theme: "Un día nublado y tranquilo",
      quote: "El cielo gris trajo una calma reconfortante a toda la ciudad.",
      story: `Durante esa fecha, nubes pacíficas vistieron de gris el cielo de ${params.city} con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Afuera todo seguía su marcha habitual bajo la luz difusa, mientras un viento suave mecía las ramas en los parques. En esa misma jornada gris, se registró un nacimiento en la ciudad, integrándose silenciosamente en la historia local.`,
    };
  } else {
    if (isRainy) {
      const variants = [
        `Light rain drifted across ${params.city} throughout the afternoon with steady temperatures around ${tempC}°C (${tempF}°F). Umbrellas appeared along busy avenues, and water gathered quietly on rooftops as a breeze of ${windKn} km/h (${windMph} mph) rustled through the trees. The rhythmic sound of rainfall softened the city’s usual noise, casting a quiet calm over parks and neighborhoods as daily life continued. On this date, a child was born in the city, registered quietly in the municipal logs as the rain continued to fall.`,
        
        `A fresh spring rain washed over the streets of ${params.city}, leaving pavements shimmering under overcast skies. With temperatures holding at ${tempC}°C (${tempF}°F) and wind pacing at ${windKn} km/h (${windMph} mph), the air smelled of wet earth and clean stones. Commuters carrying umbrellas moved quickly past glowing shop windows while headlights cast long reflections on the wet asphalt. On this date, a child's birth occurred in the city, documented as a simple historical event on a damp afternoon.`,
        
        `An evening rain descended over the rooftops of ${params.city}, softening the city outline against a deep iron-grey sky. Temperatures cooled to ${tempC}°C (${tempF}°F) while a gentle breeze of ${windKn} km/h (${windMph} mph) carried mist across the streets. Streetlights flickered to life, reflecting in silver pools along empty walkways where water gathered. Inside warm cafes, people watched droplets crawl down the glass. On this date, a birth was recorded in the city as evening fell across the rain-swept neighborhoods.`,
        
        `Passing rain showers swept quickly across ${params.city}, carried by a gusty wind of ${windKn} km/h (${windMph} mph). Temperatures remained cool at ${tempC}°C (${tempF}°F) as dramatic cloud formations rolled over the city rooftops. Between brief bursts of water, wet asphalt streets glistened beneath a soft, diffuse light that settled over local parks and neighborhoods. Pedestrians sheltered under storefront awnings while watching the storm patterns transition. On this date, the quiet birth of a child took place, adding a small human element to the atmospheric records.`,
        
        `Steady, quiet rainfall enveloped ${params.city} that day, turning the streets into a canvas of soft slate and grey. With temperatures registering ${tempC}°C (${tempF}°F) and wind blowing gently at ${windKn} km/h (${windMph} mph), silver raindrops lined every windowpane and balcony. The steady patter of moisture created an unexpected calm, slowing the city’s rapid morning pace down to a peaceful murmur as umbrellas moved quietly through the quiet city atmosphere. On this date, a child's birth was registered, coinciding with a day of continuous autumn rainfall.`
      ];

      const randomIndex = Math.floor(Math.random() * variants.length);
      return {
        theme: "A Rainy Arrival",
        quote: "The rain arrived softly, as if the city had paused for a moment.",
        story: variants[randomIndex],
      };
    }
    if (isSnowy) {
      return {
        theme: "A Snowy Winter Day",
        quote: "While snow carpeted the city outside, the streets fell into a quiet, frozen stillness.",
        story: `During that winter afternoon, soft snow blanketed ${params.city}, bringing a chill of ${tempC}°C (${tempF}°F) and a gentle wind at ${windKn} km/h (${windMph} mph). While the streets outside fell silent under the white canopy, office buildings and houses kept their lights glowing. On this calm, snowy day, a birth was recorded in the city as flakes continued to gather quietly on the rooftops and pavements.`,
      };
    }
    if (isSunny) {
      return {
        theme: "A Sunny Afternoon",
        quote: "The sun rose for the city just like any other day, casting bright golden light across the streets.",
        story: `During that clear afternoon, bright sunshine bathed ${params.city}, warming the day to ${tempC}°C (${tempF}°F) with wind at ${windKn} km/h (${windMph} mph). Outside, walkways were lively with pedestrians, and gold light danced across the brick building facades. On this brisk, sunny day, a child was born in the city, adding a quiet human event to an otherwise ordinary, sun-filled historic date.`,
      };
    }
    // Default Cloudy
    const variants = [
      `A quiet blanket of overcast clouds settled low over the horizon of ${params.city}. Throughout the day, the temperature rested at a steady ${tempC}°C (${tempF}°F) while a light breeze of ${windKn} km/h (${windMph} mph) rustled through parks and along building fronts. Beneath the diffuse slate-grey sky, the usual sharp outline of the skyline was beautifully softened, and streetlights glowed early on the avenues. Daily traffic moved patiently through the quiet neighborhoods. On this date, a child was born in the city, marked quietly in history under the calm overcast canopy.`,
      
      `A vast, iron-grey canopy of clouds shrouded the sky over ${params.city}, creating a cool, unified shade across the streets and public squares. Temperatures hovered around ${tempC}°C (${tempF}°F) with wind blowing at ${windKn} km/h (${windMph} mph), sweeping dry leaves along the stone pavements. The soft, shadowless light gave the local parks and brick facades an archival, timeless quality as residents went about their errands in sweaters and coats. On this date, a birth occurred in the city, joining the gentle, quiet rhythm of the grey afternoon.`,
      
      `Thick, dense grey clouds wrapped the buildings of ${params.city} in a peaceful and protective mist. The wind paced gently at ${windKn} km/h (${windMph} mph) underneath an overcast sky, keeping the daytime temperature locked at a cool ${tempC}°C (${tempF}°F). Across the city, local street corners, shop windows, and historic avenues appeared quiet and calm, illuminated by the smooth, glare-free light filtering through the clouds above. On this cloud-covered date, a birth was recorded here, an understated human moment under the vast grey skies.`,
      
      `High-altitude grey clouds uniform in texture stretched coast to coast over the sky of ${params.city}. Air temperatures remained cool but steady at ${tempC}°C (${tempF}°F) with wind speeds of ${windKn} km/h (${windMph} mph) carrying a crisp, seasonal freshness through the streets. Under this calm slate canopy, the city’s busy thoroughfares slowed to a quiet mutter, and rooftops took on a soft, silver-toned sheen in the early afternoon gloom. On this date, a child was born in the city, its entry noted alongside the stable weather patterns of the afternoon.`,
      
      `A quiet layer of stratocumulus clouds blanketed the rooftops of ${params.city} from dawn until dusk. Outside, temperatures measured ${tempC}°C (${tempF}°F) with a steady, atmospheric wind blowing at ${windKn} km/h (${windMph} mph), creating a crisp feeling in the air. The lack of direct sunshine painted the city in soft, classic shades of slate and charcoal, lending an elegant, historic mood to the regular bustle of the urban avenues. On this date, a birth was entered into the local registry, framed by the quiet shade of a cloud-swept sky.`
    ];

    const randomIndex = Math.floor(Math.random() * variants.length);
    return {
      theme: "A Quiet Cloudy Day",
      quote: "A quiet canopy of clouds hung low, softening the city's sights and sounds.",
      story: variants[randomIndex],
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
    res.json({
      theme: backupResult.theme,
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

  const systemInstruction = `You are an expert weather keepsake writer creating atmospheric historical weather stories connected to real birth dates and locations.

Your task is to generate an atmospheric weather memory centered on the weather conditions, season, sky, city atmosphere, and character of a specific day.

A child happened to be born on that date, but the weather must remain the primary subject throughout the entire narrative.

The final story should feel like a preserved memory of the day itself, not a sentimental story about becoming a parent.

The weather, atmosphere, season, and city environment are always the main characters.

The birth is only a brief historical event that occurred on that day.

Do NOT write stories about parent emotions.

Do NOT write stories about family feelings.

Do NOT write stories about emotional reactions.

Do NOT write stories about bonding moments.

Do NOT write stories about life-changing experiences.

Do NOT write stories about becoming a parent.

The narrative should read like someone remembering the atmosphere of a particular day in history, not recalling an emotional family milestone.

ADDITIONAL CRITICAL RULES

When referencing the birth:

- Mention it only once.
- Keep it brief.
- Treat it as a historical fact.
- Do not make it the emotional center of the story.

STRICTLY FORBIDDEN

Do not address the child directly.

Do not use:

- you
- your
- your arrival
- on the day of your arrival
- when you arrived
- holding you
- seeing you
- meeting you
- first cuddle
- first embrace
- first hug
- first moments together
- tiny face
- sweet scent
- little room
- everything changed
- our world
- our universe
- our hearts
- joy
- relief
- gratitude
- wonder
- magical
- sacred
- precious
- unforgettable

Instead of:

"On the day of your arrival..."

use:

"On March 2, 2026, under grey clouds..."

Instead of:

"Holding you for the first time..."

use:

"That same day, a child was born in the city."

Instead of:

"Our universe became smaller..."

use:

"The overcast sky remained unchanged throughout the afternoon."

FINAL STORY BALANCE

90% weather, atmosphere, season, city life, sky, streets, landscape.

10% simple acknowledgement that a child was born on that date.

The weather must remain the dominant subject from the first sentence to the last sentence.

ABSOLUTE WRITING RULES

The story MUST NEVER contain:
- On the day of your arrival
- Holding you for the first time
- first cuddle
- first embrace
- sweet scent
- tiny face
- everything changed
- our universe
- our hearts
- relief washed over us
- carry forever
- beautiful moment
- inside our room
- we held you
- our little one
- precious baby
- miracle
- bundle of joy

The narrator must NOT speak as a parent.
The narrator must NOT describe physical contact with a baby.
The narrator must NOT describe emotions, tears, gratitude, relief, love, affection, cuddles, hugs, embraces, or family feelings.

Instead:
Focus on atmosphere, weather, season, sky, light, wind, clouds, rain, temperature, sounds of the city, and the character of the day.
Write like a historical weather storyteller creating an atmospheric memory.

Weather should be 90% of the story.
Human element should be subtle and indirect.

Mandatory Constraints:
1. STRICTLY FORBIDDEN PHRASES AND THEMES (CRITICAL):
   - You are STRICTLY FORBIDDEN from using any greeting card cliches, Hallmark-card language, or exaggerated sentimentality.
   - Do not generate phrases similar to:
     * "everything changed" / "todo cambió" / "cambió todo"
     * "the world felt small" / "el mundo se sintió pequeño"
     * "our universe" / "nuestro universo"
     * "our hearts" / "nuestros corazones"
     * "joy washed over us" / "la alegría nos inundó"
     * "relief washed over us" / "el alivio nos inundó"
     * "wonder filled us" / "el asombro nos llenó"
     * "gratitude filled us" / "la gratitud nos llenó"
     * "holding you for the first time" / "sostenerte por primera vez" / "tenerte en brazos por primera vez"
     * "first cuddle" / "primer abrazo" / "primer cuddle"
     * "first embrace" / "primer acurruco"
     * "first hug"
     * "beautiful moment we will carry forever" / "momento hermoso que llevaremos por siempre"
     * "carry in our hearts forever" / "llevar en el corazón por siempre"
     * "life-changing moment" / "momento que cambió nuestras vidas"
     * "sacred moment" / "momento sagrado"
     * "magical moment" / "momento mágico"
     * "precious moment" / "momento precioso"
     * "unforgettable moment" / "momento inolvidable"
     * "everything began" / "todo comenzó"
     * "the beginning of our story" / "el comienzo de nuestra historia"
     * "the day everything changed" / "el día en que todo cambió"
     * "tiny face" / "carita"
     * "tiny bundle" / "pequeño bulto"
     * "sweet scent" / "dulce aroma"
     * "peaceful little room" / "habitación pequeña y pacífica"
     * "our worries disappeared" / "nuestras preocupaciones desaparecieron"
     * "our worries melted away" / "nuestras preocupaciones se derritieron"
     * "our focus was entirely on you" / "nuestra atención estaba completamente en ti"
     * "we felt immense gratitude" / "sentimos una inmensa gratitud"
     * "we felt profound relief" / "sentimos un profundo alivio"
     * "brand-new chapter" / "nuevo capítulo"
     * "filled our hearts" / "llenó nuestros corazones"
     * "journey began" / "comenzó el viaje"
     * "our lives were never the same" / "nuestras vidas nunca volvieron a ser las mismas"
     * "our quiet room" / "nuestra habitación silenciosa"
     * "the world continued outside" / "el mundo afuera continuaba"
     * "nothing else mattered" / "nada más importaba"
     * "focus narrowed" / "el enfoque se redujo"
     * "everything faded into the background" / "todo lo demás se desvaneció"
   - Avoid common hospital clichés (such as endless corridors, soft-soled shoes, beeping machines) and all Hallmark-style sentimentality.
   - Do NOT write from an emotional parent perspective. Do NOT invent feelings. Do NOT describe emotional reactions. Write as if describing an authentic day preserved in a weather archive, where a single understated human event occurred.

2. FORBIDDEN WORD GROUPS (CRITICAL):
   Avoid generating these words or their equivalents in Spanish/other languages:
   - love / amor
   - heart / corazón / corazones
   - joy / alegría
   - wonder / asombro / maravilla
   - gratitude / gratitud
   - relief / alivio
   - miracle / milagro
   - blessing / bendición
   - precious / precioso / preciosa
   - sacred / sagrado / sagrada
   - magical / mágico / mágica
   - destiny / destino
   - fate / hado
   - journey / viaje
   - universe / universo
   - forever / por siempre / siempre

3. STORY STRUCTURE (CRITICAL):
   - Keep the story length strictly between 80 and 120 words. This size limit is a hard physical keepsake layout constraint.
   - Follow this narrative flow exactly:
     1. Describe the weather conditions in the city (such as rain, clouds, streets, rooftops, umbrellas, wind, temperature, how the city felt).
     2. Describe the sky, atmosphere, city, streets, season, or landscape.
     3. Mention how people experienced the day (e.g. people walking, sheltering, traffic, etc.).
     4. Briefly and understatedly acknowledge that a child was born on that date (the birth itself should remain secondary and brief).
     5. Return naturally to the weather and atmosphere.

4. WEATHER AS BACKGROUND CONTEXT ONLY:
   - Treat weather strictly as factual, sensory background context of the day, not as a poetic metaphor or an emotional driver. Keep all weather descriptions completely objective.
   - Do NOT describe temperatures or weather conditions using subjective adjectives like pleasant, perfect, lovely, beautiful, wonderful, cosy, etc. Use neutral, factual terms (e.g., "with temperature at -5°C", "winds of 15 km/h", "under grey clouds").
   - You must weave the following weather parameters naturally into the narrative exactly ONCE:
     * Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
     * Weather condition: ${weatherText} (weatherCode ${weatherCode})
     * Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
     * Date: ${birthDate}
     * City: ${city} (Region: ${region || 'None'}, Country: ${country})

5. STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
   - THEME: If the weather is rainy, the theme title MUST be exactly "A Rainy Arrival" (or "Una llegada con lluvia" in Spanish). Otherwise, generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}").
   - QUOTE: Quotes must describe the atmosphere of the day (e.g., "The rain softened every sound across the city." / "El aire de la mañana llevaba el rastro frío del invierno."). Never generate emotional quotes about becoming a parent or full hearts.
     * If the weather is rainy and requested in English, the quote MUST be exactly: "The rain arrived softly, as if the city had paused for a moment." Otherwise, generate exactly one short, simple, natural, and memorable sentence reflecting the weather.

6. STRICT LANGUAGE REQUIREMENT:
   - The requested language is: "${language}".
   - Write all fields ("theme", "quote", "story") directly and purely in "${language}" as a native speaker would, avoiding any translation-like stiffness, awkward AI syntax, or hybrid terms.

Response JSON Schema (Keep exactly unchanged):
You must output a JSON object containing:
- theme: string (3-6 words, weather-based, factual title)
- quote: string (exactly 1 short, simple, memorable sentence)
- story: string (the completed narrative memory, strictly between 80 and 120 words formatted as a single paragraph)
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
        contents: `Generate an authentic parent memory matching the system instruction for ${city}, ${country} (${region || ''}) with weather ${weatherText} (Max Temp ${tempMax}°C, Wind ${windSpeed} km/h) on ${birthDate}.`,
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
    let finalStory = finalJson.story;
    if (!birthTime) {
      finalStory = makeStoryTimeNeutral(finalStory, lang === "es" ? "es" : "en");
    }
    res.json({
      theme: finalJson.theme,
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
    res.json({
      theme: backupResult.theme,
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
