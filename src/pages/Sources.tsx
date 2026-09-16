import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Source } from '../types'

export function SourcesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'rss' | 'newspaper' | 'other'>('rss')

  const { data: sources, isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Source[]
    },
  })

  const addSource = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('sources').insert({ name, url, type })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sources'] })
      setName('')
      setUrl('')
    },
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Sources</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Newspapers and RSS feeds the News Desk Analyst reads nightly, kept to what is relevant to
        his niche.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim() && url.trim()) addSource.mutate()
        }}
        className="mt-6 space-y-2"
      >
        <div className="flex gap-2">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'rss' | 'newspaper' | 'other')}
            className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="rss">RSS</option>
            <option value="newspaper">Newspaper</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={addSource.isPending}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      {isLoading && <p className="mt-4 text-sm text-neutral-500">Loading…</p>}
      {sources && sources.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">No sources yet.</p>
      )}
      {sources && sources.length > 0 && (
        <ul className="mt-6 divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-neutral-500">{s.url}</div>
              </div>
              <span className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500 dark:bg-neutral-900">
                {s.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
