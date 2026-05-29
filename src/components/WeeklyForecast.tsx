import React from "react";
import { Calendar } from "lucide-react";
import { motion } from "motion/react";
import { DailyForecast } from "../types";
import WeatherIcon from "./WeatherIcon";

interface WeeklyForecastProps {
  daily: DailyForecast[];
  isFahrenheit: boolean;
}

export default function WeeklyForecast({ daily, isFahrenheit }: WeeklyForecastProps) {
  // Unit conversion helper
  const formatTemp = (celsius: number) => {
    if (isFahrenheit) {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  // Convert date string into beautiful scannable weekdays
  const getWeekdayName = (dateStr: string) => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    
    // Compare dates
    if (today.toDateString() === targetDate.toDateString()) {
      return "Today";
    }
    
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (tomorrow.toDateString() === targetDate.toDateString()) {
      return "Tomorrow";
    }

    return targetDate.toLocaleDateString("en-US", { weekday: "long" });
  };

  const getMonthDay = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    return targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-12 select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 text-center sm:text-left gap-2">
        <div>
          <h2 className="font-serif italic font-semibold text-3xl text-[#3D2C2E] dark:text-[#FEFAF6] flex items-center justify-center sm:justify-start gap-2.5">
            <Calendar size={24} className="text-[#D48D71] dark:text-[#E89E82]" />
            <span>The Parent Outlook Week</span>
          </h2>
          <p className="text-sm italic text-[#7A6363] dark:text-slate-400 font-serif mt-1">
            Looking ahead to plot stroller trajectories, playground escape coordinates, and grocery runs.
          </p>
        </div>
      </div>

      {/* Horizontal horizontal layout/scrollable wrapping cards */}
      <div className="flex flex-col gap-3.5">
        {daily.map((day, idx) => (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-2xl md:rounded-3xl hover:shadow-md transition-all gap-4 text-center sm:text-left"
          >
            {/* Weekday & date representation */}
            <div className="sm:w-1/4 shrink-0">
              <h4 className="font-serif font-bold italic text-[#3D2C2E] dark:text-white leading-snug">
                {getWeekdayName(day.date)}
              </h4>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{getMonthDay(day.date)}</p>
            </div>

            {/* Custom weather code icon */}
            <div className="flex items-center gap-3 justify-center sm:w-1/6 shrink-0">
              <div className="p-2 bg-[#F9F1EB] dark:bg-[#1E1415]/70 rounded-xl border border-[#F0E4DA] dark:border-[#3B282A]/50">
                <WeatherIcon code={day.weatherCode} size={28} />
              </div>
            </div>

            {/* Emotional Lifestyle Parent Mood Level (Highlight item!) */}
            <div className="flex-1 sm:w-1/3 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-3 py-1 bg-[#FDE2D3] dark:bg-[#3B282A] text-[#D48D71] dark:text-[#E89E82] border border-[#FDE2D3]/20 dark:border-[#3B282A] rounded-full">
                <span className="w-1.5 h-1.5 bg-[#D48D71] dark:bg-[#E89E82] rounded-full animate-ping"></span>
                <span>{day.moodLabel}</span>
              </span>
            </div>

            {/* Precipitation Prob */}
            <div className="sm:w-1/12 shrink-0">
              {day.rainProb > 0 ? (
                <p className="text-xs font-mono font-bold text-[#D48D71] dark:text-[#E89E82]">
                  💧 {day.rainProb}%
                </p>
              ) : (
                <p className="text-xs font-mono font-medium text-slate-450 dark:text-slate-500">0%</p>
              )}
            </div>

            {/* Temperatures: High-Low range display */}
            <div className="sm:w-1/6 shrink-0 text-right">
              <div className="inline-flex items-center gap-3">
                <span className="font-serif font-extrabold text-sm md:text-base text-[#3D2C2E] dark:text-white">
                  {formatTemp(day.tempMax)}
                </span>
                <span className="w-1.5 h-3 bg-[#F0E4DA] dark:bg-[#3B282A] rounded-full rotate-12"></span>
                <span className="font-serif font-medium text-xs md:text-sm text-slate-400 dark:text-slate-500">
                  {formatTemp(day.tempMin)}
                </span>
              </div>
            </div>

          </motion.div>
        ))}
      </div>
    </section>
  );
}
