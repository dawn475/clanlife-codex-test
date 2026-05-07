# Clanlife

Clanlife is now set up as a Vite + React app using the component code imported from the Base44 test project.

The older vanilla HTML/CSS/JS version has been preserved in `legacy-vanilla/` for reference while the new React app lives in `src/`.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- The Base44 test export was missing its original `src/main.jsx`, pages, and several helper modules, so this merge adds a local runnable app shell.
- The imported Base44 components and entity schemas are kept in the main project.
- Save data uses `localStorage` as a fallback and syncs to Firebase Firestore when a user signs in.
- The active Firebase setup lives in `src/lib/firebase.js` and `src/lib/firebaseGameData.js`.
- Copy `.env.example` to `.env.local` and fill it with the Firebase web app config from the `clanlife` Firebase console project. If no env file is present, the app falls back to the older config found in the legacy app.
- Firestore owner-only user save rules are included in `firestore.rules`; Firebase hosting/rules config is in `firebase.json`.

## Game Systems Added

- Exploration energy bar: patrols cost energy and energy refills over time.
- Nursery queue: litters wait before kits are born.
- Nesting mechanic: expecting queens should be nested before birth; un-nested births can lose kits.
- Giving Tree: kits and apprentices can be moved into the Giving Tree.
- Daily rollover: every 24 hours, all active cats age by 0.5 moons and queued systems are processed.
- Leveling: patrol EXP can level cats and grant stat points for hunting, fighting, or healing.
- Mutations: blindness, deafness, clawless, no tail, missing limb, piebald variants, and dark patch variants can appear randomly or through inheritance.
