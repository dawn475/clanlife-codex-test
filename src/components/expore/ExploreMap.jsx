import React from "react";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Map zones per territory — each has required clan moon level to unlock
const TERRITORY_ZONES = {
  forest: [
    { id: "camp_clearing",   label: "Camp Clearing",    icon: "🌿", level: 1,  x: 45, y: 70, desc: "Safe grounds around camp. Good for apprentices.",          types: ["hunting","herb_gathering"] },
    { id: "oak_hollow",      label: "Oak Hollow",       icon: "🌳", level: 1,  x: 25, y: 50, desc: "Dense oaks teeming with squirrels and birds.",              types: ["hunting","border_patrol"] },
    { id: "sunning_rocks",   label: "Sunning Rocks",    icon: "☀️", level: 3,  x: 65, y: 45, desc: "Warm rocks where prey basks in the sun.",                   types: ["hunting","adventure"] },
    { id: "moonstone_cave",  label: "Moonstone Cave",   icon: "✨", level: 8,  x: 50, y: 20, desc: "An ancient cave glowing with moonlight.",                   types: ["adventure"] },
    { id: "border_brambles", label: "Border Brambles",  icon: "🌲", level: 5,  x: 15, y: 30, desc: "Tangled border. Rival scents detected.",                    types: ["border_patrol"] },
    { id: "herb_grove",      label: "Herb Grove",       icon: "🌱", level: 2,  x: 75, y: 65, desc: "Sheltered grove rich with healing plants.",                 types: ["herb_gathering"] },
  ],
  river: [
    { id: "camp_clearing",   label: "Camp Clearing",    icon: "🌿", level: 1,  x: 45, y: 70, desc: "Safe banks around camp.",                                   types: ["hunting","herb_gathering"] },
    { id: "shallow_ford",    label: "Shallow Ford",     icon: "🌊", level: 1,  x: 25, y: 55, desc: "Easy crossing point, fish dart beneath the surface.",       types: ["hunting"] },
    { id: "willow_island",   label: "Willow Island",    icon: "🌿", level: 3,  x: 60, y: 40, desc: "A small island draped in willows.",                         types: ["herb_gathering","adventure"] },
    { id: "deep_currents",   label: "Deep Currents",    icon: "🌀", level: 6,  x: 35, y: 25, desc: "Dangerous deep water but legendary fish hide here.",        types: ["hunting","adventure"] },
    { id: "waterfall_pool",  label: "Waterfall Pool",   icon: "💦", level: 9,  x: 70, y: 15, desc: "A hidden pool behind a great waterfall.",                   types: ["adventure"] },
    { id: "reed_beds",       label: "Reed Beds",        icon: "🌾", level: 2,  x: 75, y: 65, desc: "Thick reeds where voles nest.",                             types: ["hunting","border_patrol"] },
  ],
  moor: [
    { id: "camp_clearing",   label: "Camp Clearing",    icon: "🌿", level: 1,  x: 45, y: 70, desc: "Open moor around camp.",                                    types: ["hunting","herb_gathering"] },
    { id: "rabbit_warrens",  label: "Rabbit Warrens",   icon: "🐇", level: 1,  x: 30, y: 55, desc: "Burrows riddled with fat rabbits.",                         types: ["hunting"] },
    { id: "standing_stones", label: "Standing Stones",  icon: "🗿", level: 4,  x: 60, y: 35, desc: "Ancient stones where loners often shelter.",                types: ["border_patrol","adventure"] },
    { id: "skyrock_peak",    label: "Skyrock Peak",     icon: "⛰️", level: 7,  x: 75, y: 20, desc: "The highest point — eagle territory.",                      types: ["adventure"] },
    { id: "windswept_ridge", label: "Windswept Ridge",  icon: "💨", level: 3,  x: 20, y: 40, desc: "A gusty ridge perfect for border patrols.",                 types: ["border_patrol"] },
    { id: "hidden_hollow",   label: "Hidden Hollow",    icon: "🌱", level: 2,  x: 65, y: 65, desc: "A sheltered dip in the moor with herbs.",                   types: ["herb_gathering"] },
  ],
  pine: [
    { id: "camp_clearing",   label: "Camp Clearing",    icon: "🌿", level: 1,  x: 45, y: 70, desc: "Pine-needle carpet around camp.",                           types: ["hunting","herb_gathering"] },
    { id: "pine_ridge",      label: "Pine Ridge",       icon: "🌲", level: 1,  x: 25, y: 50, desc: "Tall pines where squirrels leap between branches.",         types: ["hunting"] },
    { id: "boggy_hollow",    label: "Boggy Hollow",     icon: "💧", level: 3,  x: 65, y: 45, desc: "A damp hollow with mushrooms and rare herbs.",              types: ["herb_gathering"] },
    { id: "abandoned_lodge", label: "Abandoned Lodge",  icon: "🏚️", level: 6,  x: 55, y: 25, desc: "An old twoleg structure. Cats have been seen inside.",      types: ["adventure"] },
    { id: "resin_trail",     label: "Resin Trail",      icon: "🍯", level: 2,  x: 75, y: 60, desc: "Sticky pine paths, good for tracking border intruders.",    types: ["border_patrol"] },
    { id: "old_shrine",      label: "Old Shrine",       icon: "⭐", level: 9,  x: 45, y: 15, desc: "A moonlit shrine said to connect with StarClan.",           types: ["adventure"] },
  ],
  marsh: [
    { id: "camp_clearing",   label: "Camp Clearing",    icon: "🌿", level: 1,  x: 45, y: 70, desc: "Soggy grounds around camp.",                                types: ["hunting","herb_gathering"] },
    { id: "frog_pools",      label: "Frog Pools",       icon: "🐸", level: 1,  x: 30, y: 55, desc: "Murky pools teeming with frogs and water voles.",           types: ["hunting"] },
    { id: "sunken_ruins",    label: "Sunken Ruins",     icon: "🏛️", level: 5,  x: 65, y: 35, desc: "Old twoleg ruins, half-submerged.",                         types: ["adventure"] },
    { id: "cattail_thicket", label: "Cattail Thicket",  icon: "🌾", level: 2,  x: 75, y: 60, desc: "Dense cattails perfect for herb gathering.",                types: ["herb_gathering"] },
    { id: "grey_water",      label: "Grey Water",       icon: "🌫️", level: 7,  x: 45, y: 20, desc: "Eerie fog-covered deep marsh. Strange sounds echo here.",   types: ["adventure","border_patrol"] },
    { id: "mudflat_border",  label: "Mudflat Border",   icon: "🐾", level: 3,  x: 20, y: 40, desc: "Soft mud that holds pawprints of intruders.",               types: ["border_patrol"] },
  ],
  mountain: [
    { id: "camp_clearing",   label: "Camp Clearing",    icon: "🌿", level: 1,  x: 45, y: 75, desc: "Rocky ledges around camp.",                                 types: ["hunting","herb_gathering"] },
    { id: "stone_slopes",    label: "Stone Slopes",     icon: "🪨", level: 1,  x: 25, y: 58, desc: "Lower slopes where mountain mice scurry.",                  types: ["hunting"] },
    { id: "ice_falls",       label: "Ice Falls",        icon: "🧊", level: 4,  x: 65, y: 40, desc: "Frozen waterfalls hide rare ice-crystals and herbs.",        types: ["herb_gathering","adventure"] },
    { id: "sky_peak",        label: "Sky Peak",         icon: "🏔️", level: 8,  x: 50, y: 15, desc: "The highest peak — eagles nest here. Legendary prey.",      types: ["hunting","adventure"] },
    { id: "eagle_pass",      label: "Eagle Pass",       icon: "🦅", level: 6,  x: 75, y: 35, desc: "A narrow pass used by roving eagles and rogues.",            types: ["border_patrol","adventure"] },
    { id: "moonpool_crevice",label: "Moonpool Crevice", icon: "🌕", level: 10, x: 20, y: 25, desc: "A sacred crevice where StarClan speaks in moonlight.",       types: ["adventure"] },
  ],
};

