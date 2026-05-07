import { generateRandomCat, getCatName, randomBetween } from "@/lib/gameData";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_EXPLORE_ENERGY = 100;
export const EXPLORE_COST = 20;
export const ENERGY_PER_DAY = 100;
export const LITTER_WAIT_DAYS = 3;

export function createClock(now = Date.now()) {
  return {
    lastRolloverAt: now,
    lastEnergyAt: now,
  };
}

export function getTimeRemaining(targetAt, now = Date.now()) {
  const remaining = Math.max(0, targetAt - now);
  const days = Math.floor(remaining / DAY_MS);
  const hours = Math.ceil((remaining % DAY_MS) / (60 * 60 * 1000));
  if (days <= 0 && hours <= 0) return "Ready";
  if (days <= 0) return `${hours}h`;
  return `${days}d ${hours}h`;
}

export function normalizeGameState(state, now = Date.now()) {
  const clock = state.clock ?? createClock(now);
  return {
    ...state,
    clan: {
      ...state.clan,
      moon: state.clan?.moon ?? 1,
      exploreEnergy: state.clan?.exploreEnergy ?? MAX_EXPLORE_ENERGY,
    },
    cats: (state.cats ?? []).map((cat) => ({
      ...cat,
      age_moons: Number(cat.age_moons ?? 0),
      level: cat.level ?? 1,
      exp: cat.exp ?? 0,
      statPoints: cat.statPoints ?? 0,
      mutations: cat.mutations ?? [],
      mutationDetails: cat.mutationDetails ?? {},
      patternMutation: cat.patternMutation ?? null,
    })),
    givingTree: state.givingTree ?? [],
    nurseryQueue: state.nurseryQueue ?? [],
    clock,
  };
}

export function applyTimedProgress(rawState, now = Date.now()) {
  let state = normalizeGameState(rawState, now);
  const log = [...(state.log ?? [])];

  const lastEnergyAt = state.clock.lastEnergyAt ?? now;
  const energyGain = Math.floor(((now - lastEnergyAt) / DAY_MS) * ENERGY_PER_DAY);
  if (energyGain > 0) {
    state = {
      ...state,
      clan: {
        ...state.clan,
        exploreEnergy: Math.min(MAX_EXPLORE_ENERGY, (state.clan.exploreEnergy ?? MAX_EXPLORE_ENERGY) + energyGain),
      },
      clock: {
        ...state.clock,
        lastEnergyAt: now,
      },
    };
  }

  const lastRolloverAt = state.clock.lastRolloverAt ?? now;
  const rolloverDays = Math.floor((now - lastRolloverAt) / DAY_MS);
  if (rolloverDays > 0) {
    state = {
      ...state,
      clan: {
        ...state.clan,
        moon: Number(((state.clan.moon ?? 1) + rolloverDays * 0.5).toFixed(1)),
      },
      cats: state.cats.map((cat) => ({
        ...cat,
        age_moons: Number(((cat.age_moons ?? 0) + rolloverDays * 0.5).toFixed(1)),
      })),
      clock: {
        ...state.clock,
        lastRolloverAt: lastRolloverAt + rolloverDays * DAY_MS,
      },
    };
    log.unshift(`${rolloverDays} daily rollover${rolloverDays > 1 ? "s" : ""}: every cat aged ${rolloverDays * 0.5} moon${rolloverDays === 2 ? "" : "s"}.`);
  }

  const readyLitters = state.nurseryQueue.filter((litter) => litter.dueAt <= now);
  if (readyLitters.length > 0) {
    const newborns = [];

    readyLitters.forEach((litter) => {
      const litterSize = randomBetween(1, 4);
      const survivalChance = litter.nested ? 100 : 55;
      const survivingKits = Array.from({ length: litterSize }, () => Math.random() * 100 < survivalChance).filter(Boolean).length;

      if (!litter.nested && survivingKits < litterSize) {
        const lost = litterSize - survivingKits;
        log.unshift(`${litter.queenName ?? "The expecting queen"} was not nested and lost ${lost} kit${lost === 1 ? "" : "s"}.`);
      }

      if (survivingKits === 0) {
        log.unshift(`${litter.queenName ?? "The expecting queen"}'s litter did not survive.`);
        return;
      }

      if (litter.nested) {
        log.unshift(`${litter.queenName ?? litter.parentNames[0]} had a safe nested birth.`);
      }
      log.unshift(`${litter.parentNames.join(" and ")} welcomed ${survivingKits} kit${survivingKits === 1 ? "" : "s"} at the nursery.`);

      newborns.push(...Array.from({ length: survivingKits }, () => ({
        ...generateRandomCat("kit", {
          parents: litter.parentSnapshots ?? [],
          mutationBoosted: litter.mutationBoosted,
        }),
        age_moons: 0,
        parentNames: litter.parentNames,
      })));
    });

    newborns.forEach((kit) => log.unshift(`${getCatName(kit)} was born.`));

    state = {
      ...state,
      cats: [
        ...state.cats.map((cat) => {
          const finishedLitter = readyLitters.find((litter) => litter.queenId === cat.id);
          if (!finishedLitter) return cat;
          return {
            ...cat,
            rank: finishedLitter.queenOriginalRank ?? cat.rank,
            status: "healthy",
            expectingLitterId: null,
          };
        }),
        ...newborns,
      ],
      nurseryQueue: state.nurseryQueue.filter((litter) => litter.dueAt > now),
    };
  }

  return {
    ...state,
    log: log.slice(0, 8),
  };
}
