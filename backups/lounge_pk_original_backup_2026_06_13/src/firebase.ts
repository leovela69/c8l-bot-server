import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDoWO_U1mu1wYF8jBEWKnjmjg27S1vC-Xg",
  authDomain: "gen-lang-client-0744582882.firebaseapp.com",
  projectId: "gen-lang-client-0744582882",
  storageBucket: "gen-lang-client-0744582882.firebasestorage.app",
  messagingSenderId: "216451866663",
  appId: "1:216451866663:web:04936ac4af98ddb25dee02"
};

// Initialize Firebase for SSR compatibility
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
