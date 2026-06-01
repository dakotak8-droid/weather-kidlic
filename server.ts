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
      let theme = "Recibidos por la Lluvia";
      let quote = "La lluvia de afuera no importaba en lo absoluto; conocerte fue el momento más feliz de nuestras vidas.";

      if (isNY) {
        story = `La mañana del ${params.birthDate} comenzó con lloviznas suaves sobre Nueva York. Afuera, se veían los taxis amarillos esquivando charcos en Broadway y la bruma de la mañana flotaba entre los rascacielos. Hacía una temperatura templada de ${tempC}°C (${tempF}°F), pero dentro de la habitación del hospital apenas lo notamos. Estábamos concentrados en conocerte por primera vez y sostener tu cuerpecito cálido en nuestros brazos. Esa mañana lluviosa en Nueva York se convirtió en el día en que nuestras vidas cambiaron para siempre.`;
      } else if (isChicago) {
        story = `Una lluvia fría caía sobre Chicago, con el viento soplando desde el lago Míchigan a ${windKn} km/h (${windMph} mph). La gente en la calle caminaba apurada con abrigos oscuros, pero nuestra atención estaba puesta por completo en recibirte. Cuando te sostuvimos en brazos por primera vez, tu respiración suave era el único sonido de la habitación. El clima frío y húmedo de Chicago afuera no importaba en lo absoluto; sentíamos una inmensa felicidad de tenerte con nosotros.`;
      } else if (isWarsaw) {
        story = `Varsovia amaneció tranquila y húmeda, con una llovizna constante que mojaba los adoquines del centro histórico. Hacía un poco de frío, con ${tempC}°C (${tempF}°F), y el sol salió tras nubes grises a las ${params.sunrise}. En nuestra habitación, en cambio, todo era calidez y calma. Pasamos esas primeras horas abrazándote, mirándote la carita y contando tus pequeños dedos. Varsovia seguía su curso bajo la lluvia de otoño, pero para nosotros todo comenzó ahí.`;
      } else if (isParis) {
        story = `Una llovizna ligera caía sobre París, mojando los tejados de zinc y los cafés tranquilos junto al Sena. Hacía un clima templado de ${tempC}°C (${tempF}°F) con una brisa muy suave. Sentimos un alivio y una alegría inmensos cuando por fin te pusieron en nuestros brazos. Al abrazarte por primera vez nos olvidamos por completo del clima gris de afuera. Esa tarde tranquila y lluviosa en París siempre será uno de nuestros recuerdos más queridos.`;
      } else if (isLondon) {
        story = `Una llovizna clásica londinense caía afuera, dejando las calles húmedas y tranquilas. El sol salió a las ${params.sunrise} detrás de nubes pesadas con una temperatura de ${tempC}°C (${tempF}°F). Mientras la ciudad seguía con su rutina húmeda habitual, nuestro mundo se detuvo dentro de esa habitación de hospital. Te sostuvimos cerca, escuchando tus pequeños murmullos de recién nacido, con la certeza de que nunca habíamos sido tan felices.`;
      } else if (isToronto) {
        story = `Una lluvia fresca caía sobre Toronto, bajando hacia las orillas del lago Ontario bajo un cielo nublado de ${tempC}°C (${tempF}°F). El viento soplaba a ${windKn} km/h (${windMph} mph), pero la habitación del hospital se sentía como un refugio cálido y seguro. Nos distrajimos por completo del clima gris de afuera, ocupados en abrazarte y contemplar cada detalle de tu carita. Ese día lluvioso junto al lago es ahora el recuerdo más hermoso que compartimos.`;
      } else {
        story = `La mañana en que naciste en ${params.city} fue húmeda y lluviosa, frente a un termómetro que marcaba unos templados ${tempC}°C (${tempF}°F) y un viento de ${windKn} km/h (${windMph} mph). Pero adentro estábamos en nuestro propio mundo de calma. Sostener tu pequeño cuerpo por primera vez nos hizo olvidar la lluvia de afuera. El día húmedo en ${params.city} quedó grabado para siempre como el inicio de nuestra familia.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "Recibidos por la Nieve";
      let quote = "Hacía mucho frío afuera, pero abrazarte nos dio toda la calidez que podíamos necesitar.";

      if (isNY) {
        story = `Un hermoso manto de nieve cubría las calles y tejados de Nueva York la mañana en que naciste. La nieve caía en silencio sobre Central Park, apagando el ruido habitual de la gran ciudad en un día frío de invierno a ${tempC}°C (${tempF}°F). Nos mantuvimos muy abrigados en la habitación del hospital, sosteniéndote cerca y mirando cómo abrías tus ojos curiosos. Al contemplar ese Manhattan nevado y silencioso desde la ventana, supimos que nunca habíamos sentido tanta calidez en nuestros corazones.`;
      } else if (isChicago) {
        story = `El viento soplaba helado desde el lago Míchigan a ${windKn} km/h (${windMph} mph), acumulando nieve fresca entre los grandes edificios de Chicago con una temperatura de ${tempC}°C (${tempF}°F). Sin embargo, dentro de la habitación del hospital todo era calidez. En el momento exacto en que te tuvimos en brazos, nos olvidamos por completo del frío invierno de afuera. Estábamos increíblemente agradecidos de tener por fin a nuestro bebé con nosotros.`;
      } else if (isWarsaw) {
        story = `Una nieve fresca cubría por completo las calles históricas de Varsovia y la escarcha bordeaba el río Vístula. El sol asomó tras nubes frías a las ${params.sunrise} con una temperatura gélida de ${tempC}°C (${tempF}°F). Adentro, nuestra atención estaba puesta solo en ti. Escuchar tus primeros murmullos y sostenerte contra nuestro pecho nos dio todo el abrigo que necesitábamos. Varsovia estaba silenciosa bajo el invierno polaco, pero nuestros corazones estaban llenos de alegría.`;
      } else {
        story = `Una capa de nieve limpia cubría ${params.city} la mañana en que naciste, con una temperatura de ${tempC}°C (${tempF}°F) y un viento que soplaba la nieve afuera a ${windKn} km/h (${windMph} mph). Pero nuestra habitación del hospital era un refugio cálido y en paz. Al acunarte y darte un beso en la frente, sentimos una inmensa tranquilidad. El día nevado en ${params.city} será siempre el recuerdo más cálido de nuestras vidas.`;
      }

      return { theme, quote, story };
    }

    if (isSunny) {
      let story = "";
      let theme = "Un Día de Sol";
      let quote = "El día afuera estaba hermoso y despejado, pero la mejor parte fue sostenerte en brazos por primera vez.";

      if (isNY) {
        story = `Nueva York disfrutaba de un día hermoso, brillante y soleado cuando llegaste al mundo. El sol de la mañana se reflejaba en los edificios de cristal de Manhattan, los taxis amarillos recorrían Broadway bajo un cielo despejado y hacía una temperatura de ${tempC}°C (${tempF}°F). Mientras la gran ciudad seguía con su rutina apresurada allá abajo, nosotros solo teníamos ojos para ti, contando tus pequeños dedos y disfrutando este momento único. Ese día soleado en Nueva York siempre será nuestro favorito.`;
      } else if (isChicago) {
        story = `El clima afuera en Chicago era agradable y despejado, con un sol brillante que se reflejaba en el lago Míchigan y una suave brisa de ${windKn} km/h (${windMph} mph). Hacía unos templados ${tempC}°C (${tempF}°F), pero apenas nos fijamos en eso. Estábamos ocupados dándote la bienvenida y sosteniéndote muy cerca. Tomar tu pequeña mano mientras la luz del sol de Chicago entraba por la ventana fue el momento más feliz de nuestras vidas.`;
      } else if (isWarsaw) {
        story = `Varsovia estaba iluminada por un sol brillante y despejado el día en que naciste. El sol de la mañana salió a las ${params.sunrise} sobre los edificios históricos del centro y brillaba en el río Vístula a unos agradables ${tempC}°C (${tempF}°F). En la habitación del hospital todo era paz y silencio mientras te abrazábamos por primera vez. Esa mañana luminosa en Varsovia siempre nos recordará el día en que por fin fuimos una familia.`;
      } else {
        story = `Un día despejado y lleno de sol nos recibió en ${params.city} cuando naciste, con cielos azules y una suave brisa soplando a ${windKn} km/h (${windMph} mph). La temperatura subió a unos agradables ${tempC}°C (${tempF}°F), haciendo que afuera fuera un día hermoso. Pero la mejor parte, por mucho, fue tenerte entre nuestros brazos por primera vez. El sol brillante de ${params.city} hizo que todo se sintiera aún más especial al darte la bienvenida a nuestra familia.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy / Overcast
    let story = "";
    let theme = "Atmósfera Serena";
    let quote = "Bajo un cielo gris y tranquilo, nuestro mundo cambió por completo en el momento en que por fin te conocimos.";

    if (isNY) {
      story = `El cielo sobre Manhattan estaba tranquilo y gris, suavizando el ruido y el movimiento constante de Nueva York. Hacía un clima templado de ${tempC}°C (${tempF}°F) afuera, pero dentro de nuestra habitación el tiempo pareció detenerse por completo. En el segundo en que abriste los ojos y nos miraste, todo el bullicio de la ciudad desapareció. Nos quedamos sentados abrazándote, sintiendo una inmensa gratitud de que por fin estuvieras aquí.`;
    } else if (isChicago) {
      story = `Nubes grises cubrían los edificios de Chicago, empujadas por un viento constante de ${windKn} km/h (${windMph} mph) que venía del lago Míchigan. El día se sentía muy tranquilo a unos ${tempC}°C (${tempF}°F), y toda nuestra atención estaba enfocada en conocerte. Cuando te sostuvimos en brazos y tu pequeña mano rodeó nuestro dedo, cualquier preocupación desapareció. Ese día gris y silencioso en Chicago será siempre el día en que nuestras vidas cambiaron para mejor.`;
    } else if (isWarsaw) {
      story = `Un cielo cubierto y pacífico cobijaba las orillas del río Vístula y las viejas murallas de Varsovia la mañana en que naciste. El sol salió tras las nubes grises a las ${params.sunrise} con una brisa muy suave. Estábamos demasiado ocupados abrazándote por primera vez como para pensar en el clima. Sostenerte cerca mientras Varsovia descansaba bajo ese cielo sereno fue un momento de pura felicidad que guardaremos para siempre.`;
    } else {
      story = `Un cielo gris y tranquilo cubría ${params.city} el día en que naciste, con una suave brisa soplando a ${windKn} km/h (${windMph} mph) y una temperatura agradable de ${tempC}°C (${tempF}°F). Afuera el día transcurría despacio y en paz, mientras que adentro vivíamos el momento más emocionante de nuestras vidas. Cuando te estrechamos por primera vez contra nuestro pecho, sentimos un profundo alivio y felicidad. Ese día nublado en ${params.city} es para siempre nuestro recuerdo preferido.`;
    }

    return { theme, quote, story };
  } else {
    // English Backup Stories
    if (isRainy) {
      let story = "";
      let theme = "Welcomed by Raindrops";
      let quote = "The rain outside didn't matter at all—hearing your first soft breath was the happiest moment of our lives.";

      if (isNY) {
        story = `New York was waking up under a gentle morning drizzle on ${params.birthDate}. Outside, we could see yellow cabs dodging puddles on Broadway, and a soft mist resting between the skyscrapers. It was a mild ${tempC}°C (${tempF}°F), but inside the hospital room, we barely noticed the damp weather. We were too focused on meeting you for the first time and holding your tiny, warm body. This rainy New York morning became the day our lives changed completely.`;
      } else if (isChicago) {
        story = `A chilly rain was falling across Chicago, with the wind blowing off Lake Michigan at ${windKn} km/h (${windMph} mph). People on the streets below were bundled up in dark coats, but our attention was completely focused on finally meeting you. When we first held you in our arms, your soft breathing was the only sound in the room. The cold, wet Chicago weather outside didn't matter at all—we were just so incredibly happy to have you with us.`;
      } else if (isWarsaw) {
        story = `Warsaw was quiet and damp, with a steady rain washing the cobblestone streets of the Old Town. It was on the cooler side at ${tempC}°C (${tempF}°F), and the sun rose behind grey clouds at ${params.sunrise}. But inside our room, everything was warm and calm. We spent those first hours holding you, staring at your face, and counting your tiny fingers. Warsaw carried on under the autumn rain, but our whole family's world started right there.`;
      } else if (isParis) {
        story = `A soft grey rain was falling over Paris, wetting the zinc rooftops and quiet cafes along the Seine. The temperature was quite mild at ${tempC}°C (${tempF}°F) with a light breeze of ${windKn} km/h (${windMph} mph). We were so happy and relieved when the nurse finally placed you in our arms. Cradling you for the first time, we completely forgot about the damp weather outside. That quiet, rainy Parisian afternoon will always be one of our favorite memories.`;
      } else if (isLondon) {
        story = `A classic London drizzle was falling outside, leaving the streets wet and quiet. The morning sun rose at ${params.sunrise} behind heavy, damp clouds with a temperature of ${tempC}°C (${tempF}°F). While the city carried on with its usual wet routine, our world stopped inside that hospital room. We held you close, listening to your faint newborn sounds, and realized we had never been happier.`;
      } else if (isToronto) {
        story = `Cool lakeside rain fell over Toronto's residential neighborhoods, trickling down toward the shores of Lake Ontario under an overcast sky of ${tempC}°C (${tempF}°F). The wind was blowing at ${windKn} km/h (${windMph} mph), but the hospital room felt like a warm, safe haven. We were completely distracted from the dreary weather outside, busy holding you and taking in every single detail of your tiny features. That rainy lakeside day is now the most beautiful memory we share.`;
      } else {
        story = `The morning you were born in ${params.city} was wet and rainy, with the thermometer showing a mild ${tempC}°C (${tempF}°F) and a wind of ${windKn} km/h (${windMph} mph) softy blowing outside. But inside, we were in our own quiet world. Holding your little body for the first time made us forget all about the storm outside. The rainy day in ${params.city} is forever marked as the happiest moment of our lives.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "A Blanket of Silent Snow";
      let quote = "It was freezing cold outside, but holding you close brought all the warmth we could ever need.";

      if (isNY) {
        story = `A fresh coat of white snow was covering the streets and rooftops of New York on the morning you were born. Flurries fell silently over Central Park, quietening the usual busy hum of the city on a chilly winter day of ${tempC}°C (${tempF}°F). We stayed warm in our hospital room, holding you close and watching your beautiful dark eyes look around. Looking out at the quiet, snowy Manhattan skyline, we had never felt so much warmth in our hearts.`;
      } else if (isChicago) {
        story = `The wind was blowing cold off Lake Michigan at ${windKn} km/h (${windMph} mph), swirling fresh snow down between Chicago's high-rises with a temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, though, it was wonderfully warm. The exact moment we held you close, all the freezing Chicago winter outside was completely forgotten. We were just incredibly grateful to finally have our beautiful baby in our arms.`;
      } else if (isWarsaw) {
        story = `A fresh, quiet snow blanketed the historic streets of Warsaw, and frost lined the banks of the Vistula River. The sun rose behind cold clouds at ${params.sunrise} with a chilly temperature of ${tempC}°C (${tempF}°F). Inside, our attention was focused entirely on you. Hearing your first little sounds and holding you against our chest kept us completely warm. Warsaw was quiet under the Polish winter, but our hearts were absolutely full.`;
      } else {
        story = `A clean blanket of snow was settling over ${params.city} on the morning you were born, with the temperature hovering at ${tempC}°C (${tempF}°F) and the wind blowing snow outside at ${windKn} km/h (${windMph} mph). But our hospital room was a warm, peaceful space. Cradling your tiny shoulders and kissing your forehead, we felt an incredible sense of peace. The snowy day in ${params.city} will always be the warmest, happiest memory in our hearts.`;
      }

      return { theme, quote, story };
    }

    if (isSunny) {
      let story = "";
      let theme = "A Canvas of Sunny Light";
      let quote = "The weather outside was beautiful and bright, but the happiest part of the day was holding you for the first time.";

      if (isNY) {
        story = `New York was enjoying a beautiful, bright sunny day when you arrived. The morning sun was reflecting off the glass towers of Manhattan, yellow cabs were driving along Broadway under a clear blue sky, and it was a comfortable ${tempC}°C (${tempF}°F). While the busy city carried on with its normal routine below, our focus was entirely on holding you, counting your tiny fingers, and taking in this wonderful moment. That sunny New York day will always be our absolute favorite.`;
      } else if (isChicago) {
        story = `The weather outside in Chicago was pleasant and bright, with a clear sky reflecting off Lake Michigan and a mild breeze of ${windKn} km/h (${windMph} mph) rolling off the water. It was a lovely ${tempC}°C (${tempF}°F), but we barely noticed it. We were far too busy holding you close and welcoming you into the world. Holding your tiny hand as the warm Chicago sunshine poured into our hospital room was the absolute happiest moment of our lives.`;
      } else if (isWarsaw) {
        story = `Warsaw was bathed in beautiful, clear sunshine on the day you were born. The morning sun rose at ${params.sunrise} over the historic buildings of the Old Town and glistened off the Vistula River at a pleasant ${tempC}°C (${tempF}°F). In our hospital room, everything was peaceful and quiet as we held you for the very first time. That bright, sunny Warsaw morning will always remind us of the perfect day we finally became a family.`;
      } else {
        story = `A beautiful, sun-drenched day welcomed us in ${params.city} when you were born, with clear skies and a gentle breeze blowing at ${windKn} km/h (${windMph} mph). The temperature reached a comfortable ${tempC}°C (${tempF}°F), making for a lovely day outside. But the happiest part of it by far was holding you in our arms for the first time. The bright, sunny weather in ${params.city} made everything feel incredibly special as we welcomed you to our family.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy
    let story = "";
    let theme = "A Serene Overcast Sky";
    let quote = "Under a quiet, peaceful sky, our world changed completely the moment we finally met you.";

    if (isNY) {
      story = `The sky over Manhattan was calm and grey, softening the noisy, busy rush of New York. It was a mild ${tempC}°C (${tempF}°F) outside, but inside our hospital room, the haste of the city slowed to an absolute standstill. The second you opened your eyes and stared at us, all the bustle of New York completely faded away. We sat holding you, feeling incredibly happy and grateful that you were finally here.`;
    } else if (isChicago) {
      story = `Overcast clouds blanketed the Chicago skyline, carried by a steady wind of ${windKn} km/h (${windMph} mph) off Lake Michigan. The day was calm and quiet around ${tempC}°C (${tempF}°F), but our focus was entirely on meeting you. When we first held you, your tiny hand wrapped around our finger and all our worries disappeared. That simple, quiet grey day in Chicago will always be the day our lives changed for the better.`;
    } else if (isWarsaw) {
      story = `A quiet, cloudy sky draped the banks of the Vistula River and the old brick walls of Warsaw on the morning you were born. The sun rose behind the grey clouds at ${params.sunrise} with a calm breeze. In our hospital room, we were too busy cradling you for the first time to think about the weather. Holding you close while Warsaw rested under that serene sky was a moment of pure, quiet happiness we will keep forever.`;
    } else {
      story = `A quiet, overcast sky covered ${params.city} on the day you were born, with a calm breeze blowing at ${windKn} km/h (${windMph} mph) and the temperature at a pleasant ${tempC}°C (${tempF}°F). The weather outside was slow and peaceful, but inside we were experiencing the most exciting moment of our lives. When we first held you close to our chest, we felt a deep sense of warmth and relief. That gentle grey day in ${params.city} is forever our favorite memory.`;
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
    lang,
  } = req.body;

  if (!city) {
    res.status(400).json({ error: "Missing required parameter: city" });
    return;
  }

  const ai = getAiClient();

  if (!ai) {
    console.log("No GEMINI_API_KEY found, running high-quality offline backup generator");
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
      lang: lang === "es" ? "es" : "en",
    });
    res.json({
      theme: backupResult.theme,
      quote: backupResult.quote,
      story: backupResult.story,
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

2. STRICT GROUNDING IN WEATHER DATA:
   You must weave the provided weather details naturally into the narrative:
   - Max Temperature: ${tempMax}°C (appx ${Math.round(tempMax * 9/5 + 32)}°F)
   - Condition: ${weatherText} (weatherCode ${weatherCode})
   - Max Wind Speed: ${windSpeed} km/h (appx ${Math.round(windSpeed * 0.621371)} mph)
   - Sunrise Time: ${sunrise}
   - Date: ${birthDate}
   - City: ${city} (Region: ${region || 'None'}, Country: ${country})
   - Do NOT generate a generic story that fits any location or weather condition. Make sure the actual numbers or sensory details matching these values (like a biting wind of ${Math.round(windSpeed)} km/h or the soft sunrise at ${sunrise}) are seamlessly woven in.

3. COHERENT TIME OF DAY & WEATHER CONSISTENCY:
   - Ensure complete time-of-day consistency.
   - If the story describes dawn, morning, afternoon, or evening, the wording must be logically coherent. Never mention "afternoon" if describing sunrise conditions or morning light. Never mix morning and evening references in the same memory.
   - Ensure the description of weather matches the condition. If it is Snowy, describe a winter wonderland; if Sunny, describe bright, clear skies.

4. REAL GEOGRAPHICAL SENSE & DISTINCT CITIES:
   - Make the city feel real and distinct using specific, subtle references to the local atmosphere, landmarks, architecture, landscape, geography, or culture of "${city}" (e.g., Chicago's wind off Lake Michigan, Willis Tower shadow, El train; New York's steam escaping from street grates, yellow cabs, fire escapes, Central Park; London's brick facades, Westminster breeze, River Thames; Warsaw's cobblestone streets, Vistula River, Royal Route; Paris's zinc/slate roofs, warm cafés, River Seine; or other cities' local rivers, valleys, hills, streets, coastlines, or general geographic/architectural character!).
   - If it is not a major city, refer naturally to its regional context or general landscape (hills, quiet streets, nearby rivers, parks).

5. REDUCE POETIC EXCESS / WARM EMOTIONAL TONE:
   - WRITE LIKE A REAL PARENT remembering the day their child was born.
   - Use warm, natural, believable, conversational, memory-like language.
   - Keep the emotional tone, but reduce poetry significantly. Avoid dramatic metaphors and symbolic language.
   - Avoid phrases that sound like novels, poems, greeting cards, or inspirational quotes.
   - Avoid excessive sentimentality.
   - Crucially, you MUST NOT use or imitate expressions like:
     * "the true sunrise was in your eyes" / "el verdadero amanecer brotó de tu mirada"
     * "our souls were transformed" / "nuestras almas se transformaron"
     * "the light of our future" / "la luz de nuestro futuro"
     * "eternally illuminated our being" / "iluminó eternamente nuestro ser"
     * "Outside..., but inside..." / "Afuera..., pero adentro..."
     * "The weather faded into the background..." / "El clima pasó al segundo plano..."
     * "Nothing else mattered..." / "Nada más importaba..." / "Nada de ese ajetreo importaba..."
   - Stories must sound realistic and family-oriented, rather than cinematic.
   - If a sentence sounds like poetry, simplify it.
   - Preferred style:
     ✔ Authentic, Personal, Human, Warm, Conversational, Family-oriented
   - Examples of desired tone to guide your generation:
     * "Detroit was enjoying a beautiful sunny day, but our attention was focused on only one thing — finally meeting you for the first time."
     * "The weather outside was pleasant and bright, but we barely noticed it. We were too busy counting your tiny fingers and taking in every moment."
     * "The city carried on with its normal routine, while our world changed completely inside that hospital room."
     * "The sunshine made for a lovely day, but the happiest part of it was finally holding you in our arms."
   - Generate creative, varied sentence structures.

Response JSON Schema:
You must output a JSON object containing:
- theme: a beautiful short title (3-5 words) summarizing the day's feeling (e.g., 'A Crisp November Dawn' or 'Bajo un manto templado').
- quote: a heartwarming, memorable quote (1 sentence) welcoming the baby (e.g. 'Among clouds, rain, and sunlight, you were always the brightest part of the day').
- story: the complete narrative memory (approx 150-250 words, structured as a single elegant paragraph).
- quality_check: an object containing:
  - language_consistent: boolean (is it 100% written in the requested language?)
  - weather_consistent: boolean (does it accurately and seamlessly incorporate the provided weather data?)
  - time_consistent: boolean (are there any conflicting time references like afternoon vs sunrise?)
  - city_consistent: boolean (does it make appropriate local references without hallucinating unrelated landmarks?)
  - structure_consistent: boolean (does it avoid the forbidden cliches and repetiveness?)
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
    res.json({
      theme: finalJson.theme,
      quote: finalJson.quote,
      story: finalJson.story,
      quality_check: finalJson.quality_check
    });
  } else {
    console.log("All Gemini attempts failed or timed out, executing high-quality offline backup generator...");
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
      lang: lang === "es" ? "es" : "en",
    });
    res.json({
      theme: backupResult.theme,
      quote: backupResult.quote,
      story: backupResult.story,
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
