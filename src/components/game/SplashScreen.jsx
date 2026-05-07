import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { loadSavedTheme } from "@/lib/themes";

export default function SplashScreen() {
  const [rememberMe, setRememberMe] = React.useState(() =>
    localStorage.getItem("wc_remember_me") === "true"
  );

  useEffect(() => {
    loadSavedTheme();
  }, []);

  const handleLogin = () => {
    if (rememberMe) {
      localStorage.setItem("wc_remember_me", "true");
    } else {
      localStorage.removeItem("wc_remember_me");
    }
    base44.auth.redirectToLogin(window.location.href);
  };

  const month = new Date().getMonth();
  const SEASON_DATA = [
    { emoji: "❄️", label: "Leaf-bare",  bg: "from-slate-900 via-blue-950 to-zinc-900" },
    { emoji: "❄️", label: "Leaf-bare",  bg: "from-slate-900 via-blue-950 to-zinc-900" },
    { emoji: "🌸", label: "Newleaf",    bg: "from-emerald-950 via-green-900 to-teal-950" },
    { emoji: "🌸", label: "Newleaf",    bg: "from-emerald-950 via-green-900 to-teal-950" },
    { emoji: "🌸", label: "Newleaf",    bg: "from-emerald-950 via-green-900 to-teal-950" },
    { emoji: "☀️", label: "Greenleaf",  bg: "from-amber-950 via-orange-900 to-yellow-950" },
    { emoji: "☀️", label: "Greenleaf",  bg: "from-amber-950 via-orange-900 to-yellow-950" },
    { emoji: "☀️", label: "Greenleaf",  bg: "from-amber-950 via-orange-900 to-yellow-950" },
    { emoji: "🍂", label: "Leaf-fall",  bg: "from-orange-950 via-red-950 to-amber-950" },
    { emoji: "🍂", label: "Leaf-fall",  bg: "from-orange-950 via-red-950 to-amber-950" },
    { emoji: "🍂", label: "Leaf-fall",  bg: "from-orange-950 via-red-950 to-amber-950" },
    { emoji: "❄️", label: "Leaf-bare",  bg: "from-slate-900 via-blue-950 to-zinc-900" },
  ];
  const season = SEASON_DATA[month];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${season.bg} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Starfield */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() > 0.8 ? "2px" : "1px",
              height: Math.random() > 0.8 ? "2px" : "1px",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 65}%`,
              opacity: 0.2 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Silhouette tree left */}
      <div className="absolute bottom-0 left-0 text-8xl opacity-20 select-none pointer-events-none">🌲🌲</div>
      {/* Silhouette tree right */}
      <div className="absolute bottom-0 right-0 text-8xl opacity-20 select-none pointer-events-none">🌲🌲</div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Hero */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-7xl mb-4 drop-shadow-2xl"
          >
            🐾
          </motion.div>
          <h1 className="font-display text-5xl font-bold text-white tracking-widest drop-shadow-lg">
            Warrior<br />Clans
          </h1>
          <p className="font-body text-white/60 mt-3 text-sm">
            {season.emoji} {season.label} is upon the forest
          </p>
        </div>

        {/* Card */}
        <Card className="bg-black/50 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="font-display text-white text-lg font-semibold">Welcome, Warrior</p>
              <p className="font-body text-white/50 text-xs">
                Lead a clan, explore territories, breed cats, and forge your legend.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { icon: "⚔️", label: "Battle" },
                { icon: "🐱", label: "Breed" },
                { icon: "🗺️", label: "Explore" },
                { icon: "🌿", label: "Heal" },
              ].map(f => (
                <div key={f.label} className="p-2 rounded-lg bg-white/5 border border-white/8 text-center">
                  <div className="text-lg">{f.icon}</div>
                  <p className="text-[9px] font-display text-white/50 mt-0.5">{f.label}</p>
                </div>
              ))}
            </div>

            {/* Remember me */}
            <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-lg p-3">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(val) => {
                  setRememberMe(!!val);
                  if (val) localStorage.setItem("wc_remember_me", "true");
                  else localStorage.removeItem("wc_remember_me");
                }}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="font-body text-white/70 text-xs cursor-pointer leading-snug">
                <span className="font-semibold text-white/90">Remember me</span><br />
                Stay signed in — don't log out when I close the tab
              </Label>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full font-display tracking-widest text-sm h-11 bg-primary hover:bg-primary/90 shadow-lg"
              size="lg"
            >
              ENTER THE CLANS
            </Button>

            <p className="text-center font-body text-white/25 text-[10px]">
              New players: an account is created automatically on sign-in
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
