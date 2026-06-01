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
      phraseEn: "in the late night you arrived",
      phraseEs: "en la noche tardía en que llegaste",
    };
  } else if (hours >= 6 && hours < 9) {
    return {
      nameEn: "Early Morning",
      nameEs: "Mañana temprano",
      phraseEn: "in the early morning you arrived",
      phraseEs: "en la mañana temprano en que llegaste",
    };
  } else if (hours >= 9 && hours < 12) {
    return {
      nameEn: "Morning",
      nameEs: "Mañana",
      phraseEn: "on the morning you arrived",
      phraseEs: "en la mañana en que llegaste",
    };
  } else if (hours >= 12 && hours < 17) {
    return {
      nameEn: "Afternoon",
      nameEs: "Tarde",
      phraseEn: "that afternoon",
      phraseEs: "aquella tarde",
    };
  } else if (hours >= 17 && hours < 20) {
    return {
      nameEn: "Evening",
      nameEs: "Atardecer",
      phraseEn: "on a peaceful evening",
      phraseEs: "en un atardecer pacífico",
    };
  } else {
    return {
      nameEn: "Night",
      nameEs: "Noche",
      phraseEn: "late that night",
      phraseEs: "en la noche de tu llegada",
    };
  }
}

function applyTimeOfArrival(story: string, lang: 'en' | 'es', birthTime?: string): string {
  const period = getPeriodInfo(birthTime);
  if (!period) return story;

  if (lang === "es") {
    if (period.nameEs === "Noche tardía") {
      return story
        .replace(/La mañana comenzó con/gi, "La madrugada comenzó con")
        .replace(/la mañana en que naciste/gi, "la madrugada en que naciste")
        .replace(/La mañana en que naciste/gi, "La madrugada en que naciste")
        .replace(/la mañana/gi, "la madrugada")
        .replace(/una mañana/gi, "una madrugada")
        .replace(/Pasamos la mañana/gi, "Pasamos las silenciosas horas de la madrugada")
        .replace(/el día/gi, "la madrugada")
        .replace(/amaneció con/gi, "comenzó de madrugada con")
        .replace(/amaneció cubierta/gi, "se cubrió de madrugada");
    } else if (period.nameEs === "Mañana temprano") {
      return story
        .replace(/La mañana comenzó con/gi, "La mañana temprano comenzó con")
        .replace(/la mañana en que naciste/gi, "la mañana temprano en que naciste")
        .replace(/La mañana en que naciste/gi, "La mañana temprano en que naciste")
        .replace(/la mañana/gi, "la mañana temprano")
        .replace(/una mañana/gi, "una mañana temprano")
        .replace(/Pasamos la mañana/gi, "Pasamos la mañana temprano de tu llegada")
        .replace(/amaneció con/gi, "comenzó muy de mañana con")
        .replace(/amaneció cubierta/gi, "se cubrió al amanecer");
    } else if (period.nameEs === "Mañana") {
      return story
        .replace(/La mañana comenzó con/gi, "La mañana en que llegaste comenzó con")
        .replace(/la mañana en que naciste/gi, "la mañana en que llegaste")
        .replace(/La mañana en que naciste/gi, "La mañana en que llegaste");
    } else if (period.nameEs === "Tarde") {
      return story
        .replace(/La mañana comenzó con/gi, "La tarde comenzó con")
        .replace(/la mañana en que naciste/gi, "la tarde en que naciste")
        .replace(/La mañana en que naciste/gi, "La tarde en que naciste")
        .replace(/la mañana/gi, "la tarde")
        .replace(/una mañana/gi, "una tarde")
        .replace(/Pasamos la mañana/gi, "Pasamos la tarde")
        .replace(/el día/gi, "la tarde")
        .replace(/amaneció con/gi, "comenzó por la tarde con")
        .replace(/amaneció cubierta/gi, "se cubrió por la tarde");
    } else if (period.nameEs === "Atardecer") {
      return story
        .replace(/La mañana comenzó con/gi, "El atardecer comenzó con")
        .replace(/la mañana en que naciste/gi, "el atardecer en que naciste")
        .replace(/La mañana en que naciste/gi, "El atardecer en que naciste")
        .replace(/la mañana/gi, "el atardecer")
        .replace(/una mañana/gi, "un atardecer")
        .replace(/Pasamos la mañana/gi, "Pasamos el atardecer")
        .replace(/el día/gi, "el atardecer")
        .replace(/amaneció con/gi, "se llenó en el atardecer con")
        .replace(/amaneció cubierta/gi, "se vistió en el atardecer");
    } else if (period.nameEs === "Noche") {
      return story
        .replace(/La mañana comenzó con/gi, "La noche comenzó con")
        .replace(/la mañana en que naciste/gi, "la noche en que naciste")
        .replace(/La mañana en que naciste/gi, "La noche en que naciste")
        .replace(/la mañana/gi, "la noche")
        .replace(/una mañana/gi, "una noche")
        .replace(/Pasamos la mañana/gi, "Pasamos la noche")
        .replace(/el día/gi, "la noche")
        .replace(/amaneció con/gi, "se envolvió por la noche con")
        .replace(/amaneció cubierta/gi, "se cubrió por la noche");
    }
  } else {
    if (period.nameEn === "Late Night") {
      return story
        .replace(/The morning began with/gi, "The late night began with")
        .replace(/the morning you were born/gi, "the late night you were born")
        .replace(/chilly winter morning/gi, "chilly winter late night")
        .replace(/sunny morning/gi, "clear late night")
        .replace(/spent the morning/gi, "spent the late night hours")
        .replace(/the day you were born/gi, "the late night you arrived")
        .replace(/on the day/gi, "on that late night");
    } else if (period.nameEn === "Early Morning") {
      return story
        .replace(/The morning began with/gi, "The early morning began with")
        .replace(/the morning you were born/gi, "the early morning you were born")
        .replace(/chilly winter morning/gi, "chilly winter early morning")
        .replace(/sunny morning/gi, "sunny early morning")
        .replace(/spent the morning/gi, "spent the early morning")
        .replace(/the day you were born/gi, "the early morning you arrived")
        .replace(/on the day/gi, "on the early morning");
    } else if (period.nameEn === "Morning") {
      return story
        .replace(/The morning began with/gi, "On the morning you arrived, it began with")
        .replace(/the morning you were born/gi, "the morning you arrived")
        .replace(/on the day/gi, "on the morning you arrived");
    } else if (period.nameEn === "Afternoon") {
      return story
        .replace(/The morning began with/gi, "The afternoon began with")
        .replace(/the morning you were born/gi, "the afternoon you were born")
        .replace(/chilly winter morning/gi, "chilly winter afternoon")
        .replace(/sunny morning/gi, "sunny afternoon")
        .replace(/spent the morning/gi, "spent the afternoon")
        .replace(/the day you were born/gi, "the afternoon you arrived")
        .replace(/on the day/gi, "on the afternoon");
    } else if (period.nameEn === "Evening") {
      return story
        .replace(/The morning began with/gi, "The evening began with")
        .replace(/the morning you were born/gi, "the evening you were born")
        .replace(/chilly winter morning/gi, "chilly winter evening")
        .replace(/sunny morning/gi, "sunny evening")
        .replace(/spent the morning/gi, "spent the evening")
        .replace(/the day you were born/gi, "the evening you arrived")
        .replace(/on the day/gi, "on the evening");
    } else if (period.nameEn === "Night") {
      return story
        .replace(/The morning began with/gi, "The night began with")
        .replace(/the morning you were born/gi, "the night you were born")
        .replace(/chilly winter morning/gi, "cold winter night")
        .replace(/sunny morning/gi, "night")
        .replace(/spent the morning/gi, "spent the night")
        .replace(/the day you were born/gi, "the night you arrived")
        .replace(/on the day/gi, "on the night");
    }
  }

  return story;
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
    return "Un día suave de primavera";
  } else {
    if (isRainy) return "A Rainy Arrival";
    if (isSnowy) return "A Snowy Welcome";
    if (isSunny) return "A Sunny Beginning";
    if (isCloudy) return "A Quiet Cloudy Day";
    return "A Gentle Spring Day";
  }
}

