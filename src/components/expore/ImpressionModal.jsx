import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Sword, Star, MessageCircle, Loader2 } from "lucide-react";
import { getCatName, PREFIXES, SUFFIXES, randomFrom } from "@/lib/gameData";
import { TRAIT_ICONS } from "@/lib/catIcons";
import { generateRandomCat } from "@/lib/gameData";
import { rollRandomGenetics } from "@/lib/genetics";
import { cn } from "@/lib/utils";

const IMPRESSION_ACTIONS = [
  {
    id: "share_prey",
    label: "Share Prey",
    icon: "🐟",
    desc: "Offer food — works best with hungry outsiders",
    successBase: 0.45,
    successTraits: ["gentle", "loyal", "calm"],
    failTraits: ["ambitious", "fierce"],
    impression: 20,
    expReward: 15,
  },
  {
    id: "tell_story",
    label: "Tell a Story",
    icon: "📖",
    desc: "Share tales of clan life — appeals to the curious",
    successBase: 0.40,
    successTraits: ["wise", "playful", "cunning"],
    failTraits: ["stubborn"],
    impression: 15,
    expReward: 12,
  },
  {
    id: "show_strength",
    label: "Show Strength",
    icon: "⚔️",
    desc: "Demonstrate battle skill — earns respect from rogues",
    successBase: 0.35,
    successTraits: ["brave", "fierce", "ambitious"],
    failTraits: ["gentle", "calm"],
    impression: 18,
    expReward: 14,
  },
  {
    id: "offer_shelter",
    label: "Offer Shelter",
    icon: "🏡",
    desc: "Invite them to camp for safety — safest approach",
    successBase: 0.55,
    successTraits: ["gentle", "loyal", "wise", "calm"],
    failTraits: ["fierce", "stubborn"],
    impression: 25,
    expReward: 18,
  },
  {
    id: "grooming",
    label: "Social Grooming",
    icon: "🪥",
    desc: "Build trust through touch — risky but highly effective",
    successBase: 0.30,
    successTraits: ["gentle", "playful", "loyal"],
    failTraits: ["fierce", "stubborn", "ambitious"],
    impression: 30,
    expReward: 20,
  },
];

function getOutsiderType() {
  const roll = Math.random();
  if (roll < 0.5) return "loner";
  if (roll < 0.85) return "rogue";
  return "kittypet";
}

function generateOutsider() {
  const type = getOutsiderType();
  const g = rollRandomGenetics();
  const gender = Math.random() > 0.5 ? "tom" : "she-cat";
  const traits = ["brave", "loyal", "cunning", "gentle", "fierce", "ambitious", "calm", "playful", "stubborn", "wise"];
  const trait = randomFrom(traits);
  const name = randomFrom(PREFIXES);
  const age = 12 + Math.floor(Math.random() * 48);
  return {
    name,
    type,
    gender,
    trait,
    age_moons: age,
    ...g,
    origin: type,
  };
}

