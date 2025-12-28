
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Note: In a real production environment, these should be in environment variables.
// For the purpose of this hackathon-ready demo, we assume the Firebase project is configured.
const firebaseConfig = {
  apiKey: "AIzaSy_demo_key",
  authDomain: "acadpulse-demo.firebaseapp.com",
  projectId: "acadpulse-demo",
  storageBucket: "acadpulse-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
