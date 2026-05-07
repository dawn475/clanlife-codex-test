import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CatAvatar from "@/components/game/CatAvatar";
import { getCatName } from "@/lib/gameData";
import { RANK_ICONS, getCatIcon } from "@/lib/catIcons";
import { Users, Shuffle, Crown, Shield, Swords, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TERRITORY_ICONS = {
  forest: "🌲", river: "🌊", moor: "🌾",
  pine: "🌲", marsh: "🌿", mountain: "⛰️",
};

const rankOrder = ["leader", "deputy", "medicine_cat", "warrior", "apprentice", "queen", "elder", "kit"];

export default function VisitClan({ user }) {
  const [visitedClan, setVisitedClan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all clans except the current user's
  const { data: allClans = [] } = useQuery({
    queryKey: ["all_clans_visit"],
    queryFn: () => base44.entities.Clan.list(),
  });

  const otherClans = allClans.filter(c => c.owner_id !== user?.id);

  // Fetch cats for visited clan
  const { data: visitedCats = [], isLoading: catsLoading } = useQuery({
    queryKey: ["visit_cats", visitedClan?.id],
    queryFn: () => base44.entities.Cat.filter({ clan_id: visitedClan.id, is_alive: true }),
    enabled: !!visitedClan?.id,
  });

  const visitRandom = () => {
    if (otherClans.length === 0) return;
    const pick = otherClans[Math.floor(Math.random() * otherClans.length)];
    setVisitedClan(pick);
  };

  const sortedCats = [...visitedCats].sort((a, b) =>
    rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
  );

  const rankSections = rankOrder
    .map(rank => ({ rank, cats: sortedCats.filter(c => c.rank === rank) }))
    .filter(s => s.cats.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Visit a Clan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground font-body">
            Travel to another clan's territory and see their cats.
          </p>

          {otherClans.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body italic">No other clans exist yet...</p>
          ) : (
            <div className="space-y-3">
              <Button onClick={visitRandom} className="font-display gap-2" variant="outline">
                <Shuffle className="w-4 h-4" />
                Visit a Random Clan ({otherClans.length} available)
              </Button>

              {/* Clan list picker */}
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                {otherClans.map(clan => (
                  <button
                    key={clan.id}
                    onClick={() => setVisitedClan(clan)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                      visitedClan?.id === clan.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60 hover:border-primary/30 bg-card/60"
                    )}
                  >
                    <span className="text-xl">{TERRITORY_ICONS[clan.territory] || "🌿"}</span>
                    <div>
                      <p className="font-display text-sm font-semibold">{clan.name}Clan</p>
                      <p className="text-[10px] text-muted-foreground capitalize font-body">
                        {clan.territory} · Moon {clan.moon || 1}
                      </p>
                    </div>
                    {clan.motto && (
                      <p className="text-[10px] text-muted-foreground italic ml-auto max-w-24 truncate font-body">
                        "{clan.motto}"
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AnimatePresence>
        {visitedClan && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-accent/20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                      {TERRITORY_ICONS[visitedClan.territory]}
                      {visitedClan.name}Clan
                    </CardTitle>
                    {visitedClan.motto && (
                      <p className="font-body text-xs text-muted-foreground italic mt-1">"{visitedClan.motto}"</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="capitalize text-[10px]">{visitedClan.territory}</Badge>
                    <Badge variant="outline" className="text-[10px]">Moon {visitedClan.moon || 1}</Badge>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-2 mt-2 text-xs font-body text-muted-foreground">
                  <span>🥩 {visitedClan.prey_stock || 0} prey</span>
                  <span>🌿 {visitedClan.herbs_stock || 0} herbs</span>
                  <span>⭐ {visitedClan.reputation || 50} rep</span>
                  <span>😺 {visitedCats.length} cats</span>
                </div>
              </CardHeader>

              <CardContent>
                {catsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : sortedCats.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">This clan has no cats yet.</p>
                ) : (
                  <div className="space-y-4">
                    {rankSections.map(({ rank, cats }) => (
                      <div key={rank}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span>{RANK_ICONS[rank]}</span>
                          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {rank.replace("_", " ")} ({cats.length})
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {cats.map(cat => (
                            <div key={cat.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                              <CatAvatar cat={cat} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs">{getCatIcon(cat)}</span>
                                  <p className="font-display text-xs font-semibold truncate">{getCatName(cat)}</p>
                                </div>
                                <p className="text-[9px] text-muted-foreground capitalize">
                                  {cat.pelt_color} {cat.pelt_pattern} · {cat.gender} · {cat.age_moons}m
                                </p>
                                <p className="text-[9px] text-muted-foreground">
                                  🎯{cat.skill_hunting} ⚔️{cat.skill_fighting} 🌿{cat.skill_healing}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
