import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import Navbar from "./Navbar";
import { useUserProfile } from "@/lib/useUserProfile";
import GlobalChat from "@/components/chat/GlobalChat";
import { loadSavedTheme } from "@/lib/themes";
import SplashScreen from "./SplashScreen";

export default function GameLayout() {
  const navigate = useNavigate();
  // Apply saved theme on load
  React.useEffect(() => { loadSavedTheme(); }, []);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { profile, isLoading: loadingProfile, createProfile } = useUserProfile(user);

  // Create profile for new users
  useEffect(() => {
    if (user && !loadingProfile && !profile) {
      createProfile.mutate();
    }
  }, [user, loadingProfile, profile]);

  // Show splash screen instead of redirecting when not authed

  const { data: clans = [] } = useQuery({
    queryKey: ["clan", user?.id],
    queryFn: () => base44.entities.Clan.filter({ owner_id: user.id }),
    enabled: !!user?.id,
  });

  if (loadingUser || loadingProfile) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="mt-3 font-display text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <SplashScreen />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} userId={user?.id} />
      <main className="pt-2 pb-40 md:pt-20 md:pb-40 px-4 max-w-5xl mx-auto">
        <Outlet context={{ user, profile }} />
      </main>
      <GlobalChat user={user} clan={clans[0]} />
    </div>
  );
}
