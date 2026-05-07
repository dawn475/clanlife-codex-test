import React from "react";
import { PELT_DISPLAY_COLORS, EYE_DISPLAY_COLORS } from "@/lib/gameData";

export default function CatAvatar({ cat, size = "md" }) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
    xl: "w-32 h-32"
  };

  const eyeSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
    xl: "w-5 h-5"
  };

  const earSizes = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-9 h-9"
  };

  const peltColor = PELT_DISPLAY_COLORS[cat?.pelt_color] || "#7a5230";
  const eyeColor = EYE_DISPLAY_COLORS[cat?.eye_color] || "#f0a030";
  const isAlive = cat?.is_alive !== false;
  const pattern = cat?.pelt_pattern;
  const patternMutation = cat?.patternMutation;

  let patternOverlay = null;
  if (pattern === "tabby") {
    patternOverlay = "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 5px)";
  } else if (pattern === "spotted") {
    patternOverlay = "radial-gradient(circle 3px, rgba(0,0,0,0.2) 30%, transparent 70%)";
  } else if (pattern === "bicolor") {
    patternOverlay = `linear-gradient(135deg, ${peltColor} 50%, #f5f0e8 50%)`;
  } else if (pattern === "colorpoint") {
    patternOverlay = `radial-gradient(circle at center, #f5f0e8 30%, ${peltColor} 80%)`;
  }

  if (patternMutation?.type === "piebald") {
    const coverage = { light: 70, mottled: 50, dense: 30 }[patternMutation.variant] ?? 55;
    patternOverlay = `radial-gradient(circle at 30% 25%, #f6f0e4 0 18%, transparent 19%),
      radial-gradient(circle at 70% 62%, #f6f0e4 0 22%, transparent 23%),
      linear-gradient(135deg, ${peltColor} 0 ${coverage}%, #f6f0e4 ${coverage}% 100%)`;
  } else if (patternMutation?.type === "patches") {
    const coverage = { light: 72, mottled: 52, dense: 34 }[patternMutation.variant] ?? 55;
    patternOverlay = `radial-gradient(circle at 32% 28%, #15120f 0 18%, transparent 19%),
      radial-gradient(circle at 70% 65%, #15120f 0 23%, transparent 24%),
      linear-gradient(135deg, ${peltColor} 0 ${coverage}%, #15120f ${coverage}% 100%)`;
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
      {/* Body circle */}
      <div
        className={`${sizeClasses[size]} rounded-full relative overflow-hidden border-2 border-border shadow-inner ${!isAlive ? 'opacity-40 grayscale' : ''}`}
        style={{ backgroundColor: peltColor }}
      >
        {patternOverlay && (
          <div className="absolute inset-0 rounded-full" style={{ background: patternOverlay }} />
        )}
        {/* Eyes */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5">
          <div
            className={`${eyeSizes[size]} rounded-full shadow-sm`}
            style={{ backgroundColor: typeof eyeColor === 'string' && !eyeColor.includes('gradient') ? eyeColor : '#f0a030', background: eyeColor }}
          />
          <div
            className={`${eyeSizes[size]} rounded-full shadow-sm`}
            style={{ backgroundColor: typeof eyeColor === 'string' && !eyeColor.includes('gradient') ? eyeColor : '#4a90d9', background: cat?.eye_color === 'odd' ? '#4a90d9' : eyeColor }}
          />
        </div>
      </div>
      {/* Ears */}
      <div
        className={`${earSizes[size]} absolute -top-0.5 left-0.5 rotate-[-20deg] rounded-tl-full rounded-tr-full`}
        style={{ backgroundColor: peltColor, borderTop: '1px solid rgba(0,0,0,0.1)' }}
      />
      <div
        className={`${earSizes[size]} absolute -top-0.5 right-0.5 rotate-[20deg] rounded-tl-full rounded-tr-full`}
        style={{ backgroundColor: peltColor, borderTop: '1px solid rgba(0,0,0,0.1)' }}
      />
      {/* Status indicator */}
      {cat?.status === "injured" && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full border-2 border-card text-[8px] flex items-center justify-center text-destructive-foreground font-bold">!</div>
      )}
      {cat?.status === "sick" && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-500 rounded-full border-2 border-card text-[8px] flex items-center justify-center text-white font-bold">~</div>
      )}
      {cat?.status === "expecting" && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-pink-400 rounded-full border-2 border-card text-[8px] flex items-center justify-center text-white font-bold">♥</div>
      )}
    </div>
  );
}
