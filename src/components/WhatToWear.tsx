import React, { useState } from "react";
import { Sparkles, ShoppingBag, Shirt, Lightbulb, Compass } from "lucide-react";
import { motion } from "motion/react";
import { ClothingSuggestion } from "../types";

interface WhatToWearProps {
  clothing: ClothingSuggestion;
}

export default function WhatToWear({ clothing }: WhatToWearProps) {
  const [activeTab, setActiveTab] = useState<"all" | "baby" | "toddler" | "parent">("all");

  // Funny checklist items of parenting gear based to carry
  const parentDuffelItems = [
    { text: "At least 3 half-chewed oat bars of unknown vintage.", id: "bar" },
    { text: "Approximately 45 wet wipes (35 dried, 10 fully functioning).", id: "wipe" },
    { text: "A remarkably smooth rock a toddler instructed you to guard with your life.", id: "rock" },
    { text: "Emergency change of trousers (for the adult, because splash damage is real).", id: "pants" }
  ];

  return (
    <section className="bg-[#FEFAF6] dark:bg-[#1E1415] px-4 py-16 select-none border-y border-[#F0E4DA] dark:border-[#3B282A]">
      <div className="max-w-4xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase font-mono tracking-widest bg-[#FDE2D3] border border-[#FDE2D3] text-[#D48D71] dark:bg-[#3B282A] dark:border-[#3B282A] dark:text-[#E89E82] px-3 py-1 rounded-full font-bold">
            Tactical Outfitting Station
          </span>
          <h2 className="font-serif italic font-semibold text-3xl text-[#3D2C2E] dark:text-white mt-4 mb-2">
            What to Wear Today Outfit Advisor
          </h2>
          <p className="text-sm italic text-[#7A6363] dark:text-slate-400 font-serif max-w-xl mx-auto">
            Practical, weather-calibrated clothing recommendations balanced against the absolute sovereign resistance of young children.
          </p>
        </div>

        {/* Tab Filters for Mobile responsiveness */}
        <div className="flex justify-center bg-[#F9F1EB] dark:bg-[#2B1D1F] p-1 rounded-2xl max-w-sm mx-auto mb-8 border border-[#F0E4DA] dark:border-[#3B282A]">
          {(["all", "baby", "toddler", "parent"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl capitalize transition-all ${
                activeTab === tab
                  ? "bg-white dark:bg-[#1E1415] shadow-sm text-[#3D2C2E] dark:text-[#FEFAF6]"
                  : "text-[#7A6363] dark:text-slate-450 hover:text-[#3D2C2E]"
              }`}
            >
              {tab === "all" ? "Reveal All" : tab}
            </button>
          ))}
        </div>

        {/* Clothing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Baby Card */}
          {(activeTab === "all" || activeTab === "baby") && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="p-2.5 bg-[#FDE2D3] dark:bg-[#3B282A] rounded-xl text-xl leading-none">
                    👶
                  </span>
                  <div>
                    <h4 className="font-serif italic font-bold text-md text-[#3D2C2E] dark:text-white">Babies & Crawlers</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">0 - 12 Months</span>
                  </div>
                </div>
                
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-1">Recommended Armor</h5>
                <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-250 leading-relaxed mb-6 font-sans">
                  {clothing.baby}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0E4DA] dark:border-[#3B282A]/60 bg-[#F9F1EB] dark:bg-[#1E1415]/60 p-4 -mx-6 -mb-6 rounded-b-3xl">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-[#D48D71] dark:text-[#E89E82] font-bold mb-1">
                  <Lightbulb size={12} /> The Override Veto
                </span>
                <p className="text-xs text-[#7A6363] dark:text-slate-350 font-sans leading-relaxed">
                  "Will spit up on shoulder line within 10 yards of leaving home. Carry a reserve bib, and do not make sudden moves."
                </p>
              </div>
            </motion.div>
          )}

          {/* Toddler Card */}
          {(activeTab === "all" || activeTab === "toddler") && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="p-2.5 bg-[#FDE2D3] dark:bg-[#3B282A] rounded-xl text-xl leading-none">
                    🦖
                  </span>
                  <div>
                    <h4 className="font-serif italic font-bold text-md text-[#3D2C2E] dark:text-white">The Toddler Tornado</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">1 - 4 Years</span>
                  </div>
                </div>
                
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-1">Recommended Armor</h5>
                <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-250 leading-relaxed mb-6 font-sans">
                  {clothing.toddler}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0E4DA] dark:border-[#3B282A]/60 bg-[#F9F1EB] dark:bg-[#1E1415]/60 p-4 -mx-6 -mb-6 rounded-b-3xl">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-[#D48D71] dark:text-[#E89E82] font-bold mb-1">
                  <Lightbulb size={12} /> The Override Veto
                </span>
                <p className="text-xs text-[#7A6363] dark:text-slate-350 font-sans leading-relaxed">
                  "Jacket highly mandated. Tiny human completely disagrees. Will wear single princess pajama pant leg, boots, and zero mittens."
                </p>
              </div>
            </motion.div>
          )}

          {/* Parent Card */}
          {(activeTab === "all" || activeTab === "parent") && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="p-2.5 bg-[#FDE2D3] dark:bg-[#3B282A] rounded-xl text-xl leading-none">
                    ☕
                  </span>
                  <div>
                    <h4 className="font-serif italic font-bold text-md text-[#3D2C2E] dark:text-white">The Tired Survivor</h4>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Parent Crew</span>
                  </div>
                </div>
                
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-[#7A6363] font-bold mb-1">Recommended Armor</h5>
                <p className="text-sm font-semibold text-[#3D2C2E] dark:text-slate-250 leading-relaxed mb-6 font-sans">
                  {clothing.parent}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0E4DA] dark:border-[#3B282A]/60 bg-[#F9F1EB] dark:bg-[#1E1415]/60 p-4 -mx-6 -mb-6 rounded-b-3xl">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-[#D48D71] dark:text-[#E89E82] font-bold mb-1">
                  <Lightbulb size={12} /> The Override Veto
                </span>
                <p className="text-xs text-[#7A6363] dark:text-slate-350 font-sans leading-relaxed">
                  "We hope you fancy reheated coffee spots because you'll be wearing one by 10 AM. Black hoodies hide chocolate signatures well."
                </p>
              </div>
            </motion.div>
          )}

        </div>

        {/* Parent Tactical Duffel Checklist (Horizontal footer bar styled with Editorial Olive Green!) */}
        <div className="mt-12 bg-[#5A5A40] text-white rounded-3xl p-8 text-left relative overflow-hidden shadow-md">
          {/* Accent decoration element */}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-4 border-b border-white/10 gap-3">
            <h4 className="font-serif italic font-semibold text-2xl flex items-center gap-2">
              <ShoppingBag size={20} className="text-amber-100" />
              <span>Tactical Outing Duffel Checklist</span>
            </h4>
            <span className="text-[9px] font-mono bg-white/15 text-white/95 px-2 py-0.5 rounded uppercase tracking-widest font-semibold">
              MANDATORY SECURED GOODS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {parentDuffelItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5 text-sm text-[#F0E4DA]">
                <span className="text-amber-200 shrink-0 mt-0.5">✔</span>
                <span className="font-sans leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
