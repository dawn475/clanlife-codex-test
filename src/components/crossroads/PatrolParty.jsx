import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PartyBuilder from "./PartyBuilder";
import { getCatName, PATROL_OUTCOMES, randomFrom, randomBetween } from "@/lib/gameData";
import { getGroupCompatibility } from "@/lib/personalities";
import { Loader2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatrolParty({ clan, user, profile }) {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: cats = [] } = useQuery({
    queryKey: ["cats", clan?.id],
    queryFn: () => base44.entities.Cat.filter({ clan_id: clan.id, is_alive: true }),
    enabled: !!clan?.id,
  });

  const toggle = (id) => setSelected(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 5 ? [...prev, id] : prev
  );

  const go = async () => {
    if (selected.length === 0) return;
    setSending(true);
    setResult(null);

    const outcome = randomFrom(PATROL_OUTCOMES);
    const leadCat = cats.find(c => c.id === selected[0]);
    const text = outcome.text.replace("{cat}", getCatName(leadCat));
    const selectedCats = selected.map(id => cats.find(c => c.id === id)).filter(Boolean);
    const chemistry = getGroupCompatibility(selectedCats);

    // Injury risk, reduced by chemistry bonus
    const injuryChance = 0.15 / chemistry;

    for (const id of selected) {
      const cat = cats.find(c => c.id === id);
      if (!cat) continue;
      const updates = {};
      if (cat.skill_fighting < 10 && Math.random() > 0.6)
        updates.skill_fighting = Math.min(10, cat.skill_fighting + 1);
      if (Math.random() < injuryChance) {
        updates.status = "injured";
        updates.health = Math.max(20, (cat.health || 100) - randomBetween(10, 25));
      }
      if (Object.keys(updates).length > 0)
        await base44.entities.Cat.update(id, updates);
    }

    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, {
        acorns: (profile.acorns || 0) + 10,
        total_patrols: (profile.total_patrols || 0) + 1,
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    }

    await base44.entities.ExplorationLog.create({
      clan_id: clan.id, cat_ids: selected, type: "border_patrol",
      outcome: text, prey_gained: 0, herbs_gained: 0,
      cats_encountered: outcome.encounter || "", moon: clan.moon || 1,
    });

    setResult({ text, encounter: outcome.encounter, acorns: 10, chemistry, injuredAny: selected.some(id => {
      const cat = cats.find(c => c.id === id);
      return cat && Math.random() < injuryChance;
    })});
    setSending(false);
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ["cats", clan?.id] });
    queryClient.invalidateQueries({ queryKey: ["clan"] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" /> Border Patrol
        </CardTitle>
        <p className="text-xs text-muted-foreground font-body">Send a patrol to defend territory. Good chemistry reduces injury risk.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 space-y-2">
                <p className="font-body text-sm leading-relaxed">{result.text}</p>
                {result.encounter && <p className="text-xs text-accent font-body">⚠️ {result.encounter}</p>}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/25">🌰 +{result.acorns}</Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <PartyBuilder
          cats={cats}
          selected={selected}
          onToggle={toggle}
          maxSize={5}
          filterFn={c => ["warrior","deputy","leader","apprentice","medicine_cat"].includes(c.rank) && c.status === "healthy"}
        />

        <Button onClick={go} disabled={selected.length === 0 || sending} className="w-full font-display" size="lg">
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Patrolling…</> : "Send Patrol"}
        </Button>
      </CardContent>
    </Card>
  );
}
