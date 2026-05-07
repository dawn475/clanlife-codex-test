import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PartyBuilder from "./PartyBuilder";
import { getCatName, HERB_OUTCOMES, randomFrom } from "@/lib/gameData";
import { getGroupCompatibility } from "@/lib/personalities";
import { Loader2, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HerbGathering({ clan, user, profile }) {
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
    prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
  );

  const go = async () => {
    if (selected.length === 0) return;
    setSending(true);
    setResult(null);

    const outcome = randomFrom(HERB_OUTCOMES);
    const leadCat = cats.find(c => c.id === selected[0]);
    const text = outcome.text.replace("{cat}", getCatName(leadCat));
    const selectedCats = selected.map(id => cats.find(c => c.id === id)).filter(Boolean);
    const chemistry = getGroupCompatibility(selectedCats);
    const herbsGained = Math.round((outcome.herbs + (selected.length - 1)) * chemistry);

    await base44.entities.Clan.update(clan.id, {
      herbs_stock: (clan.herbs_stock || 0) + herbsGained,
    });

    for (const id of selected) {
      const cat = cats.find(c => c.id === id);
      if (cat && cat.skill_healing < 10 && Math.random() > 0.6) {
        await base44.entities.Cat.update(id, { skill_healing: Math.min(10, cat.skill_healing + 1) });
      }
    }

    if (profile?.id) {
      await base44.entities.UserProfile.update(profile.id, {
        acorns: (profile.acorns || 0) + 12,
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    }

    await base44.entities.ExplorationLog.create({
      clan_id: clan.id, cat_ids: selected, type: "herb_gathering",
      outcome: text, prey_gained: 0, herbs_gained: herbsGained, moon: clan.moon || 1,
    });

    setResult({ text, herbs: herbsGained, acorns: 12, chemistry });
    setSending(false);
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ["cats", clan?.id] });
    queryClient.invalidateQueries({ queryKey: ["clan"] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Leaf className="w-5 h-5 text-primary" /> Herb Gathering
        </CardTitle>
        <p className="text-xs text-muted-foreground font-body">Medicine cats and warriors can gather healing herbs. Up to 3 cats.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                <p className="font-body text-sm leading-relaxed">{result.text}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">🌿 +{result.herbs} herbs</Badge>
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
          maxSize={3}
          filterFn={c => ["medicine_cat","warrior","apprentice"].includes(c.rank) && c.status === "healthy"}
        />

        <Button onClick={go} disabled={selected.length === 0 || sending} className="w-full font-display" size="lg">
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gathering…</> : "Gather Herbs"}
        </Button>
      </CardContent>
    </Card>
  );
}
