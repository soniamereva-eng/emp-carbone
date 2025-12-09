import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()

    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: import.meta.env.VITE_SITE_URL
      }
    })
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="email@exemple.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit">Se connecter</button>
    </form>
  )
}
