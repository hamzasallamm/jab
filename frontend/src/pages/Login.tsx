import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button, ErrorText, Field, TextInput } from '../components/ui'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post<{ access_token: string }>('/auth/login', { email, password })
      await setToken(res.access_token)
      navigate('/profile')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <h1 className="font-display text-4xl">Log In</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-steel-light">
        No account?{' '}
        <Link to="/signup" className="text-jab">
          Sign up
        </Link>
      </p>
    </div>
  )
}
