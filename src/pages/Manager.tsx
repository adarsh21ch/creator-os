import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Card, Input, PageHeader, Spinner } from '../components/ui/primitives'
import type { ManagerMessage, ManagerProposal } from '../types'

function ProposalCard({ proposal }: { proposal: ManagerProposal }) {
  const qc = useQueryClient()

  const apply = useMutation({
    mutationFn: async () => {
      const value: string | boolean = proposal.field === 'enabled' ? proposal.new_value === 'true' : proposal.new_value
      const { error: updateErr } = await supabase
        .from('employees')
        .update({ [proposal.field]: value })
        .eq('id', proposal.employee_id)
      if (updateErr) throw updateErr
      const { error: statusErr } = await supabase
        .from('manager_proposals')
        .update({ status: 'applied' })
        .eq('id', proposal.id)
      if (statusErr) throw statusErr
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager_proposals'] })
      qc.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const reject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('manager_proposals').update({ status: 'rejected' }).eq('id', proposal.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manager_proposals'] }),
  })

  return (
    <Card className="border-accent-500/25 bg-accent-500/[0.06] p-4">
      <p className="text-sm font-medium text-white">
        {proposal.employees?.code} {proposal.employees?.name} — change{' '}
        <span className="font-mono text-xs text-accent-300">{proposal.field}</span>
      </p>
      {proposal.rationale && <p className="mt-1 text-sm text-white/50">{proposal.rationale}</p>}
      <div className="mt-3 space-y-1 rounded-lg bg-black/20 p-3 text-xs">
        <p className="text-white/40">
          <span className="font-medium text-white/60">From:</span> {proposal.old_value || '(empty)'}
        </p>
        <p className="text-white/70">
          <span className="font-medium text-white/60">To:</span> {proposal.new_value}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="primary" onClick={() => apply.mutate()} disabled={apply.isPending || reject.isPending} className="text-xs">
          {apply.isPending ? 'Applying…' : 'Apply'}
        </Button>
        <Button variant="secondary" onClick={() => reject.mutate()} disabled={apply.isPending || reject.isPending} className="text-xs">
          Reject
        </Button>
      </div>
      {(apply.isError || reject.isError) && (
        <p className="mt-2 text-xs text-red-400">{((apply.error ?? reject.error) as Error).message}</p>
      )}
    </Card>
  )
}

export function ManagerPage() {
  const qc = useQueryClient()
  const [input, setInput] = useState('')

  const messages = useQuery({
    queryKey: ['manager_messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manager_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)
      if (error) throw error
      return data as ManagerMessage[]
    },
  })

  const proposals = useQuery({
    queryKey: ['manager_proposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manager_proposals')
        .select('*, employees(code, name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as ManagerProposal[]
    },
  })

  const send = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('manager-chat', { body: { message: input } })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      setInput('')
      qc.invalidateQueries({ queryKey: ['manager_messages'] })
      qc.invalidateQueries({ queryKey: ['manager_proposals'] })
    },
  })

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Manager"
        description="M-00 Chief of Staff. Tell it what's working and what isn't across the team — it reads the employee's current setup and proposes one specific change for you to approve. It never edits anyone's settings on its own."
      />

      {proposals.data && proposals.data.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-white/50">
            Pending your approval ({proposals.data.length})
          </h2>
          <div className="space-y-3">
            {proposals.data.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <Card className="min-h-[200px] space-y-3 p-4">
          {messages.isLoading && <p className="text-sm text-white/40">Loading…</p>}
          {messages.data && messages.data.length === 0 && (
            <p className="text-sm text-white/40">
              Nothing yet — say something like "Hook Writer's outputs feel too generic, make them
              punchier" and it'll draft a change to review.
            </p>
          )}
          {messages.data?.map((m) => (
            <div
              key={m.id}
              className={`rounded-xl p-3 text-sm ${
                m.role === 'user' ? 'ml-8 bg-white/5' : 'mr-8 bg-accent-500/10'
              }`}
            >
              <p className="mb-1 text-[11px] font-medium text-white/40">
                {m.role === 'user' ? 'You' : 'M-00'}
              </p>
              <p className="whitespace-pre-wrap text-white/85">{m.content}</p>
            </div>
          ))}
          {send.isPending && (
            <div className="mr-8 flex items-center gap-2 rounded-xl bg-accent-500/10 p-3 text-sm text-white/40">
              <Spinner /> M-00 is thinking…
            </div>
          )}
        </Card>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !send.isPending) send.mutate()
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell the Manager what's working or not…"
            className="flex-1"
          />
          <Button type="submit" disabled={send.isPending || !input.trim()}>
            Send
          </Button>
        </form>
        {send.isError && <p className="mt-2 text-sm text-red-400">{(send.error as Error).message}</p>}
      </section>
    </div>
  )
}
