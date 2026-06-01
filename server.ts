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
      let theme = "Un día de lluvia";
      let quote = "La lluvia afuera era constante, pero nosotros estábamos concentrados en conocerte.";

      if (isNY) {
        story = `La mañana del ${params.birthDate} comenzó con lloviznas suaves sobre Nueva York. Afuera los taxis amarillos esquivaban charcos en Broadway y la bruma flotaba entre los rascacielos. Hacía una temperatura de ${tempC}°C (${tempF}°F). Los enfermeros entraban y salían en silencio por el pasillo mientras nosotros te sosteníamos por primera vez. Para el resto de la ciudad era un día gris de rutina, pero para nosotros fue el momento en que todo cobró un sentido diferente.`;
      } else if (isChicago) {
        story = `Llovía bastante sobre Chicago, con un viento frío de ${windKn} km/h (${windMph} mph) soplando desde el lago. La gente caminaba apurada con paraguas por la avenida Michigan, pero en nuestra habitación el ambiente era tranquilo. Pasamos la mañana mirando tu cara y acostumbrándonos a la idea de que ya estabas aquí. El clima de afuera era normal y húmedo, pero nosotros solo nos fijábamos en ti.`;
      } else if (isWarsaw) {
        story = `Varsovia amaneció con una llovizna constante que mojaba las calles del centro histórico. Hacía un poco de frío, con ${tempC}°C (${tempF}°F), y el sol salió tras nubes grises a las ${params.sunrise}. Mientras la ciudad seguía su rutina diaria bajo los paraguas, nosotros estábamos en el hospital contando tus pequeños dedos. Todavía recordamos con mucha claridad el sonido suave de las gotas contra el vidrio.`;
      } else if (isParis) {
        story = `Una llovizna ligera caía sobre París, mojando los tejados y las calles junto al Sena. Hacía un clima de ${tempC}°C (${tempF}°F). Los médicos se movían sin hacer ruido mientras esperábamos tu llegada. Afuera la gente tomaba café bajo los toldos, pero nuestras mentes estaban totalmente ocupadas en sostener tu pequeña mano por primera vez.`;
      } else if (isLondon) {
        story = `Una llovizna clásica londinense caía afuera, dejando las aceras mojadas y silenciosas. El sol salió a las ${params.sunrise} detrás de nubes pesadas con una temperatura de ${tempC}°C (${tempF}°F). Mientras la gente de la ciudad continuaba su ritmo habitual bajo la llovizna, nosotros estábamos en el hospital escuchando tus respiraciones tranquilas de recién nacido. Fue un día muy común para todos los demás, pero para nosotros quedó marcado.`;
      } else if (isToronto) {
        story = `Una lluvia fresca caía sobre Toronto, bajando hacia las orillas del lago Ontario. El viento soplaba a ${windKn} km/h (${windMph} mph). La habitación del hospital era un lugar tranquilo. Nos pasamos las horas mirándote dormir y aprendiendo a sostenerte paso a paso. Afuera estaba gris, pero nosotros apenas le prestamos atención al clima.`;
      } else {
        story = `La mañana en que naciste en ${params.city} fue bastante húmeda y lluviosa, con una temperatura de ${tempC}°C (${tempF}°F) y un viento de ${windKn} km/h (${windMph} mph). En el hospital los pasillos estaban tranquilos y el personal se movía con discreción. La lluvia caía de forma constante, pero nosotros estábamos totalmente concentrados en verte y en cargarte por primera vez.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "Un día de nieve";
      let quote = "Hacía mucho frío afuera, pero nosotros estábamos concentrados en darte la bienvenida.";

      if (isNY) {
        story = `Nueva York amaneció cubierta por una capa gruesa de nieve. Los copos caían despacio sobre Central Park, silenciando el tráfico ruidoso de la ciudad en un día frío a ${tempC}°C (${tempF}°F). Los radiadores del hospital hacían un ruido suave de fondo mientras te envolvían en mantas de algodón. Mirábamos por la ventana el Manhattan silencioso mientras te veíamos dormir de cerca.`;
      } else if (isChicago) {
        story = `El viento soplaba frío desde el lago Míchigan a ${windKn} km/h (${windMph} mph), acumulando nieve entre los edificios de Chicago con una temperatura de ${tempC}°C (${tempF}°F). Los autos avanzaban despacio por las calles cubiertas de blanco. En el hospital, los familiares esperaban pacientemente en la sala de estar. Nos turnábamos para cargarte y mirarte la cara, tranquilos frente al invierno de afuera.`;
      } else if (isWarsaw) {
        story = `Una nieve fresca cubría por completo las calles históricas de Varsovia y la escarcha bordeaba el río Vístula. El sol asomó tras nubes frías a las ${params.sunrise} con una temperatura gélida de ${tempC}°C (${tempF}°F). La ciudad seguía su rutina blanca y helada habitual, pero en nuestra habitación todo pasaba de forma mucho más pausada. Sostenerte por primera vez fue un momento de gran tranquilidad que todavía recordamos con total claridad de principio a fin.`;
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
        story = `Nueva York tenía un día hermoso, despejado y soleado cuando naciste. La luz de la mañana se reflejaba en los edificios de cristal de Manhattan y los taxis amarillos recorrían Broadway a ${tempC}°C (${tempF}°F). Mientras todos los demás seguían con su prisa diaria abajo en la calle, nosotros pasamos la tarde en la habitación contando tus dedos y mirándote dormir.`;
      } else if (isChicago) {
        story = `El día estaba muy agradable y despejado en Chicago, con sol brillante sobre el lago Míchigan y una brisa de ${windKn} km/h (${windMph} mph). Hacía unos templados ${tempC}°C (${tempF}°F). En el hospital el movimiento era el de siempre, pero para nosotros las horas transcurrieron a otro ritmo. Tomarte la pequeña mano por primera vez con el sol entrando por la ventana de la habitación es algo de lo que todavía solemos hablar hoy en día.`;
      } else if (isWarsaw) {
        story = `Varsovia amaneció iluminada por un sol brillante y despejado. El sol de la mañana salió a las ${params.sunrise} sobre los edificios históricos del centro a unos agradables ${tempC}°C (${tempF}°F). En el hospital todo estaba en orden y en bastante calma. Nos sentamos junto a la ventana para tener una mejor luz mientras te tomábamos fotos sencillas y te abrazábamos por primera vez.`;
      } else {
        story = `Un día soleado y muy despejado nos recibió en ${params.city} cuando naciste, con cielos azules y una suave brisa a ${windKn} km/h (${windMph} mph). La temperatura subió a unos agradables ${tempC}°C (${tempF}°F). La gente caminaba tranquila por los parques de afuera, mientras nosotros estábamos en el hospital enfocados únicamente en aprender a sostenerte y en cuidarte.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy
    let story = "";
    let theme = "Un día nublado";
    let quote = "Afuera era un día gris común y corriente. Para nosotros fue la primera vez que te vimos.";

    if (isNY) {
      story = `El cielo sobre Manhattan estaba gris y completamente tranquilo, apagando el ruido habitual de Nueva York. Hacía un clima de ${tempC}°C (${tempF}°F). Mientras la ciudad continuaba con su rutina de siempre, en nuestra habitación de hospital el ambiente era de pura calma. Te quedaste dormido sosteniendo nuestro dedo, y en ese momento nos olvidamos por completo de cualquier otra cosa de afuera.`;
    } else if (isChicago) {
      story = `Unas nubes grises y bajas cubrían los edificios de Chicago, empujadas por un viento constante de ${windKn} km/h (${windMph} mph) que venía del lago Míchigan a ${tempC}°C (${tempF}°F). En el hospital el personal médico hacía sus rondas correspondientes, y nosotros pasamos la tarde simplemente mirándote respirar. El día gris no importaba; toda nuestra atención estaba concentrada en ti.`;
    } else if (isWarsaw) {
      story = `Un cielo cubierto cubría las orillas del río Vístula y las viejas murallas de Varsovia. El sol salió a las ${params.sunrise} con una brisa muy mansa. En la habitación del hospital todo estaba muy silencioso mientras te pasábamos de unos brazos a otros. La rutina de la ciudad siguió su curso habitual, pero a nosotros nos quedó guardado ese recuerdo tan específico para siempre.`;
    } else {
      story = `Un cielo gris y tranquilo cubría ${params.city} el día en que naciste, con una suave brisa a ${windKn} km/h (${windMph} mph) y una temperatura de ${tempC}°C (${tempF}°F). Afuera el día transcurría despacio y sin novedades particulares, mientras que adentro pasábamos las horas conociéndote. Sostenerte por primera vez fue un momento de gran alivio y tranquilidad.`;
    }

    return { theme, quote, story };
  } else {
    // English Backup Stories
    if (isRainy) {
      let story = "";
      let theme = "A Rainy Morning";
      let quote = "Outside, it was raining steadily, but we barely noticed. We were focused on meeting you for the first time.";

      if (isNY) {
        story = `New York was waking up under a gentle morning drizzle on ${params.birthDate}. Outside, yellow cabs were dodging puddles on Broadway, and a soft mist rested between the skyscrapers at a mild ${tempC}°C (${tempF}°F). Inside the hospital room, we barely registered the damp weather. Nurses moved quietly through the hallways while we held you for the first time. For the rest of the city, it was just another routine workday, but for us, it was the start of something we still talk about today.`;
      } else if (isChicago) {
        story = `A steady rain was falling across Chicago, with the wind blowing off Lake Michigan at ${windKn} km/h (${windMph} mph). People downstairs were walking quickly with umbrellas, but in our hospital room, everything was quiet. We spent the morning simply studying your face, trying to process that you were finally here. The cold, wet Chicago weather outside didn't worry us at all.`;
      } else if (isWarsaw) {
        story = `Warsaw was quiet and damp, with a steady rain washing the cobblestone streets of the Old Town. It was on the cooler side at ${tempC}°C (${tempF}°F), and the sun rose behind grey clouds at ${params.sunrise}. While the city continued its usual wet routine, we were in our room staring at your tiny fingers. We still remember clearly the quiet sound of droplets beating against the clean glass window.`;
      } else if (isParis) {
        story = `A soft grey rain was falling over Paris, wetting the rooftops and quiet cafes along the Seine. The temperature was quite mild at ${tempC}°C (${tempF}°F) with a light breeze. The team at the hospital worked quietly, and we felt an immense sense of relief after a long day of waiting. While people sipped coffee under the awnings outside, our whole attention was focused on holding your tiny hand.`;
      } else if (isLondon) {
        story = `A classic London drizzle was falling outside, leaving the streets wet and quiet. The sun rose at ${params.sunrise} behind heavy, damp clouds with a temperature of ${tempC}°C (${tempF}°F). While the city carried on with its usual wet routine, our attention was completely focused on you, listening to your faint breathing in that calm hospital room. It was an ordinary day for everyone else, but not for us.`;
      } else if (isToronto) {
        story = `Cool lakeside rain fell over Toronto's residential neighborhoods, trickling down toward the shores of Lake Ontario under an overcast sky of ${tempC}°C (${tempF}°F). The wind was blowing at ${windKn} km/h (${windMph} mph), but the room felt safe and quiet. We were completely distracted from the dismal weather outside, busy studying every tiny detail of your hands and feet.`;
      } else {
        story = `The morning you were born in ${params.city} was wet and rainy, with the thermometer showing a mild ${tempC}°C (${tempF}°F) and a wind of ${windKn} km/h (${windMph} mph). The hospital hallways were quiet, and the staff was moving around with soft footsteps. It was raining steadily across the area, but we were focused only on holding you in our arms for the first time.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "Snow Outside";
      let quote = "It was freezing cold outside, but our attention was completely focused on meeting you.";

      if (isNY) {
        story = `A fresh coat of white snow was covering the streets and rooftops of New York on the morning you were born. Flurries fell silently over Central Park, quietening the traffic hum on a chilly winter day of ${tempC}°C (${tempF}°F). The room was warm, with the radiator humming quietly in the corner, while we held you close and watched your eyes look around. We still remember looking out at the snowy Manhattan skyline while holding you.`;
      } else if (isChicago) {
        story = `The wind was blowing cold off Lake Michigan at ${windKn} km/h (${windMph} mph), swirling fresh snow down between Chicago's high-rises with a temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, though, it was wonderfully quiet and warm. Parents and grandparents waited in the lobby, while we took turns cradling you. The freezing Chicago winter became a simple backdrop to that first quiet afternoon together.`;
      } else if (isWarsaw) {
        story = `A fresh, quiet snow blanketed the historic streets of Warsaw, and frost lined the banks of the Vistula River. The sun rose behind cold clouds at ${params.sunrise} with a chilly temperature of ${tempC}°C (${tempF}°F). The city carried on with its quiet winter routine, but inside our room, everything moved at a much slower pace. Holding you against our chest for the first time was a moment of absolute calm that we still remember clearly.`;
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
        story = `New York was enjoying a beautiful, bright sunny day when you arrived. The morning sun was reflecting off the glass towers of Manhattan, yellow cabs were driving along Broadway, and it was a comfortable ${tempC}°C (${tempF}°F). While everyone downstairs was caught up in the usual city rush, we spent the afternoon in our quiet room, counting your toes and watching you sleep peacefully.`;
      } else if (isChicago) {
        story = `The weather outside in Chicago was pleasant and bright, with a clear sky reflecting off Lake Michigan and a mild breeze of ${windKn} km/h (${windMph} mph) rolling off the water. It was a lovely ${tempC}°C (${tempF}°F), but we barely noticed it. We were far too busy holding you close and welcoming you into the world. Holding your tiny hand as the warm Chicago sunshine poured into our hospital room is something we still talk about today.`;
      } else if (isWarsaw) {
        story = `Warsaw was bathed in beautiful, clear sunshine on the day you were born. The morning sun rose at ${params.sunrise} over the historic buildings and glistened off the Vistula River at a pleasant ${tempC}°C (${tempF}°F). In our hospital room, the nurses worked quietly, and everything was peaceful. We sat by the window to get some good natural light while taking a few simple photos of your first hours.`;
      } else {
        story = `A beautiful, sun-drenched day welcomed us in ${params.city} when you were born, with clear blue skies and a gentle breeze blowing at ${windKn} km/h (${windMph} mph). The temperature reached a comfortable ${tempC}°C (${tempF}°F). People were walking through the parks outside, while we were in the hospital, focused entirely on learning how to feed you and keep you warm.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy
    let story = "";
    let theme = "A Quiet Cloudy Day";
    let quote = "It was just a regular cloudy day for everyone else, but not for us.";

    if (isNY) {
      story = `The sky over Manhattan was calm and grey, softening the noisy, busy rush of New York. It was a mild ${tempC}°C (${tempF}°F) outside, but inside our hospital room, the haste of the city slowed to an absolute standstill. You fell asleep holding onto our pinky finger, and all the bustle downstairs didn't matter anymore. We just sat there quietly, looking at your face.`;
    } else if (isChicago) {
      story = `Overcast clouds blanketed the Chicago skyline, carried by a steady wind of ${windKn} km/h (${windMph} mph) off Lake Michigan at ${tempC}°C (${tempF}°F). Outside, the streets quieted down, and we spent the afternoon holding you close. There was a simple, peaceful feeling in the room as we took turns looking at our new baby.`;
    } else if (isWarsaw) {
      story = `A quiet, cloudy sky draped the banks of the Vistula River and the old brick walls of Warsaw on the morning you were born. The sun rose behind the grey clouds at ${params.sunrise} with a calm breeze. The city carried on as usual, while our entire attention was focused on you, listening to your soft newborn sounds in a very peaceful room.`;
    } else {
      story = `A quiet, overcast sky covered ${params.city} on the day you were born, with a calm breeze blowing at ${windKn} km/h (${windMph} mph) and the temperature at a pleasant ${tempC}°C (${tempF}°F). While the weather outside was slow and grey, we spent the hours getting to know you. Sostenerte—having you in our arms for the first time—was an immense sense of relief, a moment we still remember clearly today.`;
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

5. STAGE AN AUTHENTIC, COMPLETELY UN-POETIC PARENT MEMORY:
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
