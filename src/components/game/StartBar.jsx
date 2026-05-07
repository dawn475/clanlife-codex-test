import React from "react";

export default function StatBar({ label, value, max = 100, color = "bg-primary" }) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-body">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
