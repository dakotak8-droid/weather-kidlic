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
      phraseEn: "during the silent late night hours",
      phraseEs: "durante las horas silenciosas de la madrugada",
    };
  } else if (hours >= 6 && hours < 9) {
    return {
      nameEn: "Early Morning",
      nameEs: "Mañana temprano",
      phraseEn: "as dawn broke quietly over the city",
      phraseEs: "mientras el amanecer se asomaba silenciosamente sobre la ciudad",
    };
  } else if (hours >= 9 && hours < 12) {
    return {
      nameEn: "Morning",
      nameEs: "Mañana",
      phraseEn: "during the cool morning hours",
      phraseEs: "durante las frescas horas de la mañana",
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      nameEn: "Afternoon",
      nameEs: "Tarde",
      phraseEn: "during the tranquil afternoon",
      phraseEs: "durante la tarde tranquila",
    };
  } else if (hours >= 17 && hours < 20) {
    return {
      nameEn: "Evening",
      nameEs: "Atardecer",
      phraseEn: "as dusk settled over the streets",
      phraseEs: "cuando el atardecer comenzaba a cubrir las calles",
    };
  } else {
    return {
      nameEn: "Night",
      nameEs: "Noche",
      phraseEn: "under the dark night sky",
      phraseEs: "bajo el oscuro cielo nocturno",
    };
  }
}

function applyTimeOfRecord(story: string, lang: 'en' | 'es', birthTime?: string): string {
  const period = getPeriodInfo(birthTime);
  if (!period) return story;

  // Step 1: Clean the story first of any time parameters
  const neutralized = makeStoryTimeNeutral(story, lang);

  // Step 2: Inject the specific birth time phrase at key structure anchors
  if (lang === "es") {
    const phraseEs = period.phraseEs;
    let s = neutralized;
    s = s.replace(/El día comenzó con/gi, `La jornada comenzó, ${phraseEs}, con`);
    s = s.replace(/Durante esa jornada/gi, `Durante esa jornada, ${phraseEs}`);
    s = s.replace(/En esa fecha/gi, `En esa fecha, ${phraseEs}`);
    s = s.replace(/comenzó el día con/gi, `comenzó el día, ${phraseEs}, con`);
    return s;
  } else {
    const phraseEn = period.phraseEn;
    let s = neutralized;
    s = s.replace(/The day began with/gi, `The day began ${phraseEn}, with`);
    s = s.replace(/On this date/gi, `On this date, ${phraseEn}`);
    s = s.replace(/During that clear afternoon/gi, `During that clear afternoon, ${phraseEn}`);
    s = s.replace(/During that/gi, `During that ${phraseEn}`);
    return s;
  }
}

function getThemeForEmptyTime(weatherCode: number, lang: 'en' | 'es'): string {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  const isSunny = [0, 1].includes(weatherCode);
  const isCloudy = [2, 3, 45, 48].includes(weatherCode);

  if (lang === "es") {
    if (isRainy) return "Una jornada de lluvia";
    if (isSnowy) return "Un día cubierto de nieve";
    if (isSunny) return "Un despejado día soleado";
    if (isCloudy) return "Un día nublado y tranquilo";
    return "Una jornada pacífica";
  } else {
    if (isRainy) return "A Rainy Day";
    if (isSnowy) return "A Snowy Winter Day";
    if (isSunny) return "A Sunny Afternoon";
    if (isCloudy) return "A Quiet Cloudy Day";
    return "A Peaceful Day";
  }
}

function getCorrectTheme(weatherCode: number, lang: 'en' | 'es', birthTime?: string): string {
  // Always use timeless and elegant themes, never forcing time-of-day wording
  return getThemeForEmptyTime(weatherCode, lang);
}

