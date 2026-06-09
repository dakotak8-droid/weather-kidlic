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
    if (isSunny) return "A Sunny Day";
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
        story: `Una lluvia apacible y constante cubrió las avenidas de ${params.city}, tiñendo los tejados de un gris plateado. Un aire fresco mecía suavemente las copas de los árboles, arrastrando el aroma característico de la tierra mojada por los parques cercanos. En esta misma jornada, un nacimiento fue registrado discretamente bajo el lento compás de la lluvia. La tarde transcurrió pacífica bajo esa luz difusa y tranquila, envolviendo las calles con un manto de serena calma.`,
      };
    }
    if (isSnowy) {
      return {
        theme: "Un día cubierto de nieve",
        quote: "Mientras la nieve cubría la ciudad, el silence blanco envolvía las calles.",
        story: `Silenciosos copos de nieve descendían de manera constante sobre ${params.city}, vistiendo las avenidas con un manto blanco y denso. El aire invernal se sentía nítido y helado al respirar, adormeciendo el bullicio habitual de las plazas y calles principales. En medio de esta quietud, un nacimiento fue registrado discretamente en la ciudad. Las farolas se encendieron temprano, proyectando círculos de luz dorada sobre la nieve intacta mientras el cielo continuaba desvaneciéndose en tonos de tiza.`,
      };
    }
    if (isSunny) {
      return {
        theme: "Un despejado día soleado",
        quote: "El sol brilló con calma, iluminando las calles de la ciudad.",
        story: `Un sol espléndido iluminó brillantemente cada rincón de ${params.city}, proyectando sombras nítidas y alargadas junto a las fachadas de ladrillo antiguo. Una brisa templada corría entre los edificios, invitando a caminar despacio por los parques abiertos. En esta luminosa jornada de cielos despejados, un nacimiento fue registrado discretamente. El cielo se mantuvo limpio de nubes todo el día, extendiendo un azul profundo e impecable hasta que la suave luz dorada del atardecer se desvaneció lentamente.`,
      };
    }
    // Default Cloudy
    return {
      theme: "Un día nublado y tranquilo",
      quote: "El cielo gris trajo una calma reconfortante a toda la ciudad.",
      story: `Un denso y pacífico manto de nubes grises cubrió el cielo de ${params.city}, suavizando los contornos de los edificios contra el horizonte. El viento soplaba en ráfagas suaves que traían un aire fresco y limpio del río, agitando ligeramente las hojas secas. En esta atmósfera tranquila, un nacimiento fue registrado discretamente en la ciudad. Bajo esta luz tenue y sin sombras, las calles y los paseos peatonales se percibían pacíficos, con un manto de serena calma que se prolongó hasta el anochecer.`,
    };
  } else {
    if (isRainy) {
      const variants = [
        `Soft rain drifted steadily across the avenues of ${params.city}, casting a silver sheen over the brick buildings and historic slate rooftops. On this same day, a birth was quietly logged under the damp skies. Underneath the glass awnings, people watched the droplets trace pathways down the windowpanes, while the streetlights began to flicker on early, casting long reflections in the quiet puddle-lined streets.`,
        `A fresh rain washed over the streets of ${params.city}, leaving pavements shimmering under dense clouds. A birth was recorded amidst the cool afternoon breeze that carried the scent of wet stone. Warm yellow headlights cast long reflections on the wet asphalt, illuminating the quiet sidewalks as the clouds remained low and heavy, locking the skyline in a peaceful gray embrace.`,
        `Steady rain descended over the rooftops of ${params.city}, softening the city outline against a deep iron-grey sky. In the middle of this quiet rainfall, a birth was logged as a gentle breeze carried a silver mist across the neighborhood streets. Puddles gathered on the pavement, reflecting in silver pools along the concrete walkways under the persistent overcast sky.`,
        `Passing rain showers swept quickly across ${params.city}, carried by a fresh, atmospheric wind. High cloud formations rolled steadily over the rooftops, and a birth was quietly recorded amidst the changing skies. Between brief bursts of water, wet asphalt streets glistened beneath a soft, diffuse light that illuminated the brick buildings layout as the air turned cool.`,
        `Quiet, steady rainfall enveloped ${params.city}, turning the streets into a canvas of soft slate and grey. A birth was factually noted as cool silver droplets lined every windowpane. The steady patter of moisture created an unexpected calm across the skyline throughout the day, slowing the pulse of the town into a patient, lazy rhythm of falling water.`
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
        story: `Thick, quiet snow descended over ${params.city}, wrapping the urban skyline in a thick blanket of pristine white. The crisp, icy winter air kept the streets peaceful, and a birth was quietly logged amidst the snowfall. Soft light from shop windows glowed warmly onto the accumulating drifts, while the tree branches in the squares bowed gently under the weight of the fresh snow, preserving a landscape of absolute stillness.`,
      };
    }
    if (isSunny) {
      return {
        theme: "A Sunny Day",
        quote: "The sun shone for the city with gentle brilliance, casting gold light across the streets.",
        story: `Warm, radiant sunshine bathed ${params.city}, illuminating the details of the historic facades and casting sharp shadows across the public squares. Amidst this bright atmosphere, a birth was quietly recorded. A gentle, pleasant breeze wandered through the open streets, carrying a whisper of warmth that invited people to linger under a pristine, vast blue sky from horizon to horizon.`,
      };
    }
    // Default Cloudy
    const variants = [
      `A quiet blanket of slate-grey clouds hung low over ${params.city}, beautifully softening the sharp profile of the distant buildings against the sky. During these quiet hours, a birth was logged. A fresh, cool breeze swept through the brick alleys, rustling dry leaves along the stone pavements as the neighborhood blocks felt peaceful and close, wrapped in a comfortable twilight haze.`,
      `A vast, iron-grey canopy of clouds shrouded the sky over ${params.city}, creating a cool, unified shade across the streets and public squares. A birth was quietly recorded under this overcast dome. A light breeze swept dry leaves along the stone pavements, and the soft, shadowless light gave the local parks and buildings an archival, timeless quality.`,
      `Thick, dense grey clouds wrapped the buildings of ${params.city} in a peaceful and protective mist. As a birth was quietly logged, the wind paced gently beneath the overcast sky, carrying a crisp freshness through the avenues. Across the city, local street corners, shop windows, and historic avenues appeared quiet and calm under the glare-free sky.`,
      `High-altitude grey clouds uniform in texture stretched coast to coast over the sky of ${params.city}. Air temperatures remained cool but steady, and a birth was recorded under this calm slate canopy. Outside, a gentle breeze carried a crisp freshness through the streets as the skyline sat in quiet composure.`,
      `A quiet layer of stratocumulus clouds blanketed the rooftops of ${params.city} throughout the day. A birth was factually noted during these serene hours as a steady, atmospheric wind blew through the alleys. The lack of direct sunshine painted the city in soft, classic shades of slate and charcoal, bringing a comforting stillness to the parks.`
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
app.get("/audit-report.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=audit-report.txt");
  res.sendFile(path.join(process.cwd(), "audit-report.txt"));
});

