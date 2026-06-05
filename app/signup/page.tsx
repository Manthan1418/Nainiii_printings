"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '../../lib/firebaseClient'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const userCred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      const idToken = await userCred.user.getIdToken()
      const res = await fetch('/api/auth/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) })
      if (res.ok) router.push('/dashboard')
      else alert('Signup succeeded but session failed')
    } catch (err: any) {
      // Avoid console.error to prevent Next.js dev overlay; set user-friendly message instead
      const code = err?.code || ''
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in or use a different email.')
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email address.')
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Choose a stronger password.')
      } else {
        setError(err?.message || 'Signup failed')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Admin Account</h2>
        <label className="block">Email
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 mt-1 rounded border" />
        </label>
        <label className="block mt-3">Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 mt-1 rounded border" />
        </label>
        <div className="mt-4">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded w-full" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </form>
    </div>
  )
}
