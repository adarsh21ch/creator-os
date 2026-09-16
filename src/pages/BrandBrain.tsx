import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { BrandBrain } from '../types'

const PILLARS_DEFAULT = ['Politics', 'Current Affairs', 'Incidents', 'Reservation', 'Business Politics']

export function BrandBrainPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['brand_brain'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brand_brain').select('*').eq('id', 1).single()
      if (error) throw error
      return data as BrandBrain
    },
  })

  const [form, setForm] = useState({
    hook_formula: '',
    voice_notes: '',
    banned_claims: '',
    language_register: '' as '' | 'clean' | 'mixed' | 'crude',
  })

  useEffect(() => {
    if (data) {
      setForm({
        hook_formula: data.hook_formula ?? '',
        voice_notes: data.voice_notes ?? '',
        banned_claims: data.banned_claims ?? '',
        language_register: data.language_register ?? '',
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('brand_brain')
        .update({
          hook_formula: form.hook_formula || null,
          voice_notes: form.voice_notes || null,
          banned_claims: form.banned_claims || null,
          language_register: form.language_register || null,
          pillars: PILLARS_DEFAULT,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['brand_brain'] }),
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Brand Brain</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Voice profile, hook formula, banned claims, language register. The Hook Writer and
        Scriptwriter load this before writing.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="mt-6 space-y-4"
      >
        <div>
          <div className="mb-1 text-xs font-medium text-neutral-500">Pillars</div>
          <div className="flex flex-wrap gap-2">
            {PILLARS_DEFAULT.map((p) => (
              <span
                key={p}
                className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800 dark:bg-purple-900/30 dark:text-purple-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-neutral-500">Hook formula</div>
          <input
            value={form.hook_formula}
            onChange={(e) => setForm({ ...form, hook_formula: e.target.value })}
            placeholder="Recognizable trigger word → specific outcome → withhold the how"
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-neutral-500">Voice notes</div>
          <textarea
            rows={6}
            value={form.voice_notes}
            onChange={(e) => setForm({ ...form, voice_notes: e.target.value })}
            placeholder="e.g. six-beat structure, teacher framing, speaks as 'hum' not 'main'…"
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-neutral-500">Banned claims</div>
          <textarea
            rows={3}
            value={form.banned_claims}
            onChange={(e) => setForm({ ...form, banned_claims: e.target.value })}
            placeholder="Claims not to make on camera"
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-neutral-500">Language register</div>
          <select
            value={form.language_register}
            onChange={(e) =>
              setForm({ ...form, language_register: e.target.value as typeof form.language_register })
            }
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Undecided</option>
            <option value="clean">Clean — no crude language, ever</option>
            <option value="mixed">Mixed — occasional, context-dependent</option>
            <option value="crude">Unfiltered — matches his real speech</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">
            Pending decision — he wants brand deals later, this affects what the Scriptwriter can
            write.
          </p>
        </label>

        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {save.isSuccess && <span className="ml-3 text-xs text-green-600">Saved</span>}
      </form>
    </div>
  )
}
