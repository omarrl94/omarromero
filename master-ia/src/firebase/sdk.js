// Punto de entrada que esbuild empaqueta e incrusta en index.html: expone a la
// aplicación solo las funciones de Firebase que usa (Authentication y Firestore).
import { initializeApp } from 'firebase/app';
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, setPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification,
  sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider
} from 'firebase/auth';
import {
  initializeFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, onSnapshot, writeBatch
} from 'firebase/firestore';

window.FB = {
  initializeApp,
  getAuth, connectAuthEmulator, onAuthStateChanged, setPersistence, browserSessionPersistence,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification,
  sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider,
  initializeFirestore, connectFirestoreEmulator, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit, onSnapshot, writeBatch
};
