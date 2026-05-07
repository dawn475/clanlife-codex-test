import React from "react";
import { Badge } from "@/components/ui/badge";
import { MARKINGS, RARITY_CONFIG } from "@/lib/genetics";

export default function MarkingBadge({ marking, showRarity = true, size = "sm" }) {
  const m = MARKINGS[marking] || MARKINGS.none;
  const r = RARITY_CONFIG[m.rarity];

  if (marking === "none" && !showRarity) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {marking !== "none" && (
        <Badge
          variant="outline"
          className={`font-body capitalize text-[10px] px-1.5 py-0 ${r.bg} ${r.color} ${r.border}`}
          style={m.color ? { borderColor: m.color + "60", color: m.color } : {}}
        >
          {m.label}
        </Badge>
      )}
      {showRarity && (
        <Badge
          variant="outline"
          className={`font-body text-[10px] px-1.5 py-0 ${r.bg} ${r.color} ${r.border}`}
        >
          {r.label}
        </Badge>
      )}
    </div>
  );
}
