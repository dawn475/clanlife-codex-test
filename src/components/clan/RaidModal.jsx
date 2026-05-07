import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Swords, Clock, TrendingUp, Coins, Package, Trophy, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getCatName } from "@/lib/gameData";
import { getCatSlots } from "./ClanOverview";
import { cn } from "@/lib/utils";

const TERRITORY_ICONS = {
  forest: "🌲", river: "🌊", moor: "🌾",
  pine: "🌲", marsh: "🌿", mountain: "⛰️",
};

const RAID_TYPES = [
  { key: "territory", icon: "🗺️", label: "Raid for Territory", desc: "Expand your clan's hunting grounds by 1 tile (+4 cat slots). Win cap: 15.", reward: "territory" },
  { key: "currency", icon: "🌰", label: "Raid for Acorns",    desc: "Steal 30–80 acorns from the rival clan's stores.",                       reward: "acorns" },
  { key: "items",    icon: "📦", label: "Raid for Items",     desc: "Plunder a random item from the rival's inventory.",                       reward: "items" },
];

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const TERRITORY_WIN_CAP = 15;

function getRaidCooldown(clan) {
  if (!clan?.last_raid_time) return 0;
  const elapsed = Date.now() - new Date(clan.last_raid_time).getTime();
  return Math.max(0, COOLDOWN_MS - elapsed);
}

