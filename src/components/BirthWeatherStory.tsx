import React, { useState, useEffect, useRef } from "react";
import { Search, Calendar, ChevronRight, Sparkles, RefreshCw, X, Heart, Baby, BookOpen, Download } from "lucide-react";
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
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

    // Weather description for context
    const tempF = Math.round((tempMax * 9) / 5 + 32);
    const tempC = Math.round(tempMax);

    if (isRainy) {
      return {
        theme: "The Cozy Storm Sanctuary",
        quote: "Rain outside. Endless love inside.",
        story: `On the day you came into the world, a gentle rain fell over the city, drumming a soft lullaby against the hospital glass. Outside, the air was cool at ${tempC}°C (${tempF}°F), wrapping the streets in a glistening mist. While the storm hummed peacefully, a warm and quiet sanctuary unfolded indoors as we held you for the absolute first time. The skies washed the earth clean, turning a fresh new page for your beautiful debut. No matter how hard it pours, you are our perfect shelter.`,
        metricLabel: "HEARTWARMING HARMONY",
        metricValue: "Securely Anchored"
      };
    } else if (isSnowy) {
      return {
        theme: "The Frost-Bound Cradle",
        quote: "One ordinary freezing day. One extraordinary arrival.",
        story: `A quiet blanket of fresh winter snow carpeted the neighborhood on the day you arrived. Outside, crisp freezing air held steady around ${tempC}°C (${tempF}°F), silvering the windowpanes with beautiful ice crystals. But indoors, a gentle firelight warmed our hearts the second we met your gaze. You were custom-made for thick knitted hats, sweet nursery huddles, and cozy winter snuggles. Nature gave us a pristine white wonderland, but you gave us our entire world.`,
        metricLabel: "HEARTWARMING HARMONY",
        metricValue: "Glowingly Lit"
      };
    } else if (isSunny) {
      return {
        theme: "The Golden Daybreak",
        quote: "A bright sky welcomed a life that would change everything.",
        story: `On the clear and radiant morning you were born, the sky was completely flooded with brilliant, warm sunshine. Natural golden light poured through the frame at a pristine ${tempC}°C (${tempF}°F), lighting up the room as we held you for the absolute first time. Not a single cloud had the courage to compete with your glowing earthly debut. You arrived in a bright, inviting world, immediately becoming the central sun of our entire universe.`,
        metricLabel: "HEARTWARMING HARMONY",
        metricValue: "Prism of Pure Joy"
      };
    } else {
      // Overcast / Cloudy / Default
      return {
        theme: "The Velvet Blanket Skies",
        quote: "Soft clouds above. A brand-new chapter below.",
        story: `On the quiet day you were born, a beautiful velvet cloud layer blanketed the town in a natural, soft-focus light. With mild, quiet air hovering right around ${tempC}°C (${tempF}°F), the atmosphere felt like a gentle embrace designed specifically for deep, peaceful rest. As you took your first breaths under those protective, dreamy skies, we held you close and realized that the absolute best chapter of our family story had officially begun.`,
        metricLabel: "HEARTWARMING HARMONY",
        metricValue: "Velvet Softness"
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

    // Direct string extraction to avoid JavaScript local timezone offset shifts
    const segments = birthDate.split("-");
    if (segments.length !== 3) {
      setErrorMessage("Please select a valid birth date.");
      return;
    }

    const yearNum = parseInt(segments[0], 10);
    const monthNum = parseInt(segments[1], 10);
    const dayNum = parseInt(segments[2], 10);

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      setErrorMessage("Please enter a valid birth date.");
      return;
    }

    // Compare with today's local date boundaries in a timezone-robust way
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    if (
      yearNum > currentYear ||
      (yearNum === currentYear && monthNum > currentMonth) ||
      (yearNum === currentYear && monthNum === currentMonth && dayNum > currentDay)
    ) {
      setErrorMessage("Are they a time traveler? The birth date cannot be in the future!");
      return;
    }

    if (yearNum < 1940) {
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

      // Format pieces cleanly without timezone shifts
      const yearStr = String(yearNum);
      const monthStr = String(monthNum).padStart(2, "0");
      const dayStr = String(dayNum).padStart(2, "0");
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

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
      const formattedDate = `${monthStr}/${dayStr}/${yearStr}`;

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

  // High-resolution Instagram-safe Canvas download (1080x1350, 4:5 aspect ratio)
  const handleDownloadKeepsake = () => {
    if (!revealResult) return;
    setIsGeneratingImage(true);

    // Let React update the loading spinner state before starting heavy canvas matrix draw blocking
    setTimeout(() => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsGeneratingImage(false);
          return;
        }

        // Enable high-fidelity anti-aliasing configurations
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // 1. Cozy atmospheric background (Deep Slate Blue/Midnight gradient)
        const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
        bgGrad.addColorStop(0, "#0E1321"); // premium slate-midnight
        bgGrad.addColorStop(0.5, "#0A0D18"); // deep galaxy cosmic navy
        bgGrad.addColorStop(1, "#05070B"); // solid bottom black
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1350);

        // Draw glowing golden baby-light cosmic orb from upper right corner
        const sunGlow = ctx.createRadialGradient(900, 160, 50, 900, 160, 500);
        sunGlow.addColorStop(0, "rgba(232, 158, 130, 0.08)"); // cozy gold atmospheric mist
        sunGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, 1080, 1350);

        // Draw cool calming water-light cosmic orb from lower left corner
        const oceanGlow = ctx.createRadialGradient(180, 1150, 40, 180, 1150, 450);
        oceanGlow.addColorStop(0, "rgba(129, 140, 248, 0.05)"); // calming indigo mist
        oceanGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = oceanGlow;
        ctx.fillRect(0, 0, 1080, 1350);

        // 2. Linear matrix dots overlay (Fine architectural starry lines)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
        ctx.lineWidth = 1;
        for (let x = 80; x < 1000; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, 80);
          ctx.lineTo(x, 1270);
          ctx.stroke();
        }
        for (let y = 80; y < 1270; y += 32) {
          ctx.beginPath();
          ctx.moveTo(80, y);
          ctx.lineTo(1000, y);
          ctx.stroke();
        }

        // 3. Elegant double-bounding borders
        // Outer glow path
        ctx.strokeStyle = "rgba(232, 158, 130, 0.14)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(ctx, 60, 60, 960, 1230, 42);
        ctx.stroke();

        // Inner solid rule
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundRect(ctx, 70, 70, 940, 1210, 36);
        ctx.stroke();

        // Celestial four-point corner star ornaments
        drawFourPointStar(ctx, 84, 84, 10, "#E89E82");
        drawFourPointStar(ctx, 996, 84, 10, "#E89E82");
        drawFourPointStar(ctx, 84, 1266, 10, "#E89E82");
        drawFourPointStar(ctx, 996, 1266, 10, "#E89E82");

        // 4. Certificate Header Labels
        drawFourPointStar(ctx, 132, 160, 12, "#E89E82");
        ctx.fillStyle = "#E89E82";
        ctx.font = "bold 18px 'JetBrains Mono', 'Courier New', monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("WEATHER KEEPSAKE CERTIFICATE", 160, 160);

        // City Name Title (Georgia bold italic)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "italic bold 64px 'Georgia', 'Times New Roman', serif";
        ctx.fillText(revealResult.city, 130, 240);

        // Subheader Atmosphere Text
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        ctx.font = "600 22px 'Inter', 'system-ui', sans-serif";
        const coordDesc = revealResult.country ? `${revealResult.country} • Atmosphere and stars mapped` : "Atmosphere and stars mapped";
        ctx.fillText(coordDesc, 130, 300);

        // 5. BIRTH METEOROLOGICAL SNAPSHOT BOX (Upper-Right coordinates)
        ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        drawRoundRect(ctx, 650, 120, 300, 150, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = "bold 14px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText("BIRTH TEMPERATURE", 676, 160);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 30px 'Inter', 'system-ui', sans-serif";
        const tempString = `${Math.round(revealResult.tempMax)}°C / ${Math.round((revealResult.tempMax * 9) / 5 + 32)}°F`;
        ctx.fillText(tempString, 676, 210);

        // High resolution programmatic custom weather icon drawing inside the snapshot box
        drawCustomKeepsakeIcon(ctx, 884, 195, revealResult.weatherCode);

        // 6. Pill Tag Registry (Theme badge & dynamic birthday date width)
        ctx.fillStyle = "rgba(232, 158, 130, 0.12)";
        ctx.strokeStyle = "rgba(232, 158, 130, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        const themeText = `THEME: ${revealResult.story.theme.toUpperCase()}`;
        ctx.font = "bold 18px 'JetBrains Mono', 'Courier New', monospace";
        const themeWidth = ctx.measureText(themeText).width + 30;
        drawRoundRect(ctx, 130, 350, themeWidth, 44, 22);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#E89E82";
        ctx.fillText(themeText, 145, 372);

        ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
        ctx.font = "bold 20px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText(`DATE: ${revealResult.date}`, 130 + themeWidth + 24, 372);

        // 7. STORY PARAGRAPH (Beautifully wrapped and staggered with premium line spacing)
        ctx.fillStyle = "#E2E8F0";
        ctx.font = "34px 'Inter', 'system-ui', sans-serif";
        const startY = 460;
        const finalY = wrapText(ctx, revealResult.story.story, 130, startY, 820, 56);

        // 8. MEMORABLE QUOTE BANNER CONTAINER (Offset dynamically to avoid overlaps)
        const quoteBoxY = finalY + 70;
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
        ctx.beginPath();
        drawRoundRect(ctx, 130, quoteBoxY, 820, 180, 20);
        ctx.fill();

        // Vertical premium left gold indicator line
        ctx.fillStyle = "#E89E82";
        ctx.fillRect(132, quoteBoxY + 20, 6, 140);

        ctx.fillStyle = "#D48D71";
        ctx.font = "bold 15px 'JetBrains Mono', 'Courier New', monospace";
        ctx.fillText("MEMORABLE OUTLOOK", 160, quoteBoxY + 50);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "italic 34px 'Georgia', 'Times New Roman', serif";
        wrapText(ctx, `“${revealResult.story.quote}”`, 160, quoteBoxY + 110, 750, 46);

        // 9. BOTTOM METADATA DIVIDER & FOOTER LABELS
        const footerY = 1120;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(130, footerY);
        ctx.lineTo(950, footerY);
        ctx.stroke();

        // Vector Heart graphic representation
        drawHeartIcon(ctx, 130, footerY + 36, 24, "#E89E82");

        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = "bold 20px 'JetBrains Mono', 'Courier New', monospace";
        ctx.textBaseline = "middle";
        ctx.fillText(`${revealResult.story.metricLabel}: `, 166, footerY + 46);

        const metricLabelWidth = ctx.measureText(`${revealResult.story.metricLabel}: `).width;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(revealResult.story.metricValue, 166 + metricLabelWidth, footerY + 46);

        // Bottom Right: Branding footer
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.font = "bold 20px 'JetBrains Mono', 'Courier New', monospace";
        ctx.textAlign = "right";
        ctx.fillText("Weather When Born • Keepsake Edition", 950, footerY + 46);

        // 10. TRIGGER PNG ANCHOR DOWNLOAD
        const dataUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        const safeCity = revealResult.city.replace(/[^a-zA-Z0-9]/g, "_");
        const safeDate = revealResult.date.replace(/\//g, "-");
        downloadLink.download = `Keepsake_${safeCity}_${safeDate}.png`;
        downloadLink.href = dataUrl;
        downloadLink.click();
      } catch (err) {
        console.error("Keepsake high-resolution render failed:", err);
      } finally {
        setIsGeneratingImage(false);
      }
    }, 800);
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
                    THE GOLDEN DAYBREAK
                  </span>
                  <p className="text-xs leading-relaxed text-slate-300 font-sans">
                    On the beautiful, sunlit morning you were born, the Austin skies were perfect, clear gold. As warm autumn light filled the room, our world changed forever. It felt as if the sun had cleared the clouds just for your arrival. We held you close under those warm October beams, realizing that the brightest light was now inside.
                  </p>
                </div>

                {/* Short bold Quote */}
                <p className="text-sm font-serif italic text-white/95 border-l-2 border-[#E89E82] pl-3 py-1 bg-white/[0.02]">
                  “A bright sky welcomed a life that would change everything.”
                </p>

                {/* Simulated Metadata footer details */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Heart size={10} className="text-[#E89E82] fill-[#E89E82]" />
                    <span>Nursery Memory Keepsake</span>
                  </div>
                  <span>Original Edition</span>
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
              <span>Your Authentic Weather Keepsake</span>
            </div>

            <div className="max-w-xl mx-auto rounded-[36px] bg-[#0E1321] text-[#FEFAF6] p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              {/* Premium cozy star/cloud grid graphic background overlay */}
              <div className="absolute inset-0 bg-[#161c2e]/20 [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

              <div className="relative z-10 space-y-6 text-left">
                {/* Header: Birth Info & Geolocation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-4">
                  <div>
                    <span className="text-[9px] font-mono tracking-widest text-[#E89E82] uppercase bg-[#E89E82]/10 border border-[#E89E82]/20 px-2.5 py-0.5 rounded-full font-bold">
                      Weather Keepsake Certificate
                    </span>
                    <h3 className="font-serif italic font-extrabold text-2xl sm:text-3xl text-white mt-1.5 font-sans leading-tight">
                      {revealResult.city}
                    </h3>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
                      {revealResult.country ? `${revealResult.country} • ` : ""}Atmosphere and stars mapped
                    </p>
                  </div>
                  
                  {/* Meteorological snapshot snapshot */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 self-start sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-300 block">BIRTH TEMPERATURE</span>
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
                  <p className="text-[10px] font-mono text-[#D48D71] uppercase tracking-widest font-bold mb-1.5">MEMORABLE OUTLOOK</p>
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
                  <span className="text-slate-500 bg-white/5 px-2 py-0.5 rounded font-mono uppercase tracking-widest text-[9px]">
                    Digital Milestone Edition
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Keepsake Download Controls below card */}
            <div className="flex flex-col items-center gap-3 mt-8">
              <button
                type="button"
                disabled={isGeneratingImage}
                onClick={handleDownloadKeepsake}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#D48D71] to-[#E89E82] hover:opacity-95 active:scale-[0.98] text-[#1E1415] font-mono text-xs uppercase tracking-widest font-extrabold px-10 py-4 rounded-2xl shadow-xl transition-all duration-200 cursor-pointer disabled:opacity-75"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="animate-spin text-[#1E1415]" size={14} />
                    <span>Crafting Keepsake...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} className="stroke-[2.5]" />
                    <span>Download Keepsake</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase text-center mt-1">
                Optimized for Instagram (4:5 vertical), Facebook, and baby memory albums
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ==========================================
// HIGH RESOLUTION CANVAS EXPORT GRAPHICS SETUP
// ==========================================

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

function drawFourPointStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
}

function drawHeartIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const d = size;
  ctx.moveTo(x, y + d / 4);
  ctx.quadraticCurveTo(x, y, x + d / 2, y);
  ctx.quadraticCurveTo(x + d, y, x + d, y + d / 3);
  ctx.quadraticCurveTo(x + d, y + (d * 5) / 8, x + d / 2, y + d);
  ctx.quadraticCurveTo(x, y + (d * 5) / 8, x, y + d / 3);
  ctx.quadraticCurveTo(x, y, x, y + d / 4);
  ctx.fill();
}

function drawCustomKeepsakeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, code: number) {
  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
  const isSnowy = [71, 73, 75, 77, 85, 86].includes(code);
  const isSunny = [0, 1].includes(code);

  if (isSunny) {
    // Premium bright golden sun
    ctx.beginPath();
    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 24);
    grad.addColorStop(0, "#FEF08A");
    grad.addColorStop(1, "#F59E0B");
    ctx.fillStyle = grad;
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();

    // Golden sunburst rays
    ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x1 = cx + Math.cos(angle) * 26;
      const y1 = cy + Math.sin(angle) * 26;
      const x2 = cx + Math.cos(angle) * 36;
      const y2 = cy + Math.sin(angle) * 36;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  } else if (isRainy) {
    // Soft fluffy indigo raining cloud
    drawSingleCloudShape(ctx, cx, cy - 8, "#E2E8F0");
    
    // Glowing diagonal rainfall drops
    ctx.strokeStyle = "#818CF8";
    ctx.lineWidth = 3;
    const dropOffsets = [
      { dx: -12, dy: 14 },
      { dx: 0, dy: 20 },
      { dx: 12, dy: 14 },
    ];
    dropOffsets.forEach(({ dx, dy }) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy + dy);
      ctx.lineTo(cx + dx - 4, cy + dy + 10);
      ctx.stroke();
    });
  } else if (isSnowy) {
    // Beautiful winter snowy cloud
    drawSingleCloudShape(ctx, cx, cy - 8, "#FFFFFF");

    // Stellar ice stars
    ctx.strokeStyle = "#93C5FD";
    ctx.lineWidth = 2.5;
    const flakeOffsets = [
      { dx: -10, dy: 18, size: 6 },
      { dx: 10, dy: 18, size: 6 },
      { dx: 0, dy: 24, size: 8 }
    ];
    flakeOffsets.forEach(({ dx, dy, size }) => {
      const scx = cx + dx;
      const scy = cy + dy;
      for (let i = 0; i < 4; i++) {
        const rad = (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(scx - Math.cos(rad) * size, scy - Math.sin(rad) * size);
        ctx.lineTo(scx + Math.cos(rad) * size, scy + Math.sin(rad) * size);
        ctx.stroke();
      }
    });
  } else {
    // Soft overcast cloudy sky
    drawSingleCloudShape(ctx, cx + 8, cy - 4, "rgba(255, 255, 255, 0.4)");
    drawSingleCloudShape(ctx, cx - 6, cy + 4, "rgba(255, 255, 255, 0.95)");
  }
}

function drawSingleCloudShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, fillStyle: string) {
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(cx - 14, cy + 4, 12, 0, Math.PI * 2);
  ctx.arc(cx, cy - 2, 16, 0, Math.PI * 2);
  ctx.arc(cx + 14, cy + 4, 11, 0, Math.PI * 2);
  ctx.rect(cx - 14, cy, 28, 16);
  ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let y = startY;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y;
}