// Level multipliers for zones
export const ZONE_LEVEL_MODS = {
  1:  { preyMod: 1.0, herbMod: 1.0, encounterChance: 0.05, lootBonus: 0 },
  2:  { preyMod: 1.1, herbMod: 1.1, encounterChance: 0.10, lootBonus: 0 },
  3:  { preyMod: 1.2, herbMod: 1.1, encounterChance: 0.15, lootBonus: 0 },
  4:  { preyMod: 1.3, herbMod: 1.2, encounterChance: 0.20, lootBonus: 1 },
  5:  { preyMod: 1.4, herbMod: 1.3, encounterChance: 0.25, lootBonus: 1 },
  6:  { preyMod: 1.5, herbMod: 1.4, encounterChance: 0.30, lootBonus: 1 },
  7:  { preyMod: 1.6, herbMod: 1.5, encounterChance: 0.35, lootBonus: 2 },
  8:  { preyMod: 1.8, herbMod: 1.6, encounterChance: 0.40, lootBonus: 2 },
  9:  { preyMod: 2.0, herbMod: 1.8, encounterChance: 0.50, lootBonus: 2 },
  10: { preyMod: 2.5, herbMod: 2.0, encounterChance: 0.60, lootBonus: 3 },
};

export function getZonesForTerritory(territory) {
  return TERRITORY_ZONES[territory] || TERRITORY_ZONES.forest;
}

