import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reel } from '../types'

const PILLARS = ['Politics', 'Current Affairs', 'Incidents', 'Reservation', 'Business Politics']

const emptyForm = {
  posted_at: '',
  transcript: '',
  caption: '',
  pillar: '',
  hook_type: '',
  length_seconds: '',
  is_organic: true,
  views: '',
  likes: '',
  comments: '',
  shares: '',
  saves: '',
  profile_visits: '',
  follows: '',
  notes: '',
}

function toIntOrNull(v: string) {
  return v.trim() === '' ? null : Number.parseInt(v, 10)
}

export function LibraryPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)

  const { data: reels, isLoading } = useQuery({
    queryKey: ['reels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Reel[]
    },
  })

  const addReel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('reels').insert({
        posted_at: form.posted_at || null,
        transcript: form.transcript,
        caption: form.caption || null,
        pillar: form.pillar || null,
        hook_type: form.hook_type || null,
        length_seconds: toIntOrNull(form.length_seconds),
        is_organic: form.is_organic,
        views: toIntOrNull(form.views),
        likes: toIntOrNull(form.likes),
        comments: toIntOrNull(form.comments),
        shares: toIntOrNull(form.shares),
        saves: toIntOrNull(form.saves),
        profile_visits: toIntOrNull(form.profile_visits),
        follows: toIntOrNull(form.follows),
        notes: form.notes || null,
        source: 'voice_training',
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reels'] })
      setForm(emptyForm)
      setOpen(false)
    },
  })

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Library</h1>
          <p className="mt-1 text-sm text-neutral-500">
            The foundation table. Every reel he has posted — transcript and metrics together. This
            is also the Voice Training intake: paste past reels here to build the voice profile and
            give the Pattern Analyst labelled examples.
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          {open ? 'Close' : '+ Add reel'}
        </button>
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            addReel.mutate()
          }}
          className="mb-8 space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <textarea
            required
            placeholder="Transcript — paste the full reel transcript"
            value={form.transcript}
            onChange={(e) => setForm({ ...form, transcript: e.target.value })}
            rows={5}
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input
              type="date"
              value={form.posted_at}
              onChange={(e) => setForm({ ...form, posted_at: e.target.value })}
              className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <select
              value={form.pillar}
              onChange={(e) => setForm({ ...form, pillar: e.target.value })}
              className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">Pillar</option>
              {PILLARS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              placeholder="Hook type"
              value={form.hook_type}
              onChange={(e) => setForm({ ...form, hook_type: e.target.value })}
              className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              placeholder="Length (sec)"
              value={form.length_seconds}
              onChange={(e) => setForm({ ...form, length_seconds: e.target.value })}
              className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {(['views', 'likes', 'comments', 'shares', 'saves', 'profile_visits', 'follows'] as const).map(
              (field) => (
                <input
                  key={field}
                  type="number"
                  placeholder={field.replace('_', ' ')}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              ),
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <input
              type="checkbox"
              checked={form.is_organic}
              onChange={(e) => setForm({ ...form, is_organic: e.target.checked })}
            />
            Organic (uncheck if this was a paid promotion — promoted reels confound teardowns)
          </label>
          <input
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={addReel.isPending}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {addReel.isPending ? 'Saving…' : 'Save reel'}
          </button>
          {addReel.isError && (
            <p className="text-sm text-red-600">{(addReel.error as Error).message}</p>
          )}
        </form>
      )}

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {!isLoading && reels && reels.length === 0 && (
        <p className="text-sm text-neutral-500">No reels yet. Add the first one above.</p>
      )}
      {reels && reels.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Pillar</th>
                <th className="p-2">Views</th>
                <th className="p-2">Follows</th>
                <th className="p-2">Saves</th>
                <th className="p-2">Organic</th>
              </tr>
            </thead>
            <tbody>
              {reels.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="p-2">{r.posted_at ?? '—'}</td>
                  <td className="p-2">{r.pillar ?? '—'}</td>
                  <td className="p-2">{r.views ?? '—'}</td>
                  <td className="p-2">{r.follows ?? '—'}</td>
                  <td className="p-2">{r.saves ?? '—'}</td>
                  <td className="p-2">{r.is_organic ? 'Yes' : 'Paid'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
