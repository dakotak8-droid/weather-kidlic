import React from "react";
import { Wind, Droplets, Thermometer, CloudRain, Clock, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { CurrentWeather, HourlyForecast } from "../types";
import WeatherIcon from "./WeatherIcon";

interface DailyForecastProps {
  currentWeather: CurrentWeather | null;
  hourly: HourlyForecast[];
  isFahrenheit: boolean;
}

export default function DailyForecast({ currentWeather, hourly, isFahrenheit }: DailyForecastProps) {
  if (!currentWeather) return null;

  // Temp conversion helper
  const formatTemp = (celsius: number) => {
    if (isFahrenheit) {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Wind speed conversion helper
  const formatWind = (speedKmh: number) => {
    // Return km/h or mph
    return `${Math.round(speedKmh)} km/h`;
  };

  // Convert wind speed to funny parent danger levels
  const getWindHumor = (speed: number) => {
    if (speed < 5) return "Perfect for blowing bubbles.";
    if (speed < 15) return "Optimal sidewalk-chalk draft.";
    if (speed < 30) return "Hat-stealing danger: high.";
    return "Stroller parachute drag advisory active.";
  };

  // Get dynamic hour timeline labels (translating normal hours into parent shifts)
  const getParentShiftName = (timeStr: string) => {
    const date = new Date(timeStr);
    const h = date.getHours();
    
    if (h >= 6 && h < 9) return "Morning Shifts (Coffee Rush) ☕";
    if (h >= 9 && h < 13) return "Snack Escalation Zone 🥨";
    if (h >= 13 && h < 16) return "The Sacred Quiet (Naptime?) 🤫";
    if (h >= 16 && h < 20) return "Pre-Bedtime Toy Storm 🧸";
    if (h >= 20 && h < 24) return "Adult Wind-Down Shift 🍷";
    return "Sleepy Ghostly Whispers 😴";
  };

  // Grab some representatives hours (e.g., every 3 hours starting from now)
  const filteredHourly = hourly.filter((_, index) => index % 3 === 0).slice(0, 5);

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Lefthand side: Meteorology Detail Card */}
        <motion.div 
          className="md:col-span-12 lg:col-span-5 bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
          whileHover={{ y: -3 }}
        >
          <h3 className="font-serif italic font-bold text-xl text-[#4A3B3B] dark:text-[#FEFAF6] mb-5 flex items-center gap-2.5">
            <Thermometer size={18} className="text-[#D48D71] dark:text-[#E89E82]" />
            <span>The Parent Stats Desk</span>
          </h3>

          <div className="space-y-4">
            
            {/* Real Feel Info */}
            <div className="flex items-center justify-between p-3.5 bg-[#F9F1EB] dark:bg-[#1E1415]/70 rounded-2xl border border-[#F0E4DA] dark:border-[#3B282A]">
              <div className="flex items-center gap-3">
                <Thermometer className="text-[#D48D71] dark:text-[#E89E82]" size={20} />
                <div className="text-left">
                  <p className="text-[9px] text-[#7A6363] dark:text-slate-400 font-mono tracking-wider uppercase">APPETENT TEMP</p>
                  <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-200">How it feels on skin</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif font-extrabold text-xl text-[#3D2C2E] dark:text-[#FEFAF6]">
                  {formatTemp(currentWeather.feelsLike)}
                </p>
              </div>
            </div>

            {/* Relative Humidity Info */}
            <div className="flex items-center justify-between p-3.5 bg-[#F9F1EB] dark:bg-[#1E1415]/70 rounded-2xl border border-[#F0E4DA] dark:border-[#3B282A]">
              <div className="flex items-center gap-3">
                <Droplets className="text-[#D48D71] dark:text-teal-450" size={20} />
                <div className="text-left">
                  <p className="text-[9px] text-[#7A6363] dark:text-slate-400 font-mono tracking-wider uppercase">HUMIDITY SCALES</p>
                  <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-200">Sticky fingers rating</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif font-extrabold text-xl text-[#3D2C2E] dark:text-[#FEFAF6]">
                  {currentWeather.humidity}%
                </p>
              </div>
            </div>

            {/* Precipitation Info */}
            <div className="flex items-center justify-between p-3.5 bg-[#F9F1EB] dark:bg-[#1E1415]/70 rounded-2xl border border-[#F0E4DA] dark:border-[#3B282A]">
              <div className="flex items-center gap-3">
                <CloudRain className="text-[#D48D71] dark:text-indigo-400" size={20} />
                <div className="text-left">
                  <p className="text-[9px] text-[#7A6363] dark:text-slate-400 font-mono tracking-wider uppercase">WATER MASS</p>
                  <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-200">Precipitation amount</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-serif font-extrabold text-xl text-[#3D2C2E] dark:text-[#FEFAF6]">
                  {currentWeather.precipitation} mm
                </p>
              </div>
            </div>

            {/* Wind Info with Humor */}
            <div className="flex flex-col gap-2 p-3.5 bg-[#F9F1EB] dark:bg-[#1E1415]/70 rounded-2xl border border-[#F0E4DA] dark:border-[#3B282A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wind className="text-[#D48D71] dark:text-[#E89E82]" size={20} />
                  <div className="text-left">
                    <p className="text-[9px] text-[#7A6363] dark:text-slate-400 font-mono tracking-wider uppercase">ATMOSPHERIC SPEED</p>
                    <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-200">Wind velocity</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-serif font-extrabold text-[#3D2C2E] dark:text-[#FEFAF6]">
                    {formatWind(currentWeather.windSpeed)}
                  </p>
                </div>
              </div>
              <div className="mt-1 pl-8 text-xs italic text-[#7A6363] dark:text-slate-400 border-l-2 border-[#F0E4DA] dark:border-[#3B282A] text-left">
                "{getWindHumor(currentWeather.windSpeed)}"
              </div>
            </div>

          </div>
        </motion.div>

        {/* Righthand side: Hourly Child Activity Timeline */}
        <motion.div 
          className="md:col-span-12 lg:col-span-7 bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
          whileHover={{ y: -3 }}
        >
          <div>
            <h3 className="font-serif italic font-bold text-xl text-[#4A3B3B] dark:text-[#FEFAF6] mb-2 flex items-center gap-2.5">
              <Clock size={18} className="text-[#D48D71] dark:text-[#E89E82]" />
              <span>Hourly Child-Energy Timeline</span>
            </h3>
            <p className="text-xs text-[#7A6363] dark:text-[#FEFAF6]/70 font-sans mb-5 text-left">
              Real-time atmospheric predictions aligned with the psychological shifting points of youth behavior.
            </p>
          </div>

          <div className="space-y-4">
            {filteredHourly.map((hour, idx) => {
              const date = new Date(hour.time);
              const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-[#F9F1EB] dark:bg-[#1E1415]/70 rounded-2xl border border-[#F0E4DA] dark:border-[#3B282A] hover:border-[#D48D71]/40 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <span className="font-mono text-[10px] tracking-wide font-bold text-[#D48D71] dark:text-[#E89E82] block">{formattedTime}</span>
                      <span className="text-xs font-semibold text-[#3D2C2E] dark:text-slate-200 block truncate max-w-[170px] sm:max-w-[240px]">
                        {getParentShiftName(hour.time)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Tiny animated icon */}
                    <WeatherIcon code={hour.weatherCode} size={24} />
                    
                    <div className="text-right">
                      <p className="font-serif font-extrabold text-sm text-[#3D2C2E] dark:text-[#FEFAF6]">
                        {formatTemp(hour.temp)}
                      </p>
                      
                      {/* Rain Probability Badge */}
                      {hour.rainProb > 0 ? (
                        <span className="inline-flex items-center text-[10px] bg-[#FDE2D3] dark:bg-[#3B282A] text-[#D48D71] dark:text-[#E89E82] font-mono px-1.5 py-0.5 rounded-md border border-[#F0E4DA] dark:border-[#3B282A] font-medium">
                          💧 {hour.rainProb}% rain
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] bg-[#FEFAF6] dark:bg-[#1E1415]/60 text-[#7A6363] dark:text-slate-300 font-mono px-1.5 py-0.5 rounded-md border border-[#F0E4DA] dark:border-[#3B282A]/50 font-medium">
                          ☀️ dry
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 bg-[#FDE2D3]/40 dark:bg-[#3B282A]/30 border border-[#F0E4DA]/80 dark:border-[#3B282A] rounded-2xl text-[11px] text-[#7A6363] dark:text-slate-350 font-sans italic text-left flex items-start gap-2.5">
            <Sparkles size={14} className="shrink-0 mt-0.5 text-[#D48D71]" />
            <span>Note: Hourly predictions can fluctuate rapidly depending on toddler crayon selections and juice splashes.</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
