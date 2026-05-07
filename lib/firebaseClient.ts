import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// Firebase client config provided by user
const clientConfig = {
  apiKey: "AIzaSyAAcotXAx5uWo_C3ixOEX5zliahdsnbFHo",
  authDomain: "nainiiiprinting.firebaseapp.com",
  projectId: "nainiiiprinting",
  storageBucket: "nainiiiprinting.firebasestorage.app",
  messagingSenderId: "543789808706",
  appId: "1:543789808706:web:18da43e3a1140698ac01db",
  measurementId: "G-YCHYQPPWE7",
}

if (!getApps().length) initializeApp(clientConfig)

export const firebaseAuth = getAuth()

