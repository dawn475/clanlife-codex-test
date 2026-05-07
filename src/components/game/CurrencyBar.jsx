import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Gift, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function CurrencyBar({ profile, userId }) {
  const [claiming, setClaiming] = useState(false);
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];
  const canClaim = !profile?.last_daily_claim || profile.last_daily_claim !== today;

  const claimDaily = async () => {
    if (!canClaim || !profile) return;
    setClaiming(true);
    await base44.entities.UserProfile.update(profile.id, {
      acorns: (profile.acorns || 0) + 50,
      last_daily_claim: today,
    });
    queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    setClaiming(false);
  };

  return (
    <div className="flex items-center gap-3 text-sm font-body">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full cursor-default">
              <span className="text-base">🌰</span>
              <span className="font-semibold text-amber-700">{profile?.acorns ?? 0}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent><p>Acorns — earned by playing</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full cursor-default">
              <span className="text-base">💎</span>
              <span className="font-semibold text-blue-700">{profile?.moonstones ?? 0}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent><p>Moonstones — premium currency</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {canClaim && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
          onClick={claimDaily}
          disabled={claiming}
        >
          {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
          Daily
        </Button>
      )}
    </div>
  );
}
