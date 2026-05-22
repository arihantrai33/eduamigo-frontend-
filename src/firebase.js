import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAUoCNEm7ESDOkwKXZOnll7gxnAHap3BYo",
  authDomain: "eduamigo-375c7.firebaseapp.com",
  databaseURL: "https://eduamigo-375c7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "eduamigo-375c7",
  storageBucket: "eduamigo-375c7.firebasestorage.app",
  messagingSenderId: "445929377114",
  appId: "1:445929377114:web:7a40c7a4d21d03c0eb3763"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);         // Realtime DB — bus tracking ke liye
export const firestore = getFirestore(app); // Firestore — students, teachers, fee etc.
export const auth = getAuth(app);           // Authentication