function formatCountdown(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

export default function RaidModal({ open, onClose, myClam, myClan, profile, user }) {
  const [selectedType, setSelectedType] = useState(null);
  const [targetClan, setTargetClan] = useState(null);
  const [raiding, setRaiding] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(() => getRaidCooldown(myClan));
  const queryClient = useQueryClient();

  // Tick cooldown
  React.useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => {
      const left = getRaidCooldown(myClan);
      setCooldownLeft(left);
      if (left <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [myClan, cooldownLeft]);

  const { data: allClans = [] } = useQuery({
    queryKey: ["all_clans_raid"],
    queryFn: () => base44.entities.Clan.list(),
    enabled: open,
  });

  const rivalClans = allClans.filter(c => c.owner_id !== user?.id);

  // Fetch rival cats when a target is selected
  const { data: rivalCats = [] } = useQuery({
    queryKey: ["rival_cats", targetClan?.id],
    queryFn: () => base44.entities.Cat.filter({ clan_id: targetClan.id, is_alive: true }),
    enabled: !!targetClan?.id,
  });

  // My warriors for combat strength
  const { data: myCats = [] } = useQuery({
    queryKey: ["cats", myClan?.id],
    queryFn: () => base44.entities.Cat.filter({ clan_id: myClan.id, is_alive: true }),
    enabled: !!myClan?.id,
  });

  const myWarriors = myCats.filter(c => ["warrior", "deputy", "leader"].includes(c.rank));
  const rivalWarriors = rivalCats.filter(c => ["warrior", "deputy", "leader"].includes(c.rank));

  function calcStrength(warriors) {
    if (!warriors.length) return 1;
    return warriors.reduce((sum, c) => sum + (c.skill_fighting || 3), 0);
  }

  const myStrength = calcStrength(myWarriors);
  const rivalStrength = calcStrength(rivalWarriors);
  const winChance = Math.min(0.85, Math.max(0.15, myStrength / (myStrength + rivalStrength)));

  const canRaid = cooldownLeft <= 0;
  const atTerritoryCap = (myClan?.territory_wins ?? 0) >= TERRITORY_WIN_CAP;

  const handleRaid = async () => {
    if (!selectedType || !targetClan || !canRaid) return;
    if (selectedType === "territory" && atTerritoryCap) return;
    setRaiding(true);
    setResult(null);

    const won = Math.random() < winChance;
    const now = new Date().toISOString();

    // Record cooldown
    await base44.entities.Clan.update(myClan.id, { last_raid_time: now });

    let summary = "";

    if (won) {
      if (selectedType === "territory") {
        const newSize = (myClan.territory_size ?? 1) + 1;
        const newWins = (myClan.territory_wins ?? 0) + 1;
        await base44.entities.Clan.update(myClan.id, {
          territory_size: newSize,
          territory_wins: newWins,
        });
        summary = `Victory! Your territory grew to ${newSize} tile${newSize !== 1 ? "s" : ""} (+4 cat slots). Raid wins: ${newWins}/15.`;
      } else if (selectedType === "currency") {
        const stolen = 30 + Math.floor(Math.random() * 51); // 30–80
        if (profile?.id) {
          await base44.entities.UserProfile.update(profile.id, {
            acorns: (profile.acorns || 0) + stolen,
          });
        }
        summary = `Victory! You plundered ${stolen} 🌰 from ${targetClan.name}Clan!`;
      } else if (selectedType === "items") {
        summary = `Victory! You raided ${targetClan.name}Clan's stores! (+1 random item added to inventory)`;
        // Award a random item
        const randomItems = [
          { item_key: "poppy_seeds", item_name: "Poppy Seeds", item_type: "healing", icon: "🌺", description: "Eases pain and helps cats sleep." },
          { item_key: "marigold", item_name: "Marigold", item_type: "healing", icon: "🌼", description: "Soothes infection and heals wounds." },
          { item_key: "cobwebs", item_name: "Cobwebs", item_type: "healing", icon: "🕸️", description: "Stops bleeding quickly." },
        ];
        const item = randomItems[Math.floor(Math.random() * randomItems.length)];
        await base44.entities.InventoryItem.create({
          owner_id: user.id,
          quantity: 1,
          ...item,
        });
      }
    } else {
      summary = `Defeat! ${targetClan.name}Clan drove your warriors back. Try again in 30 minutes.`;
    }

    queryClient.invalidateQueries({ queryKey: ["clan", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["userProfile", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["inventory", user?.id] });

    setCooldownLeft(COOLDOWN_MS);
    setResult({ won, summary });
    setRaiding(false);
  };

  const reset = () => {
    setSelectedType(null);
    setTargetClan(null);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Swords className="w-5 h-5 text-destructive" /> Raid Another Clan
          </DialogTitle>
        </DialogHeader>

        {/* Cooldown warning */}
        {!canRaid && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm font-body text-orange-700">
            <Clock className="w-4 h-4 shrink-0" />
            Raid cooldown: <span className="font-semibold ml-1">{formatCountdown(cooldownLeft)}</span> remaining
          </div>
        )}

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className={cn(
                "p-4 rounded-xl border-2 text-center space-y-2",
                result.won ? "border-primary/40 bg-primary/5" : "border-destructive/30 bg-destructive/5"
              )}>
                <p className="text-3xl">{result.won ? "🏆" : "💔"}</p>
                <p className={cn("font-display font-bold text-lg", result.won ? "text-primary" : "text-destructive")}>
                  {result.won ? "Victory!" : "Defeat!"}
                </p>
                <p className="font-body text-sm text-muted-foreground">{result.summary}</p>
              </div>
              <Button onClick={reset} variant="outline" className="w-full font-display">
                Raid Again
              </Button>
            </motion.div>
          ) : (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              {/* Step 1: raid type */}
              <div className="space-y-2">
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Step 1 — Choose what to raid for</p>
                <div className="space-y-2">
                  {RAID_TYPES.map(rt => {
                    const disabled = rt.key === "territory" && atTerritoryCap;
                    return (
                      <button
                        key={rt.key}
                        onClick={() => !disabled && setSelectedType(rt.key)}
                        disabled={disabled}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                          selectedType === rt.key ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/30",
                          disabled && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <span className="text-xl mt-0.5">{rt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display text-sm font-semibold">{rt.label}</p>
                          <p className="text-[11px] font-body text-muted-foreground">{rt.desc}</p>
                          {rt.key === "territory" && atTerritoryCap && (
                            <p className="text-[10px] text-destructive font-body mt-0.5">⚠ Territory win cap reached (15/15)</p>
                          )}
                          {rt.key === "territory" && !atTerritoryCap && (
                            <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                              {myClan?.territory_wins ?? 0}/15 wins used
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: pick target */}
              {selectedType && (
                <div className="space-y-2">
                  <p className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Step 2 — Choose your target</p>
                  {rivalClans.length === 0 ? (
                    <p className="text-sm font-body text-muted-foreground italic">No other clans to raid yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {rivalClans.map(clan => (
                        <button
                          key={clan.id}
                          onClick={() => setTargetClan(clan)}
                          className={cn(
                            "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                            targetClan?.id === clan.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/30"
                          )}
                        >
                          <span className="text-xl">{TERRITORY_ICONS[clan.territory] || "🌿"}</span>
                          <div>
                            <p className="font-display text-sm font-semibold">{clan.name}Clan</p>
                            <p className="text-[10px] font-body text-muted-foreground capitalize">
                              {clan.territory} · Moon {clan.moon || 1} · {clan.reputation ?? 50} rep
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Combat preview */}
              {targetClan && (
                <Card className="border-border/60 bg-muted/30">
                  <CardContent className="p-3 space-y-2">
                    <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Battle Preview</p>
                    <div className="flex items-center gap-2 text-sm font-body">
                      <span className="text-green-600 font-semibold">Your warriors: {myWarriors.length} (str {myStrength})</span>
                      <span className="text-muted-foreground mx-1">vs</span>
                      <span className="text-destructive font-semibold">Rivals: {rivalWarriors.length} (str {rivalStrength})</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-body text-muted-foreground">
                        <span>Win chance</span>
                        <span className="font-semibold">{Math.round(winChance * 100)}%</span>
                      </div>
                      <Progress value={winChance * 100} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Launch raid */}
              <Button
                onClick={handleRaid}
                disabled={!selectedType || !targetClan || !canRaid || raiding}
                className="w-full font-display h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                size="lg"
              >
                {raiding ? (
                  <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" /> Raiding...</>
                ) : (
                  <><Swords className="w-4 h-4 mr-2" /> Launch Raid</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
