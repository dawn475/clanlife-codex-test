import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { containsProfanity } from "@/lib/profanityFilter";

const CHANNELS = [
  { key: "general",   label: "General",   color: "text-primary" },
  { key: "sales",     label: "Sales",     color: "text-amber-600" },
  { key: "help",      label: "Help",      color: "text-blue-600" },
  { key: "giveaways", label: "Giveaways", color: "text-pink-600" },
];

const CHANNEL_COLORS = {
  general:   "bg-primary/10 text-primary border-primary/20",
  sales:     "bg-amber-500/10 text-amber-700 border-amber-500/20",
  help:      "bg-blue-500/10 text-blue-700 border-blue-500/20",
  giveaways: "bg-pink-500/10 text-pink-700 border-pink-500/20",
};

export default function GlobalChat({ user, clan }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState("general");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const bottomRef = useRef(null);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ["chat", channel],
    queryFn: () => base44.entities.ChatMessage.filter({ channel }, "-created_date", 50),
    enabled: open,
    refetchInterval: open ? 5000 : false,
  });

  // Reversed so newest is at bottom
  const sorted = [...messages].reverse();

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sorted.length, open]);

  // Simulate online count (real-time presence would need a backend; approximate via recent messages)
  useEffect(() => {
    const uniqueUsers = new Set(messages.map(m => m.user_id));
    setOnlineCount(Math.max(1, uniqueUsers.size));
  }, [messages]);

  const [chatError, setChatError] = useState(null);

  const send = async () => {
    if (!input.trim() || !user) return;
    if (containsProfanity(input)) {
      setChatError("Message contains inappropriate content.");
      setTimeout(() => setChatError(null), 3000);
      return;
    }
    setSending(true);
    await base44.entities.ChatMessage.create({
      user_id: user.id,
      user_name: user.full_name || user.email?.split("@")[0] || "Wanderer",
      channel,
      message: input.trim(),
      clan_name: clan?.name || "",
    });
    setInput("");
    await refetch();
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Open chat panel */}
      {open && (
        <div className="bg-card border-t border-border shadow-2xl flex flex-col" style={{ height: 320 }}>
          {/* Channel tabs */}
          <div className="flex items-center gap-1 px-3 pt-2 border-b border-border overflow-x-auto">
            {CHANNELS.map(ch => (
              <button
                key={ch.key}
                onClick={() => setChannel(ch.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-display font-semibold rounded-t-md whitespace-nowrap transition-all border-b-2",
                  channel === ch.key
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {ch.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-body whitespace-nowrap pr-1">
              <Users className="w-3 h-3 text-green-500" />
              <span className="text-green-600 font-semibold">{onlineCount}</span>
              <span>online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {sorted.length === 0 && (
              <p className="text-xs text-muted-foreground font-body italic text-center pt-4">
                No messages yet. Be the first to speak!
              </p>
            )}
            {sorted.map(msg => (
              <div key={msg.id} className={cn("flex items-start gap-2", msg.user_id === user?.id && "flex-row-reverse")}>
                <div className={cn("max-w-[75%]", msg.user_id === user?.id && "items-end flex flex-col")}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-display font-semibold text-foreground">{msg.user_name}</span>
                    {msg.clan_name && (
                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0", CHANNEL_COLORS[msg.channel])}>
                        {msg.clan_name}Clan
                      </Badge>
                    )}
                  </div>
                  <div className={cn(
                    "text-xs font-body rounded-lg px-2.5 py-1.5",
                    msg.user_id === user?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {chatError && <p className="text-xs text-destructive px-3 pb-1 font-body">{chatError}</p>}

          {/* Input */}
          <div className="flex items-center gap-2 p-2 border-t border-border">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${channel}...`}
              className="text-xs font-body h-8"
              maxLength={300}
            />
            <Button size="sm" onClick={send} disabled={sending || !input.trim()} className="h-8 w-8 p-0 shrink-0">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Toggle bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 bg-primary text-primary-foreground text-sm font-display font-semibold hover:bg-primary/90 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Global Chat
          <Badge className="text-[10px] px-1.5 py-0 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 capitalize">
            #{channel}
          </Badge>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs opacity-80">
            <Users className="w-3 h-3 text-green-300" />
            <span className="text-green-300">{onlineCount}</span>
          </span>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </span>
      </button>
    </div>
  );
}
