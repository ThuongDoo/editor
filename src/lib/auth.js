import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth } from './firebase'

// Mirrors the { data, loading, error }-shaped hooks used for Firestore reads
// elsewhere in this app (see lib/websites.js, lib/templates.js) and in
// `template`'s useWebsiteConfig.
export function useAuthUser() {
  const [user, setUser] = useState(auth.currentUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOutUser() {
  return signOut(auth)
}
