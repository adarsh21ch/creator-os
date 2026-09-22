import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Badge, Button, Card, EmptyState, PageHeader } from '../components/ui/primitives'
import type { Idea } from '../types'

const CONFIDENCE_VARIANT = {
  high: 'success',
  medium: 'warning',
  low: 'default',
} as const

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
      <PageHeader
        title="Ideas"
        description="C-01 Topic Planner reads today's outlier posts and headlines and turns them into ranked reel topics — pick one and it goes straight into Studio."
        actions={
          <Button onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? 'Thinking…' : 'Generate ideas'}
          </Button>
        }
      />
      {generate.isError && (
        <p className="mt-2 text-sm text-red-400">{(generate.error as Error).message}</p>
      )}

      {ideas.isLoading && <p className="mt-6 text-sm text-white/40">Loading…</p>}
      {ideas.isError && <p className="mt-6 text-sm text-red-400">{(ideas.error as Error).message}</p>}
      {ideas.data && ideas.data.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="No ideas yet"
            description={'Click "Generate ideas" above once you have outlier posts or news headlines. Check Today first to see if there\'s anything to work with.'}
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {ideas.data?.map((idea) => (
          <Card key={idea.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              {idea.pillar && <span className="text-xs text-white/40">{idea.pillar}</span>}
              {idea.confidence && (
                <Badge variant={CONFIDENCE_VARIANT[idea.confidence]}>{idea.confidence} confidence</Badge>
              )}
            </div>
            <p className="mt-1.5 font-medium text-white">{idea.topic}</p>
            {idea.why_now && <p className="mt-1 text-sm text-white/50">{idea.why_now}</p>}
            {idea.source && <p className="mt-1 text-xs text-white/30">Source: {idea.source}</p>}
            <div className="mt-3 flex gap-2">
              <Button onClick={() => openInStudio(idea)} className="text-xs">
                Use in Studio →
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStatus.mutate({ id: idea.id, status: 'dismissed' })}
                disabled={setStatus.isPending}
                className="text-xs"
              >
                Dismiss
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