export function getZoneMods(level) {
  return ZONE_LEVEL_MODS[level] || ZONE_LEVEL_MODS[1];
}

export default function ExploreMap({ territory, clan, selectedZone, onSelectZone, patrolType }) {
  const moon = clan?.moon || 1;
  const zones = getZonesForTerritory(territory);

  const TERRITORY_BG = {
    forest: "bg-gradient-to-br from-emerald-900 to-green-800",
    river:  "bg-gradient-to-br from-blue-900 to-cyan-800",
    moor:   "bg-gradient-to-br from-amber-900 to-yellow-800",
    pine:   "bg-gradient-to-br from-green-950 to-emerald-900",
    marsh:  "bg-gradient-to-br from-teal-900 to-emerald-950",
    mountain:"bg-gradient-to-br from-slate-900 to-zinc-800",
  };

  const TERRITORY_LABELS = {
    forest: "The Forest",  river: "The River",   moor: "The Moor",
    pine: "Pine Forest",   marsh: "The Marshes", mountain: "The Mountains",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">{TERRITORY_LABELS[territory] || "Territory Map"}</h3>
        <span className="text-[10px] text-muted-foreground font-body">Click a location to explore</span>
      </div>

      <div className={cn("relative w-full rounded-xl overflow-hidden border border-border/40", TERRITORY_BG[territory])}
        style={{ paddingBottom: "55%" }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "20% 20%" }} />

        {zones.map(zone => {
          const unlocked = moon >= zone.level;
          const isSelected = selectedZone?.id === zone.id;
          const compatible = !patrolType || zone.types.includes(patrolType);

          return (
            <button
              key={zone.id}
              disabled={!unlocked}
              onClick={() => onSelectZone(unlocked ? zone : null)}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                "flex flex-col items-center gap-0.5 group"
              )}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            >
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-lg md:text-xl",
                "transition-all duration-200 shadow-lg",
                !unlocked && "opacity-40 cursor-not-allowed border-white/20 bg-black/40",
                unlocked && !isSelected && compatible && "border-white/40 bg-black/50 hover:border-white/80 hover:bg-black/70 hover:scale-110",
                unlocked && !isSelected && !compatible && "border-white/20 bg-black/30 opacity-50",
                isSelected && "border-yellow-400 bg-yellow-900/60 scale-110 ring-2 ring-yellow-400/50",
              )}>
                {!unlocked ? <Lock className="w-4 h-4 text-white/60" /> : zone.icon}
              </div>
              <span className={cn(
                "text-[9px] font-display font-semibold px-1.5 py-0.5 rounded bg-black/60 text-white whitespace-nowrap",
                !unlocked && "opacity-40",
                isSelected && "text-yellow-300",
              )}>
                {zone.label}
              </span>
              {!unlocked && (
                <span className="text-[8px] font-body text-white/50 bg-black/50 px-1 rounded">
                  Moon {zone.level}
                </span>
              )}
              {unlocked && isSelected && (
                <Badge className="text-[8px] px-1 py-0 bg-yellow-500/80 border-yellow-400 text-yellow-900">
                  Selected
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {selectedZone && (
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm font-body">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{selectedZone.icon}</span>
            <span className="font-display font-semibold text-sm">{selectedZone.label}</span>
            <Badge variant="outline" className="text-[9px] ml-auto">Lvl {selectedZone.level}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{selectedZone.desc}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedZone.types.map(t => (
              <Badge key={t} variant="secondary" className="text-[9px]">{t.replace("_", " ")}</Badge>
            ))}
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            🎯 Bonus: ×{getZoneMods(selectedZone.level).preyMod} prey · ×{getZoneMods(selectedZone.level).herbMod} herbs · +{getZoneMods(selectedZone.level).lootBonus} loot bonus
          </div>
        </div>
      )}
    </div>
  );
}
