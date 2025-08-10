// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCofLr9lmikQsOunuMOmRopDS4LuS_ixLo",
  authDomain: "suny-ther-assist.firebaseapp.com",
  projectId: "suny-ther-assist",
  storageBucket: "suny-ther-assist.firebasestorage.app",
  messagingSenderId: "177053061068",
  appId: "1:177053061068:web:b54c447b57937018fed769"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