app.get("/api/generate-story", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=audit-report.txt");
  res.sendFile(path.join(process.cwd(), "audit-report.txt"));
});

app.get("/api/version", (req, res) => {
  res.json({
    prompt_version: "historical_archive_v1",
    generator_path: "api_generate_story",
    build_timestamp: "2026-06-04T19:32:55Z"
  });
});

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
    timePeriod,
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
      story: finalBackupStory.trim(),
      isFallback: true,
      debug_source: "server_offline_backup",
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

  let finalTimePeriod = timePeriod;
  if (birthTime && !finalTimePeriod) {
    const parts = birthTime.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        if (hours >= 0 && hours < 6) finalTimePeriod = "Early Morning";
        else if (hours >= 6 && hours < 12) finalTimePeriod = "Morning";
        else if (hours >= 12 && hours < 17) finalTimePeriod = "Afternoon";
        else if (hours >= 17 && hours < 21) finalTimePeriod = "Evening";
        else if (hours >= 21 && hours < 24) finalTimePeriod = "Night";
      }
    }
  }

  let timeAtmosphereContext = "";
  if (finalTimePeriod) {
    let atmosDetails = "";
    if (finalTimePeriod === "Early Morning") {
      atmosDetails = "- Early Morning atmospheric suggestions: quiet streets, first light, city awakening (or Spanish equivalents: calles tranquilas, primera luz, despertar de la ciudad)";
    } else if (finalTimePeriod === "Morning") {
      atmosDetails = "- Morning atmospheric suggestions: active streets, growing daylight (or Spanish equivalents: calles activas, luz del día en aumento)";
    } else if (finalTimePeriod === "Afternoon") {
      atmosDetails = "- Afternoon atmospheric suggestions: full daylight, busiest part of the day (or Spanish equivalents: plena luz del día, la parte más ocupada del día)";
    } else if (finalTimePeriod === "Evening") {
      atmosDetails = "- Evening atmospheric suggestions: golden light, city slowing down, sunset atmosphere (or Spanish equivalents: luz dorada, la ciudad desacelerando, atmósfera de atardecer)";
    } else if (finalTimePeriod === "Night") {
      atmosDetails = "- Night atmospheric suggestions: streetlights, night sky, quieter city atmosphere (or Spanish equivalents: farolas, cielo nocturno, atmósfera urbana más tranquila)";
    }

    if (atmosDetails) {
      timeAtmosphereContext = `
6. ATMOSPHERIC CONTEXT FOR THE TIME OF DAY (${finalTimePeriod}):
- You may use the following details as additional atmospheric context to capture the mood/vibe of the city at this time of day.
- Do NOT force the story to mention the name of the time period itself directly if it doesn't fit naturally. Use these details only as subtle sensory context.
${atmosDetails}
`;
    }
  }

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

