import { ParentContext, ClothingSuggestion, SurvivalForecastItem } from "../types";

// Dynamic WMO Weather Code Translator
export function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return "Pristine Sun (Prepare SPF 100)";
    case 1: return "Partly Splendid";
    case 2: return "Suspiciously Quiet Sky";
    case 3: return "Total Overhead Comfy Blanket";
    case 45:
    case 48: return "Coffee Fog & Human Fog";
    case 51:
    case 53:
    case 55: return "Nuisance Drizzle (Mist-ical)";
    case 61:
    case 63:
    case 65: return "Actual Rain (Messy Mud Physics)";
    case 66:
    case 67: return "Spicy Freezing Rain";
    case 71:
    case 73:
    case 75: return "Magical Snow (High Hot-Cocoa Demand)";
    case 77: return "Frosted Crunchy Grass";
    case 80:
    case 81:
    case 82: return "Surprise Showers (Quick, grab the stroller raincover!)";
    case 85:
    case 86: return "Sleet/Mini Snowstorm";
    case 95: return "Banging Thunderstorm (Blanket Fort Safezone)";
    case 96:
    case 99: return "Slightly Dramatic Storm";
    default: return "Undecided Weather (Roll for initiative)";
  }
}

// Map weather conditions to cozy lifestyle mood labels for the weekly forecast
export function getMoodLabelForCode(code: number): string {
  if (code === 0 || code === 1) {
    return "Outdoor Play Golden Zone";
  }
  if (code === 2 || code === 3) {
    return "Target Run Comfort Level: 10/10";
  }
  if (code === 45 || code === 48) {
    return "Cozy Human Fog (Stay Home)";
  }
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    return "Puddle-Jumping Mud Chaos";
  }
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "Snowman Engineering Pending";
  }
  if ([95, 96, 99].includes(code)) {
    return "Indoor Fort Fortress Alert";
  }
  return "Snack Cabinet Exploration Duty";
}

