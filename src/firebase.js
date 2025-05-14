import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDrtldf0BzVsa1gvphbpooxS--xhHsz7Uk",
    authDomain: "galfdesign.firebaseapp.com",
    projectId: "galfdesign",
    storageBucket: "galfdesign.firebasestorage.app",
    messagingSenderId: "24716676100",
    appId: "1:24716676100:web:8de2c20e352a249396b951"
  };

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const auth = getAuth(app);
