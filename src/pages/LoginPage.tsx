import { FormEvent, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (session) return <Navigate to="/board" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <div className="login-page">
      <div className="login-copy"><span className="pill">Candidate operations, simplified</span><h1>Move great people forward.</h1><p>A focused ATS for small recruiting teams. Jobs, candidates, pipeline and AI-assisted CV review in one clean workspace.</p><div className="login-stats"><div><strong>5</strong><span>pipeline stages</span></div><div><strong>1</strong><span>shared workspace</span></div><div><strong>AI</strong><span>decision support</span></div></div></div>
      <form className="login-card" onSubmit={submit}>
        <div className="brand login-brand"><div className="brand-mark">N</div><div><strong>Northstar</strong><span>Mini ATS</span></div></div>
        <h2>Welcome back</h2><p>Sign in to manage your candidate pipeline.</p>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
