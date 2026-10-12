import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyClv1AiAqfBRI6Q_SZIqfstsgHcosRUIL8",
  authDomain: "barokah-laundry-suci.firebaseapp.com",
  projectId: "barokah-laundry-suci",
  storageBucket: "barokah-laundry-suci.firebasestorage.app",
  messagingSenderId: "422339805718",
  appId: "1:422339805718:web:4555e29209f6f0bc15eb37"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
