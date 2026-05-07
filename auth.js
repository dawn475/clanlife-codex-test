// js/auth.js

import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Sign up
export async function signUp(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}

// Login
export async function login(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// Logout
export async function logout() {
  return await signOut(auth);
}

// Track user state
export function listenForAuth(callback) {
  onAuthStateChanged(auth, callback);
}
