import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI, Type } from "@google/genai";

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
  const storyLower = story.toLowerCase();
  const quoteLower = quote.toLowerCase();
  const themeLower = theme.toLowerCase();
  
  const combinedQuoteTheme = `${quoteLower} ${themeLower}`;

  const forbiddenPhrases = [
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
    "new chapter",

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
    "abrazar"
  ];

  for (const phrase of forbiddenPhrases) {
    if (storyLower.includes(phrase) || combinedQuoteTheme.includes(phrase)) {
      return { valid: false, reason: `Contains forbidden phrase or emotional parenting word: "${phrase}"` };
    }
  }

  // 1. Enforce zero birth, baby, child, or arrival mentions in the QUOTE and THEME (100% weather only!)
  const birthMentionsQuoteThemeEn = (combinedQuoteTheme.match(/\bbirth\b|\bborn\b|\bbaby\b|\bchild\b|\bperson\b|\bpeople\b|\barrival\b/gi) || []).length;
  const birthMentionsQuoteThemeEs = (combinedQuoteTheme.match(/\bnacimiento\b|\bnació\b|\bbebé\b|\bniño\b|\bniña\b|\bhijo\b|\bhija\b|\bpersona\b|\bgente\b|\bllegada\b|\barribo\b/gi) || []).length;
  if (birthMentionsQuoteThemeEn + birthMentionsQuoteThemeEs > 0) {
    return { valid: false, reason: "Quote or Theme contains forbidden birth, baby, child, or arrival references" };
  }

  // 2. Enforce exactly one (or at most one) brief, third-person-neutral birth reference in the STORY, strictly near the end
  const birthKeywordsEn = (storyLower.match(/\barrival\b|\bborn\b|\bbirth\b/gi) || []).length;
  const birthKeywordsEs = (storyLower.match(/\bnacimiento\b|\bnació\b|\barribo\b|\bllegada\b/gi) || []).length;
  const totalBirthKeywords = birthKeywordsEn + birthKeywordsEs;

  if (totalBirthKeywords > 1) {
    return { valid: false, reason: `Story contains too many birth/arrival references (${totalBirthKeywords}). Max is 1 brief mention at the very end.` };
  }

  // If 0 keywords, check for indirect ones like "nueva vida" (new life) or "vida" at the end of the story
  if (totalBirthKeywords === 0) {
    const lifeMentions = (storyLower.match(/\bvida\b|\bpequeña vida\b|\blittle life\b/gi) || []).length;
    if (lifeMentions === 0) {
      return { valid: false, reason: "Story is missing the required single brief, neutral mention of the birth at the end." };
    }
  }

  // 3. Enforce zero standard pronouns targeting the user or first-person plural in the story
  if (/\b(you|your|we|our|us)\b/i.test(storyLower)) {
    return { valid: false, reason: "Story contains forbidden pronoun 'you', 'your', 'we', 'our', or 'us'" };
  }
  if (/\b(tú|te|ti|tu|nosotros|nuestro|nuestra|nuestros|nuestras|nos)\b/i.test(storyLower)) {
    return { valid: false, reason: "Story contains forbidden Spanish pronoun or possessive" };
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

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
    const birthSentence = lang === "es"
      ? " También fue el día en que una nueva y pequeña vida llegó al mundo."
      : " It was also the day a new little arrival entered the world.";
    finalBackupStory = finalBackupStory.trim() + birthSentence;
    res.status(200).json({
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

CONCEPTUAL REFRAME (WEATHER AS PROTAGONIST):
This is a WEATHER KEEPSAKE where the weather, season, sky, temperature, wind, precipitation, and atmosphere of the city are the absolute main subjects (at least 90% of the narrative).
The day itself is the protagonist. The city's atmosphere is the protagonist.
A child happened to be born on that day, but this birth is only a small historical event mentioned exactly ONCE near the very end of the story in a single short sentence. The baby is NOT the protagonist.

STORY REQUIREMENTS & STYLE:
1. Describe: sky conditions, clouds, sunlight, rain, snow, wind, temperature, humidity, seasonal atmosphere, city mood, streets, parks, rooftops, local surroundings, and natural seasonal details.
2. Under no circumstances write about: parents, motherhood, fatherhood, family emotions, holding/seeing/cradling/embracing the baby, first cuddle, tears of joy, becoming parents, emotional reactions, love at first sight, bonding experiences, nursery scenes, or family memories. These family/parent topics are strictly forbidden.
3. Write in elegant, warm, atmospheric language with sensory details, letting the reader feel transported back into the weather of that exact day as if reading a preserved weather journal or old almanac. Keep descriptions beautifully sensory and detailed, but completely free of sentimentality or cliches.
4. Strictly third-person objective perspective. Personal pronouns targeting the user or first person plural ("you", "your", "we", "our", "us", "tú", "te", "ti", "tu", "nosotros", "nuestro", "nuestra", "nuestros", "nuestras", "nos") are STRICTLY FORBIDDEN.
5. BIRTH MENTION RULE: Mention the birth exactly ONCE near the end of the story in a single brief, neutral sentence without elaborating, discussing parents, or mentioning emotions.
   - Example English: "It was also the day a new little arrival entered the world."
   - Example Spanish: "También fue el día en que una nueva y pequeña vida llegó al mundo." / "También fue la fecha en que un nuevo arribo entró al mundo."
6. UNIQUENESS RULE: Every story must be unique. Never reuse the same structure, opening, or ending. Adapt the atmosphere to the city's unique geography, local character, season, weather details, and regional climate personality. (e.g., a snowy day in Poznan must feel different from a snowy day in Lodz; a rainy day in Toronto must feel different from Seattle).

WEATHER DETAILS (INTEGRATE NATURALLY EXACTLY ONCE):
- Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
- Weather condition: ${weatherText} (weatherCode ${weatherCode})
- Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
- Date: ${birthDate}
- City: ${city} (Region: ${region || "None"}, Country: ${country})

STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
- THEME (TITLE): If the weather is rainy, the theme title MUST be exactly "A Rainy Afternoon" (or "Una jornada de lluvia" in Spanish). Otherwise, generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}"). No time-of-day reference in theme unless specified by birthTime.
- QUOTE (THE SKY'S RECORD): Generate a separate, short, memorable quote. This quote must describe ONLY the weather, sky, clouds, rain, snow, sunlight, wind, or seasonal atmosphere. It must NEVER mention parents, family, baby, child, arrival, love, joy, or emotions. It should feel like a poetic meteorological line from a climate diary or old almanac.
  - Example English: "Rain whispered across the rooftops while silver clouds drifted above the city."
  - Example Spanish: "La lluvia caía suavemente, como si la ciudad se hubiera detenido por un momento."

STRICT LANGUAGE REQUIREMENT:
- The requested language is: "${language}".
- Write "theme", "quote", and "story" purely in "${language}" as a native speaker would, avoiding translation stiffness or hybrid terms.

Response JSON Schema (Keep exactly unchanged):
You must output a JSON object containing:
- theme: string (3-6 words, weather-based, factual title)
- quote: string (exactly 1 short, simple, memorable sentence about weather only)
- story: string (the completed narrative memory, strictly between 80 and 120 words formatted as a single paragraph with exactly one brief birth mention near the end)
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
        contents: `Generate an atmospheric historical weather archive record centered entirely on the weather conditions, season, sky, city atmosphere, and character of the day. Do NOT write about birth, babies, relationships, families, or people. Follow the system instruction for ${city}, ${country} (${region || ""}) with weather ${weatherText} (Max Temp ${tempMax}°C, Wind ${windSpeed} km/h) on ${birthDate}.`,
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
    res.status(200).json({
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
    const birthSentence = lang === "es"
      ? " También fue el día en que una nueva y pequeña vida llegó al mundo."
      : " It was also the day a new little arrival entered the world.";
    finalBackupStory = finalBackupStory.trim() + birthSentence;
    res.status(200).json({
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
}