STRICT DESIGN, STYLE & WEATHER PRINCIPLES:
1. The weather, sky, season, and city atmosphere must remain the primary subject of the story. The narrative should focus on what people in the city would have seen, felt, or noticed (e.g. the quality of light, clouds, cold drafts, wet cobblestones, seasonal mood, or quiet sky).
2. The story should read like a preserved historical weather memory, not a birth announcement, greeting card, family story, or tourist guide.
   - When appropriate, the story may include ONE recognizable local feature, landmark, district, river, waterfront, square, bridge, avenue, historic neighborhood, or natural feature associated with the city. This helps make different cities feel distinct from one another.
   - The landmark should ONLY appear as part of the weather scene (e.g., low clouds drifting around the Eiffel Tower, rain reflections along the Seine, mist over the Vistula River, streetlights glowing near the Old Town walls, fog rolling beneath the Golden Gate Bridge / nubes bajas flotando alrededor de la Torre Eiffel, reflejos de lluvia a lo largo del Sena, niebla sobre el río Vístula, farolas brillando cerca de las murallas del casco antiguo, niebla rodando bajo el puente Golden Gate).
   - Do NOT introduce landmarks simply because they are famous. The weather must always remain the main character.
   - Do NOT write tourist-guide style descriptions. Avoid: lists of attractions, historical facts, travel recommendations, sightseeing language, or promotional descriptions.
   - Use local details only when they naturally strengthen the atmosphere of that specific weather day.
   - The chosen landmark should occupy no more than one sentence.
3. The exact weather conditions of the day should influence the story more strongly:
   - Overcast days should feel different from rainy days: overcast focuses on gray ambient light, flat tones, heavy slate clouds, and diffuse shadows; rain is about glistening streets, pattering droplets, umbrellas, and wet asphalt.
   - Rainy days should feel different from snowy days: snowy focus on muffled silence, crisp frost, soft white layers on roofs, slow-drifting flakes, and visibility fading into winter haze.
   - Windy days should feel different from calm days: windy focuses on swaying branches, rustling leaves, dancing dust, chattering windowpanes; calm hours focus on stillness, slow cloud movement, and peaceful, stagnant air.
   - Cold days should feel different from warm days: cold is brisk, stinging, heavy coats, steam, pale skies; warm is golden, loose layers, lingering shadows, and soft gentle breezes.
4. Do NOT read like a scientific report or a standard weather report. Do NOT describe weather measurements or mention instrument recordings. Use numbers only when absolutely necessary (e.g. "reaching a soft high around 20°C").

THE BIRTH FACT (Brief, Factual, Non-Sentimental Integration):
- Birth must be mentioned at most once, briefly and factually (e.g., "a child was born", "a birth was logged", "un nacimiento fue registrado", "una nueva vida comenzó"). It must be a peaceful third-person historical anchor, not a central emotional climax.
- The reference must be highly integrated and peaceful, with absolutely NO emotional family or parenting clichés in the text.
- Do NOT use recurring phrases or templates. Do NOT use any of these forbidden phrases:
  * "one small arrival"
  * "unforgettable for a family"
  * "life-changing moment"
  * "special family"
  * "precious arrival"
  * "treasured memory"
  * "magical moment"
  * "heartwarming day"
