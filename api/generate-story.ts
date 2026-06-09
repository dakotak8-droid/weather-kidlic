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
    s = s.replace(/al amanecer/gi, "con el comienzo de la jornada");
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
      [/\bmedianoche\b/gi, "la jornada"],
      [/\bamanecer\b/gi, "el inicio de la jornada"],
      [/\bsalida del sol\b/gi, "el día"],
      [/\bpuesta de sol\b/gi, "el fin del día"],
      [/\bla noche de tu llegada\b/gi, "el de esa jornada"],
      [/\bla noche en que naciste\b/gi, "la jornada de esa fecha"],
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
      [/\bdawn\b/gi, "the start of the day"],
      [/\bsunrise\b/gi, "the sun"],
      [/\bsunset\b/gi, "the end of the day"],
      [/\bmidnight\b/gi, "the day"],
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
    "sacred moment",
    "life-changing",
    "emotional reactions",
    "bonding moments",
    "welcome into the world",
    "your arrival",
    "our room",
    "inside our room",
    "carry forever",
    "we will carry",
    "pure warmth",
    "beautiful moment",
    "precious",
    "miracle",
    "bundle of joy",
    "parent",
    "mother",
    "father",
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
    "llevaremos",
    "calidez pura",
    "momento hermoso",
    "sagrado",
    "precioso",
    "milagro",
    "padre",
    "madre",
    "sentimientos",
    "emociones",
    "abrazar",
    "bienvenida al mundo",
    "tu llegada",
    "cambió nuestras vidas"
  ];

  for (const phrase of forbiddenPhrases) {
    if (storyLower.includes(phrase) || combinedQuoteTheme.includes(phrase)) {
      return { valid: false, reason: `Contains forbidden phrase or emotional parenting word: "${phrase}"` };
    }
  }

  // 1. Enforce zero birth, baby, child, arrival, parents, or family references in QUOTE and THEME (100% weather only!)
  const combinedQuoteThemeBirthEn = (combinedQuoteTheme.match(/\bbirth\b|\bborn\b|\bbaby\b|\bchild\b|\bperson\b|\bpeople\b|\barrival\b|\bparents\b|\bfamily\b|\bhospital\b|\blabor\b|\bchildbirth\b|\bdeliver\b|\bdelivered\b/gi) || []).length;
  const combinedQuoteThemeBirthEs = (combinedQuoteTheme.match(/\bnacimiento\b|\bnació\b|\bbebé\b|\bniño\b|\bniña\b|\bhijo\b|\bhija\b|\bpersona\b|\bgente\b|\bllegada\b|\barribo\b|\bpadres\b|\bfamilia\b|\bparto\b|\bparir\b/gi) || []).length;
  if (combinedQuoteThemeBirthEn + combinedQuoteThemeBirthEs > 0) {
    return { valid: false, reason: "Quote or Theme contains forbidden birth, baby, child, family, arrival, or human references" };
  }

  // 2. In STORY itself, birth/born must be only a brief factual reference (maximum 3 minor birth/child references to adhere to the 80/20 rule)
  const storyBirthEnCount = (storyLower.match(/\bbirth\b|\bborn\b|\bchild\b|\bnacimiento\b|\bnació\b|\bniño\b|\bniña\b/gi) || []).length;
  const heavyFamilyEnCount = (storyLower.match(/\bbaby\b|\bparents\b|\bhospital\b|\bbebé\b|\bpadres\b/gi) || []).length;
  if (heavyFamilyEnCount > 0) {
    return { valid: false, reason: "Story contains forbidden active family references like baby, parents, family, or hospital" };
  }
  if (storyBirthEnCount > 3) {
    return { valid: false, reason: "Story exceeds maximum allowed brief historical birth/child references for 80/20 rule" };
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

  if (params.lang === "es") {
    if (isRainy) {
      return {
        theme: "Una jornada de lluvia",
        quote: "La lluvia cayó suavemente, como si la ciudad se hubiera detenido por un momento.",
        story: `Una lluvia apacible y constante cubrió las avenidas de ${params.city}, tiñendo los tejados de un gris plateado. Un aire fresco mecía suavemente las copas de los árboles, arrastrando el aroma característico de la tierra mojada por los parques cercanos. Pocas personas transitaban la calzada húmeda, prefiriendo el resguardo de los portales mientras el agua formaba pequeños espejos en las aceras que reflejaban las siluetas de la arquitectura local. La jornada transcurrió bajo esa luz difusa y tranquila, envolviendo las calles con un manto de serena calma.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "Un día cubierto de nieve",
        quote: "Mientras la nieve cubría la ciudad, el silencio blanco envolvía las calles.",
        story: `Silenciosos copos de nieve descendían de manera constante sobre ${params.city}, vistiendo las avenidas con un manto blanco y denso. El aire invernal se sentía nítido y helado al respirar, adormeciendo el bullicio habitual de las plazas y calles principales. Las farolas se encendieron temprano, proyectando círculos de luz dorada sobre la nieve intacta acumulada en los alféizares y las aceras vacías. Todo en la ciudad parecía haberse pausado bajo esa atmósfera de quietud profunda.`,
      };
    }
    if (isSunny) {
      return {
        theme: "Un despejado día soleado",
        quote: "El sol brilló con calma, iluminando las calles de la ciudad.",
        story: `Un sol espléndido iluminó brillantemente cada rincón de ${params.city}, proyectando sombras nítidas y alargadas junto a las fachadas de ladrillo antiguo. Una brisa templada y sumamente agradable corría entre los edificios, invitando a la gente a caminar despacio por los parques abiertos y las avenidas principales. El cielo se mantuvo limpio de nubes, extendiendo un azul profundo e impecable desde el amanecer hasta que la luz dorada de la tarde se desvaneció lentamente.`,
      };
    }
    // Default Cloudy
    return {
      theme: "Un día nublado y tranquilo",
      quote: "El cielo gris trajo una calma reconfortante a toda la ciudad.",
      story: `Un denso y pacífico manto de nubes grises cubrió el cielo de ${params.city}, suavizando los contornos de los edificios contra el horizonte. El viento soplaba en ráfagas suaves que traían un aire fresco y limpio del río, agitando ligeramente las hojas secas en el suelo. Bajo esta luz tenue y sin sombras, las calles y los paseos peatonales se percibían íntimos, pacíficos y con una atmósfera nostálgica y acogedora que se prolongó hasta el anochecer.`,
    };
  } else {
    if (isRainy) {
      const variants = [
        `Soft rain drifted steadily across the avenues of ${params.city}, casting a silver sheen over the brick buildings and historic slate rooftops. A cool, damp breeze rustled through the green branches of the parks, carrying the clean scent of wet cobblestones and earth. Underneath the glass awnings, people watched the droplets trace pathways down the windowpanes, while the streetlights began to flicker on early, casting long reflections in the quiet puddle-lined streets.`,
        `A fresh rain washed over the streets of ${params.city}, leaving pavements shimmering under dense clouds. The afternoon air carried a clean scent of wet stone and green parks. Warm yellow headlights cast long reflections on the wet asphalt, illuminating the quiet sidewalks. The clouds remained low and heavy, locking the skyline in a peaceful gray embrace as the day progressed quietly.`,
        `Steady rain descended over the rooftops of ${params.city}, softening the city outline against a deep iron-grey sky. A gentle breeze carried a silver mist across the neighborhood streets, rustling leaf-laden branches. Puddles gathered on the pavement, reflecting in silver pools along the concrete walkways, while fat droplets continued to crawl down glass windows and old stone archways under the persistent overcast sky.`,
        `Passing rain showers swept quickly across ${params.city}, carried by a fresh, atmospheric wind. High cloud formations rolled steadily over the rooftops. Between brief bursts of water, wet asphalt streets glistened beneath a soft, diffuse light that illuminated the brick buildings. Deep slate clouds persisted as the gentle wind from the river rustled the park benches.`,
        `Quiet, steady rainfall enveloped ${params.city}, turning the streets into a canvas of soft slate and grey. Cool silver droplets lined every windowpane, glistening against the dull stone brick. The steady patter of moisture created an unexpected calm across the skyline throughout the day, slowing the pulse of the town into a patient, lazy rhythm.`
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
        story: `Thick, quiet snow descended over ${params.city}, wrapping the urban skyline in a thick blanket of pristine white. The crisp, icy winter air kept the streets peaceful, dampening the usual sounds of traffic and footsteps. Soft light from shop windows glowed warmly onto the accumulating drifts along the sidewalks, while the tree branches in the squares bowed gently under the weight of the fresh snowfall, creating a landscape of stillness.`,
      };
    }
    if (isSunny) {
      return {
        theme: "A Sunny Day",
        quote: "The sun shone for the city with gentle brilliance, casting gold light across the streets.",
        story: `Warm, radiant sunshine bathed ${params.city}, illuminating the details of the historic facades and casting sharp, playful shadows across the public squares. A gentle, pleasant breeze wandered through the open streets, carrying a whisper of warmth that invited people to linger on park benches and outdoor cafes. The sky remained a pristine, vast blue from horizon to horizon, keeping the town bright and welcoming.`,
      };
    }
    // Default Cloudy
    const variants = [
      `A quiet blanket of slate-grey clouds hung low over ${params.city}, beautifully softening the sharp profile of the distant buildings against the sky. A fresh, cool breeze swept through the brick alleys and open avenues, rustling dry leaves along the stone pavements. Without the glare of direct sunlight, the neighborhood blocks felt peaceful and close, wrapped in a comfortable twilight haze that lasted throughout the entire day.`,
      `A vast, iron-grey canopy of clouds shrouded the sky over ${params.city}, creating a cool, unified shade across the streets and public squares. A light breeze swept dry leaves along the stone pavements and brick boundaries. The soft, shadowless light gave the local parks and buildings an archival, timeless quality, inviting a calm mood of quiet contemplation.`,
      `Thick, dense grey clouds wrapped the buildings of ${params.city} in a peaceful and protective mist. The wind paced gently underneath an overcast sky, carrying a crisp freshness through the avenues. Across the city, local street corners, shop windows, and historic avenues appeared quiet and calm, beautifully illuminated by the glare-free light.`,
      `High-altitude grey clouds uniform in texture stretched coast to coast over the sky of ${params.city}. Air temperatures remained cool but steady as a gentle breeze carried a crisp freshness through the streets. Under this calm slate canopy, the skyline sat in quiet composure, casting a peaceful mood onto the stone paths below.`,
      `A quiet layer of stratocumulus clouds blanketed the rooftops of ${params.city} throughout the day. Outside, a steady, atmospheric wind blew through the alleys, creating a crisp feeling in the air. The lack of direct sunshine painted the city in soft, classic shades of slate and charcoal, bringing a comforting stillness to the parks.`
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
  // Allow GET for retrieving the audit-report
  if (req.method === "GET") {
    const fs = await import("fs");
    const path = await import("path");
    try {
      const filePath = path.join(process.cwd(), "audit-report.txt");
      if (fs.existsSync(filePath)) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=audit-report.txt");
        res.status(200).send(fs.readFileSync(filePath, "utf-8"));
        return;
      }
    } catch (e) {
      console.error("Error reading audit report on Vercel API:", e);
    }
    res.status(404).send("Audit report file not found on disk.");
    return;
  }

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
    res.status(200).json({
      theme: backupResult.theme,
      quote: backupResult.quote,
      story: finalBackupStory.trim(),
      isFallback: true,
      debug_source: "api_offline_backup",
      prompt_version: "historical_archive_v1",
      generator_path: "api_generate_story",
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

  const targetDate = birthDate;
  const timeOfRecord = birthTime;
  const timeOfDepartureRule = timeOfRecord
    ? `
5. TIME OF RECORD PERSONALIZATION (CRITICAL CONSTRAINT):
   Since the provided time of record is "${timeOfRecord}", the narrative MUST incorporate the exact phrase corresponding to that period from the list below:
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
   - Avoid placing any time-of-day references inside the Theme title (the "theme" json property).
   - Absolutely do NOT use words like: Morning, Afternoon, Evening, Night, Late Night, Early Morning, Sunset, Sunrise, Dawn, Midnight, Madrugada, Tarde, Atardecer, Noche, etc., in the theme title.
   - Elegant, timeless themes (titles) only! Preferred examples of theme titles are:
     * English: "A Quiet Cloudy Day", "Cloudy Skies in ${city}", "A Gentle Winter Day", "A Sunny Afternoon"
     * Spanish: "Un día nublado y tranquilo", "Cielo nublado en ${city}", "Un despejado día soleado", "Un suave día de invierno"`
    : `
5. TIME OF RECORD NOT SPECIFIED:
   Since no time of record was specified, continue using neutral daily terms that do not assume a specific hour or time of day.
   CRITICAL CONSTRAINT: Avoid mentioning or using keywords like: morning, afternoon, evening, night, dawn, sunrise, sunset, midnight, early morning, late night, mañana, tarde, noche, amanecer, salida del sol, puesta de sol, medianoche, madrugada, or similar time-of-day references.
   Instead, use strictly time-neutral terms, such as:
   - "On this date in ${city}..." / "En esta fecha en ${city}..."
   - "The sky over ${city}..." / "El cielo sobre ${city}..."
   Do NOT assume a specific time period under any circumstances.`;

  const systemInstruction = `You are a historical local memory chronicler and archivist.

Your task is to create a soft, highly atmospheric reminiscence documenting the look, draft, light, and sensory feelings of the city environment on a specific historical date.

STRICT DESIGN & WORDING PRINCIPLES (OVERRIDING ALL PREVIOUS CONSTRAINTS):
- The narrative must NEVER read like a scientific report or a standard weather report.
- It must NEVER sound like a meteorological analysis or contain lists of data points or observations.
- Do NOT describe weather measurements or mention instrument recordings.
- The weather data (temperature, rain, snow, wind) must influence the narrative but should rarely appear as numbers. Use numbers only when absolutely necessary. Do not include raw stats or metrics, and if numbers are used, limit them to a single natural reference (e.g., "reaching a soft high around 20°C").
- Instead of raw data, describe what people in the city would have seen, felt, or noticed in the city environment:
  - Focus on: sky, light, clouds, rain, air, streets, parks, rooftops, architecture, local scenery, traffic, windows, and overall seasonal character.
  - The goal is to make the reader feel like they are stepping into that day, observing the quiet flow of life and atmosphere, preserving the memory of a day, not documenting weather observations.

FORBIDDEN PATTERNS & CLICHÉS:
You are STRICTLY FORBIDDEN from using any of the following phrases (or their Spanish equivalents):
- "recorded a maximum temperature" / "se registró una temperatura máxima"
- "minimum temperature" / "temperatura mínima"
- "wind speed reached" / "la velocidad del viento alcanzó"
- "visibility remained" / "la visibilidad permaneció"
- "humidity levels" / "niveles de humedad"
- "precipitation maintained" / "precipitación se mantuvo"
- "meteorological station" / "estación meteorológica"
- "weather conditions were" / "las condiciones climáticas eran" / "las condiciones del clima eran"
- any sentence that sounds like a scientific summary or technical meteorology report.

No emotional parenting, baby-centric, or family clichés are allowed (e.g. holding, cuddles, newborn fragrance, etc.). This is about the city and its skies.

A list of examples of good vs. bad style:
- BAD: "The meteorological station recorded a maximum temperature of 24°C."
  GOOD: "Warm June air settled over the city as clouds drifted slowly across the afternoon sky."
- BAD: "Wind speed reached 13.5 km/h."
  GOOD: "A gentle breeze moved through the streets and carried the scent of recent rain."
- BAD: "Visibility remained moderate."
  GOOD: "Distant buildings faded softly into the gray horizon."

HISTORICAL WEATHER DATA FOR YOUR REFERENCE (To influence, not to list as raw numbers):
- Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
- Weather condition: ${weatherText} (weatherCode ${weatherCode})
- Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
- Date: ${targetDate}
- City: ${city} (Region: ${region || 'None'}, Country: ${country})

THE BIRTH FACT (Gently Connecting Weather and Birth):
- The narrative must end with exactly one final sentence that gently connects the weather archive to the birth.
- The final sentence must read exactly or be styled very closely as:
  * In English: "Among all the ordinary moments of that day, one small arrival would make the date unforgettable for a family."
  * In Spanish: "Entre todos los momentos ordinarios de aquel día, una pequeña llegada haría que la fecha fuera inolvidable para una familia."
- The final sentence must be warm, memorable, and human, but never sentimental, emotional, or overly dramatic.
- Do NOT mention hearts, blessings, miracles, destiny, gratitude, or life-changing moments.
- This is the ONLY permitted reference to the birth, child, or family, appearing exactly once as the final sentence of the story.
- Minimum 90% of the story must be about the day itself and city atmosphere, with this final sentence delivering the gentle connection at the end.

STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
- THEME (TITLE): If the weather is rainy, the theme title MUST be exactly "A Rainy Afternoon" (or "Una jornada de lluvia" in Spanish). Otherwise, generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}"). No time-of-day reference in theme unless specified by the record.
- QUOTE: Generate a separate, short, memorable quote of exactly 1 sentence. This quote must describe ONLY the weather, sky, clouds, rain, snow, sunlight, wind, or seasonal atmosphere. It must NEVER mention any human elements, relationships, birth, or sentiments.

STRICT LANGUAGE REQUIREMENT:
- The requested language is: "${language}".
- Write "theme", "quote", and "story" purely in "${language}" as a native speaker would, avoiding translation stiffness or hybrid terms.

${timeOfDepartureRule}

Response JSON Schema (Keep exactly unchanged):
Output a JSON object containing:
- theme: string (3-6 words, weather-based, factual title)
- quote: string (exactly 1 short, simple, memorable sentence about weather only)
- story: string (the completed narrative weather archive record, strictly between 80 and 120 words formatted as a single paragraph containing exactly the required birth mention at the end)
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
  let apiFallbackLabel = "API_FORBIDDEN_BACKUP";

  while (attempts < maxAttempts) {
    try {
      console.log(`Querying Gemini (Attempt ${attempts + 1}) for story in ${language}...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate an atmospheric historical weather archive record centered 80-90% on weather conditions, seasonal details, and city atmosphere, with only the allowed factual birth mention. Ensure it is third-person factual and has absolutely zero emotional words or family mentions. Follow the system instruction for ${city}, ${country} (${region || ""}) on ${targetDate}.`,
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
          temperature: 0.2,
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
    } catch (err: any) {
      console.error("Gemini API call error during attempt " + (attempts + 1) + ":", err);
      const status = err?.status || err?.statusCode || err?.code;
      const msg = String(err?.message || err || "").toUpperCase();
      if (status === 503 || msg.includes("UNAVAILABLE") || msg.includes("HIGH DEMAND")) {
        apiFallbackLabel = "API_HIGH_DEMAND_FALLBACK";
      } else if (status === 403 || msg.includes("FORBIDDEN") || msg.includes("PERMISSION DENIED")) {
        apiFallbackLabel = "API_FORBIDDEN_BACKUP";
      } else if (status === 429 || msg.includes("QUOTA")) {
        apiFallbackLabel = "API_QUOTA_FALLBACK";
      } else {
        apiFallbackLabel = "API_GEMINI_ERROR_FALLBACK";
      }
    }
    attempts++;
  }

  let useBackup = true;
  let finalResponseData: any = null;

  if (finalJson) {
    let finalStory = finalJson.story;
    if (!birthTime) {
      finalStory = makeStoryTimeNeutral(finalStory, lang === "es" ? "es" : "en");
    }

    // Final backend sanitizer check for forbidden parent/relationship concepts
    const forbiddenPhrases = [
      "your arrival", "holding you", "our room", "first cuddle", "our hearts",
      "sacred moment", "sweet scent", "our world", "welcome into the world",
      "life-changing", "we will carry", "pure warmth", "everything changed",
      "you were born", "your birth", "we held", "we watched", "pure joy",
      "peaceful moment", "our hearts forever", "tu llegada", "bienvenida al mundo",
      "cambió nuestras vidas", "primer abrazo", "primer arrullo", "compañía",
      "abrazarte", "nuestra habitación", "nuestro cuarto", "nuestros corazones",
      "momento sagrado", "dulce aroma", "nuestro mundo", "calidez pura",
      "todo cambió", "te sostuvimos", "momento hermoso", "nuestros corazones para siempre"
    ];

    // "arrival" is treated as a neutral historical birth reference and should not trigger parenting/emotion rejection.
    // "llegada" is also treated as its neutral Spanish equivalent.
    const forbiddenWords = [
      "welcome", "our", "we", "us", "your", "holding", "cuddle", "joy",
      "relief", "hearts", "room", "sacred", "miracle", "precious", "universe", "changed", "forever",
      "bienvenida", "nuestro", "nuestra", "nuestros", "nuestras", "nosotros", "nosotras",
      "nos", "tu", "tus", "tuyo", "tuya", "tuyos", "tuyas", "alegría", "alivio", "corazón", "corazones",
      "milagro", "milagros", "habitación", "cuarto", "universo", "cambió", "siempre"
    ];

    let hasForbidden = false;
    const finalStoryLower = finalStory.toLowerCase();
    
    // Check phrases
    for (const phrase of forbiddenPhrases) {
      if (finalStoryLower.includes(phrase)) {
        hasForbidden = true;
        console.warn(`[FORBIDDEN PHRASE MATCHED]: "${phrase}" in story: ${finalStory}`);
        break;
      }
    }

    // Check individual words with word boundaries by splitting
    if (!hasForbidden) {
      const cleanWordList = finalStoryLower.replace(/[^a-zñáéíóúü]/gi, " ").split(/\s+/);
      for (const word of forbiddenWords) {
        if (cleanWordList.includes(word)) {
          hasForbidden = true;
          console.warn(`[FORBIDDEN WORD MATCHED]: "${word}" in story: ${finalStory}`);
          break;
        }
      }
    }

    if (!hasForbidden) {
      useBackup = false;
      finalResponseData = {
        theme: finalJson.theme,
        quote: finalJson.quote,
        story: finalStory,
        quality_check: finalJson.quality_check,
        debug_source: "api_gemini_clean",
        prompt_version: "historical_archive_v1",
        generator_path: "api_generate_story"
      };
    } else {
      console.warn("Discarding Gemini story due to forbidden parenting/emotion phrases in final state. Falling back to high-quality offline backup.");
    }
  }

  if (!useBackup && finalResponseData) {
    res.status(200).json(finalResponseData);
  } else {
    console.log("Executing high-quality offline backup generator with birthTime=" + birthTime);
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
    res.status(200).json({
      theme: backupResult.theme,
      quote: backupResult.quote,
      story: finalBackupStory.trim(),
      isFallback: true,
      debug_source: apiFallbackLabel,
      prompt_version: "historical_archive_v1",
      generator_path: "api_generate_story",
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
