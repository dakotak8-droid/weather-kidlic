import React from "react";
import { AlertCircle, ShieldAlert, Sparkles, HelpCircle } from "lucide-react";
import { motion } from "motion/react";
import { SurvivalForecastItem } from "../types";
import WeatherIcon from "./WeatherIcon";

interface ParentSurvivalProps {
  survivalItems: SurvivalForecastItem[];
}

export default function ParentSurvival({ survivalItems }: ParentSurvivalProps) {
  if (survivalItems.length === 0) return null;

  return (
    <section 
      id="survival-forecast-section" 
      className="max-w-4xl mx-auto px-4 py-12 relative select-none"
    >
      <div className="text-center mb-10">
        <h2 className="font-serif italic font-semibold text-3xl text-[#3D2C2E] dark:text-[#FEFAF6] mb-2">
          Parental Survival Risk Forecast
        </h2>
        <p className="text-sm italic text-[#7A6363] dark:text-slate-400 font-serif max-w-xl mx-auto">
          We converted standard relative humidity and pressure differentials into real parenting friction metrics. Prep accordingly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {survivalItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex flex-col justify-between bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div>
              {/* Card Header with Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-[#FDE2D3] dark:bg-[#3B282A] rounded-2xl">
                  {/* Pull dynamically styled custom parenting icons */}
                  <WeatherIcon iconName={item.iconName} size={24} />
                </div>
                
                {/* Risk assessment alert level banner */}
                <span className={`text-[10px] font-mono tracking-wider font-bold uppercase px-2.5 py-1 rounded-full border ${
                  item.probability >= 90 
                    ? "bg-[#FDE2D3] border-[#FDE2D3] text-[#D48D71] dark:bg-[#3B282A] dark:border-[#3B282A] dark:text-[#E89E82]"
                    : "bg-[#FEFAF6] border-[#F0E4DA] text-[#7A6363] dark:bg-[#1E1415]/60 dark:border-[#3B282A] dark:text-[#FEFAF6]/80"
                }`}>
                  {item.probability >= 90 ? "Critical Risk" : "Elevated Risk"}
                </span>
              </div>

              {/* Metric Title */}
              <h4 className="font-serif italic font-bold text-[#4A3B3B] dark:text-[#FEFAF6] mb-1.5 text-left">
                {item.metric}
              </h4>
              
              {/* Humorous Description */}
              <p className="text-xs text-[#7A6363] dark:text-slate-350 font-sans mb-5 leading-relaxed text-left">
                {item.funnyComment}
              </p>
            </div>

            <div>
              {/* Probability Visual Indicator */}
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[9px] font-mono text-[#7A6363] uppercase tracking-wider">Calculated Intensity</span>
                <span className="font-serif font-extrabold text-2xl text-[#D48D71] dark:text-[#E89E82]">
                  {item.probability}%
                </span>
              </div>

              {/* Progress gauge animation */}
              <div className="w-full h-2 bg-[#F9F1EB] dark:bg-[#1E1415] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.probability}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#FFD580] via-[#FF8C69] to-[#D48D71] rounded-full"
                ></motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Funny Parental Pro-Tip Warning Badge */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-5 bg-[#F9F1EB] dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl flex flex-col sm:flex-row gap-4 items-center sm:items-start text-left max-w-2xl mx-auto shadow-sm"
      >
        <div className="p-2.5 bg-[#FDE2D3] dark:bg-[#1E1415] shadow-inner rounded-xl text-[#D48D71] dark:text-[#E89E82] shrink-0">
          <ShieldAlert size={20} className="animate-pulse" />
        </div>
        <div>
          <h5 className="font-mono font-bold text-[10px] text-[#A8644A] dark:text-[#E89E82] uppercase tracking-wider mb-1">
            Veteran Parent Survival Advice
          </h5>
          <p className="text-xs text-[#7A6363] dark:text-slate-350 leading-relaxed font-sans">
            "Never make eye contact with a toddler who just stepped in a puddle or received a dry cookie. Remain completely calm, deploy fruit purees immediately, and slowly walk backwards."
          </p>
        </div>
      </motion.div>
    </section>
  );
}
