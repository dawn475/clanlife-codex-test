import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CatCard from "@/components/game/CatCard";
import CatAvatar from "@/components/game/CatAvatar";
import { firebaseReady } from "@/lib/firebase";
import {
  listenForGameUser,
  loadRemoteGameState,
  loginGameUser,
  logoutGameUser,
  registerGameUser,
  saveRemoteGameState,
} from "@/lib/firebaseGameData";
import { assignStatPoint, gainCatExperience, generateRandomCat, getCatName, randomFrom } from "@/lib/gameData";
import {
  applyTimedProgress,
  createClock,
  EXPLORE_COST,
  LITTER_WAIT_DAYS,
  MAX_EXPLORE_ENERGY,
  DAY_MS,
  getTimeRemaining,
} from "@/lib/rollover";

const STORAGE_KEY = "clanlife-react-state";

const now = Date.now();
const starterState = {
  clan: {
    name: "Dawn",
    territory: "forest",
    prey: 18,
    herbs: 9,
    reputation: 64,
    moon: 1,
    exploreEnergy: MAX_EXPLORE_ENERGY,
  },
  clock: createClock(now),
  currencies: {
    leaves: 120,
    stardust: 8,
  },
  cats: [
    {
      ...generateRandomCat("leader"),
      id: "leader-1",
      prefix: "Amber",
      suffix: "star",
      gender: "she-cat",
      pelt_color: "golden",
      pelt_pattern: "tabby",
      eye_color: "green",
      leader_level: 2,
      leader_exp: 65,
    },
    {
      ...generateRandomCat("deputy"),
      id: "deputy-1",
      prefix: "Stone",
      suffix: "claw",
      gender: "tom",
      pelt_color: "gray",
      pelt_pattern: "solid",
      eye_color: "amber",
    },
    {
      ...generateRandomCat("medicine_cat"),
      id: "medicine-1",
      prefix: "Moss",
      suffix: "whisker",
      pelt_color: "brown",
      pelt_pattern: "spotted",
      eye_color: "hazel",
      skill_healing: 8,
    },
    {
      ...generateRandomCat("apprentice"),
      id: "apprentice-1",
      prefix: "Bright",
      suffix: "paw",
      age_moons: 7,
    },
    {
      ...generateRandomCat("kit"),
      id: "kit-1",
      prefix: "Tiny",
      suffix: "kit",
      age_moons: 2,
    },
  ],
  inventory: [
    { name: "Marigold", type: "Herb", qty: 3 },
    { name: "Fresh-kill", type: "Prey", qty: 6 },
    { name: "Smooth Stone", type: "Treasure", qty: 1 },
  ],
  givingTree: [],
  nurseryQueue: [],
  log: ["DawnClan settled into its new camp."],
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return applyTimedProgress(saved ? JSON.parse(saved) : starterState);
  } catch {
    return applyTimedProgress(starterState);
  }
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authMessage, setAuthMessage] = useState(firebaseReady ? "" : "Firebase is not configured.");
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  const aliveCats = state.cats.filter((cat) => cat.is_alive !== false);
  const leader = aliveCats.find((cat) => cat.rank === "leader");
  const givingTreeEligible = aliveCats.filter((cat) => cat.rank === "kit" || cat.rank === "apprentice");
  const breedingCats = aliveCats.filter((cat) => ["leader", "deputy", "warrior", "medicine_cat", "queen"].includes(cat.rank));
  const queens = breedingCats.filter((cat) => cat.gender === "she-cat" && !cat.expectingLitterId);
  const catsWithPoints = aliveCats.filter((cat) => (cat.statPoints ?? 0) > 0);

  useEffect(() => {
    const unsubscribe = listenForGameUser(async (nextUser) => {
      setUser(nextUser);
      setRemoteLoaded(false);

      if (!nextUser) {
        setRemoteLoaded(true);
        return;
      }

      try {
        const remoteState = await loadRemoteGameState(nextUser.uid);
        if (remoteState) {
          const progressed = applyTimedProgress(remoteState);
          setState(progressed);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(progressed));
        } else {
          await saveRemoteGameState(nextUser.uid, state);
        }
        setAuthMessage(`Signed in as ${nextUser.email}`);
      } catch (error) {
        setAuthMessage(error.message);
      } finally {
        setRemoteLoaded(true);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      save(applyTimedProgress(state));
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, [state, user]);

  const save = (nextState) => {
    const progressed = applyTimedProgress(nextState);
    setState(progressed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progressed));

    if (user?.uid && remoteLoaded) {
      saveRemoteGameState(user.uid, progressed).catch((error) => setAuthMessage(error.message));
    }
  };

  const addCat = () => {
    const rank = randomFrom(["warrior", "apprentice", "kit"]);
    const cat = generateRandomCat(rank);
    save({
      ...state,
      cats: [...state.cats, cat],
      clan: { ...state.clan, prey: Math.max(0, state.clan.prey - 1) },
      log: [`${getCatName(cat)} joined ${state.clan.name}Clan.`, ...state.log].slice(0, 8),
    });
  };

  const explore = () => {
    if ((state.clan.exploreEnergy ?? 0) < EXPLORE_COST) {
      save({
        ...state,
        log: ["The patrols are too tired to explore right now.", ...state.log].slice(0, 8),
      });
      return;
    }

    const patrolCats = aliveCats.filter((cat) => !["kit", "queen"].includes(cat.rank) && cat.status !== "expecting");
    const patrolCat = patrolCats.length > 0 ? randomFrom(patrolCats) : null;
    const foundLeaves = Math.floor(Math.random() * 18) + 8;
    const foundHerbs = Math.random() > 0.55 ? 1 : 0;
    const expGain = Math.floor(Math.random() * 18) + 18;
    let levelLog = "";
    const nextCats = state.cats.map((cat) => {
      if (!patrolCat || cat.id !== patrolCat.id) return cat;
      const result = gainCatExperience(cat, expGain);
      if (result.levelsGained > 0) {
        levelLog = `${getCatName(cat)} reached level ${result.cat.level} and gained ${result.levelsGained * 2} stat points.`;
      }
      return result.cat;
    });

    save({
      ...state,
      cats: nextCats,
      clan: {
        ...state.clan,
        herbs: state.clan.herbs + foundHerbs,
        prey: state.clan.prey + 2,
        exploreEnergy: Math.max(0, state.clan.exploreEnergy - EXPLORE_COST),
      },
      currencies: { ...state.currencies, leaves: state.currencies.leaves + foundLeaves },
      inventory: state.inventory.map((item) =>
        item.name === "Fresh-kill" ? { ...item, qty: item.qty + 2 } : item
      ),
      log: [
        patrolCat ? `${getCatName(patrolCat)} gained ${expGain} patrol EXP.` : "No eligible patrol cat was available for EXP.",
        ...(levelLog ? [levelLog] : []),
        `Patrol returned with 2 prey, ${foundLeaves} leaves, and ${foundHerbs} herbs.`,
        ...state.log,
      ].slice(0, 8),
    });
  };

  const queueLitter = () => {
    const queen = queens[0];
    const mate = breedingCats.find((cat) => cat.id !== queen?.id);
    if (!queen || !mate) {
      save({ ...state, log: ["The nursery needs an available queen and another adult before a litter can be queued.", ...state.log].slice(0, 8) });
      return;
    }

    const parents = [queen, mate];
    const litterId = crypto.randomUUID();
    const dueAt = Date.now() + LITTER_WAIT_DAYS * DAY_MS;
    save({
      ...state,
      cats: state.cats.map((cat) =>
        cat.id === queen.id
          ? { ...cat, status: "expecting", rank: "queen", expectingLitterId: litterId }
          : cat
      ),
      nurseryQueue: [
        ...state.nurseryQueue,
        {
          id: litterId,
          queenId: queen.id,
          queenName: getCatName(queen),
          queenOriginalRank: queen.rank,
          parentIds: parents.map((cat) => cat.id),
          parentNames: parents.map(getCatName),
          parentSnapshots: parents,
          nested: false,
          mutationBoosted: state.inventory.some((item) => item.name === "Mutation Boost" && item.qty > 0),
          createdAt: Date.now(),
          dueAt,
        },
      ],
      log: [`${getCatName(queen)} is expecting. Build a nest before the kits arrive to reduce the risk of loss.`, ...state.log].slice(0, 8),
    });
  };

  const nestQueen = (litterId) => {
    const litter = state.nurseryQueue.find((item) => item.id === litterId);
    save({
      ...state,
      nurseryQueue: state.nurseryQueue.map((item) =>
        item.id === litterId ? { ...item, nested: true, nestedAt: Date.now() } : item
      ),
      log: [`${litter?.queenName ?? "The queen"} has been nested safely.`, ...state.log].slice(0, 8),
    });
  };

  const spendPoint = (catId, stat) => {
    const cat = state.cats.find((item) => item.id === catId);
    if (!cat || (cat.statPoints ?? 0) <= 0) return;

    save({
      ...state,
      cats: state.cats.map((item) => (item.id === catId ? assignStatPoint(item, stat) : item)),
      log: [`${getCatName(cat)} gained +1 ${stat.replace("skill_", "")}.`, ...state.log].slice(0, 8),
    });
  };

  const placeInGivingTree = (catId) => {
    const cat = state.cats.find((item) => item.id === catId);
    if (!cat || !["kit", "apprentice"].includes(cat.rank)) return;

    save({
      ...state,
      cats: state.cats.filter((item) => item.id !== catId),
      givingTree: [{ ...cat, placedAt: Date.now() }, ...state.givingTree],
      log: [`${getCatName(cat)} was placed in the Giving Tree.`, ...state.log].slice(0, 8),
    });
  };

  const handleAuth = async (mode) => {
    try {
      setAuthMessage(mode === "register" ? "Creating account..." : "Signing in...");
      if (mode === "register") {
        await registerGameUser(authForm.email, authForm.password);
      } else {
        await loginGameUser(authForm.email, authForm.password);
      }
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const handleLogout = async () => {
    await logoutGameUser();
    setAuthMessage("Signed out. Progress is still saved locally.");
  };

  const clanHealth = useMemo(() => {
    const total = aliveCats.reduce((sum, cat) => sum + (cat.health ?? 100), 0);
    return Math.round(total / Math.max(1, aliveCats.length));
  }, [aliveCats]);

  const energy = state.clan.exploreEnergy ?? MAX_EXPLORE_ENERGY;
  const nextRollover = (state.clock?.lastRolloverAt ?? Date.now()) + DAY_MS;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.18em] text-muted-foreground">Clanlife</p>
            <h1 className="font-display text-3xl font-bold text-primary">{state.clan.name}Clan</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Pill value={state.currencies.leaves} label="Leaves" />
            <Pill value={state.currencies.stardust} label="Stardust" tone="accent" />
            <Button onClick={explore} disabled={energy < EXPLORE_COST}>Send Patrol</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-5">
          <Card className="overflow-hidden border-border/70">
            <CardContent className="grid gap-5 p-5 md:grid-cols-[auto_1fr]">
              {leader && <CatAvatar cat={leader} size="xl" />}
              <div className="space-y-4">
                <div>
                  <Badge variant="outline" className="mb-2 capitalize">{state.clan.territory} territory</Badge>
                  <h2 className="font-display text-2xl font-semibold">A living clan timeline</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Patrol energy, nursery waits, Giving Tree placements, Firebase saves, and daily aging all run from the same rollover clock.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-5">
                  <Stat label="Cats" value={aliveCats.length} />
                  <Stat label="Prey" value={state.clan.prey} />
                  <Stat label="Herbs" value={state.clan.herbs} />
                  <Stat label="Mood" value={`${clanHealth}%`} />
                  <Stat label="Moon" value={state.clan.moon} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Exploration Energy</span>
                    <span className="text-muted-foreground">{energy} / {MAX_EXPLORE_ENERGY}</span>
                  </div>
                  <Progress value={(energy / MAX_EXPLORE_ENERGY) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Patrols cost {EXPLORE_COST} energy. Energy refills over time and fully restores across a day.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="font-display text-lg">Nursery</CardTitle>
                <Button variant="secondary" onClick={queueLitter}>Queue Litter</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {state.nurseryQueue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No litters are waiting right now.</p>
                ) : (
                  state.nurseryQueue.map((litter) => (
                    <div key={litter.id} className="rounded-md border border-border/60 bg-muted/30 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-body text-sm font-semibold">{litter.queenName ?? litter.parentNames[0]}</p>
                          <p className="text-xs text-muted-foreground">Parents: {litter.parentNames.join(" and ")}</p>
                          <p className="text-xs text-muted-foreground">Kits due in {getTimeRemaining(litter.dueAt)}</p>
                        </div>
                        <Badge variant={litter.nested ? "default" : "outline"}>{litter.nested ? "Nested" : "Needs nest"}</Badge>
                      </div>
                      {!litter.nested && (
                        <Button size="sm" className="mt-3 w-full" variant="secondary" onClick={() => nestQueen(litter.id)}>
                          Build Nest
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Giving Tree</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {givingTreeEligible.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No kits or apprentices are eligible right now.</p>
                ) : (
                  givingTreeEligible.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30 p-3">
                      <div>
                        <p className="font-body text-sm font-semibold">{getCatName(cat)}</p>
                        <p className="text-xs capitalize text-muted-foreground">{cat.rank} - {cat.age_moons} moons</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => placeInGivingTree(cat.id)}>Place</Button>
                    </div>
                  ))
                )}
                {state.givingTree.length > 0 && (
                  <div className="border-t border-border/60 pt-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Placed</p>
                    {state.givingTree.map((cat) => (
                      <p key={`${cat.id}-${cat.placedAt}`} className="text-sm text-muted-foreground">
                        {getCatName(cat)} ({cat.rank})
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Level Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {catsWithPoints.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cats gain EXP from patrols. Level-ups will appear here with stat points to spend.</p>
              ) : (
                catsWithPoints.map((cat) => (
                  <div key={cat.id} className="rounded-md border border-border/60 bg-muted/30 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold">{getCatName(cat)}</p>
                        <p className="text-xs text-muted-foreground">Level {cat.level ?? 1} - {cat.statPoints ?? 0} points available</p>
                      </div>
                      <Badge>{cat.exp ?? 0} EXP</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" onClick={() => spendPoint(cat.id, "skill_hunting")}>
                        Hunting {cat.skill_hunting ?? 0}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => spendPoint(cat.id, "skill_fighting")}>
                        Fighting {cat.skill_fighting ?? 0}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => spendPoint(cat.id, "skill_healing")}>
                        Healing {cat.skill_healing ?? 0}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">Clan Roster</h2>
            <Button variant="secondary" onClick={addCat}>Generate Cat</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {aliveCats.map((cat) => <CatCard key={cat.id} cat={cat} />)}
          </div>
        </section>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Firebase Save</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user ? (
                <>
                  <p className="text-sm text-muted-foreground">Signed in as {user.email}. Progress syncs to Firestore.</p>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>Sign Out</Button>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={authForm.email}
                      onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={authForm.password}
                      onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button disabled={!firebaseReady} onClick={() => handleAuth("login")}>Login</Button>
                    <Button disabled={!firebaseReady} variant="secondary" onClick={() => handleAuth("register")}>Register</Button>
                  </div>
                </>
              )}
              {authMessage && <p className="text-xs text-muted-foreground">{authMessage}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Rollover</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Next aging rollover: {getTimeRemaining(nextRollover)}</p>
              <p>Each 24 hours adds 0.5 moons to every active cat.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {state.inventory.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                  <div>
                    <p className="font-body text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.type}</p>
                  </div>
                  <Badge>{item.qty}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Camp Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {state.log.map((entry, index) => (
                <p key={`${entry}-${index}`} className="rounded-md bg-card text-sm text-muted-foreground">
                  {entry}
                </p>
              ))}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}

function Pill({ label, value, tone = "primary" }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-sm">
      <span className={tone === "accent" ? "font-semibold text-accent" : "font-semibold text-primary"}>{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/80 p-3">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