export default function ImpressionModal({ open, onClose, leader, clan, profile, onSuccess, onFail }) {
  const [outsider] = useState(generateOutsider);
  const [impressionScore, setImpressionScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [log, setLog] = useState([]);
  const [joining, setJoining] = useState(false);
  const [done, setDone] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const MAX_ATTEMPTS = 3;
  const JOIN_THRESHOLD = 60;

  const leaderTrait = leader?.trait || "brave";

  const tryAction = (action) => {
    if (attempts >= MAX_ATTEMPTS || done) return;
    
    let chance = action.successBase;
    // Leader trait bonus
    if (action.successTraits.includes(leaderTrait)) chance += 0.2;
    if (action.failTraits.includes(leaderTrait)) chance -= 0.1;
    // Outsider trait reaction
    if (action.successTraits.includes(outsider.trait)) chance += 0.15;
    if (action.failTraits.includes(outsider.trait)) chance -= 0.15;

    chance = Math.max(0.05, Math.min(0.95, chance));
    const success = Math.random() < chance;

    const gained = success ? action.impression : Math.floor(action.impression * 0.2);
    const newScore = Math.min(100, impressionScore + gained);
    setImpressionScore(newScore);
    setAttempts(a => a + 1);

    setLog(l => [...l, {
      action: action.label,
      icon: action.icon,
      success,
      gained,
      msg: success
        ? `${outsider.name} seems moved by your ${action.label.toLowerCase()}. (+${gained})`
        : `${outsider.name} is unmoved by your attempt. (+${gained})`,
    }]);

    const newAttempts = attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS || newScore >= JOIN_THRESHOLD) {
      // Resolve
      setTimeout(() => resolve(newScore, action.expReward), 500);
    }
  };

  const resolve = async (score, expBonus) => {
    setDone(true);
    const joined = score >= JOIN_THRESHOLD;
    setFinalResult(joined);

    // Award leader exp
    if (leader && profile) {
      const expGained = expBonus + (joined ? 30 : 10);
      await onSuccess({ outsider, joined, expGained });
    }
  };

  const OUTSIDER_TYPE_COLORS = {
    loner:   "text-yellow-600 bg-yellow-500/10 border-yellow-500/30",
    rogue:   "text-red-600 bg-red-500/10 border-red-500/30",
    kittypet:"text-pink-600 bg-pink-500/10 border-pink-500/30",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md font-body">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" /> Stranger Encountered!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Outsider profile */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
            <div className="text-3xl">
              {outsider.pelt_color === "black" ? "🐈‍⬛" : outsider.gender === "tom" ? "🐱" : "😸"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold">{outsider.name}</span>
                <Badge variant="outline" className={cn("text-[10px]", OUTSIDER_TYPE_COLORS[outsider.type])}>
                  {outsider.type}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {outsider.gender} · {outsider.age_moons}m · {outsider.pelt_color} {outsider.pelt_pattern}
              </p>
              <p className="text-xs mt-0.5">
                {TRAIT_ICONS[outsider.trait]} <span className="capitalize">{outsider.trait}</span>
              </p>
            </div>
          </div>

          {/* Impression bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Impression</span>
              <span className="font-semibold">{impressionScore}/100 <span className="text-muted-foreground">(need {JOIN_THRESHOLD})</span></span>
            </div>
            <Progress value={impressionScore} className="h-2" />
            <p className="text-[10px] text-muted-foreground mt-1">Attempts: {attempts}/{MAX_ATTEMPTS}</p>
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={cn("text-xs px-2 py-1 rounded flex items-center gap-2",
                  entry.success ? "bg-green-500/10 text-green-700" : "bg-muted/50 text-muted-foreground")}>
                  <span>{entry.icon}</span>
                  <span>{entry.msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          {done && finalResult !== null && (
            <div className={cn("p-3 rounded-lg text-center font-display font-semibold text-sm",
              finalResult ? "bg-green-500/15 text-green-700 border border-green-500/30"
                          : "bg-muted/60 text-muted-foreground border border-border")}>
              {finalResult
                ? `🎉 ${outsider.name} has agreed to join ${clan?.name}Clan!`
                : `${outsider.name} wanders off alone...`}
            </div>
          )}

          {/* Actions */}
          {!done && (
            <div className="grid grid-cols-1 gap-2">
              {IMPRESSION_ACTIONS.map(action => (
                <button
                  key={action.id}
                  disabled={attempts >= MAX_ATTEMPTS}
                  onClick={() => tryAction(action)}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "border-border/60 bg-card/60",
                    attempts >= MAX_ATTEMPTS && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <span className="text-xl">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-xs font-semibold">{action.label}</p>
                    <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">+{action.impression}</Badge>
                </button>
              ))}
            </div>
          )}

          {done && (
            <Button onClick={onClose} className="w-full font-display">Continue</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
