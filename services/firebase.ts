
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Live configuration provided by user
const firebaseConfig = {
  apiKey: "AIzaSyC99-9BwaZ9aPJgFiLeeD3UU8XEoFMGodA",
  authDomain: "gen-lang-client-0742583847.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0742583847-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gen-lang-client-0742583847",
  storageBucket: "gen-lang-client-0742583847.firebasestorage.app",
  messagingSenderId: "301938695654",
  appId: "1:301938695654:web:dea9534c8338e87729ca27"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
