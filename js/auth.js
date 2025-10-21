// js/auth.js – utilitários de login/logout se precisar
import { auth } from "./firebase.js";
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export async function doLogout(){ return signOut(auth); }

export async function waitForUser(){
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve)=> onAuthStateChanged(auth, u=> resolve(u||null)));
}