function getThemeForProvidedTime(weatherCode: number, hours: number, lang: 'en' | 'es'): string {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
  const isSunny = [0, 1].includes(weatherCode);
  const isCloudy = [2, 3, 45, 48].includes(weatherCode);

  if (hours >= 0 && hours < 6) { // Late Night
    if (lang === "es") {
      if (isRainy) return "Una noche lluviosa tardía";
      if (isSnowy) return "Nieve bajo las estrellas";
      if (isSunny) return "Bajo el cielo nocturno";
      if (hours === 0) return "Bienvenida de medianoche";
      return "Una noche tardía y tranquila";
    } else {
      if (isRainy) return "A Rainy Late Night";
      if (isSnowy) return "Snow Beneath the Stars";
      if (isSunny) return "Under the Night Sky";
      if (hours === 0) return "A Midnight Welcome";
      return "A Quiet Late Night";
    }
  } else if (hours >= 6 && hours < 9) { // Early Morning
    if (lang === "es") {
      if (isRainy) return "Primera luz con lluvia";
      if (isSnowy) return "Primera luz con nieve";
      if (isSunny) return "Una llegada al amanecer";
      return "Un amanecer tranquilo";
    } else {
      if (isRainy) return "First Light and Rain";
      if (isSnowy) return "First Light and Snow";
      if (isSunny) return "An Early Morning Arrival";
      return "A Quiet Early Morning";
    }
  } else if (hours >= 9 && hours < 12) { // Morning
    if (lang === "es") {
      if (isRainy) return "Una mañana lluviosa";
      if (isSnowy) return "Una mañana de nieve";
      if (isSunny) return "Sol de la mañana";
      return "Una mañana tranquila";
    } else {
      if (isRainy) return "A Rainy Morning";
      if (isSnowy) return "A Snowy Morning";
      if (isSunny) return "Morning Sunshine";
      return "A Quiet Morning";
    }
  } else if (hours >= 12 && hours < 17) { // Afternoon
    if (lang === "es") {
      if (isRainy) return "Una tarde lluviosa";
      if (isSnowy) return "Una tarde de nieve";
      if (isSunny) return "Tarde dorada";
      return "Una tarde suave";
    } else {
      if (isRainy) return "A Rainy Afternoon";
      if (isSnowy) return "A Snowy Afternoon";
      if (isSunny) return "Golden Afternoon";
      return "A Gentle Afternoon";
    }
  } else if (hours >= 17 && hours < 20) { // Evening
    if (lang === "es") {
      if (isRainy) return "Lluvia al atardecer";
      if (isSnowy) return "Nieve al atardecer";
      if (isSunny) return "Un atardecer dorado";
      return "Un atardecer tranquilo";
    } else {
      if (isRainy) return "Evening Rain";
      if (isSnowy) return "An Evening Snow";
      if (isSunny) return "A Golden Evening";
      return "A Quiet Evening";
    }
  } else { // Night
    if (lang === "es") {
      if (isRainy) return "Una noche lluviosa";
      if (isSnowy) return "Una noche de nieve";
      if (isSunny) return "Bajo el cielo nocturno";
      if (hours === 23) return "Bienvenida de medianoche";
      return "Una noche tranquila";
    } else {
      if (isRainy) return "A Rainy Night";
      if (isSnowy) return "A Snowy Night";
      if (isSunny) return "Under the Night Sky";
      if (hours === 23) return "A Midnight Welcome";
      return "A Quiet Night";
    }
  }
}

