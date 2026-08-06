import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Button, ErrorText, Field, Select, TextInput } from '../components/ui'
import type { FighterStatus, Sport } from '../types'

export function SignupFighter() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [fightName, setFightName] = useState('')
  const [age, setAge] = useState('')
  const [sport, setSport] = useState<Sport>('mma')
  const [gym, setGym] = useState('')
  const [status, setStatus] = useState<FighterStatus>('amateur')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { setToken } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post<{ access_token: string }>('/auth/signup/fighter', {
        email,
        password,
        fighter: {
          first_name: firstName,
          last_name: lastName,
          fight_name: fightName || null,
          age: Number(age),
          sport,
          gym: gym || null,
          status,
        },
      })
      await setToken(res.access_token)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-md px-4 pb-16">
      <h1 className="font-display text-4xl">Fighter Sign Up</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Field label="First Name">
          <TextInput required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Last Name">
          <TextInput required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
        <Field label="Fight Name (optional)">
          <TextInput
            value={fightName}
            onChange={(e) => setFightName(e.target.value)}
            placeholder={'e.g. "The Notorious"'}
          />
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
        <Field label="Age">
          <TextInput type="number" required min={0} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
        </Field>
        <Field label="Sport">
          <Select value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
            <option value="boxing">Boxing</option>
            <option value="mma">MMA</option>
            <option value="bjj">BJJ</option>
          </Select>
        </Field>
        <Field label="Gym">
          <TextInput value={gym} onChange={(e) => setGym(e.target.value)} placeholder="e.g. Jackson Wink MMA" />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as FighterStatus)}>
            <option value="amateur">Amateur</option>
            <option value="pro">Pro</option>
          </Select>
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-steel-light">
        Already have an account?{' '}
        <Link to="/login" className="text-jab">
          Log in
        </Link>
      </p>
    </div>
  )
}
