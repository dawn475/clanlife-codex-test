import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CatAvatar from "./CatAvatar";
import { getCatName, getExpToNextLevel, getMutationSummary } from "@/lib/gameData";
import { getCatIcon, getMoodFromHappiness, getHungerCategory, MOOD_ICONS, HUNGER_ICONS, RANK_ICONS } from "@/lib/catIcons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const rankColors = {
  leader: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  deputy: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  medicine_cat: "bg-primary/15 text-primary border-primary/30",
  warrior: "bg-secondary text-secondary-foreground border-border",
  apprentice: "bg-accent/15 text-accent border-accent/30",
  elder: "bg-muted text-muted-foreground border-border",
  queen: "bg-pink-500/15 text-pink-700 border-pink-500/30",
  kit: "bg-purple-500/15 text-purple-700 border-purple-500/30",
};

export default function CatCard({ cat }) {
  const moodKey = cat.mood || getMoodFromHappiness(cat.happiness ?? 80);
  const hungerKey = getHungerCategory(cat.hunger ?? 80);
  const moodData = MOOD_ICONS[moodKey];
  const hungerData = HUNGER_ICONS[hungerKey];
  const rankIcon = RANK_ICONS[cat.rank] || "";
  const catIcon = getCatIcon(cat);
  const level = cat.level ?? 1;
  const exp = cat.exp ?? 0;
  const expToNext = getExpToNextLevel(cat);
  const mutations = getMutationSummary(cat);

  return (
    <TooltipProvider>
      <Link to={`/cat/${cat.id}`}>
        <Card className="p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-border/60 bg-card/80 backdrop-blur-sm group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <CatAvatar cat={cat} size="md" />
              <span className="absolute -bottom-1 -right-1 text-base leading-none">{catIcon.slice(0, 2)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{rankIcon}</span>
                <h3 className="font-display text-sm font-semibold truncate group-hover:text-primary transition-colors">
                  {getCatName(cat)}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${rankColors[cat.rank] || ""}`}>
                  {cat.rank?.replace("_", " ")}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{cat.age_moons}m</span>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-sm cursor-default ${moodData.color}`}>{moodData.icon}</span>
                  </TooltipTrigger>
                  <TooltipContent><p>{moodData.label}</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`text-sm cursor-default ${hungerData.color}`}>{hungerData.icon}</span>
                  </TooltipTrigger>
                  <TooltipContent><p>{hungerData.label}</p></TooltipContent>
                </Tooltip>
              </div>

              <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                {cat.pelt_color} {cat.pelt_pattern} - {cat.gender}
              </p>

              {mutations.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {mutations.join(", ")}
                </p>
              )}

              <div className="mt-1.5">
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                  <span>Lv.{level}</span>
                  <span>{exp}/{expToNext} EXP</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (exp / expToNext) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </TooltipProvider>
  );
}
