// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ⚙️ Config do teu projeto (unikorapp) — igual ao arquivo que você enviou
export const firebaseConfig = {
  apiKey: "AIzaSyC12s4PvUWtNxOlShPc7zXlzq4XWqlVo2w",
  authDomain: "unikorapp.firebaseapp.com",
  projectId: "unikorapp",
  storageBucket: "unikorapp.appspot.com",
  messagingSenderId: "329806123621",
  appId: "1:329806123621:web:9aeff2f5947cd106cf2c8c",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 🔐 garante user para regras do Firestore
export const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) resolve(user);
    else signInAnonymously(auth).catch((e) => {
      console.warn("Anon auth falhou:", e?.message || e);
      resolve(null);
    });
  });
});

export const db = getFirestore(app);

// 🌐 cache offline (não quebra se não suportar)
try { await enableIndexedDbPersistence(db); } catch (_) {}
