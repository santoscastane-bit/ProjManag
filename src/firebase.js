import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyBCUEeRAMVL0NudJRgmDk9RUd6dtC8QSqw",
    authDomain: "pmo-adeslas-garaje.firebaseapp.com",
    projectId: "pmo-adeslas-garaje",
    storageBucket: "pmo-adeslas-garaje.firebasestorage.app",
    messagingSenderId: "836724439418",
    appId: "1:836724439418:web:24e61d98e6246f9ce07ec3",
    measurementId: "G-DP0G6VZL7C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
