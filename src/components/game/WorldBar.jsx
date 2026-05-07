import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSeason, getTimeOfDay, rollWeather, SEASON_DATA, WEATHER_DATA, TIME_OF_DAY } from "@/lib/worldState";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export default function WorldBar({ clan }) {
  const queryClient = useQueryClient();
  const moon = clan?.moon || 1;
  const season = getSeason(moon);
  const timeKey = getTimeOfDay();
  const seasonData = SEASON_DATA[season];
  const timeData = TIME_OF_DAY[timeKey];

  // Weather stored on clan, rolled fresh each moon advance
  const weather = clan?.current_weather || "clear";
  const weatherData = WEATHER_DATA[weather] || WEATHER_DATA.clear;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm text-sm font-body">
        {/* Moon */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <span>🌙</span>
              <span className="font-display text-xs font-semibold">Moon {moon}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent><p>Current moon cycle</p></TooltipContent>
        </Tooltip>

        <span className="text-border">|</span>

        {/* Season */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <span>{seasonData.icon}</span>
              <span className="text-xs capitalize">{seasonData.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent><p>{seasonData.desc}</p><p className="text-xs text-muted-foreground mt-1">Prey ×{seasonData.preyMod} · Herbs ×{seasonData.herbMod}</p></TooltipContent>
        </Tooltip>

        <span className="text-border">|</span>

        {/* Weather */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <span>{weatherData.icon}</span>
              <span className="text-xs">{weatherData.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Weather: {weatherData.label}</p>
            <p className="text-xs text-muted-foreground mt-1">Prey ×{weatherData.preyMod} · Injury ×{weatherData.injuryMod}</p>
          </TooltipContent>
        </Tooltip>

        <span className="text-border">|</span>

        {/* Time of day */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-default">
              <span>{timeData.icon}</span>
              <span className="text-xs">{timeData.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{timeData.label}</p>
            <p className="text-xs text-muted-foreground mt-1">Hunt ×{timeData.huntMod} · Encounter ×{timeData.encounterMod}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
