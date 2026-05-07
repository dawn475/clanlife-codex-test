export const RANK_ICONS = {
  leader: "C",
  deputy: "D",
  medicine_cat: "+",
  warrior: "W",
  apprentice: "A",
  elder: "E",
  queen: "Q",
  kit: "K",
};

export const MOOD_ICONS = {
  joyful: { icon: ":)", label: "Joyful", color: "text-green-500" },
  content: { icon: ":]", label: "Content", color: "text-primary" },
  neutral: { icon: ":|", label: "Neutral", color: "text-muted-foreground" },
  grumpy: { icon: ":-/", label: "Grumpy", color: "text-yellow-600" },
  miserable: { icon: ":(", label: "Miserable", color: "text-destructive" },
};

export const HUNGER_ICONS = {
  full: { icon: "++", label: "Full", color: "text-green-500" },
  hungry: { icon: "+", label: "Hungry", color: "text-yellow-600" },
  starving: { icon: "!", label: "Starving", color: "text-destructive" },
};

export const TRAIT_ICONS = {
  brave: "B",
  loyal: "L",
  cunning: "C",
  gentle: "G",
  fierce: "F",
  wise: "W",
};

export function getMoodFromHappiness(happiness = 80) {
  if (happiness >= 90) return "joyful";
  if (happiness >= 70) return "content";
  if (happiness >= 45) return "neutral";
  if (happiness >= 25) return "grumpy";
  return "miserable";
}

export function getHungerCategory(hunger = 80) {
  if (hunger >= 65) return "full";
  if (hunger >= 30) return "hungry";
  return "starving";
}

export function getCatIcon(cat) {
  if (cat?.rank === "leader") return "L";
  if (cat?.status === "injured") return "!";
  if (cat?.pelt_pattern === "spotted") return "o";
  if (cat?.pelt_pattern === "tabby") return "=";
  return "*";
}
