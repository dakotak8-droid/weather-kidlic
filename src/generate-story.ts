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

function safeParseGeminiJson(raw: string): any {
  if (!raw || typeof raw !== "string") return null;

  let cleaned = raw.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse Gemini JSON. Raw response:", raw);
    console.error("Cleaned Gemini JSON attempt:", cleaned);
    return null;
  }
}

// -------------------------------------------------------------
// SECURE BACKUP STORIES GENERATOR (Meets all rules and avoids clichés)
// -------------------------------------------------------------
const CITY_FEATURES_DB: Record<string, { en: string[]; es: string[] }> = {
  "warsaw": {
    en: ["the Vistula River's quiet banks", "the cobblestones of the historic Old Town"],
    es: ["las quietas orillas del río Vístula", "los adoquines del casco antiguo histórico"]
  },
  "oslo": {
    en: ["the misty Oslofjord waterfront", "the quiet lanes near the bustling harbor"],
    es: ["la brumosa orilla del fiordo de Oslo", "las tranquilas calles cerca del puerto"]
  },
  "paris": {
    en: ["the banks of the Seine", "the sweeping grand boulevards"],
    es: ["las orillas del Sena", "los amplios bulevares de la ciudad"]
  },
  "lisbon": {
    en: ["the wide Tagus River", "the steep, historic alleys of Alfama"],
    es: ["el ancho río Tajo", "los empinados callejones históricos de Alfama"]
  },
  "toronto": {
    en: ["the serene horizon of Lake Ontario", "the bustling downtown districts"],
    es: ["el sereno horizonte del lago Ontario", "los animados distritos del centro"]
  },
  "sydney": {
    en: ["the shimmering waters around the Harbour", "the historic circular lanes of Circular Quay"],
    es: ["las brillantes aguas del puerto", "los senderos de Circular Quay"]
  },
  "new york": {
    en: ["the wooded paths of Central Park", "the cold breeze sweeping the Hudson River"],
    es: ["los arbolados senderos de Central Park", "la fría brisa que barría el río Hudson"]
  },
  "london": {
    en: ["the flowing currents of the Thames", "the stone arches of the historic bridges"],
    es: ["las corrientes del río Támesis", "los arcos de piedra de los puentes históricos"]
  },
  "tokyo": {
    en: ["the peaceful waters of the Sumida River", "the modern avenues near the historic temple gates"],
    es: ["las tranquilas aguas del río Sumida", "las modernas avenidas cerca de los templos antiguos"]
  },
  "berlin": {
    en: ["the slow-moving Spree River", "the leafy paths of Tiergarten"],
    es: ["el lento discurrir del río Spree", "los arbolados senderos de Tiergarten"]
  },
  "madrid": {
    en: ["the grand sidewalks of Gran Vía", "the quiet shaded walks of Retiro Park"],
    es: ["las amplias aceras de la Gran Vía", "los paseos sombreados del Parque del Retiro"]
  },
  "barcelona": {
    en: ["the lively avenues of the Ramblas", "the soft breeze off the Mediterranean shore"],
    es: ["las animadas avenidas de las Ramblas", "la suave brisa de la costa del Mediterráneo"]
  },
  "rome": {
    en: ["the slow currents of the Tiber River", "the solemn vistas of ancient ruins"],
    es: ["las lentas corrientes del río Tíber", "las solemnes vistas de las ruinas antiguas"]
  },
  "amsterdam": {
    en: ["the concentric layers of historic canals", "the quiet arched bridges and narrow brick lanes"],
    es: ["los canales concéntricos del centro histórico", "los pacíficos puentes de arco y callejones de ladrillo"]
  },
  "chicago": {
    en: ["the vast horizon of Lake Michigan", "the cold wind gusts channeled by tall skyscrapers"],
    es: ["el vasto horizonte del lago Michigan", "las frescas corrientes de viento entre los rascacielos"]
  },
  "boston": {
    en: ["the sweeping paths along the Charles River", "the historic brick sidewalks of the old districts"],
    es: ["los senderos a lo largo del río Charles", "las aceras de ladrillo del casco histórico"]
  },
  "san francisco": {
    en: ["the sweeping fog near the Golden Gate", "the steep streets looking over the bay"],
    es: ["la densa niebla cerca del Golden Gate", "las empinadas calles con vistas a la bahía"]
  },
  "seoul": {
    en: ["the wide banks of the Han River", "the quiet courtyard walls of the historic palace"],
    es: ["las amplias orillas del río Han", "los tranquilos muros del palacio histórico"]
  },
  "mexico city": {
    en: ["the massive public plazas of the Zócalo", "the tree-lined avenues of Paseo de la Reforma"],
    es: ["la enorme plaza pública del Zócalo", "las arboladas avenidas del Paseo de la Reforma"]
  },
  "buenos aires": {
    en: ["the wide shores of Río de la Plata", "the historic, cobbled avenues of San Telmo"],
    es: ["las amplias costas del Río de la Plata", "las históricas avenidas empedradas de San Telmo"]
  },
  "santiago": {
    en: ["the quiet banks of the Mapocho River", "the cool breezes coming off the Andean peaks"],
    es: ["las tranquilas orillas del río Mapocho", "las frescas brisas de la cordillera andina"]
  },
  "bogota": {
    en: ["the misty green ridges of the Monserrate hills", "the old cobblestones of the colonial sector"],
    es: ["las brumosas laderas de los cerros de Monserrate", "los viejos adoquines del barrio colonial"]
  }
};

