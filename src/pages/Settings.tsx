import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { AppSettingsRow } from '../types'

export function SettingsPage() {
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
        Connection status. Actual API keys live in Supabase Edge Function secrets, never in the
        browser — this screen only shows whether they're set.
      </p>

      <div className="mt-6 space-y-3">
        <Row label="Supabase" ok={supabaseConfigured} okText="Connected" badText="Not configured" />
        <Row
          label="Anthropic API key"
          ok={data?.anthropic_key_set ?? false}
          okText="Set"
          badText="Not set — create at console.anthropic.com, add as an Edge Function secret"
        />
        <Row
          label="Gemini API key"
          ok={data?.gemini_key_set ?? false}
          okText="Set"
          badText="Not set — create at aistudio.google.com, add as an Edge Function secret"
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
