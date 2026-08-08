import { useState } from 'react'
import { api, ApiError } from '../api/client'
import { Button, ErrorText, Field, Select, TextInput } from './ui'
import type { BeltColor, FighterSport, FighterStatus, Sport } from '../types'

const ALL_SPORTS: Sport[] = ['boxing', 'mma', 'bjj']
const ALL_BELTS: BeltColor[] = ['white', 'blue', 'purple', 'brown', 'black']

function RecordEdit({
  w,
  l,
  d,
  onChange,
}: {
  w: number
  l: number
  d: number
  onChange: (w: number, l: number, d: number) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <TextInput type="number" value={w} onChange={(e) => onChange(Number(e.target.value), l, d)} />
      <TextInput type="number" value={l} onChange={(e) => onChange(w, Number(e.target.value), d)} />
      <TextInput type="number" value={d} onChange={(e) => onChange(w, l, Number(e.target.value))} />
    </div>
  )
}

export function FighterSportsSection({
  sports,
  editable = false,
  onChanged,
}: {
  sports: FighterSport[]
  editable?: boolean
  onChanged?: () => void
}) {
  const missingSports = ALL_SPORTS.filter((s) => !sports.some((entry) => entry.sport === s))

  return (
    <div className="mt-6 flex flex-col gap-4">
      {sports.map((entry) =>
        editable ? (
          <EditableSportCard key={entry.id} entry={entry} onChanged={onChanged!} />
        ) : (
          <ReadOnlySportCard key={entry.id} entry={entry} />
        ),
      )}
      {editable && missingSports.length > 0 && <AddSportCard missingSports={missingSports} onChanged={onChanged!} />}
    </div>
  )
}

function ReadOnlySportCard({ entry }: { entry: FighterSport }) {
  return (
    <div className="rounded border border-steel p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg uppercase">{entry.sport}</p>
        <span className="text-xs uppercase tracking-wide text-steel-light">{entry.status}</span>
      </div>
      <p className="text-sm text-steel-light">{entry.gym || 'Unaffiliated'}</p>
      {entry.sport === 'bjj' && entry.belt && (
        <p className="mt-1 text-sm capitalize text-amber">{entry.belt} belt</p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <RecordBlock label="Amateur" w={entry.amateur_wins} l={entry.amateur_losses} d={entry.amateur_draws} />
        <RecordBlock label="Pro" w={entry.pro_wins} l={entry.pro_losses} d={entry.pro_draws} />
      </div>
    </div>
  )
}

function RecordBlock({ label, w, l, d }: { label: string; w: number; l: number; d: number }) {
  return (
    <div className="rounded border border-steel p-2 text-center">
      <p className="text-xs uppercase tracking-wider text-steel-light">{label}</p>
      <p className="font-display text-xl">
        {w}-{l}-{d}
      </p>
    </div>
  )
}

function EditableSportCard({ entry, onChanged }: { entry: FighterSport; onChanged: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(entry)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    setSaving(true)
    try {
      await api.patch(`/profiles/me/fighter/sports/${entry.id}`, {
        gym: form.gym,
        status: form.status,
        belt: entry.sport === 'bjj' ? form.belt : null,
        amateur_wins: Number(form.amateur_wins),
        amateur_losses: Number(form.amateur_losses),
        amateur_draws: Number(form.amateur_draws),
        pro_wins: Number(form.pro_wins),
        pro_losses: Number(form.pro_losses),
        pro_draws: Number(form.pro_draws),
      })
      onChanged()
      setEditing(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setError(null)
    try {
      await api.delete(`/profiles/me/fighter/sports/${entry.id}`)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
  }

  if (!editing) {
    return (
      <div className="rounded border border-steel p-4">
        <ReadOnlySportCard entry={entry} />
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" onClick={() => setEditing(true)} className="px-3 py-1.5 text-sm">
            Edit
          </Button>
          <Button variant="ghost" onClick={remove} className="px-3 py-1.5 text-sm">
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded border border-jab p-4">
      <p className="font-display text-lg uppercase">{entry.sport}</p>
      <div className="mt-3 flex flex-col gap-3">
        <Field label="Gym">
          <TextInput value={form.gym ?? ''} onChange={(e) => setForm({ ...form, gym: e.target.value })} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as FighterStatus })}>
            <option value="amateur">Amateur</option>
            <option value="pro">Pro</option>
          </Select>
        </Field>
        {entry.sport === 'bjj' && (
          <Field label="Belt">
            <Select value={form.belt ?? ''} onChange={(e) => setForm({ ...form, belt: e.target.value as BeltColor })}>
              <option value="">No belt set</option>
              {ALL_BELTS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-steel-light">Amateur W-L-D</label>
            <RecordEdit
              w={form.amateur_wins}
              l={form.amateur_losses}
              d={form.amateur_draws}
              onChange={(w, l, d) => setForm({ ...form, amateur_wins: w, amateur_losses: l, amateur_draws: d })}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-steel-light">Pro W-L-D</label>
            <RecordEdit
              w={form.pro_wins}
              l={form.pro_losses}
              d={form.pro_draws}
              onChange={(w, l, d) => setForm({ ...form, pro_wins: w, pro_losses: l, pro_draws: d })}
            />
          </div>
        </div>
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving} className="px-3 py-1.5 text-sm">
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setForm(entry)
              setEditing(false)
            }}
            className="px-3 py-1.5 text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

function AddSportCard({ missingSports, onChanged }: { missingSports: Sport[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [sport, setSport] = useState<Sport>(missingSports[0])
  const [gym, setGym] = useState('')
  const [status, setStatus] = useState<FighterStatus>('amateur')
  const [belt, setBelt] = useState<BeltColor | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/profiles/me/fighter/sports', {
        sport,
        gym: gym || null,
        status,
        belt: sport === 'bjj' && belt ? belt : null,
      })
      setGym('')
      setBelt('')
      setOpen(false)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        + Add a Sport
      </Button>
    )
  }

  return (
    <div className="rounded border border-steel p-4">
      <p className="font-display text-lg">Add a Sport</p>
      <div className="mt-3 flex flex-col gap-3">
        <Field label="Sport">
          <Select value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
            {missingSports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gym">
          <TextInput value={gym} onChange={(e) => setGym(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as FighterStatus)}>
            <option value="amateur">Amateur</option>
            <option value="pro">Pro</option>
          </Select>
        </Field>
        {sport === 'bjj' && (
          <Field label="Belt (optional)">
            <Select value={belt} onChange={(e) => setBelt(e.target.value as BeltColor)}>
              <option value="">No belt set</option>
              {ALL_BELTS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {error && <ErrorText>{error}</ErrorText>}
        <div className="flex gap-2">
          <Button onClick={submit} disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Sport'}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