function getSeed(city: string, date: string, weatherCode: number): number {
  const str = `${city.toLowerCase()}_${date}_${weatherCode}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCityFeatures(city: string, lang: "en" | "es", seed: number): { primary: string; secondary: string } {
  const normalized = city.trim().toLowerCase();
  if (CITY_FEATURES_DB[normalized]) {
    const list = CITY_FEATURES_DB[normalized][lang];
    return {
      primary: list[0],
      secondary: list[1],
    };
  }

  const genericEn_A = [
    "the historic central avenues",
    "the peaceful public squares",
    "the local neighborhood streets",
    "the ancient town hall plazas",
    "the central green parks"
  ];
  const genericEn_B = [
    "the local riverfront trails",
    "the classic brick facades",
    "the stone-paved walkways",
    "the quiet residential quarters",
    "the sweeping municipal gardens"
  ];

  const genericEs_A = [
    "las avenidas centrales históricas",
    "las tranquilas plazas del centro",
    "los callejones del barrio antiguo",
    "las plazas del ayuntamiento",
    "los prados del parque municipal"
  ];
  const genericEs_B = [
    "los paseos junto al río local",
    "las fachadas de ladrillo antiguo",
    "los senderos empedrados de la zona",
    "los tranquilos barrios residenciales",
    "los jardines y paseos públicos"
  ];

  if (lang === "es") {
    return {
      primary: genericEs_A[seed % genericEs_A.length],
      secondary: genericEs_B[(seed + 3) % genericEs_B.length]
    };
  } else {
    return {
      primary: genericEn_A[seed % genericEn_A.length],
      secondary: genericEn_B[(seed + 3) % genericEn_B.length]
    };
  }
}

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

  const seed = getSeed(params.city, params.birthDate, params.weatherCode);
  const { primary, secondary } = getCityFeatures(params.city, params.lang, seed);
  const quoteIndex = seed % 8;
  const storyIndex = seed % 4;

  if (params.lang === "es") {
    let theme = "Un día nublado y tranquilo";
    let quotes: string[] = [];
    let stories: string[] = [];

    if (isRainy) {
      theme = "Una jornada de lluvia";
      quotes = [
        "La lluvia cayó suavemente, como si la ciudad se hubiera detenido por un momento.",
        "Gotas plateadas dibujaron caminos delicados y silenciosos en los viejos cristales.",
        "El susurro de la lluvia sobre los tejados de pizarra trajo una calma rítmica a las avenidas.",
        "Los pavimentos relucientes reflejaban el gris suave y fresco de las nubes persistentes.",
        "Una ligera humedad flotaba en el aire, envolviendo los edificios de ladrillo en una fina bruma.",
        "La lluvia mansa aquietó el ajetreo habitual, transformando las calles en lienzos húmedos.",
        "El frío húmedo se asentó bajo los arcos de piedra mientras el día se disolvía en llovizna.",
        "Se formaron ondas en los charcos crecientes, atrapando la luz difusa de un cielo encapotado."
      ];
      stories = [
        `El clima de esta fecha en ${params.city} estuvo marcado por una lluvia constante y apacible que cubrió los tejados y las brillantes calles de piedra. Gotas plateadas se acumularon en ${primary} y formaron charcos cerca de ${secondary}, reflejando el cielo gris plomo. Un viento persistente de ${params.windSpeed} km/h mecía las ramas húmedas de los árboles públicos. En medio de este compás tranquilo, un nacimiento fue registrado discretamente en los archivos oficiales. Mientras la tarde se disolvía en un suave crepúsculo, la lluvia continuó cayendo en calma, cerrando el día con una escena de serena quietud.`,
        `Una lluvia fresca barrió las avenidas de ${params.city}, vistiendo las fachadas de ladrillo con un resplandor húmedo y reflectante. Densas nubes oscuras se asentaron sobre ${primary}, mientras el aire fresco de la atmósfera circulaba suavemente cerca de ${secondary}. Durante estas horas templadas y silenciosas, un nacimiento fue registrado de manera fáctica en los registros locales. Las farolas de la calle comenzaron a brillar temprano sobre los charcos, y la jornada regresó al sonido tranquilizador de las gotas sobre los tejados, manteniendo el perfil urbano bajo un manto de paz húmeda.`,
        `La llovizna y los chubascos constantes envolvieron a ${params.city}, suavizando los contornos del horizonte urbano. Una lluvia plateada cayó de manera constante, acumulándose en charcos a lo largo de ${primary} y cubriendo los paseos abiertos de ${secondary}. En el corazón silencioso de este día húmedo, un nacimiento fue anotado brevemente y sin sentimentalismos, mientras el viento soplaba a ${params.windSpeed} km/h. Fuera, el tintineo de la lluvia ralentizó el ritmo de la ciudad, dejando las calles tranquilas, descansando bajo un cielo de pizarra uniforme.`,
        `Una corriente fresca y húmeda recorrió las calles de ${params.city}, tiñendo los peldaños y pasajes de tonos grises y brillantes. El agua de lluvia lavó ${primary}, mientras una bruma vaporosa avanzaba en silencio por ${secondary}. En medio de esta quietud, un nacimiento fue registrado de manera discreta en las crónicas históricas. Los rincones locales permanecieron tranquilos y sin reflejos a medida que avanzaba la jornada, hasta que los chubascos finalmente amainaron, dejando solo una persistente brisa fresca y el lento navegar de las nubes grises.`
      ];
    } else if (isSnowy) {
      theme = "Un día cubierto de nieve";
      quotes = [
        "Mientras la nieve cubría la ciudad, el silencio blanco envolvía las calles.",
        "Copos lentos convirtieron las concurridas plazas en santuarios silenciosos de color blanco.",
        "La ráfaga invernal y nítida transportaba el peso silencioso de la nieve recién caída.",
        "Una quietud blanca se posó en los tejados, difuminando los contornos en la distancia.",
        "Bajo el cielo helado, las calles descansaban bajo un manto inmaculado y cristalino.",
        "Luces doradas brillaban con suavidad a través de la danza de copos blancos.",
        "Un silencio tembloroso gobernaba las plazas, roto únicamente por el susurro del invierno.",
        "Capas prístinas de blanco redibujaron los monumentos, proyectando una luz sin sombras."
      ];
      stories = [
        `Copos silenciosos de nieve cayeron densamente sobre ${params.city}, vistiendo las calles con una quietud blanca e inmaculada. El aire frío y puro recorrió los senderos, cubriendo las ramas a lo largo de ${primary} y acumulándose cerca de ${secondary}. Todo el paisaje descansó en un silencio invernal profundo. En medio de esta calma, un nacimiento fue registrado discretamente en el diario municipal. Al desvanecerse la breve tarde, las luces de los comercios proyectaron senderos dorados sobre la nieve intacta, mientras el cielo continuaba siendo una cúpula de marfil pálido.`,
        `El invierno reclamó las calles de ${params.city} mientras una nevada pacífica cubría las aceras y monumentos con un manto de terciopelo blanco. Vientos helados de ${params.windSpeed} km/h soplaban a lo largo de ${primary}, mientras cristales escarchados decoraban la fachada histórica de ${secondary}. En medio de esta transformación blanca, un nacimiento fue registrado discretamente en los archivos. Las pisadas se amortiguaban al instante en la nieve blanda, y la tarde avanzó en absoluto silencio, regresando al lento descender de los copos fríos bajo un cielo calmado.`,
        `Nubes invernales pesadas y lentas dejaron caer una nieve silenciosa sobre ${params.city}, suavizando las siluetas contra un cielo de tiza pálido. Los copos se acumularon en las repisas de ladrillo y los arcos antiguos, transformando ${primary} en un refugio de paz y cubriendo ${secondary}. En esta jornada de quietud blanca, un nacimiento fue anotado discretamente. Fuera, el resplandor dorado de las farolas proyectaba amplios halos sobre los caminos, y el silencio del crepúsculo se extendió en paz desde los tejados de la ciudad hasta el horizonte.`,
        `El tiempo se volvió helado y nítido mientras una suave bruma de invierno y copos de nieve flotaban sobre ${params.city}. La nieve se acumuló de manera constante, tendiendo una capa impecable sobre ${primary}, mientras vientos fríos soplaban alrededor de ${secondary}. En la quietud pacífica de este día congelado, un nacimiento fue anotado discretamente. El bullicio urbano se transformó en un sueño reparador, y el anochecer se asentó con calma, enmarcado por una luz plateada y fría y el lento navegar de nubes altas.`
      ];
    } else if (isSunny) {
      theme = "Un despejado día soleado";
      quotes = [
        "El sol brilló con calma, ilumindando las calles de la ciudad con un resplandor dorado.",
        "Una cúpula azul impecable se extendió en lo alto, dejando que una suave calidez llenara el aire.",
        "Rayos dorados iluminaron las fachadas históricas y templaron las aceras de piedra.",
        "Una brisa agradable y templada recorrió los callejones abiertos, trayendo calidez.",
        "Sombras nítidas se alargaron junto a los muros, dibujadas por un sol limpio y persistente.",
        "La luz brillante danzaba sobre las corrientes de agua y brillaba en las agujas metálicas.",
        "Una calma bañada por el sol se asentó en los parques, invitando a caminar despacio.",
        "Con horizontes limpios y un cielo radiante, la tarde se sentía amplia y resplandeciente."
      ];
      stories = [
        `El clima de esta fecha en ${params.city} fue radiante y magnífico, con un sol brillante que proyectaba sombras alargadas sobre las veredas de piedra. Rayos dorados bañaron ${primary} y resplandecieron en las estructuras históricas alrededor de ${secondary}. Una brisa tonificante de ${params.windSpeed} km/h aportaba frescura a los espacios abiertos. En medio de este día luminoso de cielos completamente despejados, un nacimiento fue registrado discretamente en las actas locales. La luz dorada permaneció largo tiempo en los muros antes de dar paso a un crepúsculo despejado y tranquilo.`,
        `Un despejado día hermoso se desplegó sobre ${params.city}, colmado de la suave calidez de un sol radiante. La cúpula celeste se extendió de horizonte a horizonte, iluminando ${primary} y aportando una definición impecable a la arquitectura de ${secondary}. Un nacimiento fue anotado discretamente en las crónicas locales bajo este cielo limpio. Un viento suave llevó el aire fresco de la estación por los paseos arbolados, y el día concluyó mientras los tonos de la puesta de sol pintaban un degradado de ámbar sobre la ciudad tranquila.`,
        `La luz solar inundó las avenidas de ${params.city}, templando los ladrillos históricos y las plazas abiertas. La luz clara destellaba sobre ${primary} e iluminaba los senderos de ${secondary}, creando un juego de sombras nítidas. Bajo este dosel azul, un nacimiento fue registrado discretamente como un ancla histórica pacífica. A medida que avanzaba la tarde, la brisa disminuyó, dejando la ciudad bajo un cálido resplandor dorado que se desvaneció con gracia hacia una noche estrellada y fresca.`,
        `Un cielo agradable y soleado dominó el tiempo en ${params.city}, trayendo una calidez brillante a las calles. Los suaves rayos del sol iluminaron ${primary} y templaron los bancos de piedra de ${secondary}, mientras una ligera corriente de ${params.windSpeed} km/h mantenía el aire fresco. En medio de esta atmósfera clara, un nacimiento fue registrado silenciosamente. La tarde se sintió amplia y en calma, sin una sola nube a la vista, concluyendo con una suave brisa al atardecer que dejó a la ciudad en una quietud dorada.`
      ];
    } else {
      theme = "Un día nublado y tranquilo";
      quotes = [
        "Una tranquila capa de nubes altas y uniformes suavizó cada rincón de la ciudad.",
        "Tonos fríos de crepúsculo difuso tiñeron el horizonte de color ceniza y pizarra.",
        "El pesado cielo plateado cubrió con un silencio protector los barrios históricos.",
        "Una brisa firme y atmosférica cruzaba las plazas mientras las nubes navegaban altas.",
        "La luz tenue y sin reflejos revelaba la textura atemporal de los edificios antiguos.",
        "Nubes estratocúmulos se extendían grises y planas de horizonte a horizonte.",
        "Un nublado apacible con aire otoñal fresco se asentó sobre las techumbres plateadas.",
        "La tarde vestía una capa gris y calma, serena en su composición de luz templada."
      ];
      stories = [
        `Un espeso y pacífico manto de nubes grises cubrió el cielo de ${params.city}, proyectando una sombra suave y uniforme sobre los pavimentos de piedra. Bajo este dosel sin reflejos, una brisa fresca corría a lo largo de ${primary} y soplaba suavemente cerca de ${secondary}. Las fachadas históricas tomaron un tono atemporal en la luz difusa de la tarde. Durante estas horas tranquilas, un nacimiento fue registrado discretamente en los archivos municipales. Fuera, la jornada transcurrió lenta y sin prisa, manteniendo la ciudad bajo una cómoda calma.`,
        `Nubes grises de gran altitud y textura uniforme cubrieron el cielo de ${params.city}, trayendo una quietud silenciosa a los barrios históricos. El viento sopló en ráfagas suaves de ${params.windSpeed} km/h a través de ${primary}, llevando aire fresco hacia ${secondary}. Bajo esta gran cúpula gris, un nacimiento fue registrado discretamente. Aunque no hubo lluvia, la densa capa de nubes suavizó cada sonido, permitiendo que la tarde se deslizara tranquilamente hacia un crepúsculo sereno que se asentó sobre los tejados.`,
        `Espesas y densas nubes cubrieron los edificios de ${params.city} con una sombra protectora y reconfortante. Una brisa mansa transportaba el fresco aire húmedo del río, fluyendo desde ${primary} hacia las esquinas tradicionales de ${secondary}. En medio de este clima templado y sin resplandores, un nacimiento fue anotado discretamente. Las avenidas y paseos peatonales descansaron bajo un cielo de pizarra uniforme, presentando una escena atemporal de tranquilidad que permaneció intacta al caer la noche.`,
        `Una tranquila capa de nubes estratocúmulos tapizó los tejados de ${params.city} durante todo el día, filtrando la luz en suaves tonos cenicientos. Un viento apacible de ${params.windSpeed} km/h recorrió los pasajes, agitando las hojas secas a lo largo de ${primary} y llevando frescura a ${secondary}. Un nacimiento fue registrado de manera fáctica bajo este cielo calmado. La tarde mantuvo su ritmo pausado y callado, ajeno a los brillos del sol, concluyendo en un crepúsculo cenizo que trajo paz absoluta a toda la ciudad.`
      ];
    }

    return {
      theme,
      quote: quotes[quoteIndex],
      story: stories[storyIndex]
    };
  } else {
    let theme = "A Quiet Cloudy Day";
    let quotes: string[] = [];
    let stories: string[] = [];

    if (isRainy) {
      theme = "A Rainy Afternoon";
      quotes = [
        "The rain fell softly, as if the city had paused for a moment.",
        "Silver droplets traced delicate, silent paths down the old storefront panes.",
        "The sound of rain on slate rooftops brought a rhythmic calm to the avenues.",
        "Glistening pavements reflected the soft, cool gray of the persistent clouds.",
        "A light moisture hung in the air, wrapping the tall brick buildings in a quiet mist.",
        "The falling rain quieted the usual rush, turning the streets into wet charcoal drawings.",
        "Cool dampness settled over the stone arches as the day dissolved into gentle rain.",
        "Ripples formed in the rising pools, catching the diffuse light of an overcast sky."
      ];
      stories = [
        `The weather on this date in ${params.city} was defined by a steady, soothing rainfall that coated the rooftops and glistening stone lanes. Silver droplets pooled along ${primary} and flowed into pools near ${secondary}, reflecting the deep, iron-grey sky. A persistent draft of ${params.windSpeed} km/h rustled the damp branches of the urban trees. Amidst the gentle rhythm of falling water, a birth was quietly logged in the archives. As the afternoon dissolved into a soft twilight, the rain continued to whisper against the windowpanes, ending on a scene of dark, quiet composure.`,
        `Fresh rain swept through the avenues of ${params.city}, washing the brick facades in a damp, reflective glow. Low-lying charcoal clouds settled over ${primary} while the cool air of the local atmosphere circulated gently near ${secondary}. A birth was factually entered into the local records during these cool, quiet hours. Warm streetlights soon glowed early on the watercourses, and the evening returned to the calming sound of droplets falling over rooftops, keeping the city's skyline locked in a serene and peaceful moisture.`,
        `Mist and steady showers enveloped ${params.city}, softening the sharp angles of the city skyline. Cool silver rain fell consistently, gathering in quiet pools along ${primary} and bathing the open walks of ${secondary} in high humidity. In the quiet core of this damp day, a birth was briefly logged without fanfare as wind currents blew at ${params.windSpeed} km/h. Outside, the steady patter of rainfall slowed the movement of the day, leaving the streets calm, resting silently under a sky of uniform slate and soft vapor.`,
        `A shivering current of fresh air and rain moved through ${params.city}, painting the stone steps and walkways in deep, glistening grays. Rainfall swept across ${primary},  while vaporous haze rolled quietly down ${secondary}. Amidst this profound atmospheric stillness, a birth was factually recorded in the historical archives. Local street corners sat peaceful and glare-free as the day wore on, until the showers finally thinned, leaving only a lingering wet breeze and the slow drift of dark, sailing clouds.`
      ];
    } else if (isSnowy) {
      theme = "A Snowy Winter Day";
      quotes = [
        "While snow carpeted the city outside, the streets fell into a quiet, frozen stillness.",
        "Slow-drifting flakes turned the bustling plazas into serene, white-muffled sanctuaries.",
        "The crisp winter draft carried the silent weight of freshly fallen snow.",
        "A white quiet settled over the roofs, fading the city's distant contours into mist.",
        "Under the frosted sky, streets rested beneath a flawless, crystalline white dust.",
        "Golden window lights glowed softly through the dance of slow, cold flakes.",
        "A shivering silence ruled the squares, broken only by the quiet hum of winter.",
        "Pristine layers of white reshaped the monuments, casting soft, shadowless light."
      ];
      stories = [
        `Quiet flakes of winter snow fell thickly across ${params.city}, dressing the streets in a pristine, white-muffled stillness. High, frosty air drifted through the passages, dusting the branches along ${primary} and accumulating softly near ${secondary}. The entire landscape rested in a shivering, peaceful hush. In the calm center of this hibernation, a birth was quietly logged in the municipal register. As the short afternoon faded, shop lights cast warm, long trails across the fresh powder, while the sky remained a calm, pale ivory dome.`,
        `Winter claimed the streets of ${params.city} as a quiet snowfall blanketed the stone paths and monuments in seamless, velvet white. Clear, biting cold drafts blew at ${params.windSpeed} km/h across ${primary}, while frosty crystals decorated the historic facade of ${secondary}. Amidst this silent white transformation, a birth was briefly recorded in the archives. Footsteps were instantly muffled by the fresh drifts, and the day progressed in absolute quietude, returning always to the slow, heavy descent of cold ivory flakes under a tranquil sky.`,
        `Heavy, slow-moving winter clouds dropped silent snow over ${params.city}, softening the city silhouettes against a pale tiza sky. Flakes accumulated on the brick ledges and historic archways, transforming ${primary} into a silent sanctuary and gathering along ${secondary}. On this secluded winter day, a child was born. Outside, yellow lantern glow cast warm halos over the accumulating white paths, and the silence of the winter dusk stretched peacefully from rooftops to the quiet horizon.`,
        `The weather turned cold and crisp as a heavy winter mist and soft snow drifted down upon ${params.city}. Pristine snow gathered steadily, laying a flawless white layer over ${primary} while shivering winds swept around ${secondary}. In the peaceful stillness of this frozen day, a birth was factually noted. The town's bustle quieted into a deep, comforting sleep, and the early evening settled with quiet poise, framed by cold silver light and the slow, peaceful drift of high winter clouds.`
      ];
    } else if (isSunny) {
      theme = "A Sunny Day";
      quotes = [
        "The sun shone for the city with gentle brilliance, casting gold light across the streets.",
        "A vast, flawless blue dome stretched above, letting a calm warmth fill the air.",
        "Golden beams illuminated the historic brick facades and warmed the stone sidewalks.",
        "A pleasant, temperate breeze wandered through open alleys, carrying a gentle warmth.",
        "Sharp shadows stretched alongside the walls, drawn by a clean, lingering afternoon sun.",
        "Bright light danced upon the water currents and gleamed off high metal spires.",
        "A gentle sun-drenched calm settled over the parks, inviting a slow, peaceful pace.",
        "With clear horizons and a brilliant sky, the afternoon felt expansive and bright."
      ];
      stories = [
        `The weather on this date in ${params.city} was bright and magnificent, with a brilliant sun casting long, golden shadows across the stone walk. Warm, radiant sunshine bathed ${primary} and gleamed upon the historic structures around ${secondary} under a spotless blue sky. A refreshing breeze of ${params.windSpeed} km/h brought a pleasant, comfortable current to the open spaces. In the midst of this bright and luminous day, a birth was quietly logged in the city records. The gold light lingered long on the walls before settling into a peaceful, clear twilight.`,
        `A magnificent, clear day unfolded across ${params.city}, filled with the soft warmth of a pristine sun. Bright sky stretched from horizon to horizon, illuminating ${primary} and bringing sharp, elegant definition to the architecture of ${secondary}. A birth was briefly entered in the local chronicles under these clear, happy skies. A gentle wind carried the crisp air of the season through the tree-lined walks, and the day ended as a beautiful sunset cast vast amber gradients over a quiet, peaceful city.`,
        `Sunlight poured over the avenues of ${params.city}, warming the historic bricks and the open plazas. Crisp, clear light sparkled off ${primary} and illuminated the pathways of ${secondary}, creating a vibrant play of shadows. Under this expansive, cloudless azure canopy, a birth was factually noted as a quiet historical anchor. As the temperate afternoon progressed, the breeze quieted, leaving the city in a serene golden glow that faded gracefully into a cool, starry, and peaceful night.`,
        `A pleasant, sunny sky dominated the weather in ${params.city}, bringing a brilliant warmth to the streets. The gentle rays of sun lit up ${primary} and warmed the stone benches of ${secondary}, while a light draft of ${params.windSpeed} km/h kept the air fresh. Amidst this clear, radiant atmosphere, a birth was quietly logged. The afternoon felt spacious and calm, without a cloud in sight, ending with a soft sunset breeze that left the town wrapped in quiet, golden-amber composure.`
      ];
    } else {
      theme = "A Quiet Cloudy Day";
      quotes = [
        "A quiet canopy of high, uniform clouds hung low, softening the city's sights.",
        "Cool, diffused twilight tones brushed the skyline in shades of slate and ash.",
        "The heavy silver sky held a protective silence over the historic quarters.",
        "A steady, atmospheric draft paced through the public squares as clouds sailed high.",
        "Dull, glare-free light revealed the raw, timeless texture of the stone buildings.",
        "Stratocumulus clouds stretched flat and gray from horizon to quiet horizon.",
        "A peaceful overcast hummed with cool air, settling over the slate roofs.",
        "The afternoon wore a calm, gray cloak, quiet and balanced in its cool composure."
      ];
      stories = [
        `A thick, calming layer of slate clouds rolled over the sky of ${params.city}, creating a quiet, unified shadow across the pavements. Under this glare-free canopy, a soft, cool draft swept along ${primary} and paced gently near ${secondary}. The stone facades and historic archways took on a timeless, archival character in the diffuse light. During these peaceful hours, a birth was quietly logged in the register. Outside, the steady, glare-free afternoon continued its slow, silent course, keeping the city landscape in a comforting, balanced repose.`,
        `High-altitude grey clouds uniform in texture stretched over the whole sky of ${params.city}, bringing a quiet stillness to the neighborhoods. The atmospheric wind blew in gentle ráfagas at ${params.windSpeed} km/h across ${primary}, carrying a crisp freshness through ${secondary}. Under this vast, peaceful dome, a birth was factually noted in the archives. No rain fell, but the dense grey canopy softened every sound, allowing the afternoon to drift calmly into a serene, dusk-like twilight that settled warmly over the rooftops.`,
        `Thick, dense grey clouds wrapped the buildings of ${params.city} in a protective, comforting shadow. The quiet breeze carried a cool air moisture, flowing from ${primary} to the historic corners of ${secondary}. In the middle of this peaceful, glare-free weather, a birth was quietly registered. The streets and public walkways sat under a calm, unified sky, presenting an elegant, timeless scene of urban serenity that remained undisturbed as the day turned slowly towards night.`,
        `A quiet layer of stratocumulus clouds blanketed the rooftops of ${params.city} throughout the day, filtering the sunlight into soft, ash-grey hues. A gentle wind of ${params.windSpeed} km/h blew through the passages, rustling leaves along ${primary} and carrying a cool breath to ${secondary}. A birth was briefly recorded under this tranquil overcast sky. The afternoon maintained its slow, silent rhythm, free of hurry or glare, ending in a beautiful, calm gray twilight that brought absolute peace to the city.`
      ];
    }

    return {
      theme,
      quote: quotes[quoteIndex],
      story: stories[storyIndex]
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
   CRITICAL CONSTRAINT: Avoid mentioning or using keywords like: morning, afternoon, evening, night, dawn, sunrise, sunset, midnight, early morning, late night, maña    Instead, use strictly time-neutral terms, such as:
    - "On this date in ${city}..." / "En esta fecha en ${city}..."
    - "The sky over ${city}..." / "El cielo sobre ${city}..."
    Do NOT assume a specific time period under any circumstances.`;

  const systemInstruction = `You are a historical local memory chronicler and archivist.
Write a soft, highly atmospheric reminiscence in ${language} documenting the look, draft, light, and sensory feelings of the city environment of ${city}, ${country} (${region || "None"}) on ${targetDate}.

STRICT WRITING & STYLE PRINCIPLES:
1. GEOGRAPHIC UNIQUENESS & LOCAL FEATURES: Every city must feel distinct, geographically authentic, and unique. Naturally blend one or two realistic local landmarks, districts, rivers, water bodies, coastlines, microclimates, hills, streets, or public squares associated with the city (e.g., Warsaw → Vistula River, Old Town; Paris → Seine, Eiffel Tower, boulevards; Lisbon → Tagus River, Alfama, steep hills; Toronto → Lake Ontario; Sydney → Circular Quay, Harbour; New York → Central Park, Hudson River) in up to 2 sentences. Avoid generic city statements; the selected landmarks must directly interact with and be part of the active weather scene (e.g., fog rolling across the bay, rain pooling on cobblestones of a historic district, cold breeze off the lake).
2. WEATHER FOCUS: Weather, sky, and season must remain the primary subject (80-90% of the narrative). Focus on quality of light, clouds, drafts, dampness, seasonal mood, or quiet sky.
3. EXTREMELY HIGH VOCABULARY VARIETY (NO CLICHÉS): Do NOT repeat the same cloud or atmospheric phrases across different cities.
   - STRICTLY FORBIDDEN PHRASES (and their Spanish equivalents): "quiet canopy of clouds", "blanket of clouds", "slate-grey sky", "softening the city", "quiet hours", "muted atmosphere".
   - Employ extremely varied vocabulary for clouds (e.g., leaden vault, vaporous haze, layered charcoal sails, high milky gauze, billowing slate), wind (shivering current, persistent draft, gusty weight, still dampness), and season.
4. NO COMMERCIAL OR TOURIST STYLE: Do NOT write tourist-guide style descriptions or lists of sightseeing attractions.
5. NO SCIENTIFIC TALK: Do NOT read like a scientific report. Avoid technical phrases like "recorded a temperature", "minimum temperature", "wind speed reached", "visibility remained", "meteorological station" or scientific measurements.
6. BRIEF FACTUAL BIRTH FACT: Birth must be mentioned AT MOST ONCE, briefly and factually (e.g., "a child was born", "a birth was logged", "un nacimiento fue registrado"). It is a peaceful, integrated historical anchor, never an emotional or parenting climax. ABSOLUTELY FORBIDDEN CLICHÉS (and Spanish equivalents): "one small arrival", "unforgettable for a family", "precious arrival", "miracle", "magical moment", "heartwarming", "family memory", "first cuddle", "newborn fragrance", "hearts", "blessings".
7. END ON ATMOSPHERE: The final sentence must return to the weather/sky/landscape atmosphere (e.g., ending on the sunset glow, damp twilight, or slow movement of clouds over rooftops).

HISTORICAL WEATHER DATA: Max ${tempMax}°C, ${weatherText}, Wind ${windSpeed} km/h.

REQUIRED JSON SCHEMA:
- theme: string (3-6 words, weather-based title like "A Rainy Afternoon", no time references)
- quote: string (exactly 1 short weather-only sentence, no human sentiment/birth of any kind)
- story: string (strictly 90-120 words formatted as a single paragraph, ending with the weather/sky/atmosphere, containing exactly one brief factual birth mention)
- quality_check: an object containing language_consistent, weather_consistent, time_consistent, city_consistent, structure_consistent (all booleans)

${timeOfDepartureRule}

${timeAtmosphereContext}`;

  let attempts = 0;
  const maxAttempts = 3;
  let finalJson: any = null;
  let apiFallbackLabel = "API_FORBIDDEN_BACKUP";

  while (attempts < maxAttempts) {
    try {
      console.log(`Querying Gemini (Attempt ${attempts + 1}) for story in ${language}...`);
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.log("Gemini request timed out after 6500ms");
          const err = new Error("Gemini request timed out after 6500ms");
          (err as any).status = 503;
          reject(err);
        }, 6500);
      });

      let response: any;
      try {
        response = await Promise.race([
          ai.models.generateContent({
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
              maxOutputTokens: 350,
            },
          }),
          timeoutPromise
        ]);
      } finally {
        clearTimeout(timeoutId);
      }

      const parsed = safeParseGeminiJson(response.text || "");

      if (!parsed || !parsed.theme || !parsed.quote || !parsed.story) {
        console.warn("Gemini JSON parsing failed. Continue retry loop or fallback.");
        attempts++;
        continue;
      }

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
    } catch (err: any) {
      console.error("Gemini API call error during attempt " + (attempts + 1) + ":", err);
      const status = err?.status || err?.statusCode || err?.code;
      const msg = String(err?.message || err || "").toUpperCase();
      if (status === 503 || msg.includes("UNAVAILABLE") || msg.includes("HIGH DEMAND") || msg.includes("TIMED OUT") || msg.includes("TIMEOUT")) {
        apiFallbackLabel = "API_HIGH_DEMAND_FALLBACK";
        console.log(`[Gemini high-demand/timeout fallback] 503/UNAVAILABLE/TIMEOUT error encountered on attempt ${attempts + 1}. Switching to fallback story immediately to optimize response time.`);
        break; // Quit immediately, no retries for high demand or timeout
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
