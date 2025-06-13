// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAs6QDvh28Az1BypFyDP3olAVpR28iM4Eo",
    authDomain: "farmsol-febf1.firebaseapp.com",
    projectId: "farmsol-febf1",
    appId: "1:1089121553987:web:531fb3f9001c9e3b828ef6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
