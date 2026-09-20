import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function StudioPage() {
  const [topic, setTopic] = useState('')
  const [hook, setHook] = useState('')
  const [hooksText, setHooksText] = useState('')
  const [scriptText, setScriptText] = useState('')

  const genHooks = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('studio-generate', {
        body: { action: 'hooks', topic },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.text as string
    },
    onSuccess: (text) => setHooksText(text),
  })

  const genScript = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('studio-generate', {
        body: { action: 'script', topic, hook },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.text as string
    },
    onSuccess: (text) => setScriptText(text),
  })

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Studio</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Pick a topic, get hooks in your formula, pick one, get a full script in your voice —
        reading from the Brand Brain you've already set up.
      </p>

      <div className="mt-6 space-y-2">
        <label htmlFor="topic" className="text-sm font-medium">
          Topic
        </label>
        <textarea
          id="topic"
          rows={2}
          placeholder="What's today's reel about?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full rounded-md border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="button"
          onClick={() => genHooks.mutate()}
          disabled={genHooks.isPending || !topic.trim()}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {genHooks.isPending ? 'Writing hooks…' : 'Generate hooks'}
        </button>
        {genHooks.isError && (
          <p className="text-sm text-red-600">{(genHooks.error as Error).message}</p>
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
            {genScript.isPending ? 'Writing script…' : 'Generate script'}
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
            Not saved automatically yet — copy it into the Library once you've shot it, along with
            the real numbers once you have them.
          </p>
        </div>
      )}
    </div>
  )
}
