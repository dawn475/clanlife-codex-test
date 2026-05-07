import React from "react";
import { Drumstick, Leaf, Star, Moon } from "lucide-react";

export default function ClanResourceBar({ clan }) {
  if (!clan) return null;

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-body">Moon <span className="font-semibold">{clan.moon || 1}</span></span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <Drumstick className="w-4 h-4 text-accent" />
        <span className="text-sm font-body"><span className="font-semibold">{clan.prey_stock || 0}</span> prey</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <Leaf className="w-4 h-4 text-primary" />
        <span className="text-sm font-body"><span className="font-semibold">{clan.herbs_stock || 0}</span> herbs</span>
      </div>
      <div className="w-px h-5 bg-border" />
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-body"><span className="font-semibold">{clan.reputation || 50}</span> rep</span>
      </div>
    </div>
  );
}
