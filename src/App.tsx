/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Moon, Sun, ShieldAlert, Heart } from "lucide-react";
import { motion } from "motion/react";
import { WeatherData, GeocodingResult, ParentContext } from "./types";
import { getParentHumorContext, getWeatherDescription, getMoodLabelForCode } from "./data/parentHumor";

// Import modules
import HeroSection from "./components/HeroSection";
import BirthWeatherStory from "./components/BirthWeatherStory";
import DailyForecast from "./components/DailyForecast";
import ParentSurvival from "./components/ParentSurvival";
import WeeklyForecast from "./components/WeeklyForecast";
import WhatToWear from "./components/WhatToWear";
import SocialShare from "./components/SocialShare";

// Seattle acts as a delightful default cozy weather city for families
const SEATTLE_DEFAULT: GeocodingResult = {
  name: "Seattle",
  country: "United States",
  admin1: "WA",
  latitude: 47.6062,
  longitude: -122.3321
};

export default function App() {
  const [selectedCity, setSelectedCity] = useState<GeocodingResult>(() => {
    const saved = localStorage.getItem("parent_weather_city_pref");
    return saved ? JSON.parse(saved) : SEATTLE_DEFAULT;
  });

  const [isFahrenheit, setIsFahrenheit] = useState<boolean>(() => {
    const saved = localStorage.getItem("parent_weather_unit_f");
    return saved ? saved === "true" : true;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("parent_weather_theme_dark");
    if (saved) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state helpers to local storage
  useEffect(() => {
    localStorage.setItem("parent_weather_unit_f", isFahrenheit.toString());
  }, [isFahrenheit]);

  useEffect(() => {
    localStorage.setItem("parent_weather_theme_dark", isDark.toString());
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Handle City Changes
  const handleCitySelect = (city: GeocodingResult) => {
    setSelectedCity(city);
    localStorage.setItem("parent_weather_city_pref", JSON.stringify(city));
  };

  // Main Weather Fetcher Hook calling public Open-Meteo
  useEffect(() => {
    let active = true;

    async function fetchWeather() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedCity.latitude}&longitude=${selectedCity.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max&timezone=auto`
        );

        if (!response.ok) {
          throw new Error("Stroller coordinate block error.");
        }

        const data = await response.json();
        
        if (!active) return;

        // Parse structure safely
        const wCode = data.current.weather_code;
        const currentData = {
          temp: data.current.temperature_2m,
          feelsLike: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: wCode,
          weatherText: getWeatherDescription(wCode),
          precipitation: data.current.precipitation,
          city: selectedCity.name,
          country: selectedCity.country
        };

        // Grab upcoming hourly intervals (next 24 hours, take a sample every hour)
        const hourlyData = data.hourly.time.map((time: string, idx: number) => ({
          time,
          temp: data.hourly.temperature_2m[idx],
          weatherCode: data.hourly.weather_code[idx],
          rainProb: data.hourly.precipitation_probability[idx]
        })).slice(0, 24);

        // Grab upcoming weekly daily entries (next 7 days)
        const dailyData = data.daily.time.map((date: string, idx: number) => {
          const itemCode = data.daily.weather_code[idx];
          return {
            date,
            weatherCode: itemCode,
            tempMax: data.daily.temperature_2m_max[idx],
            tempMin: data.daily.temperature_2m_min[idx],
            rainProb: data.daily.precipitation_probability_max[idx],
            moodLabel: getMoodLabelForCode(itemCode)
          };
        });

        setWeatherData({
          current: currentData,
          hourly: hourlyData,
          daily: dailyData
        });

      } catch (err) {
        if (active) {
          console.error("Meteorology retrieval crash", err);
          setError("The stroller got stuck in a mud puddle! Open-Meteo fetch failed. Make sure your internet connection or city spelling is active.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchWeather();

    return () => {
      active = false;
    };
  }, [selectedCity]);

  // Derived Background Dynamic Gradient classes
  const getWeatherBackgroundGradient = () => {
    if (!weatherData) return "from-[#FEFAF6] to-[#F9F1EB] dark:from-[#1E1415] dark:to-[#2B1D1F]";
    const code = weatherData.current.weatherCode;
    
    const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
    const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
    
    if (isRainy) {
      return "from-[#F5F8FA] via-[#F2EEFA] to-white dark:from-[#1E1415] dark:via-[#1F1826] dark:to-[#141E26]";
    }
    if (isSnowy) {
      return "from-[#F7F5FA] via-white to-[#F2EEFA] dark:from-[#1E1415] dark:via-[#20182E] dark:to-[#17141E]";
    }
    if (code === 0 || code === 1) {
      return "from-[#FEFAF6] via-[#FAF2EE] to-white dark:from-[#1E1415] dark:via-[#261E1C]/80 dark:to-[#1E1415]";
    }
    // Cloudy/Overcast
    return "from-[#FAF9F5] via-[#F5EDF0] to-[#FEFAF6] dark:from-[#2B1D1F] dark:via-[#1E1415] dark:to-[#2B1D1F]";
  };

  const getHumor = (): ParentContext => {
    if (!weatherData) {
      return {
        moodSentence: "Preparing coffee grounds... Stand by.",
        survivalForecast: [],
        clothing: { baby: "", toddler: "", parent: "" },
        quoteCard: { quote: "", hashtag: "" }
      };
    }
    return getParentHumorContext(weatherData.current.temp, weatherData.current.weatherCode);
  };

  const humor = getHumor();

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getWeatherBackgroundGradient()} transition-colors duration-500`}>
      
      {/* Dynamic atmospheric ambient lighting particle layout */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none blur-3xl rounded-full"></div>

      {/* Main Navigation Header */}
      <header className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-between pointer-events-auto relative z-50 select-none">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl text-[#D48D71]">☕</span>
          <div>
            <div className="text-2xl font-serif italic font-bold tracking-tight text-[#D48D71] dark:text-[#E89E82] leading-tight">
              Mumble & Clouds
            </div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 dark:text-slate-400 font-bold block leading-none mt-0.5">
              PARENTS SURVIVING TOGETHER
            </span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* Light / Dark Mode button */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2.5 bg-white/80 hover:bg-white dark:bg-[#2B1D1F] dark:hover:bg-[#3B282A] border border-[#F0E4DA] dark:border-[#3B282A] rounded-2xl text-[#3D2C2E] dark:text-[#FEFAF6] shadow-sm hover:shadow-md transition-all duration-300"
            aria-label="Theme toggle"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Critical Core Warning Banner */}
      {error && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl flex items-start gap-3 text-rose-800 text-sm">
            <ShieldAlert size={20} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="text-left">
              <span className="font-bold block mb-0.5">Weather Retrieval Stalled</span>
              <p className="text-xs text-rose-650 leading-relaxed font-sans">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Search & Current Atmospheric Summary */}
      <HeroSection
        currentWeather={weatherData ? weatherData.current : null}
        isFahrenheit={isFahrenheit}
        setIsFahrenheit={setIsFahrenheit}
        onCitySelect={handleCitySelect}
        isLoading={isLoading}
        moodSentence={humor.moodSentence}
      />

      {/* Newborn Legacy Birth Date Weather Story */}
      <BirthWeatherStory />

      {/* Staggered Weather Components Display */}
      {weatherData && !isLoading && (
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-12"
        >
          {/* Detailed Meteorological Desk & Hourly Timeline */}
          <DailyForecast
            currentWeather={weatherData.current}
            hourly={weatherData.hourly}
            isFahrenheit={isFahrenheit}
          />

          {/* Humorous Parenting Metric Guages */}
          <ParentSurvival survivalItems={humor.survivalForecast} />

          {/* Multi-category "What to wear today" Dressing Section */}
          <WhatToWear clothing={humor.clothing} />

          {/* Abbreviated horizontal 7-day outlook */}
          <WeeklyForecast
            daily={weatherData.daily}
            isFahrenheit={isFahrenheit}
          />

          {/* Social Share Quote Generator station */}
          <SocialShare
            initialQuote={humor.quoteCard.quote}
            initialHashtag={humor.quoteCard.hashtag}
          />
        </motion.main>
      )}

      {/* Warm Cozy Parent App Footer Footer */}
      <footer className="border-t border-[#F0E4DA] dark:border-[#3B282A] bg-white/40 dark:bg-[#1E1415]/20 backdrop-blur-md py-12 mt-16 px-4 select-none">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-[#7A6363] dark:text-slate-400 font-mono tracking-widest uppercase font-bold">
            <Heart size={13} className="text-[#D48D71] fill-[#D48D71]" />
            <span>Cozy Climate Division</span>
          </div>

          <p className="font-serif italic text-[#7A6363] dark:text-slate-300 leading-relaxed mb-4 text-sm max-w-sm mx-auto">
            "Made with ☕ and survived juice boxes. Made for people raising tiny humans and surviving weather together."
          </p>

          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-mono">
            © {new Date().getFullYear()} Mumble & Clouds Forecast • Est. Seattle / Global • All toys safely cleared off floor.
          </p>
        </div>
      </footer>

    </div>
  );
}
