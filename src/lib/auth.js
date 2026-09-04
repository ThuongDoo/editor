import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db } from './firebase'

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

// Live subscription on `users/{uid}.role` (same shape `signUp` writes below)
// — ported from the sibling `admin` app's identical hook, so a role change
// there takes effect here without the user having to sign in again.
export function useUserRole(uid) {
  const [entry, setEntry] = useState(null) // { uid, role }

  useEffect(() => {
    if (!uid) return undefined
    return onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => setEntry({ uid, role: snapshot.exists() ? (snapshot.data().role ?? null) : null }),
      () => setEntry({ uid, role: null }),
    )
  }, [uid])

  if (!uid) return { role: null, loading: false }
  if (!entry || entry.uid !== uid) return { role: null, loading: true }
  return { role: entry.role, loading: false }
}

export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

// Creates the auth user, writes the matching profile doc to `users/{uid}`,
// and sends the verification email. ProtectedRoute keeps unverified users
// out of the app until they follow the link (see components/ProtectedRoute).
export async function signUp(email, password, name) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await Promise.all([
    updateProfile(user, { displayName: name }),
    setDoc(doc(db, 'users', user.uid), {
      name,
      email: user.email,
      role: 'user',
      createdAt: serverTimestamp(),
    }),
    sendEmailVerification(user),
  ])
  return user
}

export function resendVerificationEmail() {
  return sendEmailVerification(auth.currentUser)
}

// auth.currentUser.emailVerified doesn't update on its own after the user
// clicks the email link — reload() re-fetches the account state from
// Firebase so callers can re-check it.
export async function refreshUser() {
  await auth.currentUser?.reload()
  return auth.currentUser
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

// Firebase requires a recent sign-in for sensitive changes like a password
// update, so re-auth with the current password first (see
// https://firebase.google.com/docs/auth/web/manage-users#re-authenticate).
export async function changePassword(currentPassword, newPassword) {
  const credential = EmailAuthProvider.credential(
    auth.currentUser.email,
    currentPassword,
  )
  await reauthenticateWithCredential(auth.currentUser, credential)
  await updatePassword(auth.currentUser, newPassword)
}

export function signOutUser() {
  return signOut(auth)
}
