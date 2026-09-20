import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
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
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        AI keys are saved here and read by the backend when it runs each employee — nothing to
        deploy separately. They're stored behind the same login as everything else in this app.
      </p>

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
    <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
      <span className="font-medium">{label}</span>
      <span
        className={
          ok
            ? 'rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : 'rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500 dark:bg-neutral-900'
        }
      >
        {ok ? okText : badText}
      </span>
    </div>
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
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span
            className={
              currentlySet
                ? 'rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-500 dark:bg-neutral-900'
            }
          >
            {currentlySet ? 'Set' : `Not set — create at ${createUrl}`}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {currentlySet ? 'Replace' : 'Add key'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
      <div className="mb-2 font-medium">{label}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="flex gap-2"
      >
        <input
          type="password"
          autoComplete="off"
          placeholder="Paste key — never shown again after saving"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={save.isPending || !value.trim()}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setValue('')
          }}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Cancel
        </button>
      </form>
      {save.isError && (
        <p className="mt-2 text-xs text-red-600">{(save.error as Error).message}</p>
      )}
    </div>
  )
}
