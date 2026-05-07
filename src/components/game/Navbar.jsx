import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Cat, Compass, Heart, ScrollText, ShoppingBag, Package, MapPin, Settings } from "lucide-react";
import CurrencyBar from "./CurrencyBar";

const navItems = [
  { path: "/", label: "Camp", icon: Home },
  { path: "/den", label: "Den", icon: Cat },
  { path: "/explore", label: "Explore", icon: Compass },
  { path: "/nursery", label: "Nursery", icon: Heart },
  { path: "/shop", label: "Shop", icon: ShoppingBag },
  { path: "/crossroads", label: "Roads", icon: MapPin },
  { path: "/inventory", label: "Bag", icon: Package },
  { path: "/logs", label: "Logs", icon: ScrollText },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar({ profile, userId }) {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="max-w-5xl mx-auto px-2">
        {/* Currency bar — only on md+ at top */}
        <div className="hidden md:flex items-center justify-between py-1.5 border-b border-border/40">
          <span className="font-display text-sm font-bold tracking-wide text-primary">🐾 Warrior Clans</span>
          <CurrencyBar profile={profile} userId={userId} />
        </div>

        <div className="flex items-center justify-around md:justify-center md:gap-0.5 px-0 py-1.5 md:py-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path ||
              (path !== "/" && location.pathname.startsWith(path));

            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col md:flex-row items-center gap-0.5 md:gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200 text-[10px] md:text-xs font-body
                  ${isActive
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                <Icon className="w-5 h-5 md:w-3.5 md:h-3.5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Currency bar — mobile bottom */}
        <div className="md:hidden flex justify-center pb-1">
          <CurrencyBar profile={profile} userId={userId} />
        </div>
      </div>
    </nav>
  );
}
