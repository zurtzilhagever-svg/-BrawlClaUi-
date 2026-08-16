import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  browserSessionPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDym6qa6e8QJ58CTk4y6lqT9PfkD2fcDDc",
  authDomain: "brawlclaui.firebaseapp.com",
  projectId: "brawlclaui",
  storageBucket: "brawlclaui.firebasestorage.app",
  messagingSenderId: "1061589868748",
  appId: "1:1061589868748:web:2d398f61d1b42856a52269"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

function progressRef(user) {
  return doc(db, "users", user.uid);
}

export function currentUser() {
  return auth.currentUser;
}

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signIn() {
  await setPersistence(auth, browserSessionPersistence);
  return signInWithPopup(auth, provider);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function loadProgress(user) {
  if (!user) return null;
  const snapshot = await getDoc(progressRef(user));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveProgress(user, progress) {
  if (!user) return;
  await setDoc(progressRef(user), {
    displayName: user.displayName || "",
    email: user.email || "",
    photoURL: user.photoURL || "",
    ...progress,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
