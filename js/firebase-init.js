// Firebase SDK imports via gstatic CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Firebase Web SDK Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0Ap2fDkM06hEFqiof8aq_LUhFyUxcINo",
  authDomain: "brasilfusion-10ef2.firebaseapp.com",
  projectId: "brasilfusion-10ef2",
  storageBucket: "brasilfusion-10ef2.firebasestorage.app",
  messagingSenderId: "1051041130570",
  appId: "1:1051041130570:web:c7b37f136121aeee761eb3",
  measurementId: "G-HK0TL90XYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