// Parenting Weather Engine
export function getParentHumorContext(temp: number, code: number): ParentContext {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
  const isFoggy = [45, 48].includes(code);
  
  // 1. Get Dynamic Mood Sentence
  let moodSentence = "Today feels like coffee survived another battle ☕";
  
  if (isRainy) {
    if (temp < 10) {
      moodSentence = "Rain outside. Tiny cold tornado inside the house. Snails are winning today. 🐌";
    } else {
      moodSentence = "Puddle-jumping physics engine fully active. Prepare for damp socks. 🌧️";
    }
  } else if (isSnowy) {
    moodSentence = "Frozen outside. The house is currently 90% friction-free pajama sliding. ❄️";
  } else if (isFoggy) {
    moodSentence = "Visibility: Low. Toddler hiding skills: Exceptionally High. 😶‍🌫️";
  } else if (temp >= 30) {
    moodSentence = "Heat status: Popsicle juice currently acting as glue in 4 separate rooms. 🫠";
  } else if (temp >= 20) {
    moodSentence = "Sunshine level: Optimal. Toddler still refuses a regular afternoon nap. ☀️";
  } else if (temp < 8) {
    moodSentence = "Dressing for out-of-doors requires the strategic planning of a polar expedition. 🧥";
  } else {
    // Pleasant / mild
    const responses = [
      "Target parking lot feels exceptionally welcoming in this lighting. 🚗",
      "Perfect weather for packing a picnic that will be entirely ignored for basic dirt-eating. 🧺",
      "Air temperature: Friendly. Kids' attitude: TBD by snack selection. 🥨",
      "Optimal sidewalk-chalk humidity. A gallery exhibition is currently being scribbled. 🎨"
    ];
    moodSentence = responses[Math.floor((temp + code) % responses.length)];
  }

  // 2. Generate Parenting Survival Forecast Metrics
  const survivalForecast: SurvivalForecastItem[] = [];
  
  if (isRainy) {
    survivalForecast.push(
      {
        id: "fort",
        metric: "Blanket Fort Structural Integrity",
        probability: Math.min(95, 40 + Math.floor(temp % 30)),
        funnyComment: "High likelihood of cushions flying across the living room.",
        iconName: "Castle"
      },
      {
        id: "socks",
        metric: "Soggy Socks Probability",
        probability: 92,
        funnyComment: "They will step in the single deepest driveway puddle, guaranteed.",
        iconName: "Footprints"
      },
      {
        id: "screen",
        metric: "Screen Time Negotiating Window",
        probability: 98,
        funnyComment: "Bluey theme song will play on an infinite loop. Stay strong.",
        iconName: "Tv"
      }
    );
  } else if (isSnowy) {
    survivalForecast.push(
      {
        id: "cocoa",
        metric: "Hot Cocoa Marshmallow Melting Crisis",
        probability: 89,
        funnyComment: "Marshmallows dissolved too fast. Tears eminent.",
        iconName: "Coffee"
      },
      {
        id: "undressing",
        metric: "Time Spent Putting On Gear vs. Stays On Ratio",
        probability: 88,
        funnyComment: "Spent 25 mins matching gloves only for a 'potty' request in 2 mins.",
        iconName: "Hourglass"
      },
      {
        id: "slide",
        metric: "Sled Control Failure (Grass Bump Collision)",
        probability: 76,
        funnyComment: "Involved parent will get snowman snow down their back.",
        iconName: "Sparkles"
      }
    );
  } else if (temp >= 28) {
    survivalForecast.push(
      {
        id: "popsicle",
        metric: "Sticky Fingers Glue Level",
        probability: 99,
        funnyComment: "Do not touch the curtains. I repeat, DO NOT touch the curtains.",
        iconName: "Paintbrush"
      },
      {
        id: "sunscreen",
        metric: "Sunscreen Eye Burn Incident Rate",
        probability: 82,
        funnyComment: "Happens immediately after applying 'no-tear' organic formula.",
        iconName: "Eye"
      },
      {
        id: "meltdown",
        metric: "Hot Car Seat Strap Toddler Rigidity",
        probability: 86,
        funnyComment: "Plank position activated. Zero matching hip flexibility.",
        iconName: "Flame"
      }
    );
  } else {
    // Pleasant or mild weather parenting risks
    survivalForecast.push(
      {
        id: "snack",
        metric: "Snack Negotiation Frequency",
        probability: 93,
        funnyComment: "Will demand the fish-shaped crackers they threw on the dirt.",
        iconName: "Cookie"
      },
      {
        id: "sand",
        metric: "Sandbox Contraband In Shoes",
        probability: 97,
        funnyComment: "Approximately 2.4 lbs of play sand will be imported indoors.",
        iconName: "Backpack"
      },
      {
        id: "playground_stay",
        metric: "'Just Five More Minutes' Extension Rate",
        probability: 100,
        funnyComment: "Will trigger an existential crisis upon departure from the swings.",
        iconName: "Timer"
      }
    );
  }

  // 3. Clothing Suggestions
  let clothing: ClothingSuggestion = {
    baby: "Cotton onesie and happy thoughts.",
    toddler: "T-shirt that displays yesterday's breakfast art.",
    parent: "Yoga pants and the comfortable shirt of unknown vintage."
  };

  if (isRainy) {
    clothing = {
      baby: "Fleece layers under a heavy rain slicker resembling a yellow submarine.",
      toddler: "Full puddle suit. Which they will bypass to sit directly in a mud stream.",
      parent: "Anorak with hood tightly knotted. Holding 3 umbrellas (none functional)."
    };
  } else if (isSnowy) {
    clothing = {
      baby: "Triple-fleece snowsuit where they resemble a starfish and cannot move limbs.",
      toddler: "Gloves that will be stripped off and lost in deep snow within 40 seconds.",
      parent: "Old skiing jacket you haven't washed since college, thick beanie, despair."
    };
  } else if (temp >= 28) {
    clothing = {
      baby: "Lightweight diaper cover and SPF rash guard. Mainly bare skin and drool.",
      toddler: "Swimwear that they insist on wearing to the hardware shop. Sun hat (vetoed).",
      parent: "Shorts with pockets large enough to conceal wet wipes, half-eaten snack bars, and small rocks."
    };
  } else if (temp < 12) {
    clothing = {
      baby: "Sherpa-lined baby bootie mitts that pop off the foot the second you turn around.",
      toddler: "Heavy coat which they will strip off, shouting 'No cold!' while shivering.",
      parent: "Insulated coat. Hands shoved deep in pockets feeling mysterious cracker crumbs."
    };
  } else if (temp < 18) {
    clothing = {
      baby: "Cozy knit cardigan, thick socks, adorable bear-eared hat.",
      toddler: "Light zip-up hoodie. (Will be dragged along the ground by hood within 10 minutes).",
      parent: "Denim jacket or cardy. Styled neatly with dried baby-wipe residue on shoulder."
    };
  }

  // 4. shareable parent quote card
  let quote = "I thought I was a good parent, until I had to put boots on a wet, floppy toddler.";
  let hashtag = "#TinyTornadoes";
  
  const rainyQuotes = [
    { quote: "Our living room is currently a dynamic geological map of mattresses and damp blankets.", hashtag: "#RainyDaySurvival" },
    { quote: "Do puddles contain magnetic fields calibrated specifically to toddlers' butts? Discuss.", hashtag: "#PuddleTesting" },
    { quote: "Currently trading my kingdom for a dinosaur puzzle piece that rolled under the sofa.", hashtag: "#IndoorChaos" }
  ];

  const sunnyQuotes = [
    { quote: "We have survived the playground trip! Only lost one sandal, a green truck, and my sanity.", hashtag: "#PlaygroundWarriors" },
    { quote: "Applying sunscreen to a toddler is similar to gift-wrapping a wet eel.", hashtag: "#EelWrangling" },
    { quote: "Nothing says 'I love summer' like sweeping 4 metric tons of sandbox sand out of the foyer.", hashtag: "#SandcastleHome" }
  ];

  const snowyQuotes = [
    { quote: "Yes, I spent 40 minutes layering outerwear so they could stand in the snow for 90 seconds.", hashtag: "#SnowSuitSisyphus" },
    { quote: "My toddler had an absolute breakdown because the snowman we built was 'looking at him'.", hashtag: "#SnowmanStaringContest" }
  ];

  const geneticQuotes = [
    { quote: "Currently hiding in the pantry eating the premium biscuits while pretending to check the weather.", hashtag: "#PantrySnacking" },
    { quote: "If anyone needs me, I'll be negotiating with a 3-year-old about why they can't eat sidewalk chalk.", hashtag: "#ChalkGourmet" },
    { quote: "May your coffee be stronger than your toddler's morning negotiation strategies.", hashtag: "#FueledByCaffeine" }
  ];

  if (isRainy) {
    const q = rainyQuotes[Math.floor(temp % rainyQuotes.length)];
    quote = q.quote;
    hashtag = q.hashtag;
  } else if (isSnowy) {
    const q = snowyQuotes[Math.floor(temp % snowyQuotes.length)];
    quote = q.quote;
    hashtag = q.hashtag;
  } else if (temp >= 22) {
    const q = sunnyQuotes[Math.floor(temp % sunnyQuotes.length)];
    quote = q.quote;
    hashtag = q.hashtag;
  } else {
    const q = geneticQuotes[Math.floor((temp + code) % geneticQuotes.length)];
    quote = q.quote;
    hashtag = q.hashtag;
  }

  return {
    moodSentence,
    survivalForecast,
    clothing,
    quoteCard: { quote, hashtag }
  };
}

// Sample initial preloaded cities just in case users want one-click searches
export const POPULAR_PLACES = [
  { name: "New York", admin1: "NY", country: "US", latitude: 40.7128, longitude: -74.0060 },
  { name: "London", admin1: "England", country: "GB", latitude: 51.5074, longitude: -0.1278 },
  { name: "Chicago", admin1: "IL", country: "US", latitude: 41.8781, longitude: -87.6298 },
  { name: "Seattle", admin1: "WA", country: "US", latitude: 47.6062, longitude: -122.3321 },
  { name: "Sydney", admin1: "NSW", country: "AU", latitude: -33.8688, longitude: 151.2093 },
  { name: "Toronto", admin1: "ON", country: "CA", latitude: 43.6532, longitude: -79.3832 }
];
