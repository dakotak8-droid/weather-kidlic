/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import BirthWeatherStory from "./components/BirthWeatherStory";

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("keepsake_weather_theme_dark");
    if (saved) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("keepsake_weather_theme_dark", isDark.toString());
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FEFAF6] to-[#F9F1EB] dark:from-[#1E1415] dark:to-[#2B1D1F] transition-colors duration-500 flex flex-col justify-between">
      
      {/* Ambient lighting effect */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none blur-3xl rounded-full"></div>

      <div>
        {/* Main Navigation Header - Align with layout */}
        <header className="max-w-[1280px] mx-auto px-6 sm:px-8 md:px-12 py-8 flex items-center justify-between pointer-events-auto relative z-50 select-none">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">☕</span>
            <div>
              <div className="text-2xl font-serif italic font-bold tracking-tight text-[#D48D71] dark:text-[#E89E82] leading-tight">
                Mumble & Clouds
              </div>
              <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 dark:text-slate-450 font-bold block leading-none mt-1">
                Weather Keepsake Edition
              </span>
            </div>
          </div>

          {/* Global Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 bg-white/80 hover:bg-white dark:bg-[#2B1D1F] dark:hover:bg-[#3B282A] border border-[#F0E4DA] dark:border-[#3B282A] rounded-2xl text-[#3D2C2E] dark:text-[#FEFAF6] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
              aria-label="Theme toggle"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* Historical Date Weather Story Section */}
        <main className="relative z-10">
          <BirthWeatherStory />
        </main>
      </div>

      {/* Atmospheric Weather Keepsake Footer */}
      <footer className="border-t border-[#F0E4DA] dark:border-[#3B282A] bg-white/40 dark:bg-[#1E1415]/20 backdrop-blur-md py-12 px-6 select-none mt-12">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-[#7A6363] dark:text-slate-400 font-mono tracking-widest uppercase font-bold">
            <Sun size={13} className="text-[#D48D71]" />
            <span>Historical Climate Archives</span>
          </div>

          <p className="font-serif italic text-[#7A6363] dark:text-slate-300 leading-relaxed mb-4 text-sm max-w-sm mx-auto">
            "Map the exact atmosphere of any historic date. Preserving the skies, winds, and temperature in a timeless keepsake."
          </p>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            © {new Date().getFullYear()} Mumble & Clouds Keepsake • All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
