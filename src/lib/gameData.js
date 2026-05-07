export const PREFIXES = [
  "Amber", "Ash", "Briar", "Cinder", "Dawn", "Fern", "Hawk", "Moss", "Night", "Silver", "Stone", "Willow"
];

export const SUFFIXES = [
  "claw", "fall", "fur", "heart", "leaf", "light", "pool", "song", "star", "step", "tail", "whisker"
];

export const PELT_DISPLAY_COLORS = {
  black: "#171412",
  white: "#eee8db",
  ginger: "#b7652b",
  brown: "#765036",
  gray: "#74706a",
  cream: "#d8bd8a",
  calico: "#c58a52",
  tortoiseshell: "#4a3024",
  silver: "#b8b8aa",
  golden: "#c79742",
};

export const EYE_DISPLAY_COLORS = {
  amber: "#d9952f",
  blue: "#4e9fd8",
  green: "#6ea65c",
  yellow: "#e5c44f",
  hazel: "#8d7b3f",
  copper: "#b96a37",
  odd: "linear-gradient(90deg, #4e9fd8 50%, #d9952f 50%)",
};

const peltColors = Object.keys(PELT_DISPLAY_COLORS);
const eyeColors = Object.keys(EYE_DISPLAY_COLORS);
const patterns = ["solid", "tabby", "spotted", "bicolor", "colorpoint"];
const traits = ["brave", "loyal", "cunning", "gentle", "fierce", "wise"];
const missingLimbs = ["front left leg", "front right leg", "back left leg", "back right leg"];

export const MUTATION_LABELS = {
  blindness: "Blind",
  deafness: "Deaf",
  clawless: "Clawless",
  no_tail: "No Tail",
  missing_limb: "Missing Limb",
};

export const PIEBALD_VARIANTS = {
  light: "Light Piebald",
  mottled: "Mottled Piebald",
  dense: "Dense Piebald",
};

export const PATCH_VARIANTS = {
  light: "Light Patches",
  mottled: "Mottled Patches",
  dense: "Dense Patches",
};

export const HUNTING_OUTCOMES = [];
export const HERB_OUTCOMES = [];
export const PATROL_OUTCOMES = [];

export function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chance(percent) {
  return Math.random() * 100 < percent;
}

export function getCatName(cat) {
  if (!cat) return "Unknown";
  return `${cat.prefix ?? ""}${cat.suffix ?? ""}`;
}

function parentHasMutation(parents, mutation) {
  return parents.some((parent) => parent?.mutations?.includes(mutation));
}

function parentHasPattern(parents, patternKey) {
  return parents.some((parent) => parent?.patternMutation?.type === patternKey);
}

export function rollMutations({ parents = [], mutationBoosted = false } = {}) {
  const boost = mutationBoosted ? 12 : 0;
  const mutations = [];

  ["blindness", "deafness", "clawless", "no_tail", "missing_limb"].forEach((mutation) => {
    const inherited = parentHasMutation(parents, mutation);
    const rollChance = inherited ? 10 + boost : 1.5 + boost / 4;
    if (chance(rollChance)) mutations.push(mutation);
  });

  const mutationDetails = {};
  if (mutations.includes("missing_limb")) {
    mutationDetails.missing_limb = randomFrom(missingLimbs);
  }

  let patternMutation = null;
  const piebaldChance = parentHasPattern(parents, "piebald") ? 18 + boost : 3 + boost / 3;
  const patchesChance = parentHasPattern(parents, "patches") ? 14 + boost : 2 + boost / 4;

  if (chance(piebaldChance)) {
    patternMutation = { type: "piebald", variant: randomFrom(Object.keys(PIEBALD_VARIANTS)) };
  } else if (chance(patchesChance)) {
    patternMutation = { type: "patches", variant: randomFrom(Object.keys(PATCH_VARIANTS)) };
  }

  return { mutations, mutationDetails, patternMutation };
}

export function getMutationSummary(cat) {
  const summaries = (cat?.mutations ?? []).map((mutation) => {
    if (mutation === "missing_limb" && cat?.mutationDetails?.missing_limb) {
      return `${MUTATION_LABELS[mutation]} (${cat.mutationDetails.missing_limb})`;
    }
    return MUTATION_LABELS[mutation] ?? mutation;
  });

  if (cat?.patternMutation?.type === "piebald") {
    summaries.push(PIEBALD_VARIANTS[cat.patternMutation.variant] ?? "Piebald");
  }
  if (cat?.patternMutation?.type === "patches") {
    summaries.push(PATCH_VARIANTS[cat.patternMutation.variant] ?? "Patches");
  }

  return summaries;
}

export function getExpToNextLevel(cat) {
  return (cat?.level ?? 1) * 100;
}

export function gainCatExperience(cat, amount) {
  let exp = (cat.exp ?? 0) + amount;
  let level = cat.level ?? 1;
  let statPoints = cat.statPoints ?? 0;
  let levelsGained = 0;

  while (exp >= level * 100) {
    exp -= level * 100;
    level += 1;
    statPoints += 2;
    levelsGained += 1;
  }

  return {
    cat: { ...cat, exp, level, statPoints },
    levelsGained,
  };
}

export function assignStatPoint(cat, stat) {
  if ((cat.statPoints ?? 0) <= 0) return cat;
  return {
    ...cat,
    [stat]: (cat[stat] ?? 0) + 1,
    statPoints: (cat.statPoints ?? 0) - 1,
  };
}

export function generateRandomCat(rank = "warrior", options = {}) {
  const mutationRoll = rollMutations(options);

  return {
    id: crypto.randomUUID(),
    prefix: randomFrom(PREFIXES),
    suffix: rank === "leader" ? "star" : randomFrom(SUFFIXES),
    gender: randomFrom(["tom", "she-cat"]),
    age_moons: rank === "kit" ? randomBetween(1, 5) : randomBetween(8, 72),
    rank,
    pelt_color: randomFrom(peltColors),
    pelt_pattern: randomFrom(patterns),
    eye_color: randomFrom(eyeColors),
    trait: randomFrom(traits),
    level: 1,
    exp: 0,
    statPoints: 0,
    skill_hunting: randomBetween(1, 8),
    skill_fighting: randomBetween(1, 8),
    skill_healing: rank === "medicine_cat" ? randomBetween(5, 9) : randomBetween(0, 3),
    health: randomBetween(72, 100),
    happiness: randomBetween(62, 100),
    hunger: randomBetween(50, 100),
    status: "healthy",
    is_alive: true,
    mutations: mutationRoll.mutations,
    mutationDetails: mutationRoll.mutationDetails,
    patternMutation: mutationRoll.patternMutation,
    leader_level: rank === "leader" ? 1 : null,
    leader_exp: rank === "leader" ? 0 : null,
  };
}
