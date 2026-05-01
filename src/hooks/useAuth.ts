import { useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
      if (u) await ensureUserDoc(u)
    })
    return unsub
  }, [])

  async function ensureUserDoc(u: User) {
    const ref = doc(db, 'users', u.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        displayName:    u.displayName ?? '受験生',
        email:          u.email,
        examDate:       '2027-01-17',
        universityName: '志望校',
        dailyGoalHours: 6,
        createdAt:      serverTimestamp(),
      })
    }
  }

  const loginWithGoogle     = () => signInWithPopup(auth, googleProvider)
  const loginWithEmail      = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password)
  const registerWithEmail   = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password)
  const logout              = () => signOut(auth)

  return { user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout }
}