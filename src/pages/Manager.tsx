import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
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
    <div className="rounded-lg border border-purple-300 bg-purple-50 p-4 text-sm dark:border-purple-800 dark:bg-purple-950/30">
      <p className="font-medium">
        {proposal.employees?.code} {proposal.employees?.name} — change{' '}
        <span className="font-mono text-xs">{proposal.field}</span>
      </p>
      {proposal.rationale && <p className="mt-1 text-neutral-600 dark:text-neutral-400">{proposal.rationale}</p>}
      <div className="mt-2 space-y-1 text-xs">
        <p className="text-neutral-500">
          <span className="font-medium">From:</span> {proposal.old_value || '(empty)'}
        </p>
        <p className="text-neutral-700 dark:text-neutral-300">
          <span className="font-medium">To:</span> {proposal.new_value}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => apply.mutate()}
          disabled={apply.isPending || reject.isPending}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {apply.isPending ? 'Applying…' : 'Apply'}
        </button>
        <button
          type="button"
          onClick={() => reject.mutate()}
          disabled={apply.isPending || reject.isPending}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Reject
        </button>
      </div>
      {(apply.isError || reject.isError) && (
        <p className="mt-2 text-xs text-red-600">
          {((apply.error ?? reject.error) as Error).message}
        </p>
      )}
    </div>
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
      <h1 className="text-xl font-semibold">Manager</h1>
      <p className="mt-1 text-sm text-neutral-500">
        M-00 Chief of Staff. Tell it what's working and what isn't across the team — it reads
        the employee's current setup and proposes one specific change for you to approve. It
        never edits anyone's settings on its own.
      </p>

      {proposals.data && proposals.data.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">
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
        <div className="min-h-[200px] space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          {messages.isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
          {messages.data && messages.data.length === 0 && (
            <p className="text-sm text-neutral-500">
              Nothing yet — say something like "Hook Writer's outputs feel too generic, make them
              punchier" and it'll draft a change to review.
            </p>
          )}
          {messages.data?.map((m) => (
            <div
              key={m.id}
              className={`rounded-md p-3 text-sm ${
                m.role === 'user'
                  ? 'ml-8 bg-neutral-100 dark:bg-neutral-900'
                  : 'mr-8 bg-purple-50 dark:bg-purple-950/30'
              }`}
            >
              <p className="mb-1 text-[11px] font-medium text-neutral-500">
                {m.role === 'user' ? 'You' : 'M-00'}
              </p>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {send.isPending && (
            <div className="mr-8 rounded-md bg-purple-50 p-3 text-sm text-neutral-500 dark:bg-purple-950/30">
              M-00 is thinking…
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !send.isPending) send.mutate()
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell the Manager what's working or not…"
            className="flex-1 rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={send.isPending || !input.trim()}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
        {send.isError && <p className="mt-2 text-sm text-red-600">{(send.error as Error).message}</p>}
      </section>
    </div>
  )
}
