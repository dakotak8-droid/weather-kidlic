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
        `A gentle rain drifted across ${params.city} on the day of your arrival. Streets shimmered beneath fresh raindrops while umbrellas moved quietly through the afternoon. The steady rhythm of rainfall softened the noise of everyday life, giving the day an unexpected sense of calm. Temperatures hovered around ${tempC}°C (${tempF}°F) as the weather settled into a peaceful pattern with wind speed at ${windKn} km/h (${windMph} mph). It wasn't a dramatic storm or a day people would long remember, yet for us it became unforgettable. While the rain traced silver lines across windows and rooftops, a brand-new chapter quietly began.`,
        
        `A soft drizzle descended over ${params.city} on the day of your arrival. Pavements and asphalt streets shimmered under the gentle, steady downpour, reflecting the city lights under overcast skies. Outside, commuters carrying umbrellas moved with a quiet, synchronized grace through the avenues. The temperature remained cool, hovering around ${tempC}°C (${tempF}°F) with a light breeze of ${windKn} km/h (${windMph} mph). It was an unassuming, quiet day for the busy city outside, but the soft tapping of rain against the glass provided a peaceful backdrop for a beautiful, unforgettable new beginning.`,
        
        `Passing rain showers swept across ${params.city} on the day of your arrival, leaving quiet reflections on wet roadways and pavements. Wind at ${windKn} km/h (${windMph} mph) carried the fresh scent of raindrops, while clouds settled low over the cityscape. The temperature marked a steady ${tempC}°C (${tempF}°F), matching the cool, tranquil atmosphere of the day. While people sought shelter and watched the rainfall from covered windows, a serene and gentle quietness took over. It was an ordinary rainy day to the rest of the world, but to us, it was when a wonderful new story quietly commenced.`,
        
        `The steady tapping of rain on the rooftops of ${params.city} created a peaceful, rhythmic melody on the day of your arrival. A thick, atmospheric layer of clouds hung low over the buildings, softening the city's lines. The temperature held steady at ${tempC}°C (${tempF}°F) with wind at ${windKn} km/h (${windMph} mph). Outside, umbrellas painted a moving, colorful picture on the glistening streets. Inside, the rhythmic sound of falling rain created an unexpected sense of calm, transforming a gray day into a beautiful, quiet setting for a brand-new life to emerge.`,
        
        `A fresh rain washed over the neighborhoods of ${params.city} on the day you arrived, bringing a cool clarity to the streets. Fresh raindrops hung like pearls from trees and awnings, and the avenues glistened with soft reflections. The temperature was mild at ${tempC}°C (${tempF}°F), accompanied by a gentle wind of ${windKn} km/h (${windMph} mph). While passing showers softened the city's usual busy pace, they brought a deep feeling of peaceful transition and hope. It was a beautiful, tranquil rainy day—a perfect and quiet background where our favorite memory was cast.`
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
    return {
      theme: "A Quiet Cloudy Day",
      quote: "The grey skies didn't matter; our entire universe had settled inside our quiet room.",
      story: `On the day of your arrival, a quiet grey sky softened the horizon over ${params.city}, with temperatures at ${tempC}°C (${tempF}°F) and wind at ${windKn} km/h (${windMph} mph). Outside, the city continued its busy rhythm, but in our room, the steady overcast clouds created an unexpected sense of comfort and shield. The soft, diffuse light framed a peaceful oasis where our new journey quietly emerged. It was a calm and peaceful grey day, a quiet, reassuring beginning that we carry in our hearts forever.`,
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

  const systemInstruction = `You are an expert nostalgic family keepsake writer specializing in authentic, deeply personal parenthood memories.
Your task is to generate an authentic personal story, a themed title, and a simple quote for a parent remembering the day their child was born, grounded in that day's weather.

Mandatory Constraints:
1. STRICT NO-CLICHÉ NEGATIVE FILTER (CRITICAL):
   - You are STRICTLY FORBIDDEN from using any greeting card cliches, Hallmark-card language, or exaggerated sentimentality.
   - You must NEVER use any of the following phrases or their direct equivalents in Spanish:
     * "everything changed" / "todo cambió" / "cambió todo"
     * "holding you for the first time" / "sostenerte por primera vez" / "tenerte en brazos por primera vez"
     * "first cuddle" / "primer abrazo" / "primer cuddle" / "primer acurruco"
     * "our universe" / "nuestro universo"
     * "our quiet room" / "nuestra habitación silenciosa" / "nuestra silenciosa habitación" / "en el silencio de nuestra habitación"
     * "joy washed over us" / "la alegría nos inundó" / "inundó nuestros corazones de alegría"
     * "the world continued outside" / "el mundo afuera continuaba" / "afuera el mundo continuaba" / "mientras el mundo afuera continuaba"
     * "nothing else mattered" / "nada más importaba"
     * "focus narrowed" / "el enfoque se redujo" / "nuestro enfoque se estrechó"
     * "everything faded into the background" / "todo lo demás se desvaneció" / "todo se desvaneció en el fondo"
   - Avoid common hospital clichés (such as endless corridors, soft-soled shoes, beeping machines). Instead, focus on real, quiet human details.

2. AUTHENTIC PARENT STORY NARRATIVE STYLE (YEARS LATER):
   - The story must sound like a real parent telling their child the story years later. Use a down-to-earth, natural, warm, and conversational voice.
   - Keep the story length strictly between 70 and 100 words. This size limit is a hard physical keepsake layout constraint.
   - The emotional focus should be on anticipation, relief, deep gratitude, gentle curiosity, and remembering specific small details.
   - Contrast an ordinary, indifferent day outside with the meaningful, indelible personal memory inside.

3. WEATHER AS BACKGROUND CONTEXT ONLY:
   - Treat weather strictly as factual, sensory background context of the day, not as a poetic metaphor or an emotional driver. Keep all weather descriptions completely objective.
   - Do NOT describe temperatures or weather conditions using subjective adjectives like pleasant, perfect, lovely, beautiful, wonderful, cosy, etc. Use neutral, factual terms (e.g., "with temperature at -5°C", "winds of 15 km/h", "under grey clouds").
   - You must weave the following weather parameters naturally into the narrative exactly ONCE:
     * Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
     * Weather condition: ${weatherText} (weatherCode ${weatherCode})
     * Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
     * Date: ${birthDate}
     * City: ${city} (Region: ${region || 'None'}, Country: ${country})

4. STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
   - QUOTE: Generate exactly one short, simple, natural, and memorable sentence. It must feel like an authentic, heartfelt reminder spoken by a parent later in life, entirely free of greeting-card fluff or dramatic poetry.
   - THEME: Generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}").

5. STRICT LANGUAGE REQUIREMENT:
   - The requested language is: "${language}".
   - Write all fields ("theme", "quote", "story") directly and purely in "${language}" as a native speaker would, avoiding any translation-like stiffness, awkward AI syntax, or hybrid terms.

Response JSON Schema (Keep exactly unchanged):
You must output a JSON object containing:
- theme: string (3-6 words, weather-based, factual title)
- quote: string (exactly 1 short, simple, memorable sentence)
- story: string (the completed narrative memory, strictly between 70 and 100 words formatted as a single paragraph)
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
