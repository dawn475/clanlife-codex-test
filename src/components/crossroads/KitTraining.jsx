import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CatAvatar from "@/components/game/CatAvatar";
import { getCatName, randomBetween } from "@/lib/gameData";
import { Loader2, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KitTraining({ clan, user, profile }) {
  const [apprenticeId, setApprenticeId] = useState(null);
  const [mentorId, setMentorId] = useState(null);
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: cats = [] } = useQuery({
    queryKey: ["cats", clan?.id],
    queryFn: () => base44.entities.Cat.filter({ clan_id: clan.id, is_alive: true }),
    enabled: !!clan?.id,
  });

  const apprentices = cats.filter(c => c.rank === "apprentice" && c.status === "healthy");
  const mentors = cats.filter(c => ["warrior","deputy","leader","medicine_cat"].includes(c.rank) && c.status === "healthy");

  const train = async () => {
    if (!apprenticeId || !mentorId) return;
    setSending(true);
    setResult(null);

    const apprentice = cats.find(c => c.id === apprenticeId);
    const mentor = cats.find(c => c.id === mentorId);

    const skillGain = Math.random() > 0.4 ? 1 : 0;
    const statToTrain = Math.random() > 0.5 ? "skill_hunting" : "skill_fighting";
    const updates = {};
    if (skillGain) updates[statToTrain] = Math.min(10, (apprentice[statToTrain] || 1) + 1);

    // Mentor's highest skill boosts apprentice extra
    if (mentor.skill_hunting >= 8 || mentor.skill_fighting >= 8) {
      const bonus = Math.random() > 0.6 ? 1 : 0;
      if (bonus && skillGain) updates[statToTrain] = Math.min(10, (updates[statToTrain] || apprentice[statToTrain]) + 1);
    }

    // Happiness boost from training
    updates.happiness = Math.min(100, (apprentice.happiness || 80) + randomBetween(2, 8));

    if (Object.keys(updates).length > 0)
      await base44.entities.Cat.update(apprenticeId, updates);

    const messages = [
      `${getCatName(mentor)} showed ${getCatName(apprentice)} how to stalk through the undergrowth.`,
      `${getCatName(apprentice)} practiced their battle moves under ${getCatName(mentor)}'s watchful eye.`,
      `${getCatName(mentor)} took ${getCatName(apprentice)} on a training exercise along the border.`,
      `${getCatName(apprentice)} spent the morning learning hunting techniques from ${getCatName(mentor)}.`,
    ];

    setResult({
      text: messages[Math.floor(Math.random() * messages.length)],
      gained: skillGain ? `+1 ${statToTrain.replace("skill_","").replace("_"," ")}` : "No skill gain today, but happiness improved!",
    });

    setSending(false);
    setApprenticeId(null);
    setMentorId(null);
    queryClient.invalidateQueries({ queryKey: ["cats", clan?.id] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Swords className="w-5 h-5 text-accent" /> Kit Training
        </CardTitle>
        <p className="text-xs text-muted-foreground font-body">Assign a mentor to train an apprentice.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
                <p className="font-body text-sm leading-relaxed">{result.text}</p>
                <Badge variant="secondary">{result.gained}</Badge>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-body font-semibold text-muted-foreground mb-2">APPRENTICE</p>
            {apprentices.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">No apprentices available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {apprentices.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setApprenticeId(cat.id === apprenticeId ? null : cat.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      apprenticeId === cat.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <CatAvatar cat={cat} size="sm" />
                    <div>
                      <p className="font-display text-sm font-semibold">{getCatName(cat)}</p>
                      <p className="text-[10px] text-muted-foreground">Hunt: {cat.skill_hunting} • Fight: {cat.skill_fighting}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-body font-semibold text-muted-foreground mb-2">MENTOR</p>
            {mentors.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body">No mentors available.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mentors.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setMentorId(cat.id === mentorId ? null : cat.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      mentorId === cat.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                    }`}
                  >
                    <CatAvatar cat={cat} size="sm" />
                    <div>
                      <p className="font-display text-sm font-semibold">{getCatName(cat)}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{cat.rank?.replace("_"," ")} • {cat.trait}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={train}
          disabled={!apprenticeId || !mentorId || sending}
          className="w-full font-display"
          size="lg"
        >
          {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Training…</> : "Begin Training Session"}
        </Button>
      </CardContent>
    </Card>
  );
}