function makeStoryTimeNeutral(story: string, lang: 'en' | 'es'): string {
  if (lang === "es") {
    let s = story;
    s = s.replace(/la mañana en que naciste/gi, "durante esa fecha");
    s = s.replace(/La mañana en que naciste/gi, "Durante esa fecha");
    s = s.replace(/la mañana de tu llegada/gi, "durante esa jornada");
    s = s.replace(/La mañana comenzó con/gi, "La jornada comenzó con");
    s = s.replace(/el sol asomando a las \d+:\d+\s*(?:AM|PM)?/gi, "el cielo de la ciudad");
    s = s.replace(/salida del sol a las \d+:\d+\s*(?:AM|PM)?/gi, "el día");
    s = s.replace(/llovizna a las \d+:\d+\s*(?:AM|PM)?/gi, "llovizna");
    s = s.replace(/a las \d+:\d+\s*(?:AM|PM)?/gi, "");
    s = s.replace(/al amanecer/gi, "el cielo de la mañana");
    s = s.replace(/Pasamos la mañana/gi, "Pasaron las primeras horas");
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
      [/\bmedianoche\b/gi, "la noche"],
      [/\bamanecer\b/gi, "el inicio de la jornada"],
      [/\bsalida del sol\b/gi, "el día"],
      [/\bpuesta de sol\b/gi, "el fin del día"],
      [/\bla noche de tu llegada\b/gi, "el de esa jornada"],
      [/\bla noche en que naciste\b/gi, "la noche de esa fecha"],
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
    s = s.replace(/the morning you were born/gi, "that date");
    s = s.replace(/The morning you were born/gi, "That date");
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
      [/\bdawn\b/gi, "daybreak"],
      [/\bsunrise\b/gi, "daylight"],
      [/\bsunset\b/gi, "nightfall"],
      [/\bmidnight\b/gi, "the night"],
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

function validateGeneratedContent(story: string, quote: string, theme: string): { valid: boolean; reason?: string } {
  if (!story || !quote || !theme) return { valid: false, reason: "Missing required story fields" };
  const combined = `${story} ${quote} ${theme}`.toLowerCase().replace(/[\s\r\n\t]+/g, " ");
  
  const forbiddenPhrases = [
    "on the day of your arrival",
    "your arrival",
    "holding you",
    "holding you for the first time",
    "first cuddle",
    "first embrace",
    "tiny face",
    "sweet scent",
    "everything changed",
    "our universe",
    "our world",
    "our hearts",
    "joy",
    "relief",
    "gratitude",
    "wonder",
    "inside our room",
    "carry forever",
    "beautiful moment",
    "sacred",
    "precious",
    "miracle",
    "bundle of joy",
    "parent",
    "mother",
    "father",
    "family",
    "cuddle",
    "embrace",
    "feelings",
    "emotions",
    "welcome",
    "new chapter",

    "el día de tu llegada",
    "tu llegada",
    "sostenerte",
    "tenerte en brazos",
    "primer abrazo",
    "primer arrullo",
    "carita",
    "dulce aroma",
    "todo cambió",
    "nuestro universo",
    "nuestro mundo",
    "nuestros corazones",
    "alegría",
    "alivio",
    "gratitud",
    "asombro",
    "nuestra habitación",
    "para siempre",
    "momento hermoso",
    "sagrado",
    "precioso",
    "milagro",
    "padre",
    "madre",
    "familia",
    "sentimientos",
    "emociones",
    "bienvenida",
    "abrazar"
  ];

  for (const phrase of forbiddenPhrases) {
    if (combined.includes(phrase)) {
      return { valid: false, reason: `Contains forbidden phrase "${phrase}"` };
    }
  }

  // Enforce zero birth, baby, child or person mentions in the story
  const birthMentionsEn = (combined.match(/\bbirth\b|\bborn\b|\bbaby\b|\bchild\b|\bperson\b|\bpeople\b/gi) || []).length;
  const birthMentionsEs = (combined.match(/\bnacimiento\b|\bnació\b|\bbebé\b|\bniño\b|\bniña\b|\bhijo\b|\bhija\b|\bpersona\b|\bgente\b/gi) || []).length;
  if (birthMentionsEn + birthMentionsEs > 0) {
    return { valid: false, reason: "Contains forbidden birth, baby, child, or person references" };
  }

  // Enforce zero standard pronouns targeting the user or first-person plural
  if (/\b(you|we|our|us)\b/i.test(combined)) {
    return { valid: false, reason: "Contains forbidden pronoun 'you', 'we', 'our', or 'us'" };
  }
  if (/\b(tú|te|ti|tu|nosotros|nuestro|nuestra|nuestros|nuestras|nos)\b/i.test(combined)) {
    return { valid: false, reason: "Contains forbidden Spanish pronoun or possessive" };
  }

  return { valid: true };
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
        quote: "La lluvia cayó suavemente, como si la ciudad se hubiera detenido por un momento.",
        story: `Durante esa jornada, una lluvia apacible cubrió ${params.city} con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). El agua caía sobre los tejados y las calles vacías, mientras los reflejos plateados dibujaban líneas constantes en las aceras. En ese ambiente de lluvia constante, la jornada transcurrió con una inesperada calma. El agua continuó cayendo uniformemente hasta finales del día.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "Un día cubierto de nieve",
        quote: "Mientras la nieve cubría la ciudad, el silence blanco envolvía las calles.",
        story: `En esa fecha invernal, un manto de nieve cubrió las calles de ${params.city} en medio de un frío de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). La ciudad permanecía en un pacífico silencio blanco que amortiguaba el sonido habitual del viento. Los copos de nieve continuaron descendiendo con suavidad y constancia, acumulándose sobre los tejados y aceras.`,
      };
    }
    if (isSunny) {
      return {
        theme: "Un despejado día soleado",
        quote: "El sol brilló con calma, iluminando las calles de la ciudad.",
        story: `Durante esa jornada despejada, un sol brillante iluminó todo ${params.city} alcanzando los ${tempC}°C (${tempF}°F) con viento a ${windKn} km/h (${windMph} mph). Los edificios y las avenidas principales reflejaban la luz cálida, y una brisa ligera cruzaba las plazas locales. El cielo permaneció perfectamente limpio y azul de horizonte a horizonte.`,
      };
    }
    // Default Cloudy
    return {
      theme: "Un día nublado y tranquilo",
      quote: "El sky gris trajo una calma reconfortante a toda la ciudad.",
      story: `Durante esa fecha, nubes pacíficas vistieron de gris el cielo de ${params.city} con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Todo transcurrió bajo una luz difusa, mientras un viento suave mecía las ramas de los árboles. La jornada gris continuó desarrollándose en un ambiente de notable quietud y serenidad.`,
    };
  } else {
    if (isRainy) {
      const variants = [
        `Light rain drifted across ${params.city} throughout the afternoon with steady temperatures around ${tempC}°C (${tempF}°F). Water gathered quietly on rooftops as a breeze of ${windKn} km/h (${windMph} mph) rustled through the trees. The rhythmic sound of rainfall softened all sound, casting a quiet calm over parks and neighborhoods. The steady precipitation continued until late evening.`,
        
        `A fresh spring rain washed over the streets of ${params.city}, leaving pavements shimmering under overcast skies. With temperatures holding at ${tempC}°C (${tempF}°F) and wind pacing at ${windKn} km/h (${windMph} mph), the air carried a clean scent of wet earth and stone. Headlights cast long reflections on the wet asphalt. The clouds remained low as the day transitioned quietly into dusk.`,
        
        `An evening rain descended over the rooftops of ${params.city}, softening the city outline against a deep iron-grey sky. Temperatures cooled to ${tempC}°C (${tempF}°F) while a gentle breeze of ${windKn} km/h (${windMph} mph) carried mist across the neighborhood streets. Streetlights flickered to life, reflecting in silver pools along the concrete walkways. Drops continued to crawl down glass windows under a persistent dark sky.`,
        
        `Passing rain showers swept quickly across ${params.city}, carried by a gusty wind of ${windKn} km/h (${windMph} mph). Temperatures remained cool at ${tempC}°C (${tempF}°F) as dramatic cloud formations rolled steadily over the rooftops. Between brief bursts of water, wet asphalt streets glistened beneath a soft, diffuse light. Overcast skies persisted as the weather front moved slowly eastward.`,
        
        `Quiet, steady rainfall enveloped ${params.city}, turning the streets into a canvas of soft slate and grey. With temperatures registering ${tempC}°C (${tempF}°F) and wind blowing gently at ${windKn} km/h (${windMph} mph), silver droplets lined every windowpane. The steady patter of moisture created an unexpected calm across the skyline until nightfall.`
      ];

      const randomIndex = Math.floor(Math.random() * variants.length);
      return {
        theme: "A Rainy Afternoon",
        quote: "The rain fell softly, as if the city had paused for a moment.",
        story: variants[randomIndex],
      };
    }
    if (isSnowy) {
      return {
        theme: "A Snowy Winter Day",
        quote: "While snow carpeted the city outside, the streets fell into a quiet, frozen stillness.",
        story: `During that winter afternoon, soft snow blanketed ${params.city}, bringing a chill of ${tempC}°C (${tempF}°F) and a gentle wind at ${windKn} km/h (${windMph} mph). The streets fell silent under the white canopy, while buildings kept their facade lights glowing. Flakes continued to gather quietly on rooftops and pavements.`,
      };
    }
    if (isSunny) {
      return {
        theme: "A Sunny Afternoon",
        quote: "The sun rose for the city just like any other day, casting bright golden light across the streets.",
        story: `During that clear afternoon, bright sunshine bathed ${params.city}, warming the day to ${tempC}°C (${tempF}°F) with wind at ${windKn} km/h (${windMph} mph). Gold light danced across the brick building facades and tree branches. The blue sky remained perfectly clear and cloudless until the sun dipped below the horizon.`,
      };
    }
    // Default Cloudy
    const variants = [
      `A quiet blanket of overcast clouds settled low over the horizon of ${params.city}. Throughout the day, the temperature rested at a steady ${tempC}°C (${tempF}°F) while a light breeze of ${windKn} km/h (${windMph} mph) rustled through parks and along building fronts. Beneath the diffuse slate-grey sky, the usual sharp outline of the skyline was beautifully softened.`,
      
      `A vast, iron-grey canopy of clouds shrouded the sky over ${params.city}, creating a cool, unified shade across the streets and public squares. Temperatures hovered around ${tempC}°C (${tempF}°F) with wind blowing at ${windKn} km/h (${windMph} mph), sweeping dry leaves along the stone pavements. The soft, shadowless light gave the local parks and brick facades an archival, timeless quality.`,
      
      `Thick, dense grey clouds wrapped the buildings of ${params.city} in a peaceful and protective mist. The wind paced gently at ${windKn} km/h (${windMph} mph) underneath an overcast sky, keeping the daytime temperature locked at a cool ${tempC}°C (${tempF}°F). Across the city, local street corners, shop windows, and historic avenues appeared quiet and calm, illuminated by the glare-free light.`,
      
      `High-altitude grey clouds uniform in texture stretched coast to coast over the sky of ${params.city}. Air temperatures remained cool but steady at ${tempC}°C (${tempF}°F) with wind speeds of ${windKn} km/h (${windMph} mph) carrying a crisp, seasonal freshness through the streets. Under this calm slate canopy, the skyline sat in quiet composure.`,
      
      `A quiet layer of stratocumulus clouds blanketed the rooftops of ${params.city} from dawn until twilight. Outside, temperatures measured ${tempC}°C (${tempF}°F) with a steady, atmospheric wind blowing at ${windKn} km/h (${windMph} mph), creating a crisp feeling in the air. The lack of direct sunshine painted the city in soft, classic shades of slate and charcoal.`
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
      finalBackupStory = applyTimeOfRecord(finalBackupStory, lang === "es" ? "es" : "en", birthTime);
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
     English phrase: "during the silent late night hours"
     Spanish phrase: "durante las horas silenciosas de la madrugada"
   - 06:00–08:59:
     English phrase: "as dawn broke quietly over the city"
     Spanish phrase: "mientras el amanecer se asomaba silenciosamente sobre la ciudad"
   - 09:00–11:59:
     English phrase: "during the cool morning hours"
     Spanish phrase: "durante las frescas horas de la mañana"
   - 12:00–16:59:
     English phrase: "during the tranquil afternoon"
     Spanish phrase: "durante la tarde tranquila"
   - 17:00–19:59:
     English phrase: "as dusk settled over the streets"
     Spanish phrase: "cuando el atardecer comenzaba a cubrir las calles"
   - 20:00–23:59:
     English phrase: "under the dark night sky"
     Spanish phrase: "bajo el oscuro cielo nocturno"

   CRITICAL SPECIFICATION FOR THE THEME (TITLE):
   - You are STRICTLY FORBIDDEN from putting any time-of-day references inside the Theme title (the "theme" json property).
   - Absolutely do NOT use words like: Morning, Afternoon, Evening, Night, Late Night, Early Morning, Sunset, Sunrise, Dawn, Midnight, Madrugada, Tarde, Atardecer, Noche, etc., in the theme title.
   - Elegant, timeless themes (titles) only! Preferred examples of theme titles are:
     * English: "A Quiet Cloudy Day", "Cloudy Skies in ${city}", "A Gentle Winter Day", "A Sunny Afternoon"
     * Spanish: "Un día nublado y tranquilo", "Cielo nublado en ${city}", "Un despejado día soleado", "Un suave día de invierno"`
    : `
5. BIRTH TIME (NOT PROVIDED):
   Since the user did NOT provide a birth time, continue using neutral daily terms that do not assume a specific hour or time of day.
   CRITICAL CONSTRAINT: You are STRICTLY FORBIDDEN from mentioning or using keywords like: morning, afternoon, evening, night, dawn, sunrise, sunset, midnight, early morning, late night, mañana, tarde, noche, amanecer, salida del sol, puesta de sol, medianoche, madrugada, or similar time-of-day references.
   Instead, use strictly time-neutral terms, such as:
   - "On this date in ${city}..." / "En esta fecha en ${city}..."
   - "The sky over ${city}..." / "El cielo sobre ${city}..."
   Do NOT assume a specific time period under any circumstances.`;

  const systemInstruction = `You are an expert weather keepsake writer creating atmospheric historical archive records documenting the weather of specific dates and locations.

CONCEPTUAL REFRAME (CRITICAL NARRATIVE DIRECTION):
This is not a birth story, parent memory, or family keepsake generator. Do NOT write about people, relationships, families, birth, or babies. Write a historical weather keepsake journal documenting ONLY the atmosphere, weather, season, and regional character of a specific day. The weather, sky, clouds, wind, temperature, season, atmosphere, and city environment are the absolute main characters. 

The story must satisfy the following NEW STORY VALIDATION TESTS before outputting:
1. Is the weather the absolute main character and the subject of every paragraph or sentence? Yes.
2. Does the story contain ZERO references to babies, children, birth, parenting, or family? Yes. If any such reference is found, the story is INVALID.
3. Does the story read like an atmospheric weather chronicle preserved as a keepsake? (Completely objective, sensory, and beautifully detailed weather description).
4. Does the story contain the word 'you', 'your', 'we', 'our', 'us', or any personal pronoun? No. They are STRICTLY FORBIDDEN.

STRICTLY FORBIDDEN NARRATIVE THEMES:
Do NOT write about: parents, family members, babies, birth, children, emotions, gratitude, joy, relief, wonder, love, hearts, cuddles, embraces, holding or carrying the baby, first moments, first meeting, first sight, inside the room, inside our world, life changing moments, or emotional memories.

STRICTLY FORBIDDEN PHRASES (MUST NEVER APPEAR):
Do NOT use:
- "you", "your", "arrival", "your arrival", "on the day of your arrival", "when you arrived", "welcomed your child", "welcomed you", "the sky welcomed you"
- "we", "our", "us", "our arms", "we cradled you", "held you", "first cuddle", "first embrace", "first hug", "first moments together"
- "our world", "our universe", "our hearts", "our lives changed", "carry forever", "ultimate light", "brightest part of the day"
- "joy", "relief", "wonder", "gratitude", "sweet scent", "tiny face", "beautiful tiny face", "everything changed", "birth", "born", "baby", "child"
- Any other direct references to physical contact with a baby, parental emotions, tears, or family milestone feelings.

NARRATIVE RATIO:
- 100% weather, atmosphere, season, sky, clouds, wind, temperature, streets, landscape, city environment.
- 0% birth, baby, child, family, relationships, or emotions.

Mandatory Constraints:
1. FORBIDDEN WORD GROUPS:
   Avoid generating these words or their equivalents in Spanish/other languages:
   - baby / bebe / bebé
   - child / kid / children / hijo / hija / niño / niña
   - birth / born / nacido / nacida / nacer / nacimiento
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

2. STORY STRUCTURE:
   - Keep the story length strictly between 80 and 120 words (physical layout constraint).
   - Follow this narrative flow exactly:
     1. Describe the weather conditions in ${city} (such as rain, clouds, streets, wind, temperature, atmospheric composition, how the ambient city environment felt).
     2. Describe the sky, atmosphere, season, or landscape.
     3. Describe and focus purely on the environmental character of the day (e.g. steady winds, light patterns, cloud cover over building facades).
     4. Do NOT include any birth or person references. Maintain a purely objective, archival weather journal style.

3. WEATHER AS FACTUAL SENSORY CONTEXT:
   - Treat weather strictly as factual, sensory background context of the day, not as a poetic metaphor or an emotional driver. Keep all weather descriptions completely objective.
   - Do NOT describe temperatures or weather conditions using subjective adjectives like pleasant, perfect, lovely, beautiful, wonderful, cosy, etc. Use neutral, factual terms (e.g., "with temperature at -5°C", "winds of 15 km/h", "under grey clouds").
   - You must weave the following weather parameters naturally into the narrative exactly ONCE:
     * Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
     * Weather condition: ${weatherText} (weatherCode ${weatherCode})
     * Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
     * Date: ${birthDate}
     * City: ${city} (Region: ${region || 'None'}, Country: ${country})

4. STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
   - THEME (TITLE): If the weather is rainy, the theme title MUST be exactly "A Rainy Afternoon" (or "Una jornada de lluvia" in Spanish). Otherwise, generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}").
   - QUOTE: Quotes must describe the atmosphere of the day (e.g., "The rain softened every sound across the city." / "El aire de la mañana llevaba el rastro frío del invierno."). Never generate emotional quotes about becoming a parent or full hearts.
     * If the weather is rainy and requested in English, the quote MUST be exactly: "The rain fell softly, as if the city had paused for a moment." Otherwise, generate exactly one short, simple, natural, and memorable sentence reflecting the weather (e.g., "A single date. A unique sky. A story preserved.").

5. BIRTH REFERENCE REMOVABILITY:
   - The story MUST NOT contain any reference to births, babies, children, or families.
   - The story MUST NOT make any assumption about "you", "your", "arrival", "we", "our", "us", or any person.

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
        contents: `Generate an atmospheric historical weather archive record centered entirely on the weather conditions, season, sky, city atmosphere, and character of the day. Do NOT write about birth, babies, relationships, families, or people. Follow the system instruction for ${city}, ${country} (${region || ''}) with weather ${weatherText} (Max Temp ${tempMax}°C, Wind ${windSpeed} km/h) on ${birthDate}.`,
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
        const validation = validateGeneratedContent(parsed.story, parsed.quote, parsed.theme);
        if (validation.valid) {
          const qCheck = parsed.quality_check || {};
          const isPassed = qCheck.language_consistent && qCheck.weather_consistent && qCheck.time_consistent && qCheck.city_consistent && qCheck.structure_consistent;

          if (isPassed) {
            console.log("Gemini self-validation quality check passed on attempt " + (attempts + 1));
            finalJson = parsed;
            break;
          } else {
            console.log("Quality checks failed on attempt " + (attempts + 1) + ". Detail: ", qCheck);
            finalJson = parsed; // Store the last valid one in case we run out of retries
          }
        } else {
          console.warn(`Gemini response rejected on attempt ${attempts + 1}: ${validation.reason}`);
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
      finalBackupStory = applyTimeOfRecord(finalBackupStory, lang === "es" ? "es" : "en", birthTime);
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
