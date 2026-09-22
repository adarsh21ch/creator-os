import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, Card, Input, PageHeader, Select, Textarea } from '../components/ui/primitives'
import type { Employee } from '../types'

const DESK_LABEL: Record<Employee['desk'], string> = {
  manager: 'Manager',
  intelligence: 'Intelligence',
  creative: 'Creative',
  production: 'Production',
  performance: 'Performance',
}

const DESK_ORDER: Employee['desk'][] = ['manager', 'intelligence', 'creative', 'production', 'performance']

function EmployeeRow({ employee }: { employee: Employee }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: employee.name,
    prompt: employee.prompt ?? '',
    provider: employee.provider,
    model: employee.model ?? '',
    schedule: employee.schedule ?? '',
  })

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('employees')
        .update({
          name: form.name,
          prompt: form.prompt || null,
          provider: form.provider,
          model: form.model || null,
          schedule: form.schedule || null,
        })
        .eq('id', employee.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      setEditing(false)
    },
  })

  const toggleEnabled = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('employees')
        .update({ enabled: !employee.enabled })
        .eq('id', employee.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-white/30">{employee.code}</span>{' '}
          <span className="font-medium text-white">{employee.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-white/40">
            {employee.provider}
            {employee.model ? ` · ${employee.model}` : ''}
          </span>
          <button
            type="button"
            onClick={() => toggleEnabled.mutate()}
            disabled={toggleEnabled.isPending}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium disabled:opacity-50 ${
              employee.enabled
                ? 'border border-emerald-500/25 bg-emerald-500/15 text-emerald-300'
                : 'border border-white/10 bg-white/5 text-white/40'
            }`}
          >
            {employee.enabled ? 'Enabled' : 'Disabled'}
          </button>
          <Button variant="secondary" onClick={() => setEditing((v) => !v)} className="px-2 py-1 text-[11px]">
            {editing ? 'Close' : 'Edit'}
          </Button>
        </div>
      </div>

      {!editing && employee.prompt && (
        <p className="mt-2 line-clamp-2 text-xs text-white/40">{employee.prompt}</p>
      )}
      {!editing && employee.schedule && (
        <p className="mt-1 text-xs text-white/25">cron: {employee.schedule}</p>
      )}

      {editing && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save.mutate()
          }}
          className="mt-3 space-y-2"
        >
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <Textarea
            value={form.prompt}
            onChange={(e) => setForm({ ...form, prompt: e.target.value })}
            rows={4}
            placeholder="Prompt / instructions"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as 'anthropic' | 'gemini' })}
            >
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Gemini</option>
            </Select>
            <Input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              placeholder="Model override"
            />
            <Input
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="cron schedule"
            />
          </div>
          <Button type="submit" disabled={save.isPending} className="text-xs">
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
          {save.isError && <p className="text-xs text-red-400">{(save.error as Error).message}</p>}
        </form>
      )}
    </Card>
  )
}

export function EmployeesPage() {
  const qc = useQueryClient()
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesk, setNewDesk] = useState<Employee['desk']>('creative')

  const employees = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').order('code')
      if (error) throw error
      return data as Employee[]
    },
  })

  const addEmployee = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('employees').insert({
        code: newCode.trim(),
        name: newName.trim(),
        desk: newDesk,
        provider: 'anthropic',
        enabled: false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      setNewCode('')
      setNewName('')
    },
  })

  const grouped = DESK_ORDER.map((desk) => ({
    desk,
    items: employees.data?.filter((e) => e.desk === desk) ?? [],
  })).filter((g) => g.items.length > 0)

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Employees"
        description={
          <>
            The AI staff, one row each — not code files. Change a prompt, model, or schedule here
            and it takes effect immediately, no deploy needed.{' '}
            <Badge variant="success" className="align-middle">
              Enabled
            </Badge>{' '}
            means the desk actually has a working call behind it right now; disabled ones are
            staffed but not built yet.
          </>
        }
      />

      {employees.isLoading && <p className="mt-6 text-sm text-white/40">Loading…</p>}
      {employees.isError && (
        <p className="mt-6 text-sm text-red-400">{(employees.error as Error).message}</p>
      )}
      {employees.data && employees.data.length === 0 && (
        <p className="mt-6 text-sm text-white/40">
          No employees yet — run migration 0010 in the SQL Editor to hire the initial 14.
        </p>
      )}

      <div className="mt-6 space-y-8">
        {grouped.map((g) => (
          <section key={g.desk}>
            <h2 className="mb-2 text-sm font-semibold text-white/50">{DESK_LABEL[g.desk]}</h2>
            <div className="space-y-2">
              {g.items.map((e) => (
                <EmployeeRow key={e.id} employee={e} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (newCode.trim() && newName.trim()) addEmployee.mutate()
        }}
        className="mt-10 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border-subtle p-4"
      >
        <Input
          placeholder="Code (e.g. C-05)"
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          className="w-32"
        />
        <Input
          placeholder="Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="min-w-[10rem] flex-1"
        />
        <Select value={newDesk} onChange={(e) => setNewDesk(e.target.value as Employee['desk'])}>
          {DESK_ORDER.map((d) => (
            <option key={d} value={d}>
              {DESK_LABEL[d]}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={addEmployee.isPending}>
          Hire
        </Button>
        {addEmployee.isError && (
          <p className="w-full text-xs text-red-400">{(addEmployee.error as Error).message}</p>
        )}
      </form>
    </div>
  )
}
