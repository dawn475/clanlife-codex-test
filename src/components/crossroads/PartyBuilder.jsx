/**
 * Shared reusable component: pick cats for a party, shows chemistry indicator.
 */
import React from "react";
import CatAvatar from "@/components/game/CatAvatar";
import { getCatName } from "@/lib/gameData";
import { getGroupCompatibility, getChemistryLabel } from "@/lib/personalities";
import { Badge } from "@/components/ui/badge";

export default function PartyBuilder({ cats, selected, onToggle, maxSize = 4, filterFn }) {
  const available = filterFn ? cats.filter(filterFn) : cats;
  const selectedCats = selected.map(id => cats.find(c => c.id === id)).filter(Boolean);
  const chemistry = getGroupCompatibility(selectedCats);
  const chem = getChemistryLabel(chemistry);

  return (
    <div className="space-y-3">
      {selected.length >= 2 && (
        <div className={`text-xs font-body ${chem.color} flex items-center gap-1`}>
          <span>Group chemistry:</span>
          <span className="font-semibold">{chem.label}</span>
          <span className="text-muted-foreground">({chemistry >= 1 ? "+" : ""}{Math.round((chemistry - 1) * 100)}%)</span>
        </div>
      )}

      {available.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">No cats available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {available.map(cat => (
            <button
              key={cat.id}
              onClick={() => onToggle(cat.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                selected.includes(cat.id)
                  ? "border-primary bg-primary/5"
                  : selected.length >= maxSize
                  ? "border-border opacity-50 cursor-not-allowed"
                  : "border-border hover:border-primary/30"
              }`}
              disabled={!selected.includes(cat.id) && selected.length >= maxSize}
            >
              <CatAvatar cat={cat} size="sm" />
              <div>
                <p className="font-display text-sm font-semibold">{getCatName(cat)}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {cat.rank?.replace("_", " ")} • {cat.trait}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
