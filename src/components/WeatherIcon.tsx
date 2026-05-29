import { 
  Sun, 
  Cloud, 
  CloudSun, 
  CloudRain, 
  CloudDrizzle, 
  CloudLightning, 
  Snowflake, 
  CloudFog,
  Castle,
  Footprints,
  Tv,
  Coffee,
  Hourglass,
  Sparkles,
  Paintbrush,
  Eye,
  Flame,
  Cookie,
  Backpack,
  Timer,
  Wind,
  Droplets,
  Thermometer,
  CloudSnow
} from "lucide-react";
import { motion } from "motion/react";

interface WeatherIconProps {
  code?: number;
  iconName?: string;
  size?: number;
  className?: string;
}

export default function WeatherIcon({ code, iconName, size = 48, className = "" }: WeatherIconProps) {
  // If iconName is passed, return the matched metric icon with style
  if (iconName) {
    const iconProps = { size, className: `text-rose-500 dark:text-rose-400 ${className}` };
    switch (iconName) {
      case "Castle": return <Castle {...iconProps} />;
      case "Footprints": return <Footprints {...iconProps} />;
      case "Tv": return <Tv {...iconProps} />;
      case "Coffee": return <Coffee {...iconProps} />;
      case "Hourglass": return <Hourglass {...iconProps} />;
      case "Sparkles": return <Sparkles {...iconProps} />;
      case "Paintbrush": return <Paintbrush {...iconProps} />;
      case "Eye": return <Eye {...iconProps} />;
      case "Flame": return <Flame {...iconProps} />;
      case "Cookie": return <Cookie {...iconProps} />;
      case "Backpack": return <Backpack {...iconProps} />;
      case "Timer": return <Timer {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  }

  // Otherwise, render WMO Weather Code Graphic
  if (code === undefined) return <Sun size={size} className={`text-amber-500 ${className}`} />;

  // Clear Sky
  if (code === 0) {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="inline-block"
      >
        <Sun size={size} className={`text-amber-500 dark:text-amber-400 ${className}`} />
      </motion.div>
    );
  }

  // Mainly Clear, Partly Cloudy
  if (code === 1 || code === 2) {
    return (
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block"
      >
        <CloudSun size={size} className={`text-sky-500 dark:text-sky-400 ${className}`} />
      </motion.div>
    );
  }

  // Overcast, Clouds
  if (code === 3) {
    return (
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block"
      >
        <Cloud size={size} className={`text-slate-400 dark:text-slate-300 ${className}`} />
      </motion.div>
    );
  }

  // Foggy
  if (code === 45 || code === 48) {
    return (
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block"
      >
        <CloudFog size={size} className={`text-slate-300 dark:text-slate-400 ${className}`} />
      </motion.div>
    );
  }

  // Drizzle
  if (code === 51 || code === 53 || code === 55) {
    return (
      <div className="relative inline-block">
        <CloudDrizzle size={size} className={`text-indigo-400 dark:text-indigo-300 ${className}`} />
      </div>
    );
  }

  // Rain, Showers
  if ([61, 63, 65, 80, 81, 82].includes(code)) {
    return (
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block"
      >
        <CloudRain size={size} className={`text-indigo-500 dark:text-indigo-400 ${className}`} />
      </motion.div>
    );
  }

  // Snowy / Cold Gritty Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return (
      <motion.div
        animate={{ rotate: [0, 15, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block"
      >
        <CloudSnow size={size} className={`text-sky-300 dark:text-sky-200 ${className}`} />
      </motion.div>
    );
  }

  // Storms / Thunder
  if ([95, 96, 99].includes(code)) {
    return (
      <motion.div
        animate={{ scale: [1, 0.98, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-block"
      >
        <CloudLightning size={size} className={`text-purple-500 dark:text-purple-400 ${className}`} />
      </motion.div>
    );
  }

  // Default Fallback
  return <Sun size={size} className={`text-amber-500 ${className}`} />;
}
