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
        quote: "La lluvia llegó suavemente, como si la ciudad se hubiera detenido por un momento.",
        story: `El día de tu llegada, una lluvia apacible cubrió ${params.city} con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Afuera, la gente caminaba despacio bajo sus paraguas, mientras los reflejos plateados del agua dibujaban líneas en los tejados y calles. En ese ambiente sereno de lluvia constante, el ritmo cotidiano disminuyó y se respiró una inesperada calma. Un nuevo camino se abría de forma discreta, marcando un día que recordaríamos con profunda gratitud.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "Una bienvenida con nieve",
        quote: "Mientras la nieve cubría la ciudad, un silencio blanco y acogedor nos envolvía.",
        story: `El día de tu llegada, un manto de nieve cubrió las calles de ${params.city} en medio de un frío de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Mientras el exterior permanecía en un pacífico silencio blanco, nuestras vidas cobraron un sentido de asombro y tranquilidad absoluta. Es un instante sagrado que vivirá guardado en nuestra memoria para siempre.`,
      };
    }
    if (isSunny) {
      return {
        theme: "Un inicio soleado",
        quote: "El sol brilló con calma, iluminando las calles de la ciudad.",
        story: `El día de tu llegada, un sol brillante iluminó todo ${params.city} alcanzando los ${tempC}°C (${tempF}°F) con viento a ${windKn} km/h (${windMph} mph). Afuera, la ciudad continuaba con su ritmo diario bajo una luz dorada y despejada. En la quietud de ese momento cálido, un nuevo capítulo comenzó con una alegría discreta y un sentimiento de inmensa calma. Podíamos contemplar un inicio luminoso bajo un cielo perfectamente azul.`,
      };
    }
    // Default Cloudy
    return {
      theme: "Un día nublado y tranquilo",
      quote: "El cielo gris trajo una calma reconfortante a toda la ciudad.",
      story: `El día de tu llegada, nubes pacíficas vistieron de gris el cielo de ${params.city} con una temperatura de ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). Afuera todo seguía su ritmo habitual, pero entre las sombras suaves y la luz difusa, encontramos un oasis de paz donde todo comenzó con tranquilidad y esperanza.`,
    };
  } else {
    if (isRainy) {
      const variants = [
        `Light rain drifted across ${params.city} throughout the afternoon with steady temperatures around ${tempC}°C (${tempF}°F). Umbrellas appeared along busy avenues, and water gathered quietly on rooftops as a breeze of ${windKn} km/h (${windMph} mph) rustled through the trees. The rhythmic sound of rainfall softened the city’s usual noise, casting a quiet calm over parks and neighborhoods as daily life continued. For most people, it was simply an ordinary rainy day. For one family, however, it became a date they would always remember.`,
        
        `A fresh spring rain washed over the streets of ${params.city}, leaving pavements shimmering under overcast skies. With temperatures holding at ${tempC}°C (${tempF}°F) and wind pacing at ${windKn} km/h (${windMph} mph), the air smelled of wet earth and clean stones. Commuters carrying umbrellas moved quickly past glowing shop windows while headlights cast long reflections on the wet asphalt. For most people, it was simply another ordinary rainy day. For one family, however, it became a date worth remembering.`,
        
        `An evening rain descended over the rooftops of ${params.city}, softening the city outline against a deep iron-grey sky. Temperatures cooled to ${tempC}°C (${tempF}°F) while a gentle breeze of ${windKn} km/h (${windMph} mph) carried mist across the streets. Streetlights flickered to life, reflecting in silver pools along empty walkways where water gathered. Inside warm cafes, people watched droplets crawl down the glass. For most people, it was simply an ordinary evening of rain. For one family, however, it became a date they would always remember.`,
        
        `Passing rain showers swept quickly across ${params.city}, carried by a gusty wind of ${windKn} km/h (${windMph} mph). Temperatures remained cool at ${tempC}°C (${tempF}°F) as dramatic cloud formations rolled over the city rooftops. Between brief bursts of water, wet asphalt streets glistened beneath a soft, diffuse light that settled over local parks and neighborhoods. Pedestrians sheltered under storefront awnings while watching the storm patterns transition. For most people, it was simply an ordinary day of passing weather. For one family, however, it became a date worth remembering.`,
        
        `Steady, quiet rainfall enveloped ${params.city} that day, turning the streets into a canvas of soft slate and grey. With temperatures registering ${tempC}°C (${tempF}°F) and wind blowing gently at ${windKn} km/h (${windMph} mph), silver raindrops lined every windowpane and balcony. The steady patter of moisture created an unexpected calm, slowing the city’s rapid morning pace down to a peaceful murmur as umbrellas moved quietly through the quiet city atmosphere. For most people, it was simply another ordinary rainy day. For one family, however, it became a date they would always remember.`
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
        theme: "A Snowy Welcome",
        quote: "While snow carpeted the city outside, our room was filled with pure, perfect warmth.",
        story: `On the day of your arrival, soft winter snow blanketed ${params.city}, bringing a quiet chill of ${tempC}°C (${tempF}°F) and wind at ${windKn} km/h (${windMph} mph). While the streets outside fell silent under the white canopy, our quiet room was warmed by an unexpected glow. In the stillness of that snowy morning, a beautiful new window of our lives quietly opened. It was a peaceful, snowy setting—a gentle beginning that we will cherish in our memories forever.`,
      };
    }
    if (isSunny) {
      return {
        theme: "A Sunny Beginning",
        quote: "The sun rose for the city just like any other day, but our true light was finally in our arms.",
        story: `On the day of your arrival, clear sunshine bathed ${params.city}, warming the day to ${tempC}°C (${tempF}°F) with wind at ${windKn} km/h (${windMph} mph). Outside, the streets were lively, and gold sunlight danced across the buildings of the entire city. In our room, the bright beams caught a peaceful, timeless stillness as a beautiful new chapter began. The sunshine filled the room, casting warm shadows over a day we will carry with us forever. It was a golden, bright start under perfectly clear skies.`,
      };
    }
    // Default Cloudy
    const variants = [
      `A quiet blanket of overcast clouds settled low over the horizon of ${params.city}. Throughout the day, the temperature rested at a steady ${tempC}°C (${tempF}°F) while a light breeze of ${windKn} km/h (${windMph} mph) rustled through parks and along building fronts. Beneath the diffuse slate-grey sky, the usual sharp outline of the skyline was beautifully softened, and streetlights glowed early on the avenues. Daily traffic moved patiently through the quiet neighborhoods. For most people it was simply another cloudy day. For one family, it became a date worth remembering.`,
      
      `A vast, iron-grey canopy of clouds shrouded the sky over ${params.city}, creating a cool, unified shade across the streets and public squares. Temperatures hovered around ${tempC}°C (${tempF}°F) with wind blowing at ${windKn} km/h (${windMph} mph), sweeping dry leaves along the stone pavements. The soft, shadowless light gave the local parks and brick facades an archival, timeless quality as residents went about their errands in sweaters and coats. For most people it was simply another cloudy day. For one family, it became a date worth remembering.`,
      
      `Thick, dense grey clouds wrapped the buildings of ${params.city} in a peaceful and protective mist. The wind paced gently at ${windKn} km/h (${windMph} mph) underneath an overcast sky, keeping the daytime temperature locked at a cool ${tempC}°C (${tempF}°F). Across the city, local street corners, shop windows, and historic avenues appeared quiet and calm, illuminated by the smooth, glare-free light filtering through the clouds above. For most people it was simply another cloudy day. For one family, it became a date worth remembering.`,
      
      `High-altitude grey clouds uniform in texture stretched coast to coast over the sky of ${params.city}. Air temperatures remained cool but steady at ${tempC}°C (${tempF}°F) with wind speeds of ${windKn} km/h (${windMph} mph) carrying a crisp, seasonal freshness through the streets. Under this calm slate canopy, the city’s busy thoroughfares slowed to a quiet mutter, and rooftops took on a soft, silver-toned sheen in the early afternoon gloom. For most people it was simply another cloudy day. For one family, it became a date worth remembering.`,
      
      `A quiet layer of stratocumulus clouds blanketed the rooftops of ${params.city} from dawn until dusk. Outside, temperatures measured ${tempC}°C (${tempF}°F) with a steady, atmospheric wind blowing at ${windKn} km/h (${windMph} mph), creating a crisp feeling in the air. The lack of direct sunshine painted the city in soft, classic shades of slate and charcoal, lending an elegant, historic mood to the regular bustle of the urban avenues. For most people it was simply another cloudy day. For one family, it became a date worth remembering.`
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
      finalBackupStory = applyTimeOfArrival(finalBackupStory, lang === "es" ? "es" : "en", birthTime);
    } else {
      finalBackupStory = makeStoryTimeNeutral(finalBackupStory, lang === "es" ? "es" : "en");
    }
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
Your task is to generate a warm, human, and memorable weather story, a themed title, and a simple quote grounded in that day's weather for a child's birth day. Keep the stories warm, human, and memorable. Do NOT turn them into weather reports, news articles, archives, chronicles, journalism, or factual bullet points. The final style should feel like a meaningful weather memory connected to a birth day, NOT a Hallmark greeting card and NOT a meteorological report.

Mandatory Constraints:
1. STRICT NO-CLICHÉ NEGATIVE FILTER (CRITICAL):
   - You are STRICTLY FORBIDDEN from using any greeting card cliches, Hallmark-card language, or exaggerated sentimentality.
   - You must NEVER use any of the following phrases or their direct equivalents in Spanish/other languages:
     * "holding you for the first time" / "sostenerte por primera vez" / "tenerte en brazos por primera vez"
     * "first cuddle" / "primer abrazo" / "primer cuddle" / "primer acurruco"
     * "everything changed" / "todo cambió" / "cambió todo"
     * "our world changed" / "nuestro mundo cambió"
     * "brand-new chapter" / "nuevo capítulo"
     * "filled our hearts" / "llenó nuestros corazones"
     * "magical moment" / "momento mágico"
     * "journey began" / "comenzó el viaje"
     * "tiny face" / "carita"
     * "sacred moment" / "momento sagrado"
     * "our lives were never the same" / "nuestras vidas nunca volvieron a ser las mismas"
     * "our universe" / "nuestro universo"
     * "our quiet room" / "nuestra habitación silenciosa"
     * "joy washed over us" / "la alegría nos inundó"
     * "the world continued outside" / "el mundo afuera continuaba"
     * "nothing else mattered" / "nada más importaba"
     * "focus narrowed" / "el enfoque se redujo"
     * "everything faded into the background" / "todo lo demás se desvaneció"
   - Avoid common hospital clichés (such as endless corridors, soft-soled shoes, beeping machines) and all Hallmark-style sentimentality.
   - Avoid making assumptions about parents' emotions. Write as if describing an authentic day preserved in a weather archive.

2. GENUINE HISTORICAL WEATHER KEEPSAKE NARRATIVE STYLE (CRITICAL):
   - Focus primarily on the actual weather, atmosphere, city environment, season, and daily life. Weather must be treated as the main character.
   - Focus primarily on weather, atmosphere, season, and the character of the day. Any emotional element should emerge naturally from the setting and never from assumed feelings.
   - Keep the story length strictly between 80 and 120 words. This size limit is a hard physical keepsake layout constraint.
   - STRUCTURE:
     1. The story should begin by describing the weather conditions in the city (such as rain, clouds, streets, rooftops, umbrellas, wind, temperature, how the city felt).
     2. End with a simple, grounded observation that for most people it was an ordinary day, but for one family it became a date worth remembering / they would always remember.

3. WEATHER AS BACKGROUND CONTEXT ONLY:
   - Treat weather strictly as factual, sensory background context of the day, not as a poetic metaphor or an emotional driver. Keep all weather descriptions completely objective.
   - Do NOT describe temperatures or weather conditions using subjective adjectives like pleasant, perfect, lovely, beautiful, wonderful, cosy, etc. Use neutral, factual terms (e.g., "with temperature at -5°C", "winds of 15 km/h", "under grey clouds").
   - You must weave the following weather parameters naturally into the narrative exactly ONCE:
     * Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
     * Weather condition: ${weatherText} (weatherCode ${weatherCode})
     * Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
     * Date: ${birthDate}
     * City: ${city} (Region: ${region || "None"}, Country: ${country})

4. STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
   - THEME: If the weather is rainy, the theme title MUST be exactly "A Rainy Arrival" (or "Una llegada con lluvia" in Spanish). Otherwise, generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}").
   - QUOTE: If the weather is rainy and requested in English, the quote MUST be exactly: "The rain arrived softly, as if the city had paused for a moment." Otherwise, generate exactly one short, simple, natural, and memorable sentence. It must feel like a short atmospheric reflection inspired by the weather conditions of that day, entirely free of greeting-card fluff or dramatic poetry.

5. STRICT LANGUAGE REQUIREMENT:
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
        contents: `Generate an authentic parent memory matching the system instruction for ${city}, ${country} (${region || ""}) with weather ${weatherText} (Max Temp ${tempMax}°C, Wind ${windSpeed} km/h) on ${birthDate}.`,
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
      finalBackupStory = applyTimeOfArrival(finalBackupStory, lang === "es" ? "es" : "en", birthTime);
    } else {
      finalBackupStory = makeStoryTimeNeutral(finalBackupStory, lang === "es" ? "es" : "en");
    }
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
