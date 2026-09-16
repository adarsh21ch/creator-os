import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WatchlistAccount } from '../types'

export function WatchlistPage() {
  const qc = useQueryClient()
  const [handle, setHandle] = useState('')
  const [wing, setWing] = useState<'right' | 'left' | 'neutral'>('neutral')

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist_accounts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as WatchlistAccount[]
    },
  })

  const addAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('watchlist_accounts')
        .insert({ handle: handle.replace(/^@/, ''), wing })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      setHandle('')
    },
  })

  const toggleActive = useMutation({
    mutationFn: async (acc: WatchlistAccount) => {
      const { error } = await supabase
        .from('watchlist_accounts')
        .update({ active: !acc.active })
        .eq('id', acc.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Watchlist</h1>
      <p className="mt-1 text-sm text-neutral-500">
        40 accounts, tagged right / left / neutral. The Influencer Watch desk logs every new post
        against this list — outliers are ~3× that account's own 30-day median, never an absolute
        threshold.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (handle.trim()) addAccount.mutate()
        }}
        className="mt-6 flex gap-2"
      >
        <input
          placeholder="@handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <select
          value={wing}
          onChange={(e) => setWing(e.target.value as 'right' | 'left' | 'neutral')}
          className="rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="right">Right</option>
          <option value="left">Left</option>
          <option value="neutral">Neutral</option>
        </select>
        <button
          type="submit"
          disabled={addAccount.isPending}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {isLoading && <p className="mt-4 text-sm text-neutral-500">Loading…</p>}
      {accounts && accounts.length === 0 && (
        <p className="mt-4 text-sm text-neutral-500">No accounts yet.</p>
      )}
      {accounts && accounts.length > 0 && (
        <ul className="mt-6 divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {accounts.map((acc) => (
            <li key={acc.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <span className="font-medium">@{acc.handle}</span>{' '}
                <span className="text-xs text-neutral-500">{acc.wing}</span>
              </div>
              <button
                onClick={() => toggleActive.mutate(acc)}
                className={`rounded px-2 py-1 text-xs ${
                  acc.active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-900'
                }`}
              >
                {acc.active ? 'Active' : 'Paused'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
