// js/database.js

import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Save full user data
export async function saveUserData(userId, data) {
  await setDoc(doc(db, "users", userId), data);
}

// Load user data
export async function loadUserData(userId) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  return snap.exists() ? snap.data() : null;
}

// Update partial data
export async function updateUserData(userId, newData) {
  await updateDoc(doc(db, "users", userId), newData);
}
