import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import WorldBar from "@/components/game/WorldBar";
import ClanResourceBar from "@/components/game/ClanResourceBar";
import { Crown, Users, Baby, Map, Swords, Star } from "lucide-react";
import { getCatName } from "@/lib/gameData";

const TERRITORY_ICONS = {
  forest: "🌲", river: "🌊", moor: "🌾",
  pine: "🌲", marsh: "🌿", mountain: "⛰️",
};

const CAT_SLOTS_BASE = 10;
const SLOTS_PER_TILE = 4;

export function getCatSlots(clan) {
  const extra = ((clan?.territory_size ?? 1) - 1) * SLOTS_PER_TILE;
  return CAT_SLOTS_BASE + extra;
}

export default function ClanOverview({ clan, cats }) {
  const leader = cats.find(c => c.rank === "leader" && c.is_alive !== false);
  const deputy = cats.find(c => c.rank === "deputy" && c.is_alive !== false);
  const aliveCats = cats.filter(c => c.is_alive !== false);
  const kits = aliveCats.filter(c => c.rank === "kit");
  const maxSlots = getCatSlots(clan);
  const territorySize = clan?.territory_size ?? 1;
  const territoryWins = clan?.territory_wins ?? 0;

  const stats = [
    { label: "Leader", value: leader ? getCatName(leader) : "None", icon: "👑" },
    { label: "Deputy", value: deputy ? getCatName(deputy) : "None", icon: "🛡️" },
    { label: "Cats", value: `${aliveCats.length} / ${maxSlots}`, icon: "🐱" },
    { label: "Kits", value: kits.length, icon: "🐾" },
    { label: "Territory", value: `${territorySize} tile${territorySize !== 1 ? "s" : ""}`, icon: "🗺️" },
    { label: "Raid Wins", value: `${territoryWins} / 15`, icon: "⚔️" },
    { label: "Reputation", value: clan?.reputation ?? 50, icon: "⭐" },
    { label: "Moon", value: clan?.moon ?? 1, icon: "🌙" },
  ];

  return (
    <div className="space-y-4">
      {/* Clan header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl font-bold">
            {TERRITORY_ICONS[clan?.territory]} {clan?.name}Clan
          </h2>
          {clan?.motto && (
            <p className="font-body text-sm text-muted-foreground italic mt-0.5">"{clan.motto}"</p>
          )}
        </div>
        <Badge variant="outline" className="capitalize font-body text-sm">
          {clan?.territory} territory
        </Badge>
      </div>

      <WorldBar clan={clan} />
      <ClanResourceBar clan={clan} />

      {/* Cat capacity bar */}
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-display font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" /> Cat Capacity
            </span>
            <span className="font-body text-muted-foreground">
              {aliveCats.length} / {maxSlots} slots
            </span>
          </div>
          <Progress value={(aliveCats.length / maxSlots) * 100} className="h-2" />
          <p className="text-[10px] font-body text-muted-foreground">
            Territory size {territorySize} · {maxSlots} slots (base 10 + {(territorySize - 1) * SLOTS_PER_TILE} from {territorySize - 1} expansion{territorySize - 1 !== 1 ? "s" : ""})
          </p>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon }) => (
          <Card key={label} className="bg-card/60 border-border/40">
            <CardContent className="p-3 text-center">
              <p className="text-xl mb-0.5">{icon}</p>
              <p className="font-display font-bold text-base leading-tight">{value}</p>
              <p className="text-[10px] font-body text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
