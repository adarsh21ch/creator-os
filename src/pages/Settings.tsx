import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { Badge, Button, Card, Input, PageHeader } from '../components/ui/primitives'
import type { AppSettingsRow } from '../types'

export function SettingsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['app_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
      if (error) throw error
      return data as AppSettingsRow
    },
    enabled: supabaseConfigured,
  })

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Settings"
        description="AI keys are saved here and read by the backend when it runs each employee — nothing to deploy separately. They're stored behind the same login as everything else in this app."
      />

      <div className="mt-6 space-y-3">
        <Row label="Supabase" ok={supabaseConfigured} okText="Connected" badText="Not configured" />

        <KeyRow
          label="Anthropic API key"
          fieldName="anthropic_api_key"
          currentlySet={Boolean(data?.anthropic_api_key)}
          createUrl="console.anthropic.com"
          onSaved={() => qc.invalidateQueries({ queryKey: ['app_settings'] })}
        />
        <KeyRow
          label="Gemini API key"
          fieldName="gemini_api_key"
          currentlySet={Boolean(data?.gemini_api_key)}
          createUrl="aistudio.google.com"
          onSaved={() => qc.invalidateQueries({ queryKey: ['app_settings'] })}
        />

        <Row
          label="Instagram Graph API"
          ok={data?.instagram_connected ?? false}
          okText="Connected"
          badText="Not connected — needed for the Performance desk (Phase 4)"
        />
      </div>
    </div>
  )
}

function Row({ label, ok, okText, badText }: { label: string; ok: boolean; okText: string; badText: string }) {
  return (
    <Card className="flex items-center justify-between p-3.5 text-sm">
      <span className="font-medium text-white">{label}</span>
      <Badge variant={ok ? 'success' : 'default'}>{ok ? okText : badText}</Badge>
    </Card>
  )
}

function KeyRow({
  label,
  fieldName,
  currentlySet,
  createUrl,
  onSaved,
}: {
  label: string
  fieldName: 'anthropic_api_key' | 'gemini_api_key'
  currentlySet: boolean
  createUrl: string
  onSaved: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('app_settings')
        .update({ [fieldName]: value.trim() || null })
        .eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => {
      setEditing(false)
      setValue('')
      onSaved()
    },
  })

  if (!editing) {
    return (
      <Card className="flex items-center justify-between p-3.5 text-sm">
        <span className="font-medium text-white">{label}</span>
        <div className="flex items-center gap-2">
          <Badge variant={currentlySet ? 'success' : 'default'}>
            {currentlySet ? 'Set' : `Not set — create at ${createUrl}`}
          </Badge>
          <Button variant="secondary" onClick={() => setEditing(true)} className="px-2 py-1 text-xs">
            {currentlySet ? 'Replace' : 'Add key'}
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3.5 text-sm">
      <div className="mb-2 font-medium text-white">{label}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="flex gap-2"
      >
        <Input
          type="password"
          autoComplete="off"
          placeholder="Paste key — never shown again after saving"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={save.isPending || !value.trim()} className="text-xs">
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setEditing(false)
            setValue('')
          }}
          className="text-xs"
        >
          Cancel
        </Button>
      </form>
      {save.isError && <p className="mt-2 text-xs text-red-400">{(save.error as Error).message}</p>}
    </Card>
  )
}
