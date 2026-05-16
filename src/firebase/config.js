import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD5KidTudwDG7WwcxNsPwfqIdtMawoUyk8",
  authDomain: "multirao-lider.firebaseapp.com",
  projectId: "multirao-lider",
  storageBucket: "multirao-lider.firebasestorage.app",
  messagingSenderId: "587073051662",
  appId: "1:587073051662:web:6dd5c0f8add259a3ccb05f",
  measurementId: "G-RBZZM44SHD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
