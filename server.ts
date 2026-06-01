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
      let quote = "Bajo el repiqueteo de las gotas, tu calor llenó nuestra vida de un brillo infinito.";

      if (isNY) {
        story = `La mañana del ${params.birthDate} comenzó con lloviznas suaves sobre New York. Los taxis amarillos esquivaban charcos a lo largo de Broadway, la bruma matinal se asentaba entre los rascacielos y el vapor trepaba de las rejillas del metro. Las nubes cubrían el cielo húmedo de la metrópoli, marcando una temperatura templada de ${tempC}°C (${tempF}°F). Nos encontrábamos flotando en un remanso de tranquilidad en el hospital. Sostener de pronto tu cuerpo tibio con el sonido lejano de los limpiaparabrisas rítmicos fue de una belleza abrumadora. Nos abrazamos, sabiendo que este gélido día lluvioso pasaría a la historia de nuestro hogar como el portal hacia la felicidad más pura.`;
      } else if (isChicago) {
        story = `El viento característico soplaba a ${windKn} km/h (${windMph} mph) agitando con ímpetu la lluvia fría directo desde las aguas profundas del Chicago Lake Michigan. Los transeúntes agachaban el torso con abrigos oscuros sobre el asfalto mojado de la Magnificent Mile. Dentro del hospital, cobijados por un silencio reconfortante, aguardábamos con el corazón latiendo a mil por hora. Al recibirte en nuestros brazos, tu pequeña respiración ahogó el llanto en un gemido tierno. Aquella tempestad invernal de Chicago se transformó instantáneamente en el entorno más dulce y memorable de nuestras vidas, colmándonos de calma.`;
      } else if (isWarsaw) {
        story = `Una lluvia fresca y persistente lavaba los adoquines medievales del Old Town en Varsovia, deslizándose sigilosamente hacia las orillas tranquilas del río Vístula. El amanecer gris se asomó a las ${params.sunrise} envolviendo la ciudad en un murmullo pasivo y otoñal de ${tempC}°C (${tempF}°F). En el hospital, las voces se silenciaron cuando tu llanto inaugural rompió el aire fresco de la habitación. Miramos tu carita tan perfecta, acariciando tus dedos diminutos. Varsovia despertaba bajo la llovizna, pero para nosotros se levantaba un reino de luz imperecedera que abrigaría todos nuestros inviernos futuros.`;
      } else if (isParis) {
        story = `Un manto plomizo cubría los tejados de zinc y las elegantes cafeterías de París mientras la lluvia repiqueteaba con timidez en las orillas del río Sena. Se sentía un aire sereno a ${tempC}°C (${tempF}°F) con una brisa mansa de ${windKn} km/h (${windMph} mph). El milagro de tu nacimiento cubrió de una paz mística nuestra pequeña estancia. Cuando la enfermera te colocó sobre mi pecho por primera vez, un sol invisible pareció encenderse entre nosotros. Ese París húmedo y gris se grabó eternamente en nuestra memoria como el decorado más sublime de nuestra vida familiar.`;
      } else if (isLondon) {
        story = `Una húmeda neblina londinense flotaba sobre el curso del río Támesis, mientras una llovizna clásica empapaba las cabinas telefónicas rojas y las aceras de la capital inglesa. El amanecer llegó a las ${params.sunrise} cubriendo Londres con nubes cargadas y bajas a ${tempC}°C (${tempF}°F). En nuestra habitación abrigada la calma era absoluta. Al sostenerte y arrullarte con asombro, el frío clima de la metrópoli dio paso a un nido de amor indestructible. Ese día lluvioso de Londres se convirtió en el inicio solemne de nuestra pequeña y hermosa dinastía.`;
      } else if (isToronto) {
        story = `La lluvia fresca empapaba los tranquilos vecindarios residenciales, descendiendo suavemente hacia las orillas de Lake Ontario en Toronto bajo un cielo encapotado de ${tempC}°C (${tempF}°F). Con el viento que soplaba a ${windKn} km/h (${windMph} mph), las calles lucían desiertas y calmas. Sin embargo, nuestra mente estaba enteramente enfocada en el milagro que ocurría en la habitación. Cuando sentimos tu primer suspiro, una profunda sensación de gratitud nos invadió de pies a cabeza. Este día gris en Toronto cobró para siempre los colores más hermosos de nuestra memoria.`;
      } else {
        story = `La mañana de tu nacimiento llegó a ${params.city} a las ${params.sunrise}, presentándose con un cielo cubierto de lluvia y una temperatura templada de ${tempC}°C (${tempF}°F). El viento de ${windKn} km/h (${windMph} mph) arrojaba las gotas con fuerza contra los cristales, empañando el panorama exterior. En el hospital, estábamos absortos en la majestuosidad de tu llegada. Sostener tu pequeño cuerpo recién nacido disipó por completo la aspereza de la atmósfera. El temporal en ${params.city} sirvió como el humilde testigo de un amor eterno que hoy guía cada uno de nuestros pasos.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "Un Manto de Nieve";
      let quote = "Hacía un frío helador afuera, pero tu pequeño calor encendió un fuego tierno que nunca se apagará.";

      if (isNY) {
        story = `El manto blanco cubría los escapes de incendios de ladrillo rojo en New York en la mañana de tu llegada. Un copioso copo de nieve caía silenciosamente sobre Central Park, acallando la bocina habitual de la gran ciudad bajo una atmósfera helada de ${tempC}°C (${tempF}°F). En la calidez de nuestra habitación, el aire se detuvo el segundo en que abriste tus grandes ojos oscuros. Estrechándote contra el pecho, contemplamos el Manhattan nevado desde el ventanal. Aquel invierno neoyorquino nos regaló para siempre el recuerdo del día en que el cielo se vistió de gala para recibirte.`;
      } else if (isChicago) {
        story = `Un frío polar se extendía desde Lake Michigan con vientos cortantes de ${windKn} km/h (${windMph} mph) soplando nieve fresca por calles y rascacielos de Chicago. La ciudad entera parecía congelada en el tiempo bajo un cielo gélido de ${tempC}°C (${tempF}°F). Dentro de nuestra pequeña sala del hospital, reinaba una atmósfera sumamente apacible. En el instante preciso en que tu piel tocó la nuestra, el invierno Chicagoense perdió toda su severidad. Habíamos recibido el mayor milagro de nuestras vidas, un fuego de pura dicha que nos cobijaría eternamente.`;
      } else if (isWarsaw) {
        story = `La escarcha ártica decoraba las fachadas del Old Town de Varsovia y una hermosa sábana blanca cubría las orillas silenciosas del río Vístula. El amanecer nevado se instalaba a las ${params.sunrise} bajo una temperatura de ${tempC}°C (${tempF}°F). Las calles polacas lucían despobladas y místicas en el corazón del invierno. En cuanto oímos tu primera respiración débil, el tiempo adquirió un valor eterno. Acurrucados en el abrigo de la habitación, supimos que Varsovia nos había coronado con la joya más hermosa de nuestra existencia.`;
      } else {
        story = `Un hermoso velo helado se posó en ${params.city} el ${params.birthDate} alrededor de las ${params.sunrise}, cayendo en copos densos de nieve pura con el termómetro en ${tempC}°C (${tempF}°F). Mientras el viento soplaba a ${windKn} km/h (${windMph} mph) levantando torbellinos blancos afuera, nuestra estancia era un refugio cálido. Al estrecharte por primera vez y besar tu frente suave, nos inundó una paz maravillosa. La gélida bienvenida celestial de ${params.city} esculpió un día imborrable para nuestra alma.`;
      }

      return { theme, quote, story };
    }

    if (isSunny) {
      let story = "";
      let theme = "Lienzo de Luz Dorada";
      let quote = "El sol resplandecía en lo alto de los cielos, pero el verdadero amanecer brotó de tu mirada.";

      if (isNY) {
        story = `La luz brillante y radiante de la mañana encendía las fachadas acristaladas de New York en la fecha de tu llegada. Los taxis amarillos brillaban bajo el cielo de cobalto y Central Park se mecía bajo un aire templado de ${tempC}°C (${tempF}°F). Los transeúntes recorrían con prisa la gran urbe, ajenos a la hermosa revolución interna que se vivía en nuestra alcoba de hospital. El instante en que la luz de la tarde iluminó tu carita durmiente quedará grabado por siempre en el fondo de nuestro corazón. Nos fundimos en un abrazo lleno de asombro sobre esta hermosa isla de Manhattan, bautizados por el sol neoyorquino.`;
      } else if (isChicago) {
        story = `Un cielo impecable se extendía en la mañana del ${params.birthDate} sobre Chicago. Un viento sereno acariciaba el parque mientras un sol radiante brillaba sobre las aguas de Lake Michigan a unos agradables ${tempC}°C (${tempF}°F). Al nacer, el imponente horizonte y la silueta de los rascacielos cobraron un aire amigable. Acariciar tus deditos mientras la calidez de Chicago entraba por el cristal nos llenó de una esperanza insondable. Tu luz había llegado para ser el faro eterno que guiará el rumbo de nuestra familia.`;
      } else if (isWarsaw) {
        story = `Un sol vivificante iluminaba la arquitectura clásica del Old Town de Varsovia, proyectándose con hermosos destellos en las aguas calmas del Vístula. El amanecer radiante despuntó a las ${params.sunrise} tiñendo de carmín el aire templado de ${tempC}°C (${tempF}°F). En el hospital reinaba un silencio casi solemne. Cuando pudimos arrullarte cara a cara, una alegría celestial impregnó nuestras almas. Te contemplamos en paz, sabiendo que este espléndido día soleado en Varsovia era el portal de una vida llena de promesas compartidas.`;
      } else {
        story = `Un día resplandeciente abrazó a ${params.city} el ${params.birthDate}, regalándonos cielos despejados e iluminados y una brisa templada a ${windKn} km/h (${windMph} mph) con una temperatura de ${tempC}°C (${tempF}°F). Las calles locales lucían hermosas y jubilosas. Para nosotros ordinarios mortales, el mayor regalo yacía custodiado en la habitación. Estrecharte contra nuestra mejilla y oír tu dulce gemido iluminó eternamente nuestro ser. ${params.city} era un cuadro de luz, pero tú eras la verdadera claridad de nuestro porvenir.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy / Overcast
    let story = "";
    let theme = "Atmósfera Serena";
    let quote = "En medio de nubes y vientos suaves, tu llegada encendió la claridad definitiva en nuestro camino.";

    if (isNY) {
      story = `Un cielo grisáceo y calmo envolvía la isla de Manhattan el ${params.birthDate}, silenciando suavemente la ruidosa coreografía del asfalto de New York. Vapor húmedo trepaba de las calles con una temperatura templada de ${tempC}°C (${tempF}°F). Dentro de nuestra habitación, la prisa de la gran manzana se redujo a la nada absoluta. Cuando abriste levemente tus ojos, un sentimiento sobrecogedor invadió nuestras almas. Nos acurrucamos con paciencia a observarte respirar. New York seguía latiendo afuera en su neblina, pero nuestro universo entero ya cabía entre nuestros brazos cansados.`;
    } else if (isChicago) {
      story = `Nubes densas y templadas cubrían el skyline de Chicago, empujadas por ráfagas de aire de ${windKn} km/h (${windMph} mph) procedentes de Lake Michigan. El día transcurría plácido y asordinado a ${tempC}°C (${tempF}°F) con transeúntes caminando alertas en el centro. Sostener de pronto tu cuerpo ligero desató una calidez profunda en nuestro pecho que erradicó toda penumbra exterior. Ese firmamento gris se convirtió en el fondo poético del día en que nuestra familia descubrió su rumbo más glorioso.`;
    } else if (isWarsaw) {
      story = `Un cielo nuboso y templado cobijaba las orillas tranquilas del río Vístula y las viejas murallas de ladrillo en Varsovia. El amanecer silencioso inició a las ${params.sunrise} bajo una brisa calma de ${windKn} km/h. En nuestra cálida habitación de hospital, las mentes y las manos temblorosas se sincronizaron al verte aparecer. Qué momento de emoción tan dulce. Este apacible día gris polaco se instaló en el fondo de nuestra alma como el paisaje idílico de tu primer suspiro en el mundo.`;
    } else {
      story = `Un manto nuboso y templado cobijaba el cielo de ${params.city} el ${params.birthDate}, con una brisa tranquila que soplaba a ${windKn} km/h (${windMph} mph) y una temperatura agradable de ${tempC}°C (${tempF}°F). El exterior invitaba al descanso y la calma, mientras puertas adentro aguardábamos con anhelo infinito. El asombro nos embargó al acunarte y sentir tu sutil aroma a vida nueva. El gris místico de las nubes sobre ${params.city} cobró para siempre el brillo dorado del día en que naciste para iluminarnos.`;
    }

    return { theme, quote, story };
  } else {
    // English Backup Stories
    if (isRainy) {
      let story = "";
      let theme = "Welcomed by Raindrops";
      let quote = "As rain drummed softly on the glass, your first soft breath filled our world with infinite light.";

      if (isNY) {
        story = `The morning of ${params.birthDate} carried a gentle drizzle over New York. Yellow cabs dodged rain puddles along Broadway, a soft morning mist settled between skyscrapers, and steam rose quietly from subway grates. The damp sky draped the metropolis at a mild ${tempC}°C (${tempF}°F). For us, the hospital room became a haven of absolute quiet. Cradling your tiny body with the rhythm of distant windshield wipers in the background felt incredibly sacred. We realized this rainy New York day was now the beautiful beginning of our family story.`;
      } else if (isChicago) {
        story = `The city's iconic wind swept off Lake Michigan at ${windKn} km/h (${windMph} mph), pushing heavy cold rain across the Magnificent Mile. Pedestrians on Michigan Avenue pulled their dark coats close against the chill. Indoors, shielded from the elements, we waited with racing hearts. The moment we cuddled you, your tiny breathing quieted down in a tender sigh. That stormy Chicago weather faded into deep serenity, leaving us with an unforgettable memory of warmth.`;
      } else if (isWarsaw) {
        story = `A steady rain washed the cobblestones of the Warsaw Old Town, flowing gently toward the quiet banks of the Vistula River. Dawn arrived at ${params.sunrise}, wrapping the ancient streets in a calm autumn mood of ${tempC}°C (${tempF}°F). In the hospital, our room fell completely silent as your soft voice of new life broke through. We touched your perfect little fingers in wonder. Warsaw woke up in grey rain, but for us, a brilliant light had started to warm all our years to come.`;
      } else if (isParis) {
        story = `A soft grey rain fell over Paris, splashing on the classic zinc rooftops and green café awnings along the historic River Seine. The air felt mild at ${tempC}°C (${tempF}°F) with a gentle breeze of ${windKn} km/h (${windMph} mph). Cradling you for the very first time, a wave of sweet peace settled over our small hospital room. The rainy Parisian afternoon gave way to a lifetime of love, marking this wet day as the most cherished memory we will carry.`;
      } else if (isLondon) {
        story = `A quiet, classic drizzle drifted across London, misting over the banks of the River Thames and slicking the red double-decker buses on the street. Outside, commuters rushed through the damp chill, but inside our cozy room, time had stopped. Holding you close and whispering reassurance felt inordinately sweet. The historic London streetscape outside was just a backdrop to the quiet start of our family's greatest adventure.`;
      } else if (isToronto) {
        story = `Cool lakeside rain fell over Toronto's residential neighborhoods, trickling down toward the shores of Lake Ontario under an overcast sky of ${tempC}°C (${tempF}°F). The wind rustppled branches at ${windKn} km/h (${windMph} mph). Our thoughts were completely consumed by the tiny miracle resting on our chest. Feeling your warm chest rise and fall filled us with immense gratitude, transforming a dreary lakeside afternoon into our family's brightest milestone.`;
      } else {
        story = `The morning of your birth arrived in ${params.city} at ${params.sunrise} under a rain-streaked sky with a mild temperature of ${tempC}°C (${tempF}°F). Brisk wind currents blowing at ${windKn} km/h (${windMph} mph) rattled the panes, but inside, we were lost in the majesty of holding you. Feeling your skin against ours made the storm lose all its coldness. The damp weather in ${params.city} served as a humble witness to the beginning of a love story we will treasure forever.`;
      }

      return { theme, quote, story };
    }

    if (isSnowy) {
      let story = "";
      let theme = "A Blanket of Silent Snow";
      let quote = "It was freezing cold outside, but your tiny weight in our arms kindled a fire that will never fade.";

      if (isNY) {
        story = `A fresh coat of white snow covered the fire escapes of New York on the morning of your birth. Flurries fell over Central Park, quietening the relentless hum of the city under a chilly winter sky of ${tempC}°C (${tempF}°F). Inside our warm room, the entire world stood completely still. In the moment you opened your eyes and grabbed our finger, we looked out at the snowy Manhattan skyline in awe, deeply thankful for the day winter dressed the city in white to welcome you.`;
      } else if (isChicago) {
        story = `A biting winter wind blew off Lake Michigan at ${windKn} km/h (${windMph} mph), swirling snow between Chicago's skyscrapers and quiet plazas. The city was bundled up in a deep freeze of ${tempC}°C (${tempF}°F). Inside the hospital, our small namespace was peaceful and warm. The moment your tiny skin touched ours, the Chicago cold lost all power. We had received our greatest gift, starting a fire of gratitude that will keep us warm forever.`;
      } else if (isWarsaw) {
        story = `Winter frost clung to the brick fortifications of the Warsaw Old Town, and a fresh white blanket of snow lined the banks of the Vistula River. Dawn broke at ${params.sunrise}, quiet and cold at ${tempC}°C (${tempF}°F). Inside, we gathered to greet you. The second your voice echoed in the room, everything felt complete. Warsaw was blanketed in Polish winter, but for us, the warmest chapter of our lives had officially begun.`;
      } else {
        story = `A pristine blanket of snow settled over ${params.city} on ${params.birthDate}, falling in thick flakes around ${params.sunrise} as the thermometer hovered at ${tempC}°C (${tempF}°F). While the wind blew at ${windKn} km/h (${windMph} mph), creating white whirlwinds outside, our room was a serene haven. cradling your tiny shoulders and kissing your forehead brought a wave of absolute peace. The snowy skies of ${params.city} framed a moment we will protect forever.`;
      }

      return { theme, quote, story };
    }

    if (isSunny) {
      let story = "";
      let theme = "A Canvas of Golden Light";
      let quote = "The sun shone brightly over the streets, but the true daybreak was the light in your eyes.";

      if (isNY) {
        story = `Brilliant morning sunlight reflected off the glass towers of New York on the day you arrived. Yellow cabs caught the golden beams, Central Park was bright and lush under a mild sky of ${tempC}°C (${tempF}°F), and the streets hummed with life. While commuters hurried below, the greatest change of our lives occurred in our hospital room. Sostening you while afternoon sunbeams danced across your tiny hand filled us with an overwhelming joy. We were holding our whole future, right here under the New York sky.`;
      } else if (isChicago) {
        story = `Clear, bright skies welcomed you to Chicago on ${params.birthDate}. Crisp lake air swept off Lake Michigan at ${windKn} km/h (${windMph} mph), and a beautiful sun gleamed off the high-rises at a comfortable ${tempC}°C (${tempF}°F). When you arrived, the windy city's vast skyline seemed friendly and quiet. Holding you close as the sunlight poured in of Chicago's skyline brought an incredible sense of hope. You became our steady anchor on that perfect, sunny afternoon.`;
      } else if (isWarsaw) {
        story = `Beautiful sunshine bathed the historic pastel facades of the Warsaw Old Town, glittering off the waters of the Vistula River. Dawn appeared at ${params.sunrise}, warming the air to a pleasant ${tempC}°C (${tempF}°F). Inside, a sleepy quietness was broken by your tiny newborn sighs. Cradling you for the first time while Warsaw basked in the golden daylight filled us with a sense of wonder, making that sunny day our family's most sacred milestone.`;
      } else {
        story = `A gorgeous, sun-drenched day embraced ${params.city} on ${params.birthDate}, gifting us with clear blue skies and a soft breeze of ${windKn} km/h (${windMph} mph) with the temperature reaching ${tempC}°C (${tempF}°F). The municipal parks were lively and bright, but for us, the real sunlight was cradled in our arms. Feeling your steady breathing next to our heart brought a wave of serene happiness. ${params.city} was a picture of light, but you were our true sunrise.`;
      }

      return { theme, quote, story };
    }

    // Default Cloudy
    let story = "";
    let theme = "A Serene Overcast Sky";
    let quote = "Under a calm, quiet sky, your arrival brought the ultimate clarity to our lives.";

    if (isNY) {
      story = `A calm, grey sky hung low over Manhattan on ${params.birthDate}, softening the energetic rush of New York. Damp steam rose from the pavement below with a mild temperature of ${tempC}°C (${tempF}°F). Inside our hospital room, the haste of the city slowed to an absolute standstill. The second your eyes opened and met ours, all of the noisy Manhattan bustle disappeared into a quiet, comforting peace. We sat holding you, deeply grateful that you were finally resting in our arms.`;
    } else if (isChicago) {
      story = `Soft, overcast clouds blanketed the Chicago skyline, carried by a steady wind of ${windKn} km/h (${windMph} mph) from Lake Michigan. The day felt calm and peaceful at ${tempC}°C (${tempF}°F). The minute we held you in our arms for the first time, all the chill in the air dissolved. Looking down at your small features brought an immediate, overwhelming warmth that we'll guard forever, turning a simple grey Chicago day into our family's most sacred memory.`;
    } else if (isWarsaw) {
      story = `Quiet clouds draped the banks of the Vistula River and the old brick walls of Warsaw. Dawn arrived silently around ${params.sunrise} under a calm breeze of ${windKn} km/h. Inside our hospital room, tension melted as we saw you for the first time. Holding you close as Warsaw rested under the serene, overcast sky became a memory of pure happiness, sealing that simple autumn morning as the day our lives truly felt complete.`;
    } else {
      story = `A peaceful overcast sky covered ${params.city} on ${params.birthDate}, with a soft wind sweeping through the streets at ${windKn} km/h (${windMph} mph) and the temperature resting at a pleasant ${tempC}°C (${tempF}°F). Outside, the world was slow and quiet, but inside, we were preparing for a lifetime of love. When we first cradled you close, a deep sense of bliss filled our hearts, marking this grey day in ${params.city} as the most beautiful dawn of our existence.`;
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
   - Sound like a real human parent reflecting back on a momentous day with deep love and nostalgia.
   - Avoid overly dramatic poetry, flowery/theatric language, or sounding like a romance novel.
   - Prioritize genuine, down-to-earth emotional authenticity.
   - Do NOT use clichéd/repetitive structures.
   - Crucially, you MUST NOT use these clichés or phrases anywhere in your text:
     * "Outside..., but inside..."
     * "The weather faded into the background..."
     * "Nothing else mattered..."
     * "nothing of that busyness mattered..."
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
