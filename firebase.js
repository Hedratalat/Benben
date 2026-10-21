// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiVZ7DYhOi-UvDP75cBLF9jdXe5lyuTco",
  authDomain: "benben-4ea8a.firebaseapp.com",
  projectId: "benben-4ea8a",
  storageBucket: "benben-4ea8a.firebasestorage.app",
  messagingSenderId: "821576263225",
  appId: "1:821576263225:web:3672e81e0eeb309e5ccfe8",
  measurementId: "G-T9QS4V5HW3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
