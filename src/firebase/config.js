// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBk3EHEM_TVpDuxHgjBDpfVR5Ho5CmXGMo",
  authDomain: "mycotrack-e7f8d.firebaseapp.com",
  projectId: "mycotrack-e7f8d",
  storageBucket: "mycotrack-e7f8d.firebasestorage.app",
  messagingSenderId: "746383075812",
  appId: "1:746383075812:web:df232a0902a791d0e6bff1"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
const db = getFirestore(app);

// Exportamos la base de datos para usarla en otros archivos
export { db };
