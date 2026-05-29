import React, { useState } from "react";
import { Copy, Camera, Check, RefreshCw, Quote, Heart, Share2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SocialShareProps {
  initialQuote: string;
  initialHashtag: string;
}

export default function SocialShare({ initialQuote, initialHashtag }: SocialShareProps) {
  const [quoteText, setQuoteText] = useState(initialQuote);
  const [hashtag, setHashtag] = useState(initialHashtag);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Design card backgrounds
  const CARD_THEMES = [
    { name: "Cozy Slate", bg: "bg-[#3D2C2E] text-[#FEFAF6]", border: "border-[#3D2C2E]", badge: "bg-white/10 text-white", tag: "text-[#D48D71]" },
    { name: "Target Lavender", bg: "bg-[#F5EFF6] text-[#4A3B3B] dark:bg-[#2A1E2D] dark:text-[#F1E8F2]", border: "border-[#E1D4E3] dark:border-[#3B282A]", badge: "bg-[#EBD3F0]/60 text-[#714A7A] dark:bg-purple-950/60 dark:text-purple-300", tag: "text-purple-500 dark:text-purple-300" },
    { name: "Puddle Teal", bg: "bg-[#EDF5F5] text-[#3D4A4A] dark:bg-[#1E2D2D] dark:text-[#E8F2F2]", border: "border-[#D4E3E3] dark:border-[#3B282A]", badge: "bg-[#D3EEF0]/60 text-[#4A727A] dark:bg-teal-955/60 dark:text-teal-300", tag: "text-teal-600 dark:text-teal-400" },
    { name: "Pantry Rose", bg: "bg-[#FAF2EE] text-[#543D32] dark:bg-[#2E1F1A] dark:text-[#F7EBE6]", border: "border-[#F0E4DA] dark:border-[#3B282A]", badge: "bg-[#FDE2D3]/60 text-[#A8644A] dark:bg-[#3B282A] dark:text-[#E89E82]", tag: "text-[#D48D71]" },
    { name: "Naptime Amber", bg: "bg-[#FBF6EE] text-[#4A4032] dark:bg-[#2E281B] dark:text-[#FAEDDE]", border: "border-[#F3E6D0] dark:border-[#3B282A]", badge: "bg-[#F5EED0]/60 text-[#856D3D] dark:bg-amber-955/60 dark:text-amber-300", tag: "text-amber-600 dark:text-amber-400" }
  ];

  const [activeThemeIdx, setActiveThemeIdx] = useState(0);

  // Sync state if initial quote changes across cities
  React.useEffect(() => {
    setQuoteText(initialQuote);
    setHashtag(initialHashtag);
  }, [initialQuote, initialHashtag]);

  const presetQuotes = [
    { quote: "May your coffee be stronger than your toddler's negotiate will.", tag: "#FueledByCaffeine" },
    { quote: "Our living room is currently a tectonic overlay of cushions and damp blankets.", tag: "#RainyDayFort" },
    { quote: "Cozy weather: When putting on socks involves 45 minutes of philosophical discourse.", tag: "#ToddlerDebates" },
    { quote: "I thought I was a leader until I had to put boots on a floppy infant.", tag: "#WobbleLegs" },
    { quote: "Hiding in the kitchen pantry eating the premium biscuits is technically mindfulness.", tag: "#PantryPeace" }
  ];

  const rotatePreset = () => {
    const currentIdx = presetQuotes.findIndex(q => q.quote === quoteText);
    const nextIdx = (currentIdx + 1) % presetQuotes.length;
    setQuoteText(presetQuotes[nextIdx].quote);
    setHashtag(presetQuotes[nextIdx].tag);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`“${quoteText}” ${hashtag} @ParentWeather`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulatedExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 1500);
  };

  const currentTheme = CARD_THEMES[activeThemeIdx];

  return (
    <section className="max-w-4xl mx-auto px-4 py-16 select-none relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Lefthand side info and toggles */}
        <div className="md:col-span-5 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#D48D71] dark:text-[#E89E82] font-semibold block mb-2">
            Share the Struggle
          </span>
          <h2 className="font-serif italic font-semibold text-3xl text-[#3D2C2E] dark:text-[#FEFAF6] mb-4">
            Parent Quote Maker & Share Station
          </h2>
          <p className="text-sm italic text-[#7A6363] dark:text-slate-400 font-serif mb-6 leading-relaxed">
            Generate customized, minimalist quote screens to share with friends, other group chats, or post directly on Instagram. Type your own current coordinate or family event!
          </p>

          {/* Theme selection buttons */}
          <div className="mb-6">
            <h5 className="font-mono text-[9px] uppercase tracking-wider text-slate-450 font-bold mb-3.5 block text-left">Choose Card Palette</h5>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {CARD_THEMES.map((theme, idx) => (
                <button
                  key={theme.name}
                  onClick={() => setActiveThemeIdx(idx)}
                  className={`text-xs px-3.5 py-2 rounded-full border transition font-medium ${
                    activeThemeIdx === idx
                      ? "bg-[#3D2C2E] border-[#3D2C2E] text-white dark:bg-[#FDE2D3] dark:border-[#FDE2D3] dark:text-[#3D2C2E]"
                      : "bg-white border-[#F0E4DA] text-[#7A6363] hover:bg-[#F9F1EB] dark:bg-[#2B1D1F] dark:border-[#3B282A] dark:text-slate-350"
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Utility buttons */}
          <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
            <button
              onClick={rotatePreset}
              className="px-4 py-2 bg-[#F9F1EB] hover:bg-[#F0E4DA] border border-[#F0E4DA] text-slate-700 dark:bg-[#2B1D1F] dark:hover:bg-[#3B282A] dark:border-[#3B282A] dark:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Surprise Me</span>
            </button>
          </div>
        </div>

        {/* Righthand side Card Preview Pane styled like an Instagram Card */}
        <div className="md:col-span-7 flex flex-col items-center">
          
          {/* Card Mockup frame */}
          <div className="w-full max-w-sm relative">
            
            {/* Soft decorative background circles */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#FFD580]/15 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#D48D71]/15 rounded-full blur-2xl"></div>

            <motion.div
              layout
              className={`w-full aspect-[4/5] rounded-[32px] p-8 flex flex-col justify-between shadow-lg relative overflow-hidden transition-colors duration-500 border ${currentTheme.bg} ${currentTheme.border}`}
            >
              {/* Card Header branding details */}
              <div className="flex items-center justify-between">
                <span className={`text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 rounded-full ${currentTheme.badge}`}>
                  ☕ Parenting Climate Report
                </span>
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider opacity-60">
                  @ParentWeather app
                </span>
              </div>

              {/* Central text section containing quote content - fully editable! */}
              <div className="my-auto relative py-6">
                <Quote className="absolute -top-3 -left-3 opacity-15" size={40} />
                
                <textarea
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  maxLength={160}
                  className="w-full bg-transparent resize-none font-serif font-medium text-xl sm:text-2xl leading-relaxed text-center outline-none border-dashed border-b border-transparent focus:border-[#D48D71]/50 py-1"
                  rows={4}
                  placeholder="Double click to write your own family moment..."
                />
                
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  className={`w-full bg-transparent text-center font-mono text-xs font-semibold uppercase mt-3 outline-none ${currentTheme.tag}`}
                  placeholder="#YourHashtag"
                />
              </div>

              {/* Card Bottom: Branding footer */}
              <div className="flex items-center justify-between border-t border-current/15 pt-5 pb-1">
                <div className="flex items-center gap-1.5">
                  <Heart size={14} className="text-rose-500 fill-rose-500" />
                  <span className="text-[10px] font-mono opacity-85">Cozy Survival Manual</span>
                </div>
                <div className="text-[8px] font-mono opacity-65 tracking-widest uppercase">
                  Est. 2026 Climate
                </div>
              </div>
            </motion.div>

            {/* Simulated Action Drawer overlay underneath card */}
            <div className="mt-5 flex items-center justify-between bg-white dark:bg-[#2B1D1F] border border-[#F0E4DA] dark:border-[#3B282A] rounded-2xl p-3 shadow-sm">
              <button
                onClick={handleCopy}
                className="flex-1 py-2 text-xs font-semibold hover:bg-[#F9F1EB] dark:hover:bg-[#1E1415] rounded-xl text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy ready-to-paste text"
              >
                {isCopied ? (
                  <>
                    <Check size={14} className="text-teal-600 dark:text-teal-400" />
                    <span className="text-teal-600 dark:text-teal-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Caption</span>
                  </>
                )}
              </button>

              <div className="h-6 w-[1px] bg-[#F0E4DA] dark:bg-[#3B282A]"></div>

              <button
                onClick={handleSimulatedExport}
                disabled={isExporting}
                className="flex-1 py-2 text-xs font-semibold hover:bg-[#F9F1EB] dark:hover:bg-[#1E1415] rounded-xl text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 disabled:opacity-55 cursor-pointer"
                title="Simulate smartphone export"
              >
                {isExporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-[#D48D71]" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Save Image</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Status indicators */}
            <AnimatePresence>
              {exportSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -bottom-16 left-0 right-0 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl shadow-lg text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <Check size={14} className="text-teal-400" />
                  <span>Meme saved to simulated camera roll! Ready to upload!</span>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>
    </section>
  );
}
