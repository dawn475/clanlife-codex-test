import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase";

export function listenForGameUser(callback) {
  if (!firebaseReady || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function registerGameUser(email, password) {
  if (!auth) throw new Error("Firebase is not configured.");
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginGameUser(email, password) {
  if (!auth) throw new Error("Firebase is not configured.");
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutGameUser() {
  if (!auth) return;
  return signOut(auth);
}

export async function loadRemoteGameState(userId) {
  if (!db || !userId) return null;
  const snapshot = await getDoc(doc(db, "users", userId));
  if (!snapshot.exists()) return null;
  return snapshot.data()?.gameState ?? null;
}

export async function saveRemoteGameState(userId, gameState) {
  if (!db || !userId) return;
  await setDoc(
    doc(db, "users", userId),
    {
      gameState: removeUndefined(gameState),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function removeUndefined(value) {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, removeUndefined(entryValue)])
    );
  }
  return value;
}
