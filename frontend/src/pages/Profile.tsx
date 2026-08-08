import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import { Button, ErrorText, Field, TextInput } from '../components/ui'
import { FighterAvatar, fighterDisplayName } from '../components/FighterIdentity'
import { FighterSportsSection } from '../components/FighterSportsSection'
import { SocialCounts } from '../components/SocialCounts'
import { PostCard } from '../components/PostCard'
import type { FighterProfile, GymProfile, PostItem, Sport } from '../types'

export function Profile() {
  const { me, refreshMe } = useAuth()

  if (!me) return null

  return (
    <div className="mx-auto mt-12 max-w-lg px-4 pb-16">
      {me.account_type === 'fighter' && me.fighter_profile && (
        <FighterProfileCard profile={me.fighter_profile} userId={me.id} onSaved={refreshMe} />
      )}
      {me.account_type === 'gym' && me.gym_profile && <GymProfileCard profile={me.gym_profile} onSaved={refreshMe} />}
    </div>
  )
}

function FighterProfileCard({
  profile,
  userId,
  onSaved,
}: {
  profile: FighterProfile
  userId: number
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setForm(profile), [profile])

  async function save() {
    setSaving(true)
    try {
      await api.patch('/profiles/me/fighter', {
        first_name: form.first_name,
        last_name: form.last_name,
        fight_name: form.fight_name || null,
        bio: form.bio || null,
        age: Number(form.age),
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
      const data = new FormData()
      data.append('file', file)
      await api.postForm('/profiles/me/fighter/photo', data)
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
            <p className="mt-1 text-steel-light text-sm">Age {profile.age}</p>
          </div>
        </div>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>}
        <SocialCounts
          followerCount={profile.follower_count}
          followingCount={profile.following_count}
          connectionCount={profile.connection_count}
        />
        <Button variant="ghost" onClick={() => setEditing(true)} className="mt-6">
          Edit Profile
        </Button>

        <h2 className="font-display mt-10 text-2xl">Sports</h2>
        <FighterSportsSection sports={profile.sports} editable onChanged={onSaved} />

        <h2 className="font-display mt-10 text-2xl">Posts</h2>
        <MyPosts userId={userId} />
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
      <Field label="Bio">
        <textarea
          value={form.bio ?? ''}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          rows={4}
          placeholder="Tell people about yourself"
          className="rounded border border-steel bg-surface px-3 py-2 text-bone placeholder:text-steel-light focus:border-jab focus:outline-none"
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

function MyPosts({ userId }: { userId: number }) {
  const [posts, setPosts] = useState<PostItem[] | null>(null)

  useEffect(() => {
    api.get<PostItem[]>(`/posts/by-user/${userId}`).then(setPosts)
  }, [userId])

  if (posts === null) return <p className="mt-4 text-steel-light">Loading...</p>
  if (posts.length === 0) return <p className="mt-4 text-steel-light">No posts yet.</p>

  return (
    <div className="mt-4 flex flex-col gap-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
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
        <SocialCounts followerCount={profile.follower_count} followingCount={profile.following_count} />
        <Button variant="ghost" onClick={() => setEditing(true)} className="mt-6">
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
