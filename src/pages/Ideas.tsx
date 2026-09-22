import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Idea } from '../types'

const CONFIDENCE_STYLE: Record<string, string> = {
  high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400',
}

export function IdeasPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const ideas = useQuery({
    queryKey: ['ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .eq('status', 'new')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Idea[]
    },
  })

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-ideas', { body: {} })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ideas'] }),
  })

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'used' | 'dismissed' }) => {
      const { error } = await supabase.from('ideas').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ideas'] }),
  })

  function openInStudio(idea: Idea) {
    setStatus.mutate({ id: idea.id, status: 'used' })
    navigate('/studio', { state: { topic: idea.topic } })
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Ideas</h1>
          <p className="mt-1 text-sm text-neutral-500">
            C-01 Topic Planner reads today's outlier posts and headlines and turns them into
            ranked reel topics — pick one and it goes straight into Studio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="shrink-0 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {generate.isPending ? 'Thinking…' : 'Generate ideas'}
        </button>
      </div>
      {generate.isError && (
        <p className="mt-2 text-sm text-red-600">{(generate.error as Error).message}</p>
      )}

      {ideas.isLoading && <p className="mt-6 text-sm text-neutral-500">Loading…</p>}
      {ideas.isError && <p className="mt-6 text-sm text-red-600">{(ideas.error as Error).message}</p>}
      {ideas.data && ideas.data.length === 0 && (
        <p className="mt-6 text-sm text-neutral-500">
          No ideas yet — click "Generate ideas" above once you have outlier posts or news
          headlines. Check Today first to see if there's anything to work with.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {ideas.data?.map((idea) => (
          <div key={idea.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-2">
              {idea.pillar && <span className="text-xs text-neutral-500">{idea.pillar}</span>}
              {idea.confidence && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CONFIDENCE_STYLE[idea.confidence]}`}
                >
                  {idea.confidence} confidence
                </span>
              )}
            </div>
            <p className="mt-1 font-medium">{idea.topic}</p>
            {idea.why_now && (
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{idea.why_now}</p>
            )}
            {idea.source && <p className="mt-1 text-xs text-neutral-500">Source: {idea.source}</p>}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openInStudio(idea)}
                className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              >
                Use in Studio →
              </button>
              <button
                type="button"
                onClick={() => setStatus.mutate({ id: idea.id, status: 'dismissed' })}
                disabled={setStatus.isPending}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
