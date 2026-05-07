// js/setup.js

import { saveUserData } from "./database.js";

export async function createStarterData(userId) {
  const data = {
    clan: [],
    inventory: {
      prey: [],
      herbs: [],
      items: []
    },
    currency: {
      coins: 100,
      gems: 5
    },
    createdAt: Date.now()
  };

  await saveUserData(userId, data);
}
