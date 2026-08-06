import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Button, ErrorText, Field, Select, TextInput } from '../components/ui'
import { FighterAvatar, fighterDisplayName } from '../components/FighterIdentity'
import type { FighterProfile, GymProfile, Sport } from '../types'

export function Profile() {
  const { me, refreshMe } = useAuth()

  if (!me) return null

  return (
    <div className="mx-auto mt-12 max-w-lg px-4 pb-16">
      {me.account_type === 'fighter' && me.fighter_profile && (
        <FighterProfileCard profile={me.fighter_profile} onSaved={refreshMe} />
      )}
      {me.account_type === 'gym' && me.gym_profile && <GymProfileCard profile={me.gym_profile} onSaved={refreshMe} />}
    </div>
  )
}

function FighterProfileCard({ profile, onSaved }: { profile: FighterProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function save() {
    setSaving(true)
    try {
      await api.patch('/profiles/me/fighter', {
        first_name: form.first_name,
        last_name: form.last_name,
        fight_name: form.fight_name || null,
        age: Number(form.age),
        sport: form.sport,
        gym: form.gym,
        status: form.status,
        amateur_wins: Number(form.amateur_wins),
        amateur_losses: Number(form.amateur_losses),
        amateur_draws: Number(form.amateur_draws),
        pro_wins: Number(form.pro_wins),
        pro_losses: Number(form.pro_losses),
        pro_draws: Number(form.pro_draws),
      })
      await onSaved()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)
    setUploadingPhoto(true)
    try {
      await api.postForm('/profiles/me/fighter/photo', (() => {
        const data = new FormData()
        data.append('file', file)
        return data
      })())
      await onSaved()
    } catch {
      setPhotoError('Could not upload photo. Use a JPEG, PNG, or WebP under 5MB.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  if (!editing) {
    return (
      <div>
        <div className="flex items-center gap-5">
          <FighterAvatar profile={profile} />
          <div>
            <h1 className="font-display text-4xl">{fighterDisplayName(profile)}</h1>
            <p className="mt-1 text-steel-light uppercase tracking-wide text-sm">
              {profile.sport} · {profile.status} · {profile.gym || 'Unaffiliated'} · Age {profile.age}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <RecordBlock label="Amateur" w={profile.amateur_wins} l={profile.amateur_losses} d={profile.amateur_draws} />
          <RecordBlock label="Pro" w={profile.pro_wins} l={profile.pro_losses} d={profile.pro_draws} />
        </div>
        <Button variant="ghost" onClick={() => setEditing(true)} className="mt-8">
          Edit Profile
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl">Edit Profile</h1>
      <div className="flex items-center gap-5">
        <FighterAvatar profile={profile} />
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoSelected}
          />
          <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
            {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
          </Button>
          {photoError && <ErrorText>{photoError}</ErrorText>}
        </div>
      </div>
      <Field label="First Name">
        <TextInput value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
      </Field>
      <Field label="Last Name">
        <TextInput value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
      </Field>
      <Field label="Fight Name (optional)">
        <TextInput
          value={form.fight_name ?? ''}
          onChange={(e) => setForm({ ...form, fight_name: e.target.value })}
          placeholder={'e.g. "The Notorious"'}
        />
      </Field>
      <Field label="Age">
        <TextInput
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
        />
      </Field>
      <Field label="Sport">
        <Select value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value as Sport })}>
          <option value="boxing">Boxing</option>
          <option value="mma">MMA</option>
          <option value="bjj">BJJ</option>
        </Select>
      </Field>
      <Field label="Gym">
        <TextInput value={form.gym ?? ''} onChange={(e) => setForm({ ...form, gym: e.target.value })} />
      </Field>
      <Field label="Status">
        <Select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as 'pro' | 'amateur' })}
        >
          <option value="amateur">Amateur</option>
          <option value="pro">Pro</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <RecordEdit
          label="Amateur"
          w={form.amateur_wins}
          l={form.amateur_losses}
          d={form.amateur_draws}
          onChange={(w, l, d) => setForm({ ...form, amateur_wins: w, amateur_losses: l, amateur_draws: d })}
        />
        <RecordEdit
          label="Pro"
          w={form.pro_wins}
          l={form.pro_losses}
          d={form.pro_draws}
          onChange={(w, l, d) => setForm({ ...form, pro_wins: w, pro_losses: l, pro_draws: d })}
        />
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setForm(profile)
            setEditing(false)
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

function RecordBlock({ label, w, l, d }: { label: string; w: number; l: number; d: number }) {
  return (
    <div className="rounded border border-steel p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-steel-light">{label}</p>
      <p className="font-display text-3xl mt-1">
        {w}-{l}-{d}
      </p>
    </div>
  )
}

function RecordEdit({
  label,
  w,
  l,
  d,
  onChange,
}: {
  label: string
  w: number
  l: number
  d: number
  onChange: (w: number, l: number, d: number) => void
}) {
  return (
    <div className="rounded border border-steel p-3">
      <p className="text-xs uppercase tracking-wider text-steel-light mb-2">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <TextInput type="number" value={w} onChange={(e) => onChange(Number(e.target.value), l, d)} />
        <TextInput type="number" value={l} onChange={(e) => onChange(w, Number(e.target.value), d)} />
        <TextInput type="number" value={d} onChange={(e) => onChange(w, l, Number(e.target.value))} />
      </div>
    </div>
  )
}

function GymProfileCard({ profile, onSaved }: { profile: GymProfile; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)
  const allSports: Sport[] = ['boxing', 'mma', 'bjj']

  async function save() {
    setSaving(true)
    try {
      await api.patch('/profiles/me/gym', {
        org_name: form.org_name,
        location: form.location,
        bio: form.bio,
        sports: form.sports,
      })
      await onSaved()
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div>
        <h1 className="font-display text-4xl">{profile.org_name}</h1>
        <p className="mt-1 text-steel-light uppercase tracking-wide text-sm">
          {profile.location || 'Location not set'} · {profile.sports.join(', ') || 'No sports listed'}
        </p>
        {profile.bio && <p className="mt-4">{profile.bio}</p>}
        <Button variant="ghost" onClick={() => setEditing(true)} className="mt-8">
          Edit Profile
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl">Edit Profile</h1>
      <Field label="Org Name">
        <TextInput value={form.org_name} onChange={(e) => setForm({ ...form, org_name: e.target.value })} />
      </Field>
      <Field label="Location">
        <TextInput value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </Field>
      <Field label="Sports Offered">
        <div className="flex gap-2">
          {allSports.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() =>
                setForm({
                  ...form,
                  sports: form.sports.includes(s) ? form.sports.filter((x) => x !== s) : [...form.sports, s],
                })
              }
              className={`rounded border px-3 py-1.5 text-sm uppercase tracking-wide ${
                form.sports.includes(s) ? 'border-jab bg-jab/20 text-bone' : 'border-steel text-steel-light'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Bio">
        <textarea
          value={form.bio ?? ''}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          className="rounded border border-steel bg-surface px-3 py-2 text-bone focus:border-jab focus:outline-none"
        />
      </Field>
      <div className="mt-4 flex gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setForm(profile)
            setEditing(false)
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