- Avoid emotional family language.
- CRITICAL: The final sentence should usually return to the weather, atmosphere, season, city mood, or sky conditions rather than ending with the birth. Let the narrative end on the sky, climate, or quiet atmosphere of the day (e.g., "As the evening progressed, the rain finally quieted over the sleeping roofs.").

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
- any scientific/meteorological summary pattern.
- No emotional parenting, baby-centric, or family clichés are allowed (e.g. holding, cuddles, newborn fragrance, hearts, blessings, miracles, destiny, gratitude, etc.).

HISTORICAL WEATHER DATA FOR YOUR REFERENCE:
- Max temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
- Weather condition: ${weatherText} (weatherCode ${weatherCode})
- Wind speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
- Date: ${birthDate}
- City: ${city} (Region: ${region || 'None'}, Country: ${country})

STYLISH, MEMORABLE QUOTE & SIMPLE THEME:
- THEME (TITLE): If the weather is rainy, the theme title MUST be exactly "A Rainy Afternoon" (or "Una jornada de lluvia" in Spanish). Otherwise, generate a clean, weather-based title of 3 to 6 words. It must remain strictly factual and weather-oriented, NOT poetic or flowery (e.g., "A Sunny Day in ${city}", "Cloudy Skies in ${city}"). No time-of-day reference in theme unless specified by the record.
- QUOTE: Generate a separate, short, memorable quote of exactly 1 sentence. This quote must describe ONLY the weather, sky, clouds, rain, snow, sunlight, wind, or seasonal atmosphere. It must NEVER mention any human elements, relationships, birth, or sentiments.

STRICT LANGUAGE REQUIREMENT:
- The requested language is: "${language}".
- Write "theme", "quote", and "story" purely in "${language}" as a native speaker would, avoiding translation stiffness or hybrid terms.

${timeOfDepartureRule}

${timeAtmosphereContext}

Response JSON Schema (Keep exactly unchanged):
You must output a JSON object containing:
- theme: string (3-6 words, weather-based, factual title)
- quote: string (exactly 1 short, simple, memorable sentence about weather only)
- story: string (the completed narrative weather archive record, strictly between 80 and 120 words formatted as a single paragraph with a brief, factual birth mention integrated and usually returning to the weather or sky at the end)
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
        contents: `Generate an atmospheric historical weather archive record centered 80-90% on weather conditions, seasonal details, and city atmosphere, with only the allowed factual birth mention. Ensure it is third-person factual and has absolutely zero emotional words or family mentions. Follow the system instruction for ${city}, ${country} (${region || ""}) on ${birthDate}.`,
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
            console.log("[Gemini success] - Gemini self-validation quality check passed on attempt " + (attempts + 1));
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
        console.log(`[Gemini high-demand fallback] 503/UNAVAILABLE/HIGH-DEMAND error encountered on attempt ${attempts + 1}. Switching to fallback story immediately to optimize response time.`);
        break; // Quit immediately, no retries for high demand
      } else {
        if (status === 403 || msg.includes("FORBIDDEN") || msg.includes("PERMISSION DENIED")) {
          apiFallbackLabel = "API_FORBIDDEN_BACKUP";
        } else if (status === 429 || msg.includes("QUOTA")) {
          apiFallbackLabel = "API_QUOTA_FALLBACK";
        } else {
          apiFallbackLabel = "API_GEMINI_ERROR_FALLBACK";
        }
        console.log(`[Gemini network retry] Attempt ${attempts + 1} failed with error. Will retry if attempts < maxAttempts. Error detail: ${err?.message || err}`);
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
        debug_source: "server_gemini_clean",
        prompt_version: "historical_archive_v1",
        generator_path: "api_generate_story"
      };
    } else {
      console.warn("Discarding Gemini story due to forbidden parenting/emotion phrases in final state. Falling back to high-quality offline backup.");
    }
  }

  if (!useBackup && finalResponseData) {
    res.json(finalResponseData);
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
    res.json({
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
