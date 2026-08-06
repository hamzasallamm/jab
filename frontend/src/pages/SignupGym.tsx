import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button, ErrorText, Field, TextInput } from '../components/ui'
import type { Sport } from '../types'

const ALL_SPORTS: Sport[] = ['boxing', 'mma', 'bjj']

export function SignupGym() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [sports, setSports] = useState<Sport[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  function toggleSport(sport: Sport) {
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post<{ access_token: string }>('/auth/signup/gym', {
        email,
        password,
        gym: { org_name: orgName, location: location || null, bio: bio || null, sports },
      })
      await setToken(res.access_token)
      navigate('/profile')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md px-4 pb-16">
      <h1 className="font-display text-4xl">Gym / Org Sign Up</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="Org Name">
          <TextInput required value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </Field>
        <Field label="Email">
          <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Location">
          <TextInput value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Austin, TX" />
        </Field>
        <Field label="Sports Offered">
          <div className="flex gap-2">
            {ALL_SPORTS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => toggleSport(s)}
                className={`rounded border px-3 py-1.5 text-sm uppercase tracking-wide ${
                  sports.includes(s) ? 'border-jab-red bg-jab-red/20 text-bone' : 'border-steel text-steel-light'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="rounded border border-steel bg-black/30 px-3 py-2 text-bone placeholder:text-steel-light focus:border-jab-red focus:outline-none"
            placeholder="Short description of your gym"
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-steel-light">
        Already have an account?{' '}
        <Link to="/login" className="text-jab-red">
          Log in
        </Link>
      </p>
    </div>
  )
}