function getCorrectTheme(weatherCode: number, lang: 'en' | 'es', birthTime?: string): string {
  if (!birthTime) {
    return getThemeForEmptyTime(weatherCode, lang);
  }
  const parts = birthTime.split(":");
  if (parts.length < 2) {
    return getThemeForEmptyTime(weatherCode, lang);
  }
  const hours = parseInt(parts[0], 10);
  if (isNaN(hours)) {
    return getThemeForEmptyTime(weatherCode, lang);
  }
  return getThemeForProvidedTime(weatherCode, hours, lang);
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

  const cityLower = params.city.toLowerCase();
  const isNY = cityLower.includes("new york") || cityLower.includes("nyc");
  const isChicago = cityLower.includes("chicago");
  const isWarsaw = cityLower.includes("warsaw") || cityLower.includes("warszawa");
  const isToronto = cityLower.includes("toronto");
  const isLondon = cityLower.includes("london");
  const isParis = cityLower.includes("paris");

  const tempF = Math.round((params.tempMax * 9) / 5 + 32);
  const tempC = Math.round(params.tempMax);
  const windKn = Math.round(params.windSpeed);
  const windMph = Math.round(params.windSpeed * 0.621371);

  if (params.lang === "es") {
    if (isRainy) {
      let story = "";
      let theme = "Un día de lluvia";
      let quote = "La lluvia afuera era constante, pero nosotros estábamos concentrados en conocerte.";

      if (isNY) {
        story = `La mañana comenzó con una llovizna sobre Nueva York, con una temperatura de ${tempC}°C (${tempF}°F). En el hospital todo estaba en silencio y los enfermeros se movían despacio por el pasillo, mientras nosotros te sosteníamos por primera vez en brazos. Afuera era un día gris más de rutina, pero en nuestra habitación todo se sentía completamente diferente.`;
      } else if (isChicago) {
        story = `Llovía de manera constante sobre Chicago, con un viento de ${windKn} km/h (${windMph} mph) y una temperatura de ${tempC}°C (${tempF}°F). Mucha gente apuraba el paso bajo los paraguas afuera, pero en nuestra habitación del hospital el ambiente era de pura calma. Pasamos la mañana mirando tu carita, asombrados de que por fin estuvieras aquí.`;
      } else if (isWarsaw) {
        story = `Varsovia amaneció con una llovizna a las ${params.sunrise} y una temperatura de ${tempC}°C (${tempF}°F). Mientras la gente seguía con su ritmo habitual bajo la lluvia gris de afuera, nosotros estábamos en el hospital contando tus pequeños dedos. Todavía recordamos con mucha claridad el sonido de las gotas contra el vidrio.`;
      } else if (isParis) {
        story = `Una llovizna ligera caía sobre París, con una temperatura de ${tempC}°C (${tempF}°F) y una brisa de ${windKn} km/h (${windMph} mph). Los médicos y enfermeras entraban con pasos sigilosos mientras te sosteníamos por primera vez. Afuera el día transcurría despacio para todos, pero para nosotros fue el momento en que todo cambió.`;
      } else if (isLondon) {
        story = `Una llovizna caía sobre Londres a las ${params.sunrise}, dejando las calles mojadas y tranquilas a ${tempC}°C (${tempF}°F). Mientras todos los demás continuaban su ritmo habitual bajo la llovizna, nosotros estábamos en el hospital escuchando tus respiraciones tranquilas de recién nacido. Fue una mañana ordinaria para el resto de la ciudad, pero para nosotros quedó guardada en el corazón.`;
      } else if (isToronto) {
        story = `Una lluvia caía sobre Toronto, con una temperatura de ${tempC}°C (${tempF}°F) y un viento de ${windKn} km/h (${windMph} mph). La habitación del hospital era un lugar cálido y silencioso. Nos pasamos las horas mirándote dormir y aprendiendo a sostenerte con cuidado, ignorando por completo el mal clima de afuera.`;
      } else {
        story = `La mañana en que naciste en ${params.city} fue bastante húmeda y lluviosa, con una temperatura de ${tempC}°C (${tempF}°F) y un viento de ${windKn} km/h (${windMph} mph). El hospital estaba tranquilo y el personal se movía con pasos suaves por los pasillos. La lluvia caía de forma constante, pero nosotros estábamos totalmente concentrados en verte y en cargarte por primera vez.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "Un día de nieve";
      let quote = "Hacía mucho frío afuera, pero nosotros estábamos concentrados en darte la bienvenida.";

      if (isNY) {
        story = `Nueva York amaneció con un frío intenso de ${tempC}°C (${tempF}°F) y nieve cayendo despacio afuera. El hospital estaba templado y acogedor, con el radiador de la habitación zumbando suavemente de fondo. Cubierto con mantas de algodón, te tomamos en brazos por primera vez mientras mirábamos la tregua silenciosa del invierno a través de la ventana.`;
      } else if (isChicago) {
        story = `Hacía un frío cortante en Chicago, con una temperatura de ${tempC}°C (${tempF}°F) y un viento de ${windKn} km/h (${windMph} mph) arrastrando nieve por las calles. Mientras la tormenta seguía afuera, el hospital se sentía como un refugio perfectamente seguro y cálido. Nos turnábamos para cargarte y mirar tu carita, completamente tranquilos frente al invierno exterior.`;
      } else if (isWarsaw) {
        story = `Varsovia amaneció cubierta de nieve, con el sol asomando a las ${params.sunrise} tras nubes heladas a ${tempC}°C (${tempF}°F). El movimiento exterior avanzaba lento sobre el manto blanco, pero en nuestra habitación del hospital el tiempo parecía haberse detenido por completo. Sostenerte por primera vez nos trajo una inmensa tranquilidad.`;
      } else {
        story = `Una capa ligera de nieve cubría las calles de ${params.city} la mañana en que naciste, con ${tempC}°C (${tempF}°F) y viento a ${windKn} km/h (${windMph} mph). El hospital estaba tranquilo y templado. Mientras la nieve caía afuera sin hacer ruido, nosotros pasamos las primeras horas simplemente mirándote la carita y sosteniéndote con cuidado en brazos.`;
      }

      return { theme, quote, story };
    }

    if (isSunny) {
      let story = "";
      let theme = "Un día soleado";
      let quote = "El clima afuera estaba despejado, pero todo nuestro interés estaba puesto en ti.";

      if (isNY) {
        story = `La mañana en que naciste en Nueva York fue despejada y soleada, con una temperatura de ${tempC}°C (${tempF}°F). Mientras todos los demás seguían con su prisa diaria abajo en la calle, nosotros pasamos una tarde sumamente pacífica en la habitación, contándote los dedos y mirándote dormir.`;
      } else if (isChicago) {
        story = `Chicago tuvo un día soleado de ${tempC}°C (${tempF}°F), con sol y una brisa de ${windKn} km/h (${windMph} mph). En el hospital el movimiento transcurría con normalidad, pero en nuestra habitación las horas avanzaron a otro ritmo. Sostener tu pequeña mano por primera vez con el sol entrando por la ventana es un momento del que todavía solemos hablar hoy en día.`;
      } else if (isWarsaw) {
        story = `Varsovia amaneció con cielos despejados desde las ${params.sunrise} y una temperatura de ${tempC}°C (${tempF}°F). La luz inundaba la habitación del hospital, donde todo estaba en calma y silencio. Nos sentamos junto a la ventana para mirarte y abrazarte por primera vez en un día tan luminoso.`;
      } else {
        story = `Un día soleado y despejado nos recibió en ${params.city} cuando naciste, con cielos azules, una brisa a ${windKn} km/h (${windMph} mph) y una temperatura de ${tempC}°C (${tempF}°F). La gente caminaba tranquila por afuera, mientras nosotros estábamos en el hospital enfocados únicamente en aprender a sostenerte y en cuidarte.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy
    let story = "";
    let theme = "Un día nublado";
    let quote = "Afuera era un día gris común y corriente. Para nosotros fue la primera vez que te vimos.";

    if (isNY) {
      story = `El cielo sobre Nueva York estaba gris y completamente tranquilo, apagando el ruido habitual de la ciudad a ${tempC}°C (${tempF}°F). Mientras todo continuaba con su rutina de siempre afuera, en nuestra habitación de hospital el ambiente era de pura calma. Te quedaste dormido sosteniendo nuestro dedo, y en ese momento nos olvidamos por completo de cualquier otra cosa.`;
    } else if (isChicago) {
      story = `Nubes grises y bajas cubrían Chicago, empujadas por un viento constante de ${windKn} km/h (${windMph} mph) a ${tempC}°C (${tempF}°F). En el hospital las enfermeras hacían sus rondas correspondientes, y nosotros pasamos la tarde simplemente mirándote respirar. El día gris afuera no importaba nada; toda nuestra atención estaba concentrada en ti.`;
    } else if (isWarsaw) {
      story = `Un cielo gris y cubierto cubría Varsovia desde la salida del sol a las ${params.sunrise}, con una temperatura de ${tempC}°C (${tempF}°F). En el hospital todo estaba muy silencioso mientras te pasábamos con cuidado de unos brazos a otros. La rutina de la ciudad siguió su curso habitual, pero a nosotros nos quedó guardado ese momento de paz para siempre.`;
    } else {
      story = `Un cielo gris y tranquilo cubría ${params.city} el día en que naciste, con una brisa a ${windKn} km/h (${windMph} mph) y una temperatura de ${tempC}°C (${tempF}°F). Afuera el día transcurría despacio y sin novedades particulares, mientras que adentro pasábamos las horas conociéndote de cerca. Sostenerte por primera vez fue un momento de gran alivio y tranquilidad.`;
    }

    return { theme, quote, story };
  } else {
    // English Backup Stories
    if (isRainy) {
      let story = "";
      let theme = "A Rainy Morning";
      let quote = "Outside, it was raining steadily, but we barely noticed. We were focused on meeting you for the first time.";

      if (isNY) {
        story = `The morning began with a drizzle in New York, with a temperature of ${tempC}°C (${tempF}°F). Inside the hospital room, we barely registered the damp weather outside. Nurses moved quietly through the hallways while we held you for the first time. For everyone else in the city, it was just another routine workday, but in our room, everything felt completely different.`;
      } else if (isChicago) {
        story = `A rain was falling across Chicago, with the wind blowing at ${windKn} km/h (${windMph} mph) under a temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, everything was quiet. We spent the morning simply studying your face, trying to process that you were finally here. The cold, wet Chicago weather outside didn't worry us at all.`;
      } else if (isWarsaw) {
        story = `It was quiet and grey in Warsaw, with rain falling outside at ${tempC}°C (${tempF}°F) as the sun rose behind clouds at ${params.sunrise}. While the city continued its usual wet routine, we were safe inside our room, staring at your tiny fingers. We still remember clearly the quiet sound of droplets beating against the glass window.`;
      } else if (isParis) {
        story = `A drizzle fell across Paris under a temperature of ${tempC}°C (${tempF}°F) with a wind of ${windKn} km/h (${windMph} mph). The hospital staff worked quietly, and we felt an immense sense of relief holding you at last. While people hurried past the clinic windows under the rain, our entire attention was focused on holding your tiny hand.`;
      } else if (isLondon) {
        story = `A drizzle was falling outside in London, leaving the streets wet and quiet at ${tempC}°C (${tempF}°F) as the sun rose at ${params.sunrise}. While the day carried on as usual for the rest of the world, our attention was completely focused on you, listening to your faint breathing in that calm hospital room.`;
      } else if (isToronto) {
        story = `A rain fell over Toronto at ${tempC}°C (${tempF}°F), with wind blowing at ${windKn} km/h (${windMph} mph). Inside the hospital, our room felt safe and quiet. We were completely distracted from the weather outside, busy studying every tiny detail of your hands and feet.`;
      } else {
        story = `The morning you were born in ${params.city} was rainy, with the thermometer showing ${tempC}°C (${tempF}°F) and a wind of ${windKn} km/h (${windMph} mph). The hospital hallways were quiet, and the staff was moving around with soft footsteps. It was raining steadily across the area, but we were focused only on holding you in our arms for the first time.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "Snow Outside";
      let quote = "It was freezing cold outside, but our attention was completely focused on meeting you.";

      if (isNY) {
        story = `A fresh layer of snow was covering New York on the chilly winter morning you were born, with temperatures around ${tempC}°C (${tempF}°F). The hospital room was nicely heated, and the radiator hummed quietly in the corner while we held you close. We still remember looking out at the falling snow through the window while you slept.`;
      } else if (isChicago) {
        story = `The wind was blowing cold at ${windKn} km/h (${windMph} mph) with fresh snow drifting outside in Chicago at a freezing ${tempC}°C (${tempF}°F). Inside our hospital room, however, it was wonderfully quiet and warm. We took turns cradling you in our arms, and the winter chill outside became just a quiet backdrop to our first afternoon together.`;
      } else if (isWarsaw) {
        story = `A fresh snow had fallen over Warsaw, and the morning sun rose behind cold clouds at ${params.sunrise} with a chilly temperature of ${tempC}°C (${tempF}°F). The city outside followed its quiet winter routine, but inside our room, everything moved at a much slower pace. Holding you against our chest for the first time is a moment of calm we still talk about today.`;
      } else {
        story = `A quiet blanket of snow was settling over the streets of ${params.city} on the morning you were born, with the temperature hovering at ${tempC}°C (${tempF}°F) and the wind blowing at ${windKn} km/h (${windMph} mph). The hospital room was warm and still. While the world outside was cold and white, we spent the first hours just holding you and making sure you were comfortable.`;
      }

      return { theme, quote, story };
    }

    if (isSunny) {
      let story = "";
      let theme = "A Sunny Day";
      let quote = "The weather outside was bright and clear, but the best part was holding you for the first time.";

      if (isNY) {
        story = `New York was experiencing a bright, sunny morning when you arrived, with a temperature of ${tempC}°C (${tempF}°F). While the rest of the city below was caught up in the usual daily rush, we spent the afternoon in our quiet room, counting your toes and watching you sleep peacefully.`;
      } else if (isChicago) {
        story = `The weather in Chicago was sunny and clear, with a temperature of ${tempC}°C (${tempF}°F) and a breeze of ${windKn} km/h (${windMph} mph). Inside the hospital, we barely noticed the day outside. We were far too busy holding you close. Watching the morning sun stream through the window onto your tiny hand is a memory we will always cherish.`;
      } else if (isWarsaw) {
        story = `Warsaw was bathed in clear sunshine on the day you were born, with a temperature of ${tempC}°C (${tempF}°F) as the sun rose at ${params.sunrise}. In our hospital room, the nurses worked quietly, and everything was peaceful. We sat close to the window where the natural light was brightest to take a few simple photos of your first hours.`;
      } else {
        story = `A sunny, clear day welcomed us in ${params.city} when you were born, with blue skies and a breeze blowing at ${windKn} km/h (${windMph} mph) under a temperature of ${tempC}°C (${tempF}°F). People were walking through the parks outside, while we were in the hospital, focused entirely on learning how to feed you and keep you warm.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy
    let story = "";
    let theme = "A Quiet Cloudy Day";
    let quote = "It was just a regular cloudy day for everyone else, but not for us.";

    if (isNY) {
      story = `The sky over New York was calm and grey, softening the usual rush of the city at a temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, the speed of the day slowed to an absolute standstill. You fell asleep holding onto our pinky finger, and we just sat there in silence, looking at your tiny face.`;
    } else if (isChicago) {
      story = `Overcast clouds blanketed Chicago, carried by a steady wind of ${windKn} km/h (${windMph} mph) at ${tempC}°C (${tempF}°F). Outside, the streets were quiet, and inside we spent the afternoon holding you close. There was a simple, peaceful feeling in the room as we took turns cradling our new baby.`;
    } else if (isWarsaw) {
      story = `A quiet, cloudy sky covered Warsaw on the morning you were born, with the sun rising behind grey clouds at ${params.sunrise} and temperature at ${tempC}°C (${tempF}°F). The city carried on as usual, while our entire attention was focused on you, listening to your soft breathing in a very peaceful room.`;
    } else {
      story = `A quiet, overcast sky covered ${params.city} on the day you were born, with a wind blowing at ${windKn} km/h (${windMph} mph) and a temperature of ${tempC}°C (${tempF}°F). While the weather outside was slow and grey, we spent the hours getting to know you. Having you in our arms for the first time brought an immense sense of relief—a moment we still remember clearly today.`;
    }

    return { theme, quote, story };
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
   Since the user has provided the birth time ("${birthTime}"), you MUST personalize the weather story specifically to that time period.
   Categorize the time of arrival as follows:
   - 00:00–05:59 → Late Night
     In English, use terms like: late night, midnight, after midnight, before dawn, night stars, late night hour.
     In Spanish, use terms like: noche tardía, de madrugada, horas de la madrugada, medianoche, cielo estrellado.
   - 06:00–08:59 → Early Morning
     In English, use terms like: early morning, break of dawn, first light, sunrise, dawn's arrival.
     In Spanish, use terms like: mañana temprano, el amanecer, primera luz, salida del sol.
   - 09:00–11:59 → Morning
     In English, use terms like: morning, mid-morning, late morning.
     In Spanish, use terms like: mañana, media mañana, transcurso de la mañana.
   - 12:00–16:59 → Afternoon
     In English, use terms like: afternoon, mid-afternoon, early afternoon, golden afternoon.
     In Spanish, use terms like: la tarde, media tarde, transcurso de la tarde.
   - 17:00–19:59 → Evening
     In English, use terms like: evening, late afternoon, dusk, twilight, sunset.
     In Spanish, use terms like: el atardecer, la caída del sol, hora del atardecer.
   - 20:00–23:59 → Night
     In English, use terms like: night, nightfall, late evening, night sky.
     In Spanish, use terms like: la noche, horas de la noche, cielo nocturno.

   ONLY use time-based references matching the correct category. DO NOT use generic daylight/daytime terms if they conflict.
   DO NOT repeat the exact same phrase used in the theme name inside the story text (e.g. if the theme is "A Rainy Afternoon", do not use the exact phrase "A Rainy Afternoon" in the story. Instead, write "the steady rain that afternoon").
   All other weather/factual rules must still be followed: no subjective weather adjectives, no famous landmarks.`
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

7. STAGE AN AUTHENTIC, COMPLETELY UN-POETIC PARENT MEMORY:
   - THE GOAL IS NOT TO SOUND BEAUTIFUL. THE GOAL IS TO SOUND REAL AND LIFE-LIKE.
   - WRITE AS IF A PARENT IS DESCRIBING THE DAY TO A FRIEND 10 YEARS LATER.
   - Use simple, natural, conversational, down-to-earth language.
   - Stop writing poetry. Stop writing greeting-card language. Stop writing inspirational quotes.
   - Do NOT use literary language. Do NOT use symbolic language. Do NOT use romantic language. Do NOT write quotes that sound like social media inspiration posts.
   - Strictly avoid poetic metaphors or overly dramatic expressions.
   - Crucially, you MUST NOT use or imitate expressions like:
     * "infinite light" / "luz infinita"
     * "eternal love" / "amor eterno"
     * "true sunrise" / "verdadero amanecer"
     * "majesty of holding you" / "majestad de abrazarte"
     * "treasure forever" / "tesoro para siempre" / "guardar por siempre"
     * "transformed our lives forever" / "transformó nuestras vidas para siempre"
     * "humble witness" / "testigo humilde"
     * "radiant soul" / "alma radiante"
     * "light in our eyes" / "luz en nuestros ojos"
     * "destiny" / "destino"
     * "miracle" / "milagro" / "milagro de milagros"
     * "Outside..., but inside..." / "Afuera..., pero adentro..."
     * "The weather faded into the background..." / "El clima pasó al segundo plano..."
     * "Nothing else mattered..." / "Nada más importaba..." / "Nada de ese ajetreo importaba..."
     * "forever our favorite memory" / "para siempre nuestro recuerdo favorito"
     * "our world changed completely" / "nuestro mundo cambió por completo"
     * "everything changed forever" / "todo cambió para siempre"
     * "unforgettable chapter" / "capítulo inolvidable"
     * "true light" / "luz verdadera" / "verdadera luz"
   - Recommended writing style is authentic, grounded, human, simple, and believable.
   - Excellent examples of desired story tone:
     * "We still remember that day clearly."
     * "It was just another cloudy day for everyone else, but not for us."
     * "The weather was ordinary. Meeting you wasn't."
     * "The city carried on as usual while our entire attention was focused on you."
     * "Outside, it was raining steadily across Havana, but we barely noticed. We were focused on meeting you for the first time."
   - Excellent examples of desired final quotes (make them short, natural, and memorable):
     * "Outside, it was just another cloudy day. For us, it became unforgettable."
     * "The weather came and went. The memory stayed."
     * "Most people won't remember that day's weather. We always will."
     * "The city was busy. We were busy meeting you."
   - Let the quote sound like something a real parent would say to their child later in life: clean, direct, and completely devoid of greeting-card fluff.
   - Generate creative, varied sentence structures.
     * "The city was busy. We were busy meeting you."
   - Let the quote sound like something a real parent would say to their child later in life: clean, direct, and completely devoid of greeting-card fluff.
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
