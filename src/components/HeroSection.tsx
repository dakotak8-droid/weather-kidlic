import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Sparkles, Flame, Snowflake, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CurrentWeather, GeocodingResult } from "../types";
import WeatherIcon from "./WeatherIcon";
import { POPULAR_PLACES } from "../data/parentHumor";

interface HeroSectionProps {
  currentWeather: CurrentWeather | null;
  isFahrenheit: boolean;
  setIsFahrenheit: (val: boolean) => void;
  onCitySelect: (city: GeocodingResult) => void;
  isLoading: boolean;
  moodSentence: string;
}

export default function HeroSection({
  currentWeather,
  isFahrenheit,
  setIsFahrenheit,
  onCitySelect,
  isLoading,
  moodSentence
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parent time-based greeting helper
  const [parentGreeting, setParentGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 9) {
        setParentGreeting("Morning Shift: Grab your coffee. This is not a drill. ☕");
      } else if (hour >= 9 && hour < 12) {
        setParentGreeting("Mid-Morning: Snack negotiation engines are fired up! 🥨");
      } else if (hour >= 12 && hour < 15) {
        setParentGreeting("The Quiet Window: Sacred afternoon nap targets active. Tread lightly. 🤫");
      } else if (hour >= 15 && hour < 19) {
        setParentGreeting("Pre-Dinner Toys Tornado: Playground energy peaking. 🧸");
      } else if (hour >= 19 && hour < 23) {
        setParentGreeting("Wind Down: Bedtime negotiations concluded successfully (hopefully). 🍷");
      } else {
        setParentGreeting("The Ghost Shift: Silence. Only tiny sleepwalking intruders active.");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle Geocoding Search
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            searchQuery
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
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 4000); // 400ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside listener for suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectSuggestion = (city: GeocodingResult) => {
    onCitySelect(city);
    setSearchQuery("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          // Reverse-geocoding via Open-Meteo or generic placeholder
          try {
            // Geocoding services require keys, but we can search or pass coordinates directly
            // Introduce a custom local geocoded spot
            onCitySelect({
              name: "Your Location",
              country: "Detected via GPS",
              latitude,
              longitude
            });
          } catch (error) {
            console.error("Failed to read geo reverse", error);
          }
        },
        (error) => {
          alert("Could not access location. Please enter a city manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Convert temperature
  const formatTemp = (celsius: number) => {
    if (isFahrenheit) {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const handleCtaClick = () => {
    const section = document.getElementById("survival-forecast-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12 px-4 select-none">
      <div className="max-w-4xl mx-auto text-center">
        {/* Time-based organic greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-[#FDE2D3] dark:bg-[#3B282A] text-[#D48D71] dark:text-[#E89E82] font-mono text-[10px] md:text-xs uppercase tracking-widest px-4 py-2 rounded-full border border-[#F0E4DA] dark:border-[#3B282A] backdrop-blur-md shadow-sm mb-6 max-w-full"
        >
          <Sparkles size={12} className="animate-pulse shrink-0" />
          <span className="truncate">{parentGreeting}</span>
        </motion.div>

        {/* Brand App Statement */}
        <h1 className="font-serif italic font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#4A3B3B] dark:text-[#FEFAF6] leading-tight mb-8">
          The weather forecast, translated into <span className="text-[#D48D71] dark:text-[#E89E82] not-italic font-sans font-bold">parenting reality.</span>
        </h1>

        {/* Search bar & dropdown */}
        <div ref={dropdownRef} className="relative z-50 max-w-lg mx-auto mb-10">
          <div className="relative flex items-center bg-white dark:bg-[#2B1D1F] rounded-2xl border border-[#F0E4DA] dark:border-[#3B282A] shadow-md group focus-within:border-[#D48D71] dark:focus-within:border-[#D48D71] transition-all duration-300">
            <Search className="absolute left-4 text-[#7A6363] dark:text-slate-400 group-focus-within:text-[#D48D71] transition-colors" size={20} />
            
            <input
              type="text"
              placeholder="Search for your family's coordinate (e.g. London, Seattle)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-12 pr-28 py-4 bg-transparent outline-none text-[#3D2C2E] dark:text-[#FEFAF6] font-sans text-sm md:text-base border-none rounded-2xl placeholder:text-slate-400 dark:placeholder:text-[#7A6363]"
            />

            <div className="absolute right-3 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 hover:bg-[#F9F1EB] dark:hover:bg-[#3B282A] rounded-lg text-slate-400 transition"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={handleCurrentLocationClick}
                type="button"
                className="p-2 hover:bg-[#FDE2D3]/40 dark:hover:bg-[#3B282A] text-[#D48D71] dark:text-[#E89E82] rounded-xl transition duration-200"
                title="Locate Me via GPS"
              >
                <MapPin size={18} />
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          <AnimatePresence>
            {showDropdown && (searchQuery.length >= 3 || suggestions.length > 0 || isSearching) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-2xl shadow-xl overflow-hidden text-left"
              >
                {isSearching && (
                  <div className="p-4 text-sm text-[#7A6363] dark:text-slate-400 flex items-center gap-2">
                    <RefreshCw className="animate-spin text-[#D48D71]" size={16} /> Retrieving beautiful nodes...
                  </div>
                )}
                
                {!isSearching && suggestions.length === 0 && searchQuery.length >= 3 && (
                  <div className="p-4 text-sm text-[#7A6363] dark:text-slate-450">No matching cities found. Check spelling.</div>
                )}

                {!isSearching && suggestions.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-1 text-[10px] font-mono tracking-widest uppercase text-slate-400">Search Results</div>
                    {suggestions.map((city, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(city)}
                        className="w-full px-4 py-3 hover:bg-[#F9F1EB] dark:hover:bg-[#3B282A] text-left flex items-center justify-between text-[#3D2C2E] dark:text-[#FEFAF6] text-sm transition"
                      >
                        <span className="font-medium">
                          {city.name}
                          {city.admin1 ? `, ${city.admin1}` : ""}
                          <span className="text-slate-450 text-xs font-normal ml-1">({city.country})</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#D48D71] bg-[#FDE2D3] dark:bg-[#3B282A] px-1.5 py-0.5 rounded">
                          {city.latitude.toFixed(1)}°N
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Quick-links */}
                <div className="border-t border-[#F0E4DA] dark:border-[#3B282A]/80 p-3 bg-[#F9F1EB] dark:bg-[#1E1415]/60">
                  <div className="px-1.5 pb-2 text-[10px] font-mono tracking-widest uppercase text-slate-400">Recommended Havens</div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_PLACES.map((city, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(city)}
                        className="px-2.5 py-1 text-xs text-[#3D2C2E] dark:text-slate-350 hover:text-white hover:bg-[#D48D71] dark:hover:bg-[#D48D71] bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-full transition"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Weather overview display */}
        {currentWeather && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            {/* Editorial layout grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left py-4">
              <div className="md:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-[#FDE2D3] dark:bg-[#3B282A] text-[#D48D71] dark:text-[#E89E82] text-xs font-bold rounded-full uppercase tracking-wider">
                    {currentWeather.city}, {currentWeather.country}
                  </span>
                  <span className="text-sm dark:text-slate-350 opacity-70 italic font-serif">
                    Current Feel: Caffeinated but cautious
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-4">
                  <h1 className="text-[84px] sm:text-[104px] font-serif font-semibold leading-[0.9] -ml-1 text-[#4A3B3B] dark:text-white tracking-tighter">
                    {formatTemp(currentWeather.temp)}
                    <span className="text-3xl ml-3 align-baseline font-sans font-light tracking-tight text-[#7A6363] dark:text-[#E89E82]">
                      {currentWeather.weatherText}
                    </span>
                  </h1>

                  {/* Temp conversion toggle */}
                  <div className="flex items-center bg-[#E8E1DA] dark:bg-[#3B282A] p-0.5 rounded-lg text-xs font-medium select-none border border-[#F0E4DA] dark:border-[#1E1415] shrink-0 mt-3 sm:mt-0">
                    <button
                      onClick={() => setIsFahrenheit(false)}
                      className={`px-2 py-1 rounded-md transition ${
                        !isFahrenheit
                          ? "bg-white dark:bg-[#1E1415] shadow-sm text-[#D48D71] dark:text-[#E89E82]"
                          : "text-[#7A6363] dark:text-[#FEFAF6]/50 hover:text-[#3D2C2E]"
                      }`}
                    >
                      °C
                    </button>
                    <button
                      onClick={() => setIsFahrenheit(true)}
                      className={`px-2 py-1 rounded-md transition ${
                        isFahrenheit
                          ? "bg-white dark:bg-[#1E1415] shadow-sm text-[#D48D71] dark:text-[#E89E82]"
                          : "text-[#7A6363] dark:text-[#FEFAF6]/50 hover:text-[#3D2C2E]"
                      }`}
                    >
                      °F
                    </button>
                  </div>
                </div>

                {/* Funny Weather Quote */}
                <p className="text-2xl sm:text-3xl font-serif italic leading-snug text-[#7A6363] dark:text-[#E8D9D9] pt-4">
                  “{moodSentence}”
                </p>

                <p className="text-xs font-mono text-slate-400 dark:text-slate-500 tracking-wider">
                  feels like {formatTemp(currentWeather.feelsLike)} • relative humidity {currentWeather.humidity}% • winds {currentWeather.windSpeed} km/h
                </p>
              </div>

              {/* Graphical illustration container */}
              <div className="md:col-span-5 flex justify-center md:justify-end">
                <div className="relative">
                  <div className="w-56 h-56 bg-gradient-to-br from-[#FFD580] to-[#FF8C69] rounded-full blur-2xl opacity-40 absolute -inset-2"></div>
                  <div className="relative bg-white/40 dark:bg-[#2B1D1F]/50 backdrop-blur-md border border-[#F0E4DA] dark:border-[#3B282A] p-10 rounded-[40px] shadow-sm flex flex-col items-center justify-center">
                    <div className="bg-white/80 dark:bg-[#1E1415]/80 p-5 rounded-full shadow-inner mb-4">
                      <WeatherIcon code={currentWeather.weatherCode} size={64} />
                    </div>
                    <div className="text-center font-mono font-bold uppercase tracking-widest text-[10px] text-[#4A3B3B] dark:text-slate-350">
                      ATMOSPHERIC STATUS
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA to check survival forecast */}
            <div className="mt-8 flex justify-start">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCtaClick}
                className="bg-[#D48D71] hover:bg-[#C07C61] dark:bg-[#E89E82] dark:hover:bg-[#D48D71] text-white dark:text-[#1E1415] font-mono text-[11px] uppercase tracking-widest font-bold px-6 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <span>Navigate to Survival Metrics</span>
                <Sparkles size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-sm font-mono text-slate-400">Loading forecast parameters... Setting snack scales...</p>
          </div>
        )}
      </div>
    </section>
  );
}
