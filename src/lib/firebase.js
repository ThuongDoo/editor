import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Same Firebase project as `template` (see that repo's src/lib/firebase.js) —
// this app is the back office that writes the `websites/{id}.config` docs
// `template` renders read-only.
const firebaseConfig = {
  apiKey: 'AIzaSyBCMeaTVcR3432T-_DGwQ5-AZs96x_aLo4',
  authDomain: 'webtemplate-2a3e3.firebaseapp.com',
  projectId: 'webtemplate-2a3e3',
  storageBucket: 'webtemplate-2a3e3.firebasestorage.app',
  messagingSenderId: '413432032297',
  appId: '1:413432032297:web:bd0514e77dbc75eadac038',
  measurementId: 'G-VDN0BB0E61',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
