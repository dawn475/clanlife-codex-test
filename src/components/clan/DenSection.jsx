import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CatCard from "@/components/game/CatCard";
import { getCatName } from "@/lib/gameData";
import { Search, Filter } from "lucide-react";

// Generic den section — pass in cats and a title
export default function DenSection({ title, cats, rankFilter: fixedRank, emptyText }) {
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState(fixedRank || "all");

  const filtered = cats.filter(cat => {
    const nameMatch = getCatName(cat).toLowerCase().includes(search.toLowerCase());
    const rankMatch = fixedRank ? cat.rank === fixedRank : (rankFilter === "all" || cat.rank === rankFilter);
    return nameMatch && rankMatch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="pl-9 font-body"
          />
        </div>
        {!fixedRank && (
          <Select value={rankFilter} onValueChange={setRankFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ranks</SelectItem>
              <SelectItem value="leader">Leader</SelectItem>
              <SelectItem value="deputy">Deputy</SelectItem>
              <SelectItem value="medicine_cat">Medicine Cat</SelectItem>
              <SelectItem value="warrior">Warrior</SelectItem>
              <SelectItem value="apprentice">Apprentice</SelectItem>
              <SelectItem value="queen">Queen</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-sm text-muted-foreground font-body">
        {filtered.length} cat{filtered.length !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(cat => <CatCard key={cat.id} cat={cat} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-10 text-muted-foreground font-body italic">
          {emptyText || "No cats here."}
        </div>
      )}
    </div>
  );
}
