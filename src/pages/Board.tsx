import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { StudioSession } from '../types'

const STAGES: { key: StudioSession['production_status']; label: string }[] = [
  { key: 'scripted', label: 'Scripted' },
  { key: 'shooting', label: 'Shooting' },
  { key: 'editing', label: 'Editing' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'posted', label: 'Posted' },
]

export function BoardPage() {
  const qc = useQueryClient()

  const sessions = useQuery({
    queryKey: ['board_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_sessions')
        .select('*')
        .not('script_text', 'is', null)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as StudioSession[]
    },
  })

  const move = useMutation({
    mutationFn: async ({ id, production_status }: { id: string; production_status: StudioSession['production_status'] }) => {
      const { error } = await supabase.from('studio_sessions').update({ production_status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board_sessions'] }),
  })

  return (
    <div>
      <h1 className="text-xl font-semibold">Board</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Every scripted reel from Studio, tracked from script to posted. AI can't edit video —
        this is a simple hand-moved tracker for you and your editor, not an automated desk.
      </p>

      {sessions.isLoading && <p className="mt-6 text-sm text-neutral-500">Loading…</p>}
      {sessions.isError && (
        <p className="mt-6 text-sm text-red-600">{(sessions.error as Error).message}</p>
      )}
      {sessions.data && sessions.data.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          Nothing here yet — a card shows up once you've generated a script in Studio.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAGES.map((stage, idx) => (
          <div key={stage.key} className="min-w-0">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {stage.label}
            </h2>
            <div className="space-y-2">
              {sessions.data
                ?.filter((s) => (s.production_status ?? 'scripted') === stage.key)
                .map((s) => (
                  <div
                    key={s.id}
                    className="rounded-md border border-neutral-200 p-3 text-xs dark:border-neutral-800"
                  >
                    <p className="truncate font-medium">{s.topic}</p>
                    <p className="mt-1 text-neutral-500">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </p>
                    {s.reel_id && (
                      <p className="mt-1 text-green-700 dark:text-green-400">✓ linked to Library</p>
                    )}
                    <div className="mt-2 flex gap-1">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            move.mutate({ id: s.id, production_status: STAGES[idx - 1].key })
                          }
                          disabled={move.isPending}
                          className="rounded border border-neutral-300 px-1.5 py-0.5 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                        >
                          ← back
                        </button>
                      )}
                      {idx < STAGES.length - 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            move.mutate({ id: s.id, production_status: STAGES[idx + 1].key })
                          }
                          disabled={move.isPending}
                          className="rounded bg-purple-600 px-1.5 py-0.5 text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                          next →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
