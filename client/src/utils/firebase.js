import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase configuration (Replace with your own Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyA85P1FiA7WOmgG2JfiEyiVZKEc9syyyUA",
  authDomain: "codebits3.firebaseapp.com",
  projectId: "codebits3",
  storageBucket: "codebits3.firebasestorage.app",
  messagingSenderId: "672036625542",
  appId: "1:672036625542:web:b776201d4d066a7884c507",
  measurementId: "G-TVMXKZND24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Configure Google provider
provider.setCustomParameters({
  prompt: 'select_account'
});

export { auth, provider, signInWithPopup }; 