import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StudioSession } from '../types'

// A stuck spinner with no feedback is worse than a slow one — this rejects
// with a clear message instead of hanging forever if something goes wrong
// upstream (a dropped connection, an edge function that never responds).
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} took longer than ${ms / 1000}s and was cancelled — try again.`)),
        ms,
      ),
    ),
  ])
}

// Shows real elapsed seconds while a call is in flight, so "is it stuck?" has
// a visible answer instead of a spinner that looks the same at 2s and 2min.
function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) {
      setSeconds(0)
      return
    }
    const start = Date.now()
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(id)
  }, [active])
  return seconds
}

export function StudioPage() {
  const qc = useQueryClient()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [hook, setHook] = useState('')
  const [researchText, setResearchText] = useState('')
  const [hooksText, setHooksText] = useState('')
  const [scriptText, setScriptText] = useState('')
  const [skipResearch, setSkipResearch] = useState(false)

  // Every step upserts into studio_sessions — one row per topic, filled in as it
  // goes, not thrown away when the page is left. See STATUS.md for the design.
  async function saveStep(fields: Partial<StudioSession>) {
    if (sessionId) {
      const { error } = await supabase
        .from('studio_sessions')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', sessionId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('studio_sessions')
        .insert({ topic, ...fields })
        .select('id')
        .single()
      if (error) throw error
      setSessionId(data.id)
    }
    qc.invalidateQueries({ queryKey: ['studio_sessions'] })
  }

  const history = useQuery({
    queryKey: ['studio_sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('studio_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data as StudioSession[]
    },
  })

  function loadSession(s: StudioSession) {
    setSessionId(s.id)
    setTopic(s.topic)
    setResearchText(s.research_text ?? '')
    setHooksText(s.hooks_text ?? '')
    setChosenHookAndClear(s.chosen_hook ?? '')
    setScriptText(s.script_text ?? '')
  }

  function setChosenHookAndClear(h: string) {
    setHook(h)
  }

  function newSession() {
    setSessionId(null)
    setTopic('')
    setResearchText('')
    setHooksText('')
    setHook('')
    setScriptText('')
    setSkipResearch(false)
  }

  const genResearch = useMutation({
    mutationFn: async () => {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('studio-generate', { body: { action: 'research', topic } }),
        60000,
        'Research',
      )
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.text as string
    },
    onSuccess: async (text) => {
      setResearchText(text)
      await saveStep({ research_text: text })
    },
  })

  const genHooks = useMutation({
    mutationFn: async () => {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('studio-generate', {
          body: { action: 'hooks', topic, research: researchText },
        }),
        40000,
        'Hook writing',
      )
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.text as string
    },
    onSuccess: async (text) => {
      setHooksText(text)
      await saveStep({ hooks_text: text })
    },
  })

  const genScript = useMutation({
    mutationFn: async () => {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('studio-generate', {
          body: { action: 'script', topic, hook, research: researchText },
        }),
        40000,
        'Script writing',
      )
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.text as string
    },
    onSuccess: async (text) => {
      setScriptText(text)
      await saveStep({ chosen_hook: hook, script_text: text })
    },
  })

  const canResearch = topic.trim().length > 0
  const canWriteHooks = skipResearch ? canResearch : researchText.trim().length > 0
  const researchSecs = useElapsedSeconds(genResearch.isPending)
  const hooksSecs = useElapsedSeconds(genHooks.isPending)
  const scriptSecs = useElapsedSeconds(genScript.isPending)

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Studio</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Topic → real sources → hooks in your formula → a full script in your voice — reading
            from the Brand Brain you've already set up. Every step is saved as you go.
          </p>
        </div>
        {sessionId && (
          <button
            type="button"
            onClick={newSession}
            className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            + New topic
          </button>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <label htmlFor="topic" className="text-sm font-medium">
          Topic
        </label>
        <textarea
          id="topic"
          rows={2}
          placeholder="What's today's reel about?"
          value={topic}
          onChange={(e) => {
            if (sessionId) newSession()
            setTopic(e.target.value)
          }}
          className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="button"
          onClick={() => genResearch.mutate()}
          disabled={genResearch.isPending || !canResearch}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {genResearch.isPending ? `Searching the web… ${researchSecs}s` : 'Research this topic'}
        </button>
        {genResearch.isError && (
          <p className="text-sm text-red-600">{(genResearch.error as Error).message}</p>
        )}
      </div>

      {researchText && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold">Sources — check these before you shoot</h2>
          <pre className="whitespace-pre-wrap rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40">
            {researchText}
          </pre>
          <p className="text-xs text-neutral-500">
            Hooks and the script below are instructed to use only what's written here — nothing
            else. Click the links and confirm before you say anything specific on camera.
          </p>
        </div>
      )}

      {!researchText && (
        <label className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={skipResearch}
            onChange={(e) => setSkipResearch(e.target.checked)}
          />
          Skip research for this one (hooks will stay general — no invented facts, numbers, or
          names, but nothing specific either)
        </label>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => genHooks.mutate()}
          disabled={genHooks.isPending || !canWriteHooks}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {genHooks.isPending ? `Writing hooks… ${hooksSecs}s` : 'Generate hooks'}
        </button>
        {genHooks.isError && (
          <p className="mt-2 text-sm text-red-600">{(genHooks.error as Error).message}</p>
        )}
      </div>

      {hooksText && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold">Hooks</h2>
          <pre className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            {hooksText}
          </pre>

          <label htmlFor="hook" className="mt-4 block text-sm font-medium">
            Paste the hook you're going with
          </label>
          <input
            id="hook"
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            placeholder="Copy one line from above"
            className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={() => genScript.mutate()}
            disabled={genScript.isPending || !hook.trim()}
            className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {genScript.isPending ? `Writing script… ${scriptSecs}s` : 'Generate script'}
          </button>
          {genScript.isError && (
            <p className="text-sm text-red-600">{(genScript.error as Error).message}</p>
          )}
        </div>
      )}

      {scriptText && (
        <div className="mt-6 space-y-2">
          <h2 className="text-sm font-semibold">Script</h2>
          <pre className="whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            {scriptText}
          </pre>
          <p className="text-xs text-neutral-500">
            Saved to History automatically. Once you've shot it, add the real numbers in the
            Library too — that's what teaches the Pattern Analyst later.
          </p>
        </div>
      )}

      <div className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
        <h2 className="text-sm font-semibold">History</h2>
        {history.isLoading && <p className="mt-2 text-sm text-neutral-500">Loading…</p>}
        {history.isError && (
          <p className="mt-2 text-sm text-red-600">{(history.error as Error).message}</p>
        )}
        {history.data && history.data.length === 0 && (
          <p className="mt-2 text-sm text-neutral-500">
            Nothing yet — your first topic above will show up here once you research or write
            hooks for it.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {history.data?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSession(s)}
              className={`block w-full rounded-md border p-3 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                s.id === sessionId
                  ? 'border-purple-400 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{s.topic}</span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {new Date(s.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-1 flex gap-3 text-xs text-neutral-500">
                <span>{s.research_text ? '✓ research' : '— research'}</span>
                <span>{s.hooks_text ? '✓ hooks' : '— hooks'}</span>
                <span>{s.script_text ? '✓ script' : '— script'}</span>
                <span>{s.reel_id ? '✓ posted' : '— not posted'}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
