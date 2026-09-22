import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, FieldLabel, Input, PageHeader, Select, Textarea } from '../components/ui/primitives'
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
      <PageHeader
        title="Brand Brain"
        description="Voice profile, hook formula, banned claims, language register. The Hook Writer and Scriptwriter load this before writing."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="mt-6 space-y-4"
      >
        <div>
          <FieldLabel>Pillars</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {PILLARS_DEFAULT.map((p) => (
              <Badge key={p} variant="accent">
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <label className="block">
          <FieldLabel>Hook formula</FieldLabel>
          <Input
            value={form.hook_formula}
            onChange={(e) => setForm({ ...form, hook_formula: e.target.value })}
            placeholder="Recognizable trigger word → specific outcome → withhold the how"
          />
        </label>

        <label className="block">
          <FieldLabel>Voice notes</FieldLabel>
          <Textarea
            rows={6}
            value={form.voice_notes}
            onChange={(e) => setForm({ ...form, voice_notes: e.target.value })}
            placeholder="e.g. six-beat structure, teacher framing, speaks as 'hum' not 'main'…"
          />
        </label>

        <label className="block">
          <FieldLabel>Banned claims</FieldLabel>
          <Textarea
            rows={3}
            value={form.banned_claims}
            onChange={(e) => setForm({ ...form, banned_claims: e.target.value })}
            placeholder="Claims not to make on camera"
          />
        </label>

        <label className="block">
          <FieldLabel>Language register</FieldLabel>
          <Select
            value={form.language_register}
            onChange={(e) =>
              setForm({ ...form, language_register: e.target.value as typeof form.language_register })
            }
          >
            <option value="">Undecided</option>
            <option value="clean">Clean — no crude language, ever</option>
            <option value="mixed">Mixed — occasional, context-dependent</option>
            <option value="crude">Unfiltered — matches his real speech</option>
          </Select>
          <p className="mt-1.5 text-xs text-white/30">
            Pending decision — he wants brand deals later, this affects what the Scriptwriter can
            write.
          </p>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
          {save.isSuccess && <span className="text-xs text-emerald-400">Saved</span>}
        </div>
      </form>
    </div>
  )
}
