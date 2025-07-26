
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    projectId: "envoearn",
    appId: "1:638839749104:web:23fe78043161e2d7794535",
    storageBucket: "envoearn.firebasestorage.app",
    apiKey: "AIzaSyCNoYrIjkWZtpy0p7r1duNpBUGeJ1CMjfw",
    authDomain: "envoearn.firebaseapp.com",
    messagingSenderId: "638839749104",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };
