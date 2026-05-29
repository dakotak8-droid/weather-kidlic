import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, ChevronRight, Sparkles, RefreshCw, X, Heart, Baby, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeocodingResult } from "../types";
import WeatherIcon from "./WeatherIcon";

interface HistoricalStory {
  theme: string;
  story: string;
  quote: string;
  metricLabel: string;
  metricValue: string;
}

export default function BirthWeatherStory() {
  // Input fields state
  const [typedCity, setTypedCity] = useState("");
  const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(null);
  const [birthDate, setBirthDate] = useState(""); // "YYYY-MM-DD"
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Result state
  const [revealResult, setRevealResult] = useState<{
    city: string;
    country: string;
    date: string; // formatted MM/DD/YYYY
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    rainProb: number;
    story: HistoricalStory;
  } | null>(null);

  // Auto-suggestion dropdown click-outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for city suggestions when user types in the Birth City input
  useEffect(() => {
    if (typedCity.trim().length < 3 || selectedCity?.name === typedCity) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCity(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            typedCity
          )}&count=5&language=en&format=json`
        );
        const data = await response.json();
        if (data.results) {
          const results: GeocodingResult[] = data.results.map((r: any) => ({
            name: r.name,
            country: r.country,
            admin1: r.admin1,
            latitude: r.latitude,
            longitude: r.longitude
          }));
          setSuggestions(results);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Geocoding failed inside BirthWeatherStory", err);
      } finally {
        setIsSearchingCity(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [typedCity, selectedCity]);

  // Handle suggestion pick
  const handleSelectSuggestion = (city: GeocodingResult) => {
    setSelectedCity(city);
    setTypedCity(`${city.name}${city.admin1 ? `, ${city.admin1}` : ""}, ${city.country}`);
    setSuggestions([]);
    setShowDropdown(false);
  };

  // Human storytelling generator based on weather parameters
  const generateBirthStory = (weatherCode: number, tempMax: number, rainProb: number): HistoricalStory => {
    const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode);
    const isSnowy = [71, 73, 75, 77, 85, 86].includes(weatherCode);
    const isSunny = [0, 1].includes(weatherCode);

    // Dynamic temperature commentary
    let tempComment = "";
    if (tempMax > 30) {
      tempComment = ` On top of that, it was a blisteringly hot day (${Math.round(tempMax)}°C / ${Math.round((tempMax * 9)/5 + 32)}°F). You immediately launched your first official diapers/onesie protest against the heat, laying down a foundation for a lifetime of AC negotiations.`;
    } else if (tempMax < 5) {
      tempComment = ` It was also a freezing cold day (${Math.round(tempMax)}°C / ${Math.round((tempMax * 9)/5 + 32)}°F). You quickly concluded that tiny wool socks weren't just decorative accessories but essential tools of survival in an frosty world.`;
    } else {
      tempComment = ` With a perfectly mild climate averaging ${Math.round(tempMax)}°C (${Math.round((tempMax * 9)/5 + 32)}°F), you selected a beautifully balanced, cozy temperature to grace the earth with your presence.`;
    }

    if (isRainy) {
      return {
        theme: "The Cozy Storm Sanctuary",
        quote: "Born into the soothing static of heavy clouds. Warm, safe, and loved beyond measure.",
        story: `The day you were born, the clouds assembled for a spectacular drum-roll symphony. Rain drummed gently against the hospital windowpane, singing you into existence and washing the city clean just in time for your debut. While nurses sipped lukewarm coffee and your parents held their breath, you slid into a world of cozy hums. Outside, storm umbrellas were tested to their limits; inside, our absolute favorite direct descendant of pure golden sunshine had officially arrived.${tempComment}`,
        metricLabel: "DIAPER SPLASH DISPLACEMENT",
        metricValue: "94% (High Torrent)"
      };
    } else if (isSnowy) {
      return {
        theme: "The Frost-Bound Cradle",
        quote: "The winter frost was thick on the glass, but you melted our hearts instantly.",
        story: `The city was wrapped in a premium, quiet white silence. Snowflakes floated down in slow motion, transforming the neighborhood into a sleepy snowglobe. Inside, sweaters were stacked three layers deep. You made your grand debut as a legendary winter baby, completely custom-made for thick knitted hats and endless nursery huddles. Frost dominated the landscape, but your arrival brought the soft warm firelight of a brand new era.${tempComment}`,
        metricLabel: "COCONUT COCOA DEMAND INDEX",
        metricValue: "99% (Maximum cozy)"
      };
    } else if (isSunny) {
      return {
        theme: "The Golden Daybreak",
        quote: "The sun was bright, but you were the absolute main attraction.",
        story: `The atmosphere was completely clear, showcasing a pristine blue sky as if your parents had pre-booked a VIP meteorological package. Flawless sunlight flooded the room, casting rich golden shapes over the floorboards. Not a single cloud had the courage to compete with you or steal your spotlight. The weather forecast was nothing short of a cosmic welcoming party, celebrating a bright, warm new life starting its earthly residency.${tempComment}`,
        metricLabel: "SUNGLASSES DETACH RATE",
        metricValue: "100% (Instant glare veto)"
      };
    } else {
      // Overcast / Cloudy / Default
      return {
        theme: "The Velvet Blanket Skies",
        quote: "Soft focus clouds outside, quiet sanctuary within. Modern, calm, and perfect.",
        story: `A beautiful velvet cloud layer blanketed the town in a natural, cinematic, soft-focus light. It was the ultimate, eye-pleasing nap climate—meaning nature officially designed your birth day with deep, cozy sleep in mind. Wind chimes on the terrace played gentle folk melodies as you arrived, bringing a serene calm to a chaotic ward. You entered a quiet, moody world constructed perfectly for endless cuddle sessions under thick duvets.${tempComment}`,
        metricLabel: "TRI-FOLD BLANKET FORT CAPABILITY",
        metricValue: "88% (Secured)"
      };
    }
  };

  // Reveal birth weather story
  const handleRevealStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!birthDate) {
      setErrorMessage("Please select a valid birth date.");
      return;
    }

    // Parse date elements
    const selectedDate = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(selectedDate.getTime())) {
      setErrorMessage("Please enter a valid birth date.");
      return;
    }

    if (selectedDate > today) {
      setErrorMessage("Are they a time traveler? The birth date cannot be in the future!");
      return;
    }

    if (selectedDate.getFullYear() < 1940) {
      setErrorMessage("Alas! Historical weather archives are only available back to 1940. Please enter a birth date from 1940 onwards.");
      return;
    }

    setIsLoadingStory(true);

    try {
      let lat = 41.8781; // Chicago fallback
      let lon = -87.6298;
      let cityName = "Chicago, IL";
      let countryName = "United States";

      if (selectedCity) {
        lat = selectedCity.latitude;
        lon = selectedCity.longitude;
        cityName = selectedCity.name;
        countryName = selectedCity.country;
      } else if (typedCity.trim().length > 0) {
        // Attempt immediate geocode search on typing fallback
        const geoResp = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            typedCity
          )}&count=1&language=en&format=json`
        );
        const geoData = await geoResp.json();
        if (geoData.results && geoData.results[0]) {
          const first = geoData.results[0];
          lat = first.latitude;
          lon = first.longitude;
          cityName = first.name;
          countryName = first.country;
        } else {
          // If no lookup matches, proceed with general input text and default coordinates to make sure there's zero frustration!
          cityName = typedCity;
          countryName = "";
        }
      } else {
        setErrorMessage("Please specify a birth city & country.");
        setIsLoadingStory(false);
        return;
      }

      // Convert to YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Call Open-Meteo Archive public API
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto`;
      const response = await fetch(archiveUrl);
      
      if (!response.ok) {
        throw new Error("Unable to retrieve weather archives from Open-Meteo.");
      }

      const data = await response.json();
      
      let finalWeatherCode = 0; // Default sunny
      let tempMax = 20; // Default pleasant
      let tempMin = 10;
      let rainSum = 0;

      if (data.daily) {
        finalWeatherCode = data.daily.weather_code?.[0] ?? 0;
        tempMax = data.daily.temperature_2m_max?.[0] ?? 20;
        tempMin = data.daily.temperature_2m_min?.[0] ?? 10;
        rainSum = data.daily.precipitation_sum?.[0] ?? 0;
      }

      const generatedStory = generateBirthStory(finalWeatherCode, tempMax, rainSum > 0 ? 80 : 0);

      // Save formatted MM/DD/YYYY representation
      const formattedDate = `${month}/${day}/${year}`;

      setRevealResult({
        city: cityName,
        country: countryName,
        date: formattedDate,
        tempMax,
        tempMin,
        weatherCode: finalWeatherCode,
        rainProb: rainSum > 0 ? Math.min(100, Math.round(rainSum * 10)) : 0,
        story: generatedStory
      });

      // Smooth scroll down to reveal card below
      setTimeout(() => {
        const revealEl = document.getElementById("birth-story-reveal-card");
        if (revealEl) {
          revealEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);

    } catch (err) {
      console.error(err);
      setErrorMessage("Open-Meteo archive is recovering state. Please check your network and retry in a few moments!");
    } finally {
      setIsLoadingStory(false);
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-12 select-none border-b border-[#F0E4DA] dark:border-[#3B282A]">
      {/* Hero section inside birth-date layout container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="md:col-span-7 space-y-6 text-center md:text-left">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#D48D71] dark:text-[#E89E82] font-extrabold block mb-1">
              Tiny Date. Big Memory.
            </span>
            <h2 className="font-serif italic font-extrabold text-3xl sm:text-4xl leading-tight text-[#3D2C2E] dark:text-[#FEFAF6]">
              What was the weather when your baby was born?
            </h2>
            <p className="text-sm italic text-[#7A6363] dark:text-slate-400 font-serif mt-2 leading-relaxed">
              Retrieve real-time meteorological archive data back to 1940. Map the exact stroller coordinates, cloud density, and humor index of your child's spectacular birth date.
            </p>
          </div>

          {/* Clean White Input Panel Card */}
          <form onSubmit={handleRevealStory} className="bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm space-y-4 text-left relative z-40">
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-sans font-medium flex items-start gap-2 border border-red-100">
                <span className="text-red-500 font-bold">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Birth Date Input */}
              <div className="space-y-1.5 focus-within:text-[#D48D71]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>Birth Date (MM/DD/YYYY)</span>
                </label>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  min="1940-01-01"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F9F1EB] dark:bg-[#1E1415] rounded-xl text-sm border-none outline-none text-[#3D2C2E] dark:text-[#FEFAF6] placeholder:text-slate-400 transition"
                />
              </div>

              {/* Birth City Autocomplete Input */}
              <div ref={dropdownRef} className="relative space-y-1.5 focus-within:text-[#D48D71]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-400 font-extrabold flex items-center gap-1.5">
                  <Search size={12} />
                  <span>Birth City & Country</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicago, Paris, Tokyo..."
                    value={typedCity}
                    onChange={(e) => {
                      setTypedCity(e.target.value);
                      setShowDropdown(true);
                      if (selectedCity) setSelectedCity(null);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full px-4 py-3 bg-[#F9F1EB] dark:bg-[#1E1415] rounded-xl text-sm border-none outline-none text-[#3D2C2E] dark:text-[#FEFAF6] placeholder:text-slate-400 transition"
                  />
                  {typedCity && (
                    <button
                      type="button"
                      onClick={() => {
                        setTypedCity("");
                        setSelectedCity(null);
                        setSuggestions([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#F0E4DA] dark:hover:bg-[#3B282A] rounded-lg text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Autocomplete dynamic dropdown overlays */}
                <AnimatePresence>
                  {showDropdown && (suggestions.length > 0 || isSearchingCity) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-xl shadow-lg overflow-hidden text-left z-50 max-h-48 overflow-y-auto"
                    >
                      {isSearchingCity && (
                        <div className="p-3 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                          <RefreshCw className="animate-spin text-[#D48D71]" size={12} /> Locating havenCoordinates...
                        </div>
                      )}
                      {!isSearchingCity && suggestions.map((city, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSuggestion(city)}
                          className="w-full px-4 py-2.5 text-[#3D2C2E] dark:text-[#FEFAF6] text-xs font-medium hover:bg-[#F9F1EB] dark:hover:bg-[#3B282A] text-left transition flex justify-between items-center"
                        >
                          <span>{city.name}{city.admin1 ? `, ${city.admin1}` : ""}, {city.country}</span>
                          <span className="text-[9px] font-mono text-[#D48D71] bg-[#FDE2D3] dark:bg-[#3B282A] px-1 py-0.2 rounded shrink-0">Select</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoadingStory}
              className="w-full bg-[#3D2C2E] hover:bg-[#261B1C] dark:bg-[#E89E82] dark:hover:bg-[#D48D71] text-white dark:text-[#2B1D1F] py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold shadow-sm transition hover:shadow flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
            >
              {isLoadingStory ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-[#D48D71] dark:text-[#2B1D1F]" />
                  <span>Scanning the heavens...</span>
                </>
              ) : (
                <>
                  <ChevronRight size={14} />
                  <span>Reveal the weather story</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Static Premium Cozy Example Card */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-sm relative">
            {/* Ambient cozy background circles */}
            <div className="absolute -top-4 -left-6 w-32 h-32 bg-[#D48D71]/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -right-6 w-32 h-32 bg-[#FFD580]/10 rounded-full blur-3xl"></div>

            {/* Example Reveal Card Style: Premium, rounded, dark navy, cozy, and shareable */}
            <div className="w-full rounded-[32px] p-6 flex flex-col justify-between shadow-xl border border-slate-800 bg-[#121829] text-[#FEFAF6] relative overflow-hidden">
              {/* Premium dark grid pattern decor overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e2439_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none"></div>

              <div className="relative z-10 space-y-6">
                {/* Header structure */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h5 className="font-serif italic font-bold text-lg text-white">Austin, Texas</h5>
                    <p className="text-[10px] uppercase font-mono tracking-widest text-[#E89E82]">Born on 10/14/2021</p>
                  </div>
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <WeatherIcon code={0} size={26} />
                  </div>
                </div>

                {/* Emotional / funny body text */}
                <div className="space-y-3.5">
                  <span className="text-[9px] font-mono bg-[#E89E82] text-slate-900 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">
                    THE SUNLIT STANDARD
                  </span>
                  <p className="text-xs leading-relaxed text-slate-300 font-sans">
                    The world held clear skies as if pre-ordered. Pristine autumn gold blanketed Austin on that morning of October 14th. While hospital cups clinked and nursery teams stood ready, you slid in under direct cinematic gold beams. Safe to say, not a single cloud had the audacity to steal your main-event spotlight.
                  </p>
                </div>

                {/* Short bold Quote */}
                <p className="text-sm font-serif italic text-white/95 border-l-2 border-[#E89E82] pl-3 py-1 bg-white/[0.02]">
                  “Born under flawless golden beams, bringing an endless summer of parental love.”
                </p>

                {/* Simulated Metadata footer details */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Heart size={10} className="text-rose-500 fill-rose-500" />
                    <span>Nursery Memory Roll</span>
                  </div>
                  <span>CODE_SUNNY: 0</span>
                </div>
              </div>
            </div>
            
            {/* Example Tag Badge hover overlay */}
            <div className="absolute top-3 -right-3 rotate-6 bg-[#D48D71] text-xs font-mono font-bold text-white px-3 py-1.5 rounded-xl shadow-md border border-white/10 pointer-events-none z-20 flex items-center gap-1 uppercase tracking-wider scale-90">
              <Baby size={12} />
              <span>Reference Idea</span>
            </div>
          </div>
        </div>

      </div>

      {/* DYNAMIC RESULT REVEAL SECTION BELOW BOTH COLUMNS */}
      <AnimatePresence>
        {revealResult && (
          <motion.div
            id="birth-story-reveal-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="mt-14 pt-10 border-t border-dashed border-[#F0E4DA] dark:border-[#3B282A] relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F9F1EB] dark:bg-[#1E1415] border border-[#F0E4DA] dark:border-[#3B282A] px-5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase text-[#D48D71] dark:text-[#E89E82] font-extrabold flex items-center gap-1">
              <BookOpen size={12} />
              <span>Your Authentic Weather Legend</span>
            </div>

            <div className="max-w-xl mx-auto rounded-[36px] bg-[#0E1321] text-[#FEFAF6] p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              {/* Premium cozy star/cloud grid graphic background overlay */}
              <div className="absolute inset-0 bg-[#161c2e]/20 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

              <div className="relative z-10 space-y-6 text-left">
                {/* Header: Birth Info & Geolocation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-[#E89E82] uppercase bg-[#E89E82]/10 border border-[#E89E82]/20 px-2.5 py-0.5 rounded-full font-bold">
                      Aesthetic Birth Registry
                    </span>
                    <h3 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-white mt-1.5">
                      {revealResult.city}
                    </h3>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
                      {revealResult.country ? `${revealResult.country} • ` : ""}Coordinates resolved
                    </p>
                  </div>
                  
                  {/* Meteorological snapshot snapshot */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 self-start sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-300 block">MAX OUTLOOK</span>
                      <p className="font-serif font-bold text-lg text-white">
                        {Math.round(revealResult.tempMax)}°C / {Math.round((revealResult.tempMax * 9) / 5 + 32)}°F
                      </p>
                    </div>
                    <div className="p-2 bg-white/5 rounded-xl border border-white/10 shrink-0">
                      <WeatherIcon code={revealResult.weatherCode} size={30} />
                    </div>
                  </div>
                </div>

                {/* Weather Legend theme title & story copy */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#E89E82] bg-[#E89E82]/15 px-3 py-1 rounded-full border border-[#E89E82]/25">
                      Theme: {revealResult.story.theme}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Date: {revealResult.date}</span>
                  </div>
                  <p className="text-sm md:text-base text-slate-300 font-sans leading-relaxed tracking-wide">
                    {revealResult.story.story}
                  </p>
                </div>

                {/* Full-width Quote banner inside Card container */}
                <div className="bg-white/[0.03] border-l-2 border-[#E89E82] p-4 rounded-r-xl">
                  <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold mb-1.5">EMOTIONAL FOOTPRINT</p>
                  <p className="font-serif italic text-white text-md sm:text-lg leading-snug">
                    “{revealResult.story.quote}”
                  </p>
                </div>

                {/* Metric breakdown footer logs */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-slate-400 select-none">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={11} className="text-[#E89E82]" />
                    <span>{revealResult.story.metricLabel}: <strong className="text-white">{revealResult.story.metricValue}</strong></span>
                  </div>
                  <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                    ARCHIVE_KEY_WMO_{revealResult.weatherCode}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
