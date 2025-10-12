// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {initializeAuth, getReactNativePersistence} from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDnDK-lZk4Zm_ddbpinixwurX4T1xDJzyk",
  authDomain: "banbury-martial-arts-center.firebaseapp.com",
  projectId: "banbury-martial-arts-center",
  storageBucket: "banbury-martial-arts-center.firebasestorage.app",
  messagingSenderId: "1062903780310",
  appId: "1:1062903780310:web:0ff5c8b562c1b5a80b8a77",
  measurementId: "G-LR6334Z0N8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { 
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
 });
const db = getFirestore(app);
// Export both auth and db
export { db };