// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgYWlrkSDLaUBtxYXDIQT-T8qzScFIluk",
  authDomain: "wz-case-worker-mentor.firebaseapp.com",
  projectId: "wz-case-worker-mentor",
  storageBucket: "wz-case-worker-mentor.firebasestorage.app",
  messagingSenderId: "338448352008",
  appId: "1:338448352008:web:55fbfffee4810cd105e2bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